import { defineCommand } from "citty";
import { consola } from "consola";
import { colors } from "consola/utils";

export default defineCommand({
  meta: {
    name: "hello",
    description: "Prints a greeting message",
  },
  async run(ctx) {
    consola.log(colors.greenBright("Hello, world!"));
  },
});
