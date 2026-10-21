import request from "supertest";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { Mock } from "vitest";

// Mock the booking service before importing the application.
vi.mock("../../../services/api/src/services/bookings.service", () => ({
  createProjectBooking: vi.fn(),
  getProjectBookingById: vi.fn(),
}));

import {
  createProjectBooking,
  getProjectBookingById,
} from "../../../services/api/src/services/bookings.service";
import app from "../../../services/api/src/app";

const createBookingMock = vi.mocked(
  createProjectBooking,
) as Mock;

const getBookingMock = vi.mocked(
  getProjectBookingById,
) as Mock;

const bookingId = "123e4567-e89b-42d3-a456-426614174000";
const visitorId = "223e4567-e89b-42d3-a456-426614174000";

const validBooking = {
  visitorId,
  name: "Integration Test User",
  email: "integration-test@example.com",
  projectTitle: "Integration Test Project",
  projectType: "Web Application",
  description:
    "This is a sufficiently detailed project description for testing.",
  timeline: "1-3 months",
  budget: "$1,000-$5,000",
};

const createdBooking = {
  id: bookingId,
  reference: bookingId,
  bookingType: "delivery_project",
  status: "pending",
};

const persistedBooking = {
  id: bookingId,
  booking_type: "delivery_project",
  status: "pending",
  created_at: "2026-01-01T00:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();

  createBookingMock.mockResolvedValue(createdBooking);
  getBookingMock.mockResolvedValue(persistedBooking);
});

describe("GET /health", () => {
  it("returns status ok without accessing the database", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
    expect(getBookingMock).not.toHaveBeenCalled();
    expect(createBookingMock).not.toHaveBeenCalled();
  });
});

describe("GET /", () => {
  it("confirms that the server is running", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
  });
});

describe("GET /api/events", () => {
  it("returns the events endpoint message", async () => {
    const response = await request(app).get("/api/events");

    expect(response.status).toBe(200);
  });
});

describe("GET /api/leads", () => {
  it("returns the leads endpoint message", async () => {
    const response = await request(app).get("/api/leads");

    expect(response.status).toBe(200);
  });
});

describe("POST /api/bookings", () => {
  it("creates a project booking and returns its reference", async () => {
    const response = await request(app)
      .post("/api/bookings")
      .send(validBooking);

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      id: bookingId,
      reference: bookingId,
      bookingType: "delivery_project",
      status: "pending",
    });

    expect(createBookingMock).toHaveBeenCalledTimes(1);
    expect(createBookingMock).toHaveBeenCalledWith(
      expect.objectContaining(validBooking),
    );
  });

  it("rejects a request with a missing name", async () => {
    const { name: _name, ...payload } = validBooking;

    const response = await request(app)
      .post("/api/bookings")
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("name is required.");
    expect(createBookingMock).not.toHaveBeenCalled();
  });

  it("rejects a non-object request body", async () => {
    const response = await request(app)
      .post("/api/bookings")
      .send("null")
      .set("Content-Type", "application/json");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid JSON");
    expect(createBookingMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid visitor UUID", async () => {
    const response = await request(app)
      .post("/api/bookings")
      .send({
        ...validBooking,
        visitorId: "not-a-uuid",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "visitorId must be a valid UUID.",
    );
    expect(createBookingMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid email address", async () => {
    const response = await request(app)
      .post("/api/bookings")
      .send({
        ...validBooking,
        email: "not-an-email",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "A valid email address is required.",
    );
    expect(createBookingMock).not.toHaveBeenCalled();
  });

  it("rejects an unsupported project timeline", async () => {
    const response = await request(app)
      .post("/api/bookings")
      .send({
        ...validBooking,
        timeline: "someday",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Unsupported project timeline.",
    );
    expect(createBookingMock).not.toHaveBeenCalled();
  });

  it("rejects a description that is too short", async () => {
    const response = await request(app)
      .post("/api/bookings")
      .send({
        ...validBooking,
        description: "Too short",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Description must be between 20 and 10000 characters.",
    );
    expect(createBookingMock).not.toHaveBeenCalled();
  });

  it("rejects a budget that exceeds the maximum length", async () => {
    const response = await request(app)
      .post("/api/bookings")
      .send({
        ...validBooking,
        budget: "x".repeat(121),
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Budget must be a string of at most 120 characters.",
    );
    expect(createBookingMock).not.toHaveBeenCalled();
  });

  it("returns an error when the visitor does not exist", async () => {
    createBookingMock.mockRejectedValueOnce(
      new Error("VISITOR_NOT_FOUND"),
    );

    const response = await request(app)
      .post("/api/bookings")
      .send(validBooking);

    expect(response.status).toBe(400);
    expect(createBookingMock).toHaveBeenCalledTimes(1);
  });

  it("forwards unexpected service errors to Express", async () => {
    createBookingMock.mockRejectedValueOnce(
      new Error("Database unavailable"),
    );

    const response = await request(app)
      .post("/api/bookings")
      .send(validBooking);

    expect(response.status).toBe(500);
  });
});

describe("GET /api/bookings/:id", () => {
  it("rejects an invalid booking UUID", async () => {
    const response = await request(app).get(
      "/api/bookings/not-a-uuid",
    );

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Invalid booking ID.",
    });
    expect(getBookingMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the booking does not exist", async () => {
    getBookingMock.mockResolvedValueOnce(null);

    const response = await request(app).get(
      `/api/bookings/${bookingId}`,
    );

    expect(response.status).toBe(404);
    expect(getBookingMock).toHaveBeenCalledWith(bookingId);
  });

  it("returns booking metadata without exposing personal details", async () => {
    const response = await request(app).get(
      `/api/bookings/${bookingId}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: bookingId,
      bookingType: "delivery_project",
      status: "pending",
    });

    expect(response.body.data).not.toHaveProperty("email");
    expect(response.body.data).not.toHaveProperty("name");
    expect(response.body.data).not.toHaveProperty(
      "projectDescription",
    );
  });

  it("returns 500 when the booking service fails", async () => {
    getBookingMock.mockRejectedValueOnce(
      new Error("Database unavailable"),
    );

    const response = await request(app).get(
      `/api/bookings/${bookingId}`,
    );

    expect(response.status).toBe(500);
  });
});

describe("Request error handling", () => {
  it("rejects malformed JSON", async () => {
    const response = await request(app)
      .post("/api/bookings")
      .set("Content-Type", "application/json")
      .send('{"name":');

    expect(response.status).toBe(400);
    expect(createBookingMock).not.toHaveBeenCalled();
  });

  it("rejects JSON payloads larger than 1 MB", async () => {
    const response = await request(app)
      .post("/api/bookings")
      .set("Content-Type", "application/json")
      .send(
        JSON.stringify({
          data: "x".repeat(1_100_000),
        }),
      );

    expect(response.status).toBe(413);
    expect(createBookingMock).not.toHaveBeenCalled();
  });
});
