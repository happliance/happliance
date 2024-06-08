import type { ConfigLayer } from "c12";
import type { SchemaDefinition } from "untyped";
import type { ConfigSchema } from "../../schema/config";
import type { Happliance } from "./happliance";

export type { SchemaDefinition } from "untyped";

type DeepPartial<T> = T extends (...args: any[]) => any ? T : T extends Record<string, any> ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

export interface HapplianceConfig extends DeepPartial<ConfigSchema> {
  $schema?: SchemaDefinition;
}

export type HapplianceConfigLayer = ConfigLayer<HapplianceConfig & { srcDir: ConfigSchema["srcDir"]; rootDir: ConfigSchema["rootDir"] }>;

export interface HapplianceBuilder {
  bundle: (happliance: Happliance) => Promise<void>;
}

export interface HapplianceOptions extends Omit<ConfigSchema, "builder"> {
  builder: HapplianceBuilder;
  _layers: HapplianceConfigLayer[];
  $schema: SchemaDefinition;
}

export interface HapplianceAppConfig {}

export interface CustomAppConfig {
  [key: string]: unknown;
}

export interface AppConfigInput extends CustomAppConfig {}

export interface HapplianceAppConfig {}

export interface AppConfig {
  [key: string]: unknown;
}
