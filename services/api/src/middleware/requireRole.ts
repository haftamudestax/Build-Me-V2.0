
import type { NextFunction, Response } from "express";
import { createClient } from "@supabase/supabase-js";

import type { AuthenticatedRequest } from "./requireAuth";

const allowedAdminRoles = new Set(["admin", "super_admin"]);

const supabaseAdmin = () => {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export async function requireRole(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const user = req.authenticatedUser;

  if (!user) {
    res.status(401).json({
      error: "Authentication required.",
    });
    return;
  }

  try {
    const supabase = supabaseAdmin();

    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      next(error);
      return;
    }

    if (!data || !allowedAdminRoles.has(data.role)) {
      res.status(403).json({
        error: "Administrator access required.",
      });
      return;
    }

    next();
  } catch (error: unknown) {
    next(error);
  }
}
