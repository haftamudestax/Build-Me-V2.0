
import {
  Router,
  type NextFunction,
  type Response,
} from "express";

import {
  createProjectBooking,
  getProjectBookingById,
} from "../services/bookings.service";

import { getInvoiceByBookingId } from "../services/invoices.service";
import { sendInvoiceEmailByBookingId } from "../services/invoiceEmail.service";
import { validateCreateBooking } from "../validators/bookings.validator";

const router = Router();

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type InvoiceEmailStatus = "sent" | "not_sent" | "failed";

/**
 * Checks whether the minimum Resend configuration is available.
 *
 * Without these values, the booking and invoice are still created.
 * The invoice email remains in the "not_sent" state.
 */
function isInvoiceEmailConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() &&
      process.env.RESEND_FROM_EMAIL?.trim(),
  );
}

/**
 * Maps known booking and invoice service errors to HTTP responses.
 */
function handleBookingError(
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
          "This idempotency key was already used for a different booking request.",
      });

    case "BOOKING_PACKAGE_REQUIRED":
      return res.status(400).json({
        error: "A supported booking package is required.",
      });

    case "INVALID_BOOKING_PACKAGE":
      return res.status(400).json({
        error: "The selected booking package is invalid.",
      });

    case "INVALID_BOOKING_PACKAGE_PRICE":
      return res.status(400).json({
        error: "The selected booking package has an invalid price.",
      });

    case "INVOICE_CREATION_FAILED":
      return res.status(500).json({
        error:
          "The invoice could not be created. The booking was not completed.",
      });

    case "BOOKING_CREATION_FAILED":
      return res.status(500).json({
        error: "The booking could not be created.",
      });

    default:
      return next(error);
  }
}

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
    // Step 1: Create the booking and invoice.
    const booking = await createProjectBooking(validation.data);

    // The database transaction has committed at this point.
    let invoiceEmailStatus: InvoiceEmailStatus = "not_sent";

    // Step 2: Attempt email delivery only when Resend is configured.
    if (isInvoiceEmailConfigured()) {
      try {
        const emailResult = await sendInvoiceEmailByBookingId(
          booking.id,
        );

        invoiceEmailStatus =
          emailResult.status === "sent" ||
          emailResult.status === "already_sent"
            ? "sent"
            : "not_sent";
      } catch (emailError) {
        // Do not fail the booking because email delivery failed.
        invoiceEmailStatus = "failed";

        console.error(
          "[Bookings] Invoice email delivery failed.",
          {
            bookingId: booking.id,
            error:
              emailError instanceof Error
                ? emailError.message
                : "Unknown invoice email error.",
          },
        );
      }
    } else {
      console.info(
        "[Bookings] Resend is not configured. Invoice email was not sent.",
        {
          bookingId: booking.id,
        },
      );
    }

    // Step 3: Retrieve the persisted invoice summary.
    // Invoice retrieval failure must not invalidate an existing booking.
    let invoiceSummary: {
  invoiceNumber: string;
  totalCents: number;
  currency: string;
  status: "pending" | "paid" | "overdue" | "cancelled";
  emailStatus: InvoiceEmailStatus;
} | null = null; 

    try {
      const invoiceResult = await getInvoiceByBookingId(booking.id);

      if (invoiceResult) {
        const invoice = invoiceResult.invoice;

        // Use the persisted email status because the email service
        // may have updated it after sending or recording a failure.
        invoiceEmailStatus = invoice.email_status;

        invoiceSummary = {
          invoiceNumber: invoice.invoice_number,
          totalCents: invoice.total_cents,
          currency: invoice.currency,
          status: invoice.status,
          emailStatus: invoice.email_status,
        };
      } else {
        console.error(
          "[Bookings] Booking was created but its invoice could not be found.",
          {
            bookingId: booking.id,
          },
        );
      }
    } catch (invoiceError) {
      console.error(
        "[Bookings] Failed to retrieve the invoice summary.",
        {
          bookingId: booking.id,
          error:
            invoiceError instanceof Error
              ? invoiceError.message
              : "Unknown invoice retrieval error.",
        },
      );
    }

    // Step 4: Return the booking and available invoice summary.
    return res.status(201).json({
      data: {
        id: booking.id,
        reference: booking.id,
        bookingType: booking.bookingType,
        status: booking.status,
        createdAt: booking.createdAt,
        invoiceEmailStatus,
        invoice: invoiceSummary,
      },
    });
  } catch (error) {
    return handleBookingError(error, res, next);
  }
});

/**
 * Retrieve a booking by its UUID.
 *
 * Personal booking details and invoice/payment information
 * are intentionally not exposed by this endpoint.
 */
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
