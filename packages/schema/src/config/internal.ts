import { defineUntypedSchema } from "untyped";

export default defineUntypedSchema({
  /** @private */
  _majorVersion: 0,
  /** @private */
  _start: false,
  /** @private */
  _build: false,
  /** @private */
  _prepare: false,
  /** @private */
  _cli: false,
  /** @private */
  _requiredModules: {},
  /** @private */
  _happlianceConfigFile: undefined,
  /** @private */
  _happlianceConfigFiles: [],
  /** @private */
  appDir: "",
  /** @private */
  _installedModules: [],
  /** @private */
  _modules: [],
});
