import { existsSync, promises as fsp, lstatSync } from "node:fs";
import type { ModuleMeta, Happliance, HapplianceModule } from "@happliance/schema";
import { dirname, isAbsolute, join, resolve } from "pathe";
import { defu } from "defu";
import { useHappliance } from "../context";
import { importModule } from "../internal/module";
import { resolveAlias, resolvePath } from "../resolve";
import { logger } from "../logger";

const NODE_MODULES_RE = /[/\\]node_modules[/\\]/;

/** Installs a module on a Happliance instance. */
export async function installModule(moduleToInstall: string | HapplianceModule, inlineOptions?: any, happliance: Happliance = useHappliance()) {
  const { happlianceModule, buildTimeModuleMeta } = await loadHapplianceModuleInstance(moduleToInstall, happliance);

  const localLayerModuleDirs = new Set<string>();
  for (const l of happliance.options._layers) {
    const srcDir = l.config?.srcDir || l.cwd!;
    if (!NODE_MODULES_RE.test(srcDir)) localLayerModuleDirs.add(resolve(srcDir, l.config?.dir?.modules || "modules"));
  }

  const res = (await happlianceModule(inlineOptions, happliance)) ?? {};
  if (res === false /* setup aborted */) return;

  if (typeof moduleToInstall === "string") {
    /// happliance.options.build.transpile.push(normalizeModuleTranspilePath(moduleToInstall));
    const directory = getDirectory(moduleToInstall);
    if (directory !== moduleToInstall && !localLayerModuleDirs.has(directory)) happliance.options.modulesDir.push(resolve(directory, "node_modules"));
  }

  happliance.options._installedModules ||= [];
  happliance.options._installedModules.push({
    meta: defu(await happlianceModule.getMeta?.(), buildTimeModuleMeta),
    // timings: res.timings,
    entryPath: typeof moduleToInstall === "string" ? resolveAlias(moduleToInstall) : undefined,
  });
}

export function getDirectory(p: string) {
  try {
    return isAbsolute(p) && lstatSync(p).isFile() ? dirname(p) : p;
  } catch {
    return p;
  }
}

export const normalizeModuleTranspilePath = (p: string) => {
  return getDirectory(p).split("node_modules/").pop() as string;
};

export async function loadHapplianceModuleInstance(happlianceModule: string | HapplianceModule, happliance: Happliance = useHappliance()) {
  let buildTimeModuleMeta: ModuleMeta = {};
  if (typeof happlianceModule === "string") {
    const paths = [join(happlianceModule, "happliance"), join(happlianceModule, "module"), happlianceModule];
    let error: unknown;
    for (const path of paths) {
      try {
        const src = await resolvePath(path);
        happlianceModule = await importModule(src, happliance.options.modulesDir).catch(() => undefined);

        const moduleMetadataPath = join(dirname(src), "module.json");
        if (existsSync(moduleMetadataPath)) buildTimeModuleMeta = JSON.parse(await fsp.readFile(moduleMetadataPath, "utf8"));
        break;
      } catch (error_: unknown) {
        error = error_;
        continue;
      }
    }

    if (typeof happlianceModule !== "function" && error) {
      logger.error(`Error while requiring module \`${happlianceModule}\`: ${error}`);
      throw error;
    }
  }

  if (typeof happlianceModule !== "function") throw new TypeError("Happliance module should be a function: " + happlianceModule);

  return { happlianceModule, buildTimeModuleMeta } as { happlianceModule: HapplianceModule<any>; buildTimeModuleMeta: ModuleMeta };
}
