import { defineConfig } from "vitest/config";

export function createVitestConfig(options?: {
  include?: string[];
  exclude?: string[];
}) {
  return defineConfig({
    test: {
      globals: true,
      environment: "node",
      include: options?.include ?? ["src/**/*.{test,spec}.{ts,tsx}"],
      exclude: [
        ...(options?.exclude ?? []),
        "node_modules",
        "dist",
        ".turbo",
      ],
      coverage: {
        provider: "v8",
        reporter: ["text", "json", "html"],
        exclude: [
          "node_modules",
          "dist",
          "*.config.*",
          "src/**/*.d.ts",
        ],
      },
      reporters: ["verbose"],
    },
  });
}

export default createVitestConfig();
