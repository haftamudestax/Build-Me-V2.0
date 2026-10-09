import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../../../services/api/src/app";

describe("Authorization (RBAC)", () => {
  it("admin route is not yet implemented (returns 404)", async () => {
    const res = await request(app).get("/api/admin");

    expect(res.status).toBe(404);
  });

  it("project ownership route is not yet implemented (returns 404)", async () => {
    const res = await request(app)
      .get("/api/projects/test-project")
      .set("Authorization", "Bearer test-token");

    expect(res.status).toBe(404);
  });
});