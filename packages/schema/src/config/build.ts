import { defineUntypedSchema } from "untyped";
import { isTest } from "std-env";
import { consola } from "consola";

export default defineUntypedSchema({
  /**
   * Whether to generate sourcemaps.
   * @type {boolean}
   */
  sourcemap: {
    $default: true,
  },

  /**
   * Log level when building logs.
   *
   * Defaults to 'silent' when running in CI or when a TTY is not available.
   * @type {'silent' | 'info' | 'verbose'}
   */
  logLevel: {
    $resolve: (val: string | undefined) => {
      if (val && !["silent", "info", "verbose"].includes(val)) {
        consola.warn(`Invalid \`logLevel\` option: \`${val}\`. Must be one of: \`silent\`, \`info\`, \`verbose\`.`);
      }

      return val ?? (isTest ? "silent" : "info");
    },
  },

  build: {
    /**
     * You can provide your own templates which will be rendered based
     * on Happliance configuration. This feature is specially useful for using with modules.
     *
     * Templates are rendered using [`lodash/template`](https://lodash.com/docs/4.17.15#template).
     * @example
     * ```js
     * templates: [
     *   {
     *     src: '~/modules/support/plugin.js', // `src` can be absolute or relative
     *     dst: 'support.js', // `dst` is relative to project `.happ` dir
     *     options: {
     *       // Options are provided to template as `options` key
     *       live_chat: false
     *     }
     *   }
     * ]
     * ```
     * @type {typeof import('../src/types/happliance').HapplianceTemplate<any>[]}
     */
    templates: [],
  },
});
