import type { DefineHapplianceConfig } from "happliance/config";

export * from "./dist/index";

declare global {
  const defineHapplianceConfig: DefineHapplianceConfig;
}
