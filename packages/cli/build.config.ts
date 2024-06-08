import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  declaration: true,
  entries: ["src/index"],
  externals: ["node:url", "node:buffer", "node:path", "node:child_process", "node:process", "node:path", "node:os"],
});
