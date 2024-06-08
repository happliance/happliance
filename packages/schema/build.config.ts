import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  declaration: "compatible",
  entries: [
    {
      input: "src/config/index",
      outDir: "schema",
      name: "config",
      builder: "untyped",
      defaults: {
        srcDir: "/<srcDir>/",
        workspaceDir: "/<workspaceDir>/",
        rootDir: "/<rootDir>/",
      },
    },
    { input: "src/index" },
  ],

  externals: ["c12", "consola", "defu", "hookable", "pathe", "pkg-types", "std-env", "uncrypto", "untyped"],
});
