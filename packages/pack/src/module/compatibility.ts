import satisfies from "semver/functions/satisfies";
import type { Happliance, HapplianceModule, HapplianceOptions } from "@happliance/schema";
import { useHappliance } from "../context";
import { normalizeSemanticVersion } from "../compatibility";
import { loadHapplianceModuleInstance } from "./install";

function resolveHapplianceModuleEntryName(m: HapplianceOptions["modules"][number]): string | false {
  if (typeof m === "object" && !Array.isArray(m)) return (m as any as HapplianceModule).name;
  if (Array.isArray(m)) return resolveHapplianceModuleEntryName(m[0]);
  return (m as string) || false;
}

/**
 * Check if a Happliance module is installed by name.
 *
 * This will check both the installed modules and the modules to be installed. Note
 * that it cannot detect if a module is _going to be_ installed programmatically by another module.
 */
export function hasHapplianceModule(moduleName: string, happliance: Happliance = useHappliance()): boolean {
  return (
    // check installed modules
    happliance.options._installedModules.some(({ meta }) => meta.name === moduleName) ||
    // check modules to be installed
    happliance.options.modules.some((m) => moduleName === resolveHapplianceModuleEntryName(m))
  );
}

/**
 * Checks if a Happliance Module is compatible with a given semver version.
 */
export async function hasHapplianceModuleCompatibility(module: string | HapplianceModule, semverVersion: string, happliance: Happliance = useHappliance()): Promise<boolean> {
  const version = await getHapplianceModuleVersion(module, happliance);
  if (!version) return false;
  return satisfies(normalizeSemanticVersion(version), semverVersion, { includePrerelease: true });
}

/**
 * Get the version of a Happliance module.
 *
 * Scans installed modules for the version, if it's not found it will attempt to load the module instance and get the version from there.
 */
export async function getHapplianceModuleVersion(module: string | HapplianceModule, happliance: Happliance | any = useHappliance()): Promise<string | false> {
  const moduleMeta = (typeof module === "string" ? { name: module } : await module.getMeta?.()) || {};
  if (moduleMeta.version) return moduleMeta.version;
  if (!moduleMeta.name) return false;

  const version = happliance.options._installedModules.filter((m: any) => m.meta.name === moduleMeta.name).map((m: any) => m.meta.version as string)?.[0];
  if (version) return version;
  if (hasHapplianceModule(moduleMeta.name)) {
    const { buildTimeModuleMeta } = await loadHapplianceModuleInstance(moduleMeta.name, happliance);
    return buildTimeModuleMeta.version || false;
  }

  return false;
}
