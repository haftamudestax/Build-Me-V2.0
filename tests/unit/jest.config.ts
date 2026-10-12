export default {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  roots: [
    "<rootDir>/apps",
    "<rootDir>/packages",
    "<rootDir>/tests/unit"
  ]
}