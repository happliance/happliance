import { applyDefaults } from "untyped";
import { loadConfig, type ConfigLayer, type LoadConfigOptions } from "c12";
import { defu } from "defu";
import { HapplianceConfigSchema, type HapplianceConfig, type HapplianceConfigLayer, type HapplianceOptions } from "@happliance/schema";

export interface LoadHapplianceConfigOptions extends LoadConfigOptions<HapplianceConfig> {}

const layerSchemaKeys = new Set(["srcDir", "rootDir", "dir"]);
const layerSchema = Object.fromEntries(Object.entries(HapplianceConfigSchema).filter(([key]) => layerSchemaKeys.has(key)));

export async function loadHapplianceConfig(options: LoadHapplianceConfigOptions): Promise<HapplianceOptions> {
  options.overrides = defu(options.overrides, {});

  (globalThis as any).defineHapplianceConfig = (c: any) => c;
  const result = await loadConfig<HapplianceConfig>({
    name: "happliance",
    configFile: "happliance.config",
    rcFile: ".happliancerc",
    extend: { extendKey: ["extends", "_extends"] },
    dotenv: true,
    globalRc: true,
    ...options,
  });
  delete (globalThis as any).defineHapplianceConfig;
  const {
    configFile,
    layers = [],
    cwd,
  } = result as {
    configFile: string;
    layers?: ConfigLayer[];
    cwd: string;
  };
  const happlianceConfig = result.config as HapplianceConfig & { _layers: HapplianceConfigLayer[] };

  happlianceConfig.rootDir ||= cwd;
  happlianceConfig._happlianceConfigFile = configFile;
  happlianceConfig._happlianceConfigFiles = [configFile];

  const _layers: HapplianceConfigLayer[] = [];
  for (const layer of layers) {
    layer.config ||= {};
    layer.config.rootDir ||= layer.cwd;
    layer.config = <any>await applyDefaults(layerSchema, <any>layer.config);
    if (!layer.configFile || layer.configFile.endsWith(".happliancerc")) continue;
    _layers.push(layer as HapplianceConfigLayer);
  }

  happlianceConfig._layers = _layers;

  if (_layers.length === 0) {
    _layers.push({
      cwd,
      config: {
        rootDir: cwd,
        srcDir: cwd,
      },
    });
  }

  return <any>await applyDefaults(HapplianceConfigSchema, <any>happlianceConfig);
}
