import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  declaration: true,
  entries: [{ input: "src/index" }, { input: "src/app/", outDir: "dist/app/", ext: "js" }],
});
