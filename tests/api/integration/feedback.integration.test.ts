
import { randomUUID } from "node:crypto";
import type { Express } from "express";
import request from "supertest";
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

type FeedbackType =
  | "nps"
  | "rating"
  | "issue"
  | "suggestion"
  | "complaint";

type FeedbackCategory = "business" | "platforms" | "partners";

interface FeedbackPayload {
  visitorId: string;
  type: FeedbackType;
  idempotencyKey?: string;
  name?: string;
  email?: string;
  category?: FeedbackCategory;
  rating?: number;
  npsScore?: number;
  comments?: string;
}

interface FeedbackResponse {
  data?: {
    id?: string;
    reference?: string;
    type?: string;
    status?: string;
    createdAt?: string;
    name?: string;
    email?: string;
    category?: string;
    rating?: number;
    npsScore?: number;
    comments?: string;
  };
  error?: string;
}

let app: Express;
let pool: {
  query: (
    text: string,
    values?: unknown[],
  ) => Promise<{
    rows: Array<Record<string, unknown>>;
  }>;
  end: () => Promise<void>;
} | undefined;

let visitorId: string | undefined;

const originalDatabaseUrl = process.env.DATABASE_URL;

function createPayload(
  overrides: Partial<FeedbackPayload>,
): FeedbackPayload {
  if (!visitorId) {
    throw new Error(
      "Integration test visitor was not initialized.",
    );
  }

  const type = overrides.type ?? "rating";

  const payload: FeedbackPayload = {
    visitorId,
    type,
  };

  // Only rating feedback receives a default service rating.
  if (
    type === "rating" &&
    overrides.rating === undefined
  ) {
    payload.rating = 5;
  }

  return {
    ...payload,
    ...overrides,
  };
}

async function submitFeedback(
  payload: FeedbackPayload | Record<string, unknown>,
  idempotencyKey?: string,
) {
  const submission = request(app)
    .post("/api/feedback")
    .send(payload);

  if (idempotencyKey) {
    submission.set("Idempotency-Key", idempotencyKey);
  }

  return submission;
}

function expectSuccessfulFeedback(
  response: {
    status: number;
    body: FeedbackResponse;
  },
  expectedType: FeedbackType,
) {
  expect(response.status).toBe(201);
  expect(response.body.data).toBeDefined();

  expect(response.body.data?.id).toEqual(
    expect.any(String),
  );

  expect(response.body.data?.reference).toBe(
    response.body.data?.id,
  );

  expect(response.body.data?.type).toBe(expectedType);
  expect(response.body.data?.status).toBe("submitted");

  expect(response.body.data?.createdAt).toEqual(
    expect.any(String),
  );
}

describe("Feedback API integration", () => {
  beforeAll(async () => {
    const testDatabaseUrl = process.env.TEST_DATABASE_URL;

    if (!testDatabaseUrl) {
      throw new Error(
        "TEST_DATABASE_URL is required to run feedback integration tests.",
      );
    }

    // Ensure the API and shared database pool use the test database.
    process.env.DATABASE_URL = testDatabaseUrl;

    const [
      appModule,
      bookingsService,
    ] = await Promise.all([
      import("../../../services/api/src/app"),
      import("../../../services/api/src/services/bookings.service"),
    ]);

    app = appModule.default;
    pool = bookingsService.pool;

    await pool.query("SELECT 1");

    // Confirm the required tables exist in the test database.
    await pool.query("SELECT id FROM visitors LIMIT 0");
    await pool.query("SELECT id FROM feedback LIMIT 0");

    const visitorResult = await pool.query(
      `
        INSERT INTO visitors DEFAULT VALUES
        RETURNING id
      `,
    );

    visitorId = visitorResult.rows[0]?.id as string | undefined;

    if (!visitorId) {
      throw new Error(
        "Could not initialize the feedback integration test visitor.",
      );
    }
  });

  afterAll(async () => {
    if (pool && visitorId) {
      await pool.query(
        `
          DELETE FROM feedback
          WHERE visitor_id = $1
        `,
        [visitorId],
      );

      await pool.query(
        `
          DELETE FROM visitors
          WHERE id = $1
        `,
        [visitorId],
      );
    }

    if (pool) {
      await pool.end();
    }

    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
  });

  describe("Successful submissions", () => {
    it("submits NPS feedback successfully", async () => {
      const payload = createPayload({
        type: "nps",
        npsScore: 9,
        comments: "The overall experience was excellent.",
      });

      const response = await submitFeedback(payload);

      expectSuccessfulFeedback(response, "nps");
    });

    it("submits service rating feedback successfully", async () => {
      const payload = createPayload({
        type: "rating",
        rating: 5,
        comments: "Excellent service.",
      });

      const response = await submitFeedback(payload);

      expectSuccessfulFeedback(response, "rating");
    });

    it("submits issue feedback successfully", async () => {
      const payload = createPayload({
        type: "issue",
        category: "platforms",
        comments: "I experienced a problem with the platform.",
      });

      const response = await submitFeedback(payload);

      expectSuccessfulFeedback(response, "issue");
    });

    it("submits suggestion feedback successfully", async () => {
      const payload = createPayload({
        type: "suggestion",
        category: "business",
        comments: "Consider adding more self-service options.",
      });

      const response = await submitFeedback(payload);

      expectSuccessfulFeedback(response, "suggestion");
    });

    it("submits complaint feedback successfully", async () => {
      const payload = createPayload({
        type: "complaint",
        category: "partners",
        comments: "I had an issue with a partner service.",
      });

      const response = await submitFeedback(payload);

      expectSuccessfulFeedback(response, "complaint");
    });

    it("accepts optional contact details for complaint feedback without returning them", async () => {
      const payload = createPayload({
        type: "complaint",
        name: "Integration Test User",
        email: "feedback@example.com",
        category: "business",
        comments: "I would like this issue to be reviewed.",
      });

      const response = await submitFeedback(payload);

      expectSuccessfulFeedback(response, "complaint");

      expect(response.body.data).not.toHaveProperty("name");
      expect(response.body.data).not.toHaveProperty("email");
      expect(response.body.data).not.toHaveProperty("comments");
      expect(response.body.data).not.toHaveProperty("category");
      expect(response.body.data).not.toHaveProperty("rating");
      expect(response.body.data).not.toHaveProperty("npsScore");
    });
  });

  describe("Validation", () => {
    it("rejects a service rating below the supported range", async () => {
      const payload = createPayload({
        type: "rating",
        rating: 0,
      });

      const response = await submitFeedback(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toEqual(expect.any(String));
    });

    it("rejects a service rating above the supported range", async () => {
      const payload = createPayload({
        type: "rating",
        rating: 6,
      });

      const response = await submitFeedback(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toEqual(expect.any(String));
    });

    it("rejects an NPS score below the supported range", async () => {
      const payload = createPayload({
        type: "nps",
        npsScore: -1,
      });

      const response = await submitFeedback(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toEqual(expect.any(String));
    });

    it("rejects an NPS score above the supported range", async () => {
      const payload = createPayload({
        type: "nps",
        npsScore: 11,
      });

      const response = await submitFeedback(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toEqual(expect.any(String));
    });

    it("rejects rating feedback without a rating", async () => {
      const payload = createPayload({
        type: "rating",
      });

      delete payload.rating;

      const response = await submitFeedback(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toEqual(expect.any(String));
    });

    it("rejects NPS feedback without an NPS score", async () => {
      const payload = createPayload({
        type: "nps",
      });

      const response = await submitFeedback(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toEqual(expect.any(String));
    });

    it("rejects an unsupported feedback type", async () => {
      const payload = {
        visitorId,
        type: "other",
        comments: "Unsupported feedback type.",
      };

      const response = await submitFeedback(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toEqual(expect.any(String));
    });

    it("rejects NPS feedback containing a service rating", async () => {
      const payload = {
        ...createPayload({
          type: "nps",
          npsScore: 9,
        }),
        rating: 5,
      };

      const response = await submitFeedback(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        "NPS feedback cannot contain a service rating.",
      );
    });

    it("rejects rating feedback containing an NPS score", async () => {
      const payload = {
        ...createPayload({
          type: "rating",
          rating: 5,
        }),
        npsScore: 9,
      };

      const response = await submitFeedback(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toEqual(expect.any(String));
    });

    it("rejects text feedback containing rating scores", async () => {
      const payload = {
        ...createPayload({
          type: "suggestion",
          comments: "This is a suggestion.",
        }),
        rating: 5,
      };

      const response = await submitFeedback(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        "Text feedback cannot contain rating scores.",
      );
    });

    it("rejects text feedback without comments", async () => {
      const payload = createPayload({
        type: "suggestion",
      });

      const response = await submitFeedback(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toEqual(expect.any(String));
    });

    it("rejects an invalid email address", async () => {
      const payload = createPayload({
        type: "complaint",
        email: "not-a-valid-email",
        comments: "Please review this complaint.",
      });

      const response = await submitFeedback(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toEqual(expect.any(String));
    });
  });

  describe("Visitor validation", () => {
    it("rejects feedback submitted by a visitor who does not exist", async () => {
      const payload = createPayload({
        type: "rating",
        rating: 5,
      });

      payload.visitorId = randomUUID();

      const response = await submitFeedback(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toEqual(expect.any(String));
    });
  });

  describe("Idempotency", () => {
    it("returns the original feedback for an identical retry", async () => {
      const idempotencyKey = `feedback-${randomUUID()}`;

      const payload = createPayload({
        type: "nps",
        npsScore: 9,
        comments: "Consistent feedback submission.",
      });

      const firstResponse = await submitFeedback(
        payload,
        idempotencyKey,
      );

      expectSuccessfulFeedback(firstResponse, "nps");

      const secondResponse = await submitFeedback(
        payload,
        idempotencyKey,
      );

      expectSuccessfulFeedback(secondResponse, "nps");

      expect(secondResponse.body.data?.id).toBe(
        firstResponse.body.data?.id,
      );

      expect(secondResponse.body.data?.reference).toBe(
        firstResponse.body.data?.reference,
      );
    });

    it("rejects reuse of an idempotency key with different feedback", async () => {
      const idempotencyKey = `feedback-${randomUUID()}`;

      const firstPayload = createPayload({
        type: "rating",
        rating: 5,
        comments: "The original feedback.",
      });

      const firstResponse = await submitFeedback(
        firstPayload,
        idempotencyKey,
      );

      expectSuccessfulFeedback(firstResponse, "rating");

      const conflictingPayload = createPayload({
        type: "rating",
        rating: 4,
        comments: "A different feedback submission.",
      });

      const conflictingResponse = await submitFeedback(
        conflictingPayload,
        idempotencyKey,
      );

      expect(conflictingResponse.status).toBe(409);
      expect(conflictingResponse.body.error).toBe(
        "This idempotency key was already used for a different feedback submission.",
      );
    });
  });
});
