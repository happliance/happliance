import { performance } from "node:perf_hooks";
import { defu } from "defu";
import { applyDefaults } from "untyped";
import type { ModuleDefinition, ModuleOptions, ModuleSetupReturn, Happliance, HapplianceModule, HapplianceOptions } from "@happliance/schema";
import { logger } from "../logger";
import { tryUseHappliance, useHappliance } from "../context";
import { checkHapplianceCompatibility } from "../compatibility";

/**
 * Define a Happliance module, automatically merging defaults with user provided options, installing
 * any hooks that are provided, and calling an optional setup function for full control.
 */
export function defineHapplianceModule<OptionsT extends ModuleOptions>(definition: ModuleDefinition<OptionsT> | HapplianceModule<OptionsT>): HapplianceModule<OptionsT> {
  if (typeof definition === "function") return defineHapplianceModule({ setup: definition });

  const module: ModuleDefinition<OptionsT> & Required<Pick<ModuleDefinition<OptionsT>, "meta">> = defu(definition, { meta: {} });
  if (module.meta.configKey === undefined) module.meta.configKey = module.meta.name;

  async function getOptions(inlineOptions?: OptionsT, happliance: Happliance = useHappliance()) {
    const configKey = module.meta.configKey || module.meta.name!;
    const _defaults = module.defaults instanceof Function ? module.defaults(happliance) : module.defaults;
    let _options = <OptionsT>defu(inlineOptions, happliance.options[configKey as keyof HapplianceOptions], _defaults);
    if (module.schema) _options = <OptionsT>await applyDefaults(module.schema, _options);

    return _options;
  }

  async function normalizedModule(this: any, inlineOptions: OptionsT, happliance: Happliance) {
    if (!happliance) happliance = tryUseHappliance() || this.happliance;

    const uniqueKey = module.meta.name || module.meta.configKey;
    if (uniqueKey) {
      happliance.options._requiredModules = happliance.options._requiredModules || {};
      if (happliance.options._requiredModules[uniqueKey]) return false;

      happliance.options._requiredModules[uniqueKey] = true;
    }

    if (module.meta.compatibility) {
      const issues = await checkHapplianceCompatibility(module.meta.compatibility, happliance);
      if (issues.length > 0) {
        logger.warn(`Module \`${module.meta.name}\` is disabled due to incompatibility issues:\n${issues.toString()}`);
        return;
      }
    }

    const _options = await getOptions(inlineOptions, happliance);
    if (module.hooks) happliance.hooks.addHooks(module.hooks);

    const key = `happliance:module:${uniqueKey || Math.round(Math.random() * 10_000)}`;
    const mark = performance.mark(key);
    const res = (await module.setup?.call(undefined, _options, happliance)) ?? {};
    const perf = performance.measure(key, mark.name);
    const setupTime = Math.round(perf.duration * 100) / 100;

    if (setupTime > 5000 && uniqueKey !== "@happliance/telemetry") logger.warn(`Slow module \`${uniqueKey || "<no name>"}\` took \`${setupTime}ms\` to setup.`);
    else if (happliance.options.debug) logger.info(`Module \`${uniqueKey || "<no name>"}\` took \`${setupTime}ms\` to setup.`);

    if (res === false) return false;

    return defu(res, <ModuleSetupReturn>{ timings: { setup: setupTime } });
  }

  // Define getters for options and meta
  normalizedModule.getMeta = () => Promise.resolve(module.meta);
  normalizedModule.getOptions = getOptions;

  return normalizedModule as HapplianceModule<OptionsT>;
}
