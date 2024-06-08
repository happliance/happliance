import { Hookable } from "hookable";
import type { HapplianceOptions } from "./config";
import type { HapplianceHooks } from "./hooks";
import type { Ignore } from "ignore";

export interface HappliancePlugin {
  src: string;
  order?: number;
  name?: string;
}

type TemplateDefaultOptions = Record<string, any>;

export interface HapplianceTemplate<Options = TemplateDefaultOptions> {
  dst?: string;
  filename?: string;
  options?: Options;
  src?: string;
  getContents?: (data: { happliance: Happliance; app: HapplianceApp; options: Options }) => string | Promise<string>;
  write?: boolean;
}

export interface ResolvedHapplianceTemplate<Options = TemplateDefaultOptions> extends HapplianceTemplate<Options> {
  filename: string;
  dst: string;
  modified?: boolean;
}

export interface HapplianceTypeTemplate<Options = TemplateDefaultOptions> extends Omit<HapplianceTemplate<Options>, "write" | "filename"> {
  filename: `${string}.d.ts`;
  write?: true;
}

type _TemplatePlugin<Options> = Omit<HappliancePlugin, "src"> & HapplianceTemplate<Options>;
export interface HappliancePluginTemplate<Options = TemplateDefaultOptions> extends _TemplatePlugin<Options> {}

export interface HapplianceApp {
  dir: string;
  extensions: string[];
  plugins: HappliancePlugin[];
  templates: HapplianceTemplate[];
  configs: string[];
}

export interface Happliance {
  _version: string;
  _ignore?: Ignore;

  options: HapplianceOptions;
  hooks: Hookable<HapplianceHooks>;
  hook: Happliance["hooks"]["hook"];
  callHook: Happliance["hooks"]["callHook"];
  addHooks: Happliance["hooks"]["addHooks"];

  ready: () => Promise<void>;
  close: () => Promise<void>;

  server?: any;

  vfs: Record<string, string>;

  apps: Record<string, HapplianceApp>;
}
