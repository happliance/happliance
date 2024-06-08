import type { HapplianceCompatibility } from "./compatibility";
import type { Happliance } from "./happliance";
import type { HapplianceHooks } from "./hooks";

export interface ModuleMeta {
  /* Module name. */
  name?: string;

  /* Module version. */
  version?: string;

  /**
   * The configuration key used within `happliance.config` for this module's options.
   * For example, `@happliance/typeorm` uses `typeorm`.
   */
  configKey?: string;

  /**
   * Constraints for the versions of Nuxt or features this module requires.
   */
  compatibility?: HapplianceCompatibility;

  [key: string]: unknown;
}

/* The options received. */
export type ModuleOptions = Record<string, any>;

/** Optional result for happliance modules */
export interface ModuleSetupReturn {
  /**
   * Timing information for the initial setup
   */
  timings?: {
    /** Total time took for module setup in ms */
    setup?: number;
    [key: string]: number | undefined;
  };
}

type Awaitable<T> = T | Promise<T>;
type _ModuleSetupReturn = Awaitable<void | false | ModuleSetupReturn>;

export interface ModuleDefinition<T extends ModuleOptions = ModuleOptions> {
  meta?: ModuleMeta;
  defaults?: T | ((happliance: Happliance) => T);
  schema?: T;
  hooks?: Partial<HapplianceHooks>;
  setup?: (this: void, resolvedOptions: T, happliance: Happliance) => _ModuleSetupReturn;
}

export interface HapplianceModule<T extends ModuleOptions = ModuleOptions> {
  (this: void, inlineOptions: T, happliance: Happliance): _ModuleSetupReturn;
  getOptions?: (inlineOptions?: T, happliance?: Happliance) => Promise<T>;
  getMeta?: () => Promise<ModuleMeta>;
}
