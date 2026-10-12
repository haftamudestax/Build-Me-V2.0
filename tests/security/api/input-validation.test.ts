
import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../../../services/api/src/app";

describe("API input validation & injection security", () => {
  it("returns 404 for login while the route is not implemented", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "' OR '1'='1", password: "' OR '1'='1" });

    expect(res.status).toBe(404);
  });

  it("returns 404 for projects while the route is not implemented", async () => {
    const res = await request(app)
      .post("/api/projects")
      .send({ name: '<script>alert("xss")</script>' });

    expect(res.status).toBe(404);
  });

  it("rejects oversized JSON payloads", async () => {
    const bigString = "a".repeat(10 * 1024 * 1024);

    const res = await request(app)
      .post("/api/projects")
      .send({ name: bigString });

    expect(res.status).toBe(413);
  });

  it("rejects malformed JSON", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send('{"email":');

    expect(res.status).toBe(400);
  });
});
