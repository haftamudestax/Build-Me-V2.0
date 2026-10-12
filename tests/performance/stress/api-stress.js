import http from "k6/http";
import { check } from "k6";
import { config } from "../k6.config.js";

export const options = {
  stages: config.stress.stages,
};

export default function () {
  const response = http.get(`${config.baseUrl}${config.endpoints.home}`);

  check(response, {
    "request completes successfully": (r) => r.status === 200,
  });
}
