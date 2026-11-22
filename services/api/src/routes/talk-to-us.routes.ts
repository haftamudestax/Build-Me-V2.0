import { Router, type Request, type Response } from "express";

import { createTalkToUsMessage } from "../services/talk-to-us.service";
import { validateCreateTalkToUsMessage } from "../validators/talk-to-us.validator";

export const talkToUsRouter = Router();

const GENERIC_ERROR = "We could not send your message. Please try again.";

talkToUsRouter.post("/messages", async (request: Request, response: Response) => {
  const validation = validateCreateTalkToUsMessage(request.body);

  if (!validation.valid) {
    response.status(400).json({ error: validation.error });
    return;
  }

  try {
    const created = await createTalkToUsMessage(validation.data);

    response.status(201).json({
      reference: created.reference,
      status: created.status,
      createdAt: created.createdAt,
    });
  } catch (error) {
    switch (error instanceof Error ? error.message : "") {
      case "VISITOR_NOT_FOUND":
        response.status(404).json({
          error: "We could not find your session. Please reload the page and try again.",
        });
        return;

      case "IDEMPOTENCY_KEY_REUSED":
        response.status(409).json({
          error: "This message was already sent with different details. Please reload the page and try again.",
        });
        return;

      case "TALK_TO_US_RATE_LIMITED":
        response.status(429).json({
          error: "You have sent several messages recently. Please try again later, or use WhatsApp.",
        });
        return;

      default:
        response.status(500).json({ error: GENERIC_ERROR });
    }
  }
});