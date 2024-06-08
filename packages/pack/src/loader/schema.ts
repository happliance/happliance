import type { SchemaDefinition } from "@happliance/schema";
import { useHappliance } from "../context";

export function extendNuxtSchema(def: SchemaDefinition | (() => SchemaDefinition)) {
  const happliance = useHappliance();
  happliance.hook("schema:extend", (schemas) => {
    schemas.push(typeof def === "function" ? def() : def);
  });
}
