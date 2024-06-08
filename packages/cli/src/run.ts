import { fileURLToPath } from "node:url";
import { runCommand as _runCommand, runMain as _runMain } from "citty";

import { commands } from "./commands";
import { main } from "./main";

globalThis.__happliance_cli__ ||= {
  startTime: Date.now(),
  entry: fileURLToPath(new URL(import.meta.url.endsWith(".ts") ? "../bin/happliance.mjs" : "../../bin/happliance.mjs", import.meta.url)),
};

export const runMain = () => _runMain(main);

export async function runCommand(name: string, argv: string[] = process.argv.slice(2), data: { overrides?: Record<string, any> } = {}) {
  if (!(name in commands)) throw new Error(`Invalid command ${name}`);

  const command = await commands[name as keyof typeof commands]();
  const rawArgs = [...argv, "--no-clear"];
  const overrides = data.overrides || {};

  return await _runCommand(command, { rawArgs, data: { overrides } });
}
