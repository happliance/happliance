import { interopDefault, resolvePath, pathToFileURL } from "mlly";
import { resolvePackageJSON, readPackageJSON } from "pkg-types";
import type { Happliance } from "@happliance/schema";
import type { LoadHapplianceConfigOptions } from "./config";
import { importModule, tryImportModule } from "../internal/module";
import major from "semver/functions/major";

export interface LoadHapplianceOptions extends LoadHapplianceConfigOptions {
  dev?: boolean;
  ready?: boolean;
}

export async function loadHappliance(opts: LoadHapplianceOptions): Promise<Happliance> {
  opts.overrides ||= {};
  opts.overrides.dev = !!opts.dev;

  const packageJsonPath = await resolvePackageJSON("happliance", { url: opts.cwd }).catch(() => {
    throw new Error(`Cannot find any happliance version from ${opts.cwd}`);
  });

  const packageJson = await readPackageJSON(packageJsonPath);
  const rootDir = pathToFileURL(opts.cwd || process.cwd());

  const { loadHappliance } = await importModule(packageJson._name || packageJson.name, rootDir);
  const happliance = await loadHappliance(opts);
  return happliance;
}

export async function buildHappliance(happliance: Happliance): Promise<void> {
  const rootDir = pathToFileURL(happliance.options.rootDir);
  const { build } = await importModule("happliance", rootDir);
  return build(happliance);
}
