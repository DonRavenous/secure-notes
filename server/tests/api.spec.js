// server/tests/api.spec.js
const request = require("supertest");
const app = require("../server-app");

describe("API smoke", () => {
  test("health returns ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
