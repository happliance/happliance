import type { Happliance, HapplianceHooks, HapplianceOptions } from "@happliance/schema";
import { type LoadHapplianceOptions, loadHapplianceConfig, happlianceCtx } from "@happliance/pack";

import { createHooks } from "hookable";

export function createHappliance(options: HapplianceOptions): Happliance {
  const hooks = createHooks<HapplianceHooks>();

  const happliance: Happliance = {
    _version: "1",
    options,
    hooks,
    hook: hooks.hook,
    callHook: hooks.callHook,
    addHooks: hooks.addHooks,
    ready: async () => await initHappliance(happliance),
    close: async () => await hooks.callHook("close", happliance),
    apps: {},
  };

  return happliance;
}

const keyDependencies = ["@happliance/pack", "@happliance/schema"];

async function initHappliance(happliance: Happliance) {
  happlianceCtx.set(happliance);
  happliance.hook("close", () => happlianceCtx.unset());

  await happliance.callHook("ready", happliance);
}

export async function loadHappliance(opts: LoadHapplianceOptions): Promise<Happliance> {
  const options = await loadHapplianceConfig(opts);
  const happliance = createHappliance(options);

  if (opts.ready !== false) {
    await happliance.ready();
  }

  return happliance;
}
