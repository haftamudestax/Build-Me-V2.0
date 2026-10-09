import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../../../services/api/src/app";

describe("Auth security", () => {
  it("login route is not yet implemented (returns 404)", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "test-password" });

    expect(res.status).toBe(404);
  });

  it("profile route is not yet implemented (returns 404)", async () => {
    const res = await request(app)
      .get("/api/auth/profile")
      .set("Authorization", "Bearer test-token");

    expect(res.status).toBe(404);
  });
});