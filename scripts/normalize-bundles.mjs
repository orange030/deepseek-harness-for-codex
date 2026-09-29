import { readFile, writeFile } from "node:fs/promises";

const bundles = ["dist/bin.mjs", "plugins/deepseek-harness/server.mjs"];

for (const bundle of bundles) {
  const source = await readFile(bundle, "utf8");
  await writeFile(bundle, source.replace(/[\t ]+$/gmu, ""), "utf8");
}
