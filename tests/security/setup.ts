import { vi } from "vitest";

vi.mock("../../services/api/src/services/bookings.service", () => ({
  createProjectBooking: vi.fn(),
  getProjectBookingById: vi.fn(),
}));