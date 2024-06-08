import { existsSync, promises as fs } from "node:fs";
import type { Happliance, HapplianceTypeTemplate, TSReference } from "@happliance/schema";
import { readPackageJSON, type TSConfig } from "pkg-types";
import { defu } from "defu";
import { withTrailingSlash } from "ufo";
import hash from "hash-sum";
import { basename, isAbsolute, join, parse, relative, resolve } from "pathe";
import { getModulePaths, tryResolveModule } from "./internal/module";
import { /* tryUseHappliance, */ useHappliance } from "./context";
import type { HapplianceTemplate } from "@happliance/schema";
import type { ResolvedHapplianceTemplate } from "@happliance/schema";
import { resolveHapplianceModule } from "./resolve";
import { getDirectory } from "./module/install";

export function addTemplate<T>(_template: HapplianceTemplate<T> | string) {
  const happliance = useHappliance();
  const template = normalizeTemplate(_template);

  happliance.options.build.templates = happliance.options.build.templates.filter((p) => {
    return normalizeTemplate(p).filename !== template.filename;
  });

  happliance.options.build.templates.push(template);

  return template;
}

export function addTypeTemplate<T>(_template: HapplianceTypeTemplate<T>) {
  const happliance = useHappliance();
  const template = normalizeTemplate(_template);

  if (!template.filename.endsWith(".d.ts")) throw new Error(`Invalid type template. Filename must end with .d.ts : "${template.filename}"`);

  happliance.hook("prepare:types", ({ references }) => {
    references.push({ path: template.dst });
  });

  return template;
}

export function normalizeTemplate<T>(template: HapplianceTemplate<T> | string): ResolvedHapplianceTemplate<T> {
  if (!template) throw new Error("Invalid template: " + JSON.stringify(template));

  template = typeof template === "string" ? { src: template } : { ...template };

  if (template.src) {
    if (!existsSync(template.src)) throw new Error("Template not found: " + template.src);

    if (!template.filename) {
      const srcPath = parse(template.src);
      template.filename = (template as any).fileName || `${basename(srcPath.dir)}.${srcPath.name}.${hash(template.src)}${srcPath.ext}`;
    }
  }

  if (!template.src && !template.getContents) throw new Error("Invalid template. Either getContents or src options should be provided: " + JSON.stringify(template));
  if (!template.filename) throw new Error("Invalid template. Either filename should be provided: " + JSON.stringify(template));

  if (template.filename.endsWith(".d.ts")) template.write = true;
  if (!template.dst) {
    const happliance = useHappliance();
    template.dst = resolve(happliance.options.buildDir, template.filename);
  }

  return template as ResolvedHapplianceTemplate<T>;
}

// export async function updateTemplates(options?: { filter?: (template: ResolvedHapplianceTemplate<any>) => boolean }) {
//   return await tryUseHappliance()?.hooks.callHook("builder:generateApp", options);
// }

export async function _generateTypes(happliance: Happliance) {
  const nodeModulePaths = getModulePaths(happliance.options.modulesDir);
  const rootDirWithSlash = withTrailingSlash(happliance.options.rootDir);

  const modulePaths = await resolveHapplianceModule(
    rootDirWithSlash,
    happliance.options._installedModules.filter((m) => m.entryPath).map((m) => getDirectory(m.entryPath)),
  );

  const include = [
    "./happliance.d.ts",
    join(relativeWithDot(happliance.options.buildDir, happliance.options.rootDir), ".config/happliance.*"),
    join(relativeWithDot(happliance.options.buildDir, happliance.options.rootDir), "**/*"),
  ];

  if (happliance.options.srcDir !== happliance.options.rootDir) {
    include.push(join(relative(happliance.options.buildDir, happliance.options.srcDir), "**/*"));
  }

  const tsConfig: TSConfig = defu<Partial<TSConfig>, [TSConfig]>(happliance.options.typescript?.tsConfig ?? {}, {
    compilerOptions: {
      esModuleInterop: true,
      skipLibCheck: true,
      target: "ESNext",
      module: "ESNext",
      moduleResolution: "Bundler",
      allowJs: true,
      resolveJsonModule: true,
      isolatedModules: true,
      verbatimModuleSyntax: true,
      strict: happliance.options.typescript?.strict ?? true,
      forceConsistentCasingInFileNames: true,
      noImplicitOverride: true,
      noEmit: true,
      types: [],
      paths: {},
    },
    include: [
      "./happliance.d.ts",
      join(relativeWithDot(happliance.options.buildDir, happliance.options.rootDir), ".config/happliance.*"),
      join(relativeWithDot(happliance.options.buildDir, happliance.options.rootDir), "**/*"),
      ...(happliance.options.srcDir === happliance.options.rootDir ? [] : [join(relative(happliance.options.buildDir, happliance.options.srcDir), "**/*")]),
      // ...happliance.options._layers
      //   .map((layer) => layer.config?.srcDir ?? layer.cwd)
      //   .filter((srcOrCwd): srcOrCwd is string => !srcOrCwd?.startsWith(rootDirWithSlash) || srcOrCwd.includes("node_modules"))
      //   .map((srcOrCwd) => join(relative(happliance.options.buildDir, srcOrCwd), "**/*")),
      ...(happliance.options.typescript.includeWorkspace && happliance.options.workspaceDir !== happliance.options.rootDir
        ? [join(relative(happliance.options.buildDir, happliance.options.workspaceDir), "**/*")]
        : []),
      ...modulePaths.map((m) => join(relativeWithDot(happliance.options.buildDir, m), "runtime")),
    ],
    exclude: [
      // ...happliance.options.modulesDir.map((m) => relativeWithDot(happliance.options.buildDir, m)),
      ...modulePaths.map((m) => join(relativeWithDot(happliance.options.buildDir, m), "runtime/server")),
      relativeWithDot(happliance.options.buildDir, resolve(happliance.options.rootDir, "dist")),
    ],
  });

  const aliases: Record<string, string> = {
    ...happliance.options.alias,
    "#build": happliance.options.buildDir,
  };

  tsConfig.compilerOptions ||= {};
  tsConfig.include ||= [];

  const basePath = tsConfig.compilerOptions.baseUrl ? resolve(happliance.options.buildDir, tsConfig.compilerOptions.baseUrl) : happliance.options.buildDir;

  for (const alias in aliases) {
    let absolutePath = resolve(basePath, aliases[alias]);
    let stats = await fs.stat(absolutePath).catch(() => undefined);
    if (!stats) {
      const resolvedModule = await tryResolveModule(aliases[alias], happliance.options.modulesDir);
      if (resolvedModule) {
        absolutePath = resolvedModule;
        stats = await fs.stat(resolvedModule).catch(() => undefined);
      }
    }

    const relativePath = relativeWithDot(happliance.options.buildDir, absolutePath);
    if (stats?.isDirectory()) {
      tsConfig.compilerOptions.paths[alias] = [relativePath];
      tsConfig.compilerOptions.paths[`${alias}/*`] = [`${relativePath}/*`];
      if (!absolutePath.startsWith(rootDirWithSlash)) tsConfig.include.push(relativePath);
    } else {
      const path = stats?.isFile() ? relativePath.replace(/\b\.\w+$/g, "") : aliases[alias];
      tsConfig.compilerOptions.paths[alias] = [path];
      if (!absolutePath.startsWith(rootDirWithSlash)) tsConfig.include.push(path);
    }
  }

  const references: TSReference[] = await Promise.all(
    [...happliance.options.modules, ...happliance.options._modules]
      .filter((f) => typeof f === "string")
      .map(async (id) => ({ types: (await readPackageJSON(id, { url: nodeModulePaths }).catch(() => undefined))?.name || id })),
  );

  const declarations: string[] = [];
  await happliance.callHook("prepare:types", { references, declarations, tsConfig });

  for (const alias in tsConfig.compilerOptions.paths) {
    const paths = tsConfig.compilerOptions!.paths[alias];

    const aliasPromises = paths.map(async (path: string) => {
      if (!isAbsolute(path)) return path;
      const stats = await fs.stat(path).catch(() => undefined);
      return relativeWithDot(happliance.options.buildDir, stats?.isFile() ? path.replace(/\b\.\w+$/g, "") /* remove extension */ : path);
    });

    tsConfig.compilerOptions.paths[alias] = await Promise.all(aliasPromises);
  }

  tsConfig.include = [...new Set(tsConfig.include.map((p) => (isAbsolute(p) ? relativeWithDot(happliance.options.buildDir, p) : p)))];
  tsConfig.exclude = [...new Set(tsConfig.exclude!.map((p) => (isAbsolute(p) ? relativeWithDot(happliance.options.buildDir, p) : p)))];

  const declaration = [
    ...references.map((ref) => {
      if ("path" in ref && isAbsolute(ref.path)) ref.path = relative(happliance.options.buildDir, ref.path);
      return `/// <reference ${renderAttrs(ref)} />`;
    }),
    ...declarations,
    "",
    "export {};",
    "",
  ].join("\n");

  return { declaration, tsConfig };
}

export async function writeTypes(happliance: Happliance) {
  const { tsConfig, declaration } = await _generateTypes(happliance);

  async function writeFile() {
    const GeneratedBy = "// Generated by happly";

    const tsConfigPath = resolve(happliance.options.buildDir, "tsconfig.json");
    await fs.mkdir(happliance.options.buildDir, { recursive: true });
    await fs.writeFile(tsConfigPath, `${GeneratedBy}\n${JSON.stringify(tsConfig, undefined, 2)}`);

    const declarationPath = resolve(happliance.options.buildDir, "happliance.d.ts");
    await fs.writeFile(declarationPath, `${GeneratedBy}\n${declaration}`);
  }

  await writeFile();
}

function renderAttrs(obj: Record<string, string>) {
  return Object.entries(obj)
    .map(([key, value]) => renderAttr(key, value))
    .join(" ");
}

function renderAttr(key: string, value: string) {
  return value ? `${key}="${value}"` : "";
}

function relativeWithDot(from: string, to: string) {
  return relative(from, to).replace(/^([^.])/, "./$1") || ".";
}
