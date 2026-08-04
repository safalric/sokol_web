import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["tests/vitest/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/vitest/setup.ts"],
    restoreMocks: true,
  },
});
