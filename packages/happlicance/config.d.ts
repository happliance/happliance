import type { HapplianceConfig, HapplianceConfigLayer } from "happliance/schema";
import type { DefineConfig } from "c12";

export { HapplianceConfig } from "happliance/schema";

export interface DefineHapplianceConfig extends DefineConfig<HapplianceConfig, HapplianceConfigLayer> {}
export declare const defineHapplianceConfig: DefineHapplianceConfig;
