import { consola, type ConsolaReporter } from "consola";

export function setupConsole(options = {} as { dev?: boolean }) {
  if (options.dev) {
    consola.wrapAll();
  } else {
    consola.wrapConsole();
  }

  process.on("unhandledRejection", (err) => {
    consola.error("[unhandledRejection]", err);
  });

  process.on("uncaughtException", (err) => {
    consola.error("[uncaughtException]", err);
  });
}
