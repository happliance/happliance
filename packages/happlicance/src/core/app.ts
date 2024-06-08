import { defu } from "defu";
import { Happliance, HapplianceApp } from "@happliance/schema";

export function createApp(happliance: Happliance, options: Partial<HapplianceApp> = {}): HapplianceApp {
  return defu<Partial<HapplianceApp>, [HapplianceApp]>(options, {
    controllers: [],
  });
}
