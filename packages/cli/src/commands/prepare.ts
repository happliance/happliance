import { relative, resolve } from "pathe";
import { consola } from "consola";
import { defineCommand } from "citty";
import { sharedArgs } from "./_shared";
import { clearBuildDir } from "../utils/fs";
import { loadPack } from "../utils/pack";

export default defineCommand({
  meta: {
    name: "prepare",
    description: "Prepare Happliance for development/build",
  },
  args: {
    ...sharedArgs,
    dotenv: {
      type: "string",
      description: "Path to .env file",
    },
  },
  async run(ctx) {
    process.env.NODE_ENV ||= "production";
    const cwd = resolve(ctx.args.cwd || ".");

    const { loadHappliance, buildHappliance, writeTypes } = await loadPack(cwd);

    const happliance = await loadHappliance({
      cwd,
      dotenv: {
        cwd,
        fileName: ctx.args.dotenv,
      },
      overrides: {
        _prepare: true,
        logLevel: ctx.args.logLevel,
        ...ctx.data?.overrides,
      },
    });

    await clearBuildDir(happliance.options.buildDir);
    await buildHappliance(happliance);
    await writeTypes(happliance);

    console.dir(happliance);

    consola.success(`Types generated in ${relative(process.cwd(), happliance.options.buildDir)}`);
  },
});
