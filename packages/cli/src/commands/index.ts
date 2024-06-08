import type { CommandDef } from "citty";
import { interopDefault } from "mlly";

export const commands = {
  hello: async () => await import("./hello").then<CommandDef>(interopDefault),
  prepare: async () => await import("./prepare").then<CommandDef>(interopDefault),
} as const;
