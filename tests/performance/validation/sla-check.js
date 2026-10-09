import http from "k6/http";
import { check } from "k6";
import { config } from "../k6.config.js";

export const options = {
  vus: config.smoke.vus,
  duration: config.smoke.duration,
  thresholds: config.thresholds,
};

export default function () {
  const response = http.get(`${config.baseUrl}${config.endpoints.home}`);

  check(response, {
    "status is 200": (r) => r.status === 200,
    "response under 1 second": (r) => r.timings.duration < 1000,
  });
}
