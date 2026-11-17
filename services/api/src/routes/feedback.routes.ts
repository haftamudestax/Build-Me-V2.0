
import {
  Router,
  type NextFunction,
  type Response,
} from "express";

import { createFeedback } from "../services/feedback.service";
import { validateCreateFeedback } from "../validators/feedback.validator";

const router = Router();

/**
 * Maps known feedback service errors to HTTP responses.
 */
function handleFeedbackError(
  error: unknown,
  res: Response,
  next: NextFunction,
) {
  if (!(error instanceof Error)) {
    return next(error);
  }

  switch (error.message) {
    case "VISITOR_NOT_FOUND":
      return res.status(400).json({
        error:
          "The visitor does not exist. Initialize visitor tracking first.",
      });

    case "IDEMPOTENCY_KEY_REUSED":
      return res.status(409).json({
        error:
          "This idempotency key was already used for a different feedback submission.",
      });

    case "FEEDBACK_LOOKUP_FAILED":
    case "FEEDBACK_CREATION_FAILED":
      return res.status(500).json({
        error: "The feedback submission could not be completed.",
      });

    default:
      return next(error);
  }
}

/**
 * Submit visitor feedback.
 *
 * Supported feedback types:
 * - nps
 * - rating
 * - issue
 * - suggestion
 * - complaint
 */
router.post("/", async (req, res, next) => {
  const body =
    req.body &&
    typeof req.body === "object" &&
    !Array.isArray(req.body)
      ? {
          ...req.body,
          idempotencyKey:
            req.body.idempotencyKey ??
            req.get("Idempotency-Key") ??
            undefined,
        }
      : req.body;

  const validation = validateCreateFeedback(body);

  if (!validation.valid) {
    return res.status(400).json({
      error: validation.error,
    });
  }

  try {
    const feedback = await createFeedback(validation.data);

    return res.status(201).json({
      data: {
        id: feedback.id,
        reference: feedback.id,
        type: feedback.type,
        status: feedback.status,
        createdAt: feedback.createdAt,
      },
    });
  } catch (error) {
    return handleFeedbackError(error, res, next);
  }
});

export default router;
