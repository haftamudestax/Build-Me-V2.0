import { Router } from "express";
import {
  createProjectBooking,
  getProjectBookingById,
} from "../services/bookings.service";
import { validateCreateBooking } from "../validators/bookings.validator";

const router = Router();

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

  const validation = validateCreateBooking(body);

  if (!validation.valid) {
    return res.status(400).json({
      error: validation.error,
    });
  }

  try {
    const booking = await createProjectBooking(validation.data);

    return res.status(201).json({
      data: {
        id: booking.id,
        reference: booking.id,
        bookingType: booking.bookingType,
        status: booking.status,
        createdAt: booking.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "VISITOR_NOT_FOUND") {
        return res.status(400).json({
          error:
            "The visitor does not exist. Initialize visitor tracking first.",
        });
      }

      if (error.message === "IDEMPOTENCY_KEY_REUSED") {
        return res.status(409).json({
          error:
            "This idempotency key was already used for a different booking request.",
        });
      }
    }

    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  const { id } = req.params;

  if (!UUID_PATTERN.test(id)) {
    return res.status(400).json({
      error: "Invalid booking ID.",
    });
  }

  try {
    const booking = await getProjectBookingById(id);

    if (!booking) {
      return res.status(404).json({
        error: "Booking not found.",
      });
    }

    return res.json({
      data: {
        id: booking.id,
        bookingType: booking.booking_type,
        status: booking.status,
        createdAt: booking.created_at,
      },
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
