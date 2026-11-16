export type BookingStatus =
  | "pending"
  | "paid"
  | "overdue"
  | "cancelled";

export type InvoiceEmailStatus =
  | "not_sent"
  | "sent"
  | "failed";

export interface BookingInvoiceSummary {
  invoiceNumber: string;
  totalCents: number;
  currency: string;
  status: BookingStatus;
  emailStatus: InvoiceEmailStatus;
}

export interface BookingSubmission {
  id?: string;
  reference: string;
  bookingType:
    | "delivery_project"
    | "mentor_me"
    | "coffee_with_me";
  status?: string;
  createdAt?: string;
  invoice: BookingInvoiceSummary | null;
  invoiceEmailStatus: InvoiceEmailStatus;
}