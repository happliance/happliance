import { defineUntypedSchema } from "untyped";

export default defineUntypedSchema({
  /**
   * Configuration for Happliance's TypeScript integration.
   */
  typescript: {
    /**
     * TypeScript comes with certain checks to give you more safety and analysis of your program.
     * Once you’ve converted your codebase to TypeScript, you can start enabling these checks for greater safety.
     * [Read More](https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html#getting-stricter-checks)
     */
    strict: true,

    /**
     * Modules to generate deep aliases for within `compilerOptions.paths`. This does not yet support subpaths.
     * It may be necessary when using Happliance within a pnpm monorepo with `shamefully-hoist=false`.
     */
    hoist: {
      $resolve: (val) => {
        const defaults = ["defu", "h3", "consola", "ofetch", "@happliance/schema", "happliance"];
        return val === false ? [] : Array.isArray(val) ? [...val, ...defaults] : defaults;
      },
    },

    /**
     * Include parent workspace in the Happliance project. Mostly useful for themes and module authors.
     */
    includeWorkspace: false,

    /**
     * Enable build-time type checking.
     *
     * If set to true, this will type check in development. You can restrict this to build-time type checking by setting it to `build`.
     * Requires to install `typescript` as dev dependencies.
     * @type {boolean | 'build'}
     */
    typeCheck: false,

    /**
     * You can extend generated `.happ/tsconfig.json` using this option.
     * @type {typeof import('pkg-types')['TSConfig']}
     */
    tsConfig: {},
  },
});
