import { defineCommand } from "citty";
import { readPackageJSON } from "pkg-types";
import { commands } from "./commands";
import { setupConsole } from "./utils/console";

export const main = defineCommand({
  meta: async () => {
    const pkg = await readPackageJSON();
    return {
      name: pkg.name,
      version: pkg.version,
      description: pkg.description,
    };
  },

  subCommands: commands,

  async setup(ctx) {
    const command = ctx.args._[0];
    const dev = command === "dev";
    setupConsole({ dev });
  },
});
