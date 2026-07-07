import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  transform: {
    "^.+\\.ts$": ["ts-jest", {
      tsconfig: "tsconfig.jest.json",
    }],
  },
};

export default config;
