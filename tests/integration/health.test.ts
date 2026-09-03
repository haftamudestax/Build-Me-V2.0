import { describe, it, expect } from "vitest";

describe("API integration: /health", () => {
  it("returns ok status", async () => {
    const res = await fetch("http://127.0.0.1:4000/health");
    const body = await res.json();
    expect(body).toEqual({ status: "ok" });
  });
});