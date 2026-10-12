import http from "k6/http";
import { check } from "k6";
import { config } from "../k6.config.js";

export const options = {
  vus: 1,
  iterations: 10,
};

export default function () {
  // 1. Root / Homepage Check
  const homeRes = http.get(`${config.baseUrl}${config.endpoints.home}`);
  check(homeRes, {
    "homepage responds": (r) => r.status === 200,
    "homepage has a body": (r) => Boolean(r.body && r.body.length > 0),
  });

  // 2. Health Route Check
  const healthRes = http.get(`${config.baseUrl}${config.endpoints.health}`);
  check(healthRes, {
    "health route responds": (r) => r.status === 200,
    "health status is ok": (r) => {
      try {
        return r.json().status === "ok";
      } catch (_) {
        return false;
      }
    },
  });
}
