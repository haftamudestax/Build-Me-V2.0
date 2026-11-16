
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const {
  resendSendMock,
  resendConstructorMock,
  getInvoiceByBookingIdMock,
  markInvoiceEmailSentMock,
  markInvoiceEmailFailedMock,
} = vi.hoisted(() => ({
  resendSendMock: vi.fn(),
  resendConstructorMock: vi.fn(),

  getInvoiceByBookingIdMock: vi.fn(),
  markInvoiceEmailSentMock: vi.fn(),
  markInvoiceEmailFailedMock: vi.fn(),
}));

/**
 * Mock the local Resend client adapter.
 *
 * This prevents unit tests from constructing a real Resend
 * client or making external HTTP requests.
 */
vi.mock(
  "../../../services/api/src/services/resendClient",
  () => ({
    createResendClient: resendConstructorMock,
  }),
);

/**
 * Mock invoice database operations.
 */
vi.mock(
  "../../../services/api/src/services/invoices.service",
  () => ({
    getInvoiceByBookingId: getInvoiceByBookingIdMock,
    markInvoiceEmailSent: markInvoiceEmailSentMock,
    markInvoiceEmailFailed: markInvoiceEmailFailedMock,
  }),
);

import {
  sendInvoiceEmailByBookingId,
} from "../../../services/api/src/services/invoiceEmail.service";

import type {
  InvoiceWithItems,
} from "../../../services/api/src/services/invoices.service";

const BOOKING_ID = "123e4567-e89b-42d3-a456-426614174000";
const INVOICE_ID = "223e4567-e89b-42d3-a456-426614174000";
const EMAIL_ID = "email_test_123";

const INVOICE_NUMBER = "INV-20261116-TEST";
const TEST_API_KEY = "re_test_api_key";
const TEST_FROM_EMAIL = "Build Me <onboarding@resend.dev>";
const TEST_REPLY_TO = "support@example.com";

function createInvoice(
  overrides: Partial<InvoiceWithItems["invoice"]> = {},
): InvoiceWithItems {
  const invoice: InvoiceWithItems["invoice"] = {
    id: INVOICE_ID,
    invoice_number: INVOICE_NUMBER,
    booking_id: BOOKING_ID,
    customer_name: "Test Customer",
    customer_email: "customer@example.com",
    currency: "USD",
    subtotal_cents: 149900,
    tax_cents: 0,
    total_cents: 149900,
    status: "pending",
    email_status: "not_sent",
    issued_at: new Date("2026-11-16T10:00:00.000Z"),
    due_at: null,
    paid_at: null,
    email_sent_at: null,
    email_error: null,
    created_at: new Date("2026-11-16T10:00:00.000Z"),
    updated_at: new Date("2026-11-16T10:00:00.000Z"),
    ...overrides,
  };

  return {
    invoice,
    items: [
      {
        id: "323e4567-e89b-42d3-a456-426614174000",
        invoice_id: INVOICE_ID,
        description: "Starter MVP",
        package_tier: "beginner",
        quantity: 1,
        unit_price_cents: 149900,
        line_total_cents: 149900,
        created_at: new Date("2026-11-16T10:00:00.000Z"),
      },
    ],
  };
}

function createSentInvoice() {
  return {
    ...createInvoice().invoice,
    email_status: "sent" as const,
  };
}

describe("Invoice email service", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.stubEnv("RESEND_API_KEY", TEST_API_KEY);
    vi.stubEnv("RESEND_FROM_EMAIL", TEST_FROM_EMAIL);
    vi.stubEnv("RESEND_REPLY_TO", TEST_REPLY_TO);

    resendSendMock.mockResolvedValue({
      data: {
        id: EMAIL_ID,
      },
      error: null,
    });

    resendConstructorMock.mockReturnValue({
      emails: {
        send: resendSendMock,
      },
    });

    getInvoiceByBookingIdMock.mockResolvedValue(
      createInvoice(),
    );

    markInvoiceEmailSentMock.mockResolvedValue(
      createSentInvoice(),
    );

    markInvoiceEmailFailedMock.mockResolvedValue({
      ...createInvoice().invoice,
      email_status: "failed",
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  describe("sendInvoiceEmailByBookingId", () => {
    it("sends an invoice email successfully", async () => {
      const result = await sendInvoiceEmailByBookingId(
        BOOKING_ID,
      );

      expect(result).toEqual({
        status: "sent",
        invoiceId: INVOICE_ID,
        invoiceNumber: INVOICE_NUMBER,
        emailId: EMAIL_ID,
      });

      expect(
        getInvoiceByBookingIdMock,
      ).toHaveBeenCalledTimes(1);

      expect(
        getInvoiceByBookingIdMock,
      ).toHaveBeenCalledWith(BOOKING_ID);

      expect(
        resendConstructorMock,
      ).toHaveBeenCalledTimes(1);

      expect(
        resendConstructorMock,
      ).toHaveBeenCalledWith(TEST_API_KEY);

      expect(resendSendMock).toHaveBeenCalledTimes(1);

      const [emailPayload, requestOptions] =
        resendSendMock.mock.calls[0];

      expect(emailPayload).toMatchObject({
        from: TEST_FROM_EMAIL,
        to: ["customer@example.com"],
        replyTo: TEST_REPLY_TO,
      });

      expect(emailPayload.subject).toContain(
        INVOICE_NUMBER,
      );

      expect(emailPayload.html).toContain(
        "Test Customer",
      );

      expect(emailPayload.html).toContain(
        "Starter MVP",
      );

      expect(emailPayload.html).toContain("$1,499.00");
      expect(emailPayload.text).toContain("$1,499.00");

      expect(emailPayload.text).toContain(
        "Test Customer",
      );

      expect(emailPayload.html).toContain(
  "$1,499.00",
);

      expect(requestOptions).toEqual({
        idempotencyKey: `invoice-email/${INVOICE_ID}`,
      });

      expect(
        markInvoiceEmailSentMock,
      ).toHaveBeenCalledTimes(1);

      expect(
        markInvoiceEmailSentMock,
      ).toHaveBeenCalledWith(INVOICE_ID);

      expect(
        markInvoiceEmailFailedMock,
      ).not.toHaveBeenCalled();
    });

    it("returns already_sent without sending another email", async () => {
      getInvoiceByBookingIdMock.mockResolvedValue(
        createInvoice({
          email_status: "sent",
          email_sent_at: new Date(
            "2026-11-16T11:00:00.000Z",
          ),
        }),
      );

      const result = await sendInvoiceEmailByBookingId(
        BOOKING_ID,
      );

      expect(result).toEqual({
        status: "already_sent",
        invoiceId: INVOICE_ID,
        invoiceNumber: INVOICE_NUMBER,
      });

      expect(
        resendConstructorMock,
      ).not.toHaveBeenCalled();

      expect(resendSendMock).not.toHaveBeenCalled();

      expect(
        markInvoiceEmailSentMock,
      ).not.toHaveBeenCalled();

      expect(
        markInvoiceEmailFailedMock,
      ).not.toHaveBeenCalled();
    });

    it("throws when the invoice does not exist", async () => {
      getInvoiceByBookingIdMock.mockResolvedValue(null);

      await expect(
        sendInvoiceEmailByBookingId(BOOKING_ID),
      ).rejects.toThrow("INVOICE_NOT_FOUND");

      expect(
        resendConstructorMock,
      ).not.toHaveBeenCalled();

      expect(resendSendMock).not.toHaveBeenCalled();

      expect(
        markInvoiceEmailFailedMock,
      ).not.toHaveBeenCalled();
    });

    it("does not send an email for a non-pending invoice", async () => {
      getInvoiceByBookingIdMock.mockResolvedValue(
        createInvoice({
          status: "paid",
        }),
      );

      await expect(
        sendInvoiceEmailByBookingId(BOOKING_ID),
      ).rejects.toThrow("INVOICE_NOT_PENDING");

      expect(
        resendConstructorMock,
      ).not.toHaveBeenCalled();

      expect(resendSendMock).not.toHaveBeenCalled();

      expect(
        markInvoiceEmailFailedMock,
      ).not.toHaveBeenCalled();
    });

    it("does not send an email when the invoice has no items", async () => {
      getInvoiceByBookingIdMock.mockResolvedValue({
        ...createInvoice(),
        items: [],
      });

      await expect(
        sendInvoiceEmailByBookingId(BOOKING_ID),
      ).rejects.toThrow("INVOICE_ITEMS_NOT_FOUND");

      expect(
        resendConstructorMock,
      ).not.toHaveBeenCalled();

      expect(resendSendMock).not.toHaveBeenCalled();

      expect(
        markInvoiceEmailFailedMock,
      ).not.toHaveBeenCalled();
    });

    it("records a failed email when the Resend API returns an error", async () => {
      resendSendMock.mockResolvedValue({
        data: null,
        error: {
          message: "Resend delivery failed",
        },
      });

      await expect(
        sendInvoiceEmailByBookingId(BOOKING_ID),
      ).rejects.toThrow("INVOICE_EMAIL_FAILED");

      expect(
        markInvoiceEmailFailedMock,
      ).toHaveBeenCalledTimes(1);

      expect(
        markInvoiceEmailFailedMock,
      ).toHaveBeenCalledWith(
        INVOICE_ID,
        expect.anything(),
      );

      expect(
        markInvoiceEmailSentMock,
      ).not.toHaveBeenCalled();
    });

    it("records a failed email when Resend returns no email ID", async () => {
      resendSendMock.mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(
        sendInvoiceEmailByBookingId(BOOKING_ID),
      ).rejects.toThrow("INVOICE_EMAIL_FAILED");

      expect(
        markInvoiceEmailFailedMock,
      ).toHaveBeenCalledWith(
        INVOICE_ID,
        expect.anything(),
      );

      expect(
        markInvoiceEmailSentMock,
      ).not.toHaveBeenCalled();
    });

    it("records a failed email when the Resend request throws", async () => {
      resendSendMock.mockRejectedValue(
        new Error("Network connection failed"),
      );

      await expect(
        sendInvoiceEmailByBookingId(BOOKING_ID),
      ).rejects.toThrow("INVOICE_EMAIL_FAILED");

      expect(
        markInvoiceEmailFailedMock,
      ).toHaveBeenCalledWith(
        INVOICE_ID,
        expect.any(Error),
      );

      expect(
        markInvoiceEmailSentMock,
      ).not.toHaveBeenCalled();
    });

    it("allows a failed invoice email to be retried", async () => {
      getInvoiceByBookingIdMock
        .mockResolvedValueOnce(
          createInvoice({
            email_status: "failed",
            email_error: "Previous delivery attempt failed",
          }),
        )
        .mockResolvedValueOnce(
          createInvoice({
            email_status: "failed",
            email_error: "Previous delivery attempt failed",
          }),
        );

      resendSendMock
        .mockRejectedValueOnce(
          new Error("Temporary provider failure"),
        )
        .mockResolvedValueOnce({
          data: {
            id: "email_retry_456",
          },
          error: null,
        });

      await expect(
        sendInvoiceEmailByBookingId(BOOKING_ID),
      ).rejects.toThrow("INVOICE_EMAIL_FAILED");

      const retryResult = await sendInvoiceEmailByBookingId(
        BOOKING_ID,
      );

      expect(retryResult).toEqual({
        status: "sent",
        invoiceId: INVOICE_ID,
        invoiceNumber: INVOICE_NUMBER,
        emailId: "email_retry_456",
      });

      expect(resendSendMock).toHaveBeenCalledTimes(2);

      expect(
        resendConstructorMock,
      ).toHaveBeenCalledTimes(2);

      expect(
        markInvoiceEmailFailedMock,
      ).toHaveBeenCalledTimes(1);

      expect(
        markInvoiceEmailSentMock,
      ).toHaveBeenCalledTimes(1);
    });

    it("does not mark the email as failed when updating the sent status fails", async () => {
      markInvoiceEmailSentMock.mockRejectedValue(
        new Error("Database connection failed"),
      );

      await expect(
        sendInvoiceEmailByBookingId(BOOKING_ID),
      ).rejects.toThrow(
        "INVOICE_EMAIL_STATUS_UPDATE_FAILED",
      );

      expect(resendSendMock).toHaveBeenCalledTimes(1);

      expect(
        markInvoiceEmailSentMock,
      ).toHaveBeenCalledWith(INVOICE_ID);

      expect(
        markInvoiceEmailFailedMock,
      ).not.toHaveBeenCalled();
    });

    it("records a failure when the Resend API key is missing", async () => {
      vi.stubEnv("RESEND_API_KEY", "");

      await expect(
        sendInvoiceEmailByBookingId(BOOKING_ID),
      ).rejects.toThrow("INVOICE_EMAIL_FAILED");

      expect(
        resendConstructorMock,
      ).not.toHaveBeenCalled();

      expect(resendSendMock).not.toHaveBeenCalled();

      expect(
        markInvoiceEmailFailedMock,
      ).toHaveBeenCalledWith(
        INVOICE_ID,
        expect.anything(),
      );

      expect(
        markInvoiceEmailSentMock,
      ).not.toHaveBeenCalled();
    });
  });
});
