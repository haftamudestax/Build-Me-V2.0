import http from "k6/http";
import { check } from "k6";
import { config } from "../k6.config.js";

export const options = {
  vus: 1,
  iterations: 20,
  thresholds: config.thresholds,
};

export default function () {
  const response = http.get(`${config.baseUrl}${config.endpoints.home}`);

  check(response, {
    "homepage status is 200": (r) => r.status === 200,
  });
}
