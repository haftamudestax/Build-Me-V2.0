import http from "k6/http";
import { check } from "k6";
import { config } from "../k6.config.js";

export const options = {
  stages: config.load.stages,
  thresholds: config.thresholds,
};

export default function () {
  const response = http.get(`${config.baseUrl}${config.endpoints.home}`);

  check(response, {
    "homepage responds": (r) => r.status === 200,
  });
}
