import { importModule, tryResolveModule } from "./esm";

export const loadPack = async (rootDir: string): Promise<typeof import("@happliance/pack")> => {
  try {
    const localPack = await tryResolveModule("@happliance/pack", rootDir);
    const happliance = await tryResolveModule("happliance", rootDir);
    const rootURL = localPack ? rootDir : happliance || rootDir;

    const pack: typeof import("@happliance/pack") = await importModule("@happliance/pack", rootURL);

    return pack;
  } catch (error_: any) {
    if (error_.toString().includes("Cannot find module @happliance/pack")) {
      throw new Error("happly requires `@happliance/pack` to be installed in your project. Try installing `happliance` first.");
    }

    throw error_;
  }
};
