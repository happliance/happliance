import { defineUntypedSchema } from "untyped";

export default defineUntypedSchema({
  devServer: {
    /**
     * Whether to enable HTTPS.
     * @example
     * ```
     * export default defineHapplianceConfig({
     *   devServer: {
     *     https: {
     *       key: './server.key',
     *       cert: './server.crt'
     *     }
     *   }
     * })
     * ```
     * @type {boolean | { key: string; cert: string }}
     */
    https: false,

    /** Dev server listening port */
    port: process.env.HAPPLIANCE_PORT || process.env.PORT || 3000,

    /** Dev server listening host */
    host: process.env.HAPPLIANCE_HOST || process.env.HOST || undefined,

    /**
     * Listening dev server URL.
     *
     * This should not be set directly as it will always be overridden by the
     * dev server with the full URL (for module and internal use).
     */
    url: "http://localhost:3000",
  },
});
