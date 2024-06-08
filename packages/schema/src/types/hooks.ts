import type { TSConfig } from "pkg-types";
import type { Schema, SchemaDefinition } from "untyped";
import type { Happliance } from "./happliance";
import type { HapplianceCompatibility, HapplianceCompatibilityIssues } from "./compatibility";

export type HookResult = Promise<void> | void;
export type TSReference = { types: string } | { path: string };

export interface HapplianceHooks {
  // Pack
  /**
   * Allows extending compatibility checks.
   * @param compatibility Compatibility object
   * @param issues Issues to be mapped
   * @returns Promise
   */
  "pack:compatibility": (compatibility: HapplianceCompatibility, issues: HapplianceCompatibilityIssues) => HookResult;

  // Happliance
  /**
   * Called after Happliance initialization, when the Happliance instance is ready to work.
   * @param happliance The configured Happliance object
   * @returns Promise
   */
  "ready": (happliance: Happliance) => HookResult;
  /**
   * Called when Happliance instance is gracefully closing.
   * @param happliance The configured Happliance object
   * @returns Promise
   */
  "close": (happliance: Happliance) => HookResult;
  /**
   * Called to restart the current Happliance instance.
   * @returns Promise
   */
  "restart": (options?: { hard?: boolean }) => HookResult;

  /**
   * Called during Happliance initialization, before installing user modules.
   * @returns Promise
   */
  "modules:before": () => HookResult;
  /**
   * Called during Happliance initialization, after installing user modules.
   * @returns Promise
   */
  "modules:done": () => HookResult;

  /**
   * Called before Happliance bundle builder.
   * @returns Promise
   */
  "build:before": () => HookResult;
  /**
   * Called after Happliance bundle builder is complete.
   * @returns Promise
   */
  "build:done": () => HookResult;
  /**
   * Called when an error occurs at build time.
   * @param error Error object
   * @returns Promise
   */
  "build:error": (error: Error) => HookResult;
  /**
   * Called before Happly writes `.happ/tsconfig.json` and `.happ/happliance.d.ts`, allowing addition of custom references and declarations in `happliance.d.ts`, or directly modifying the options in `tsconfig.json`
   * @param options Objects containing `references`, `declarations`, `tsConfig`
   * @returns Promise
   */
  "prepare:types": (options: { references: TSReference[]; declarations: string[]; tsConfig: TSConfig }) => HookResult;

  // Schema
  /**
   * Allows extending default schemas.
   * @param schemas Schemas to be extend
   * @returns void
   */
  "schema:extend": (schemas: SchemaDefinition[]) => void;
  /**
   * Allows extending resolved schema.
   * @param schema Schema object
   * @returns void
   */
  "schema:resolved": (schema: Schema) => void;
  /**
   * Called before writing the given schema.
   * @param schema Schema object
   * @returns void
   */
  "schema:beforeWrite": (schema: Schema) => void;
  /**
   * Called after the schema is written.
   * @returns void
   */
  "schema:written": () => void;
}

export type HapplianceHookName = keyof HapplianceHooks;
