import { defineUntypedSchema } from "untyped";

export default defineUntypedSchema({
  /**
   * Happliance App configuration.
   */
  app: {
    /**
     * The base path of your Happliance application.
     *
     * For example:
     * @example
     * ```ts
     * export default defineHapplianceConfig({
     *   app: {
     *     baseURL: '/prefix/'
     *   }
     * })
     * ```
     *
     * This can also be set at runtime by setting the HAPPLIANCE_APP_BASE_URL environment variable.
     * @example
     * ```bash
     * HAPPLIANCE_APP_BASE_URL=/prefix/ node .output/server/index.mjs
     * ```
     */
    baseURL: {
      $resolve: (val) => val || process.env.HAPPLIANCE_APP_BASE_URL || "/",
    },

    /** The folder name for the built site assets, relative to `baseURL` (or `cdnURL` if set). This is set at build time and should not be customized at runtime. */
    buildAssetsDir: {
      $resolve: (val) => val || process.env.HAPPLIANCE_APP_BUILD_ASSETS_DIR || "/_happliance/",
    },

    /**
     * An absolute URL to serve the public folder from (production-only).
     *
     * For example:
     * @example
     * ```ts
     * export default defineHapplianceConfig({
     *   app: {
     *     cdnURL: 'https://mycdn.org/'
     *   }
     * })
     * ```
     *
     * This can be set to a different value at runtime by setting the `HAPPLIANCE_APP_CDN_URL` environment variable.
     * @example
     * ```bash
     * HAPPLIANCE_APP_CDN_URL=https://mycdn.org/ node .output/server/index.mjs
     * ```
     */
    cdnURL: {
      $resolve: async (val, get) => ((await get("dev")) ? "" : (process.env.HAPPLIANCE_APP_CDN_URL ?? val) || ""),
    },
  },

  /**
   * An array of happliance app plugins.
   *
   * Each plugin can be a string (which can be an absolute or relative path to a file).
   * If it ends with `.client` or `.server` then it will be automatically loaded only
   * in the appropriate context.
   *
   * It can also be an object with `src` and `mode` keys.
   * @note Plugins are also auto-registered from the `~/plugins` directory
   * and these plugins do not need to be listed in `happliance.config` unless you
   * need to customize their order. All plugins are deduplicated by their src path.
   * @example
   * ```js
   * plugins: [
   *   '~/plugins/foo.client.js', // only in client side
   *   '~/plugins/bar.server.js', // only in server side
   *   '~/plugins/baz.js', // both client & server
   *   { src: '~/plugins/both-sides.js' },
   *   { src: '~/plugins/client-only.js', mode: 'client' }, // only on client side
   *   { src: '~/plugins/server-only.js', mode: 'server' } // only on server side
   * ]
   * ```
   * @type {(typeof import('../src/types/happliance').HappliancePlugin | string)[]}
   */
  plugins: [],
});
