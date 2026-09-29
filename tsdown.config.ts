import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/bin.ts"],
  clean: true,
  deps: { alwaysBundle: [/.*/] },
  dts: false,
  format: ["esm"],
  minify: true,
  outDir: "plugins/deepseek-harness/dist",
  platform: "node",
  target: "node22",
});
