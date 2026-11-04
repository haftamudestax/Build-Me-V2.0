
import type {
  NextFunction,
  Request,
  Response,
} from "express";
import { createClient } from "@supabase/supabase-js";

export interface AuthenticatedUser {
  id: string;
  email?: string;
}

export type AuthenticatedRequest = Request & {
  authenticatedUser?: AuthenticatedUser;
};

let supabaseAdmin: ReturnType<typeof createClient> | undefined;

function getSupabaseAdmin() {
  if (supabaseAdmin) {
    return supabaseAdmin;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured.",
    );
  }

  supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseAdmin;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({
      error: "Authentication required.",
    });
    return;
  }

  const accessToken = authorization.slice("Bearer ".length).trim();

  if (!accessToken) {
    res.status(401).json({
      error: "Authentication required.",
    });
    return;
  }

  try {
    const supabase = getSupabaseAdmin();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      res.status(401).json({
        error: "Invalid or expired access token.",
      });
      return;
    }

    req.authenticatedUser = {
      id: user.id,
      ...(user.email ? { email: user.email } : {}),
    };

    next();
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message.includes("must be configured")
    ) {
      next(error);
      return;
    }

    res.status(401).json({
      error: "Unable to authenticate the request.",
    });
  }
}
