import { getContext } from "unctx";
import type { Happliance } from "@happliance/schema";

export const happlianceCtx = getContext<Happliance>("happliance");

export function useHappliance(): Happliance {
  const instance = happlianceCtx.tryUse();
  if (!instance) throw new Error("Happliance instance is unavailable !");

  return instance;
}

export function tryUseHappliance(): Happliance | null {
  return happlianceCtx.tryUse();
}
