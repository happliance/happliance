import type { ArgsDef } from "citty";

export const sharedArgs = {
  cwd: {
    type: "string",
    description: "Current working directory",
  },
  logLevel: {
    type: "string",
    description: "Log level",
  },
} as const satisfies ArgsDef;
