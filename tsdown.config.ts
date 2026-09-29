import { defineConfig } from "tsdown";

const shared = {
  deps: {
    alwaysBundle: [
      /^@modelcontextprotocol\/sdk(?:\/|$)/u,
      /^cross-spawn(?:\/|$)/u,
      /^zod(?:\/|$)/u,
    ],
    onlyBundle: false as const,
  },
  dts: false,
  format: "esm" as const,
  minify: true,
  platform: "node" as const,
  target: "node22",
};

export default defineConfig([
  {
    ...shared,
    entry: ["src/bin.ts"],
    clean: false,
    outDir: "dist",
  },
  {
    ...shared,
    entry: { server: "src/bin.ts" },
    clean: false,
    outDir: "plugins/deepseek-harness",
  },
]);
