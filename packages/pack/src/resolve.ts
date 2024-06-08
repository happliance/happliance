import { existsSync, promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import { basename, dirname, isAbsolute, join, normalize, resolve } from "pathe";
import { globby } from "globby";
import { resolvePath as _resolvePath } from "mlly";
import { resolveAlias as _resolveAlias } from "pathe/utils";
import { tryUseHappliance } from "./context";
import { isIgnored } from "./ignore";
import { toArray } from "./utils";

export interface ResolvePathOptions {
  /** Base for resolving paths from. Default is Happliance rootDir. */
  cwd?: string;

  /** An object of aliases. Default is Happliance configured aliases. */
  alias?: Record<string, string>;

  /** The file extensions to try. Default is Happliance configured extensions. */
  extensions?: string[];

  /**
   * Whether to resolve files that exist in the Happliance VFS (for example, as a Happliance template).
   * @default false
   */
  virtual?: boolean;
}

/**
 * Resolve full path to a file or directory respecting Happliance alias and extensions options
 *
 * If path could not be resolved, normalized input path will be returned
 */
export async function resolvePath(path: string, opts: ResolvePathOptions = {}): Promise<string> {
  const _path = path;
  path = normalize(path);

  if (isAbsolute(path)) {
    if (opts?.virtual && existsInVFS(path)) return path;
    if (existsSync(path) && !(await isDirectory(path))) return path;
  }

  const happliance = tryUseHappliance();
  const cwd = opts.cwd || (happliance ? happliance.options.rootDir : process.cwd());
  const extensions = opts.extensions || (happliance ? happliance.options.extensions : [".ts", ".mjs", ".cjs", ".json"]);
  const modulesDir = happliance ? happliance.options.modulesDir : [];

  path = resolveAlias(path);
  if (!isAbsolute(path)) path = resolve(cwd, path);

  if (opts?.virtual && existsInVFS(path, happliance)) return path;

  let _isDir = false;
  if (existsSync(path)) {
    _isDir = await isDirectory(path);
    if (!_isDir) return path;
  }

  for (const ext of extensions) {
    const pathWithExt = path + ext;
    if (opts?.virtual && existsInVFS(pathWithExt, happliance)) return pathWithExt;
    if (existsSync(pathWithExt)) return pathWithExt;
    const pathWithIndex = join(path, "index" + ext);
    if (opts?.virtual && existsInVFS(pathWithIndex, happliance)) return pathWithIndex;
    if (_isDir && existsSync(pathWithIndex)) return pathWithIndex;
  }

  const resolveModulePath = await _resolvePath(_path, { url: [cwd, ...modulesDir] }).catch(() => undefined);
  if (resolveModulePath) return resolveModulePath;

  return path;
}

/**
 * Try to resolve first existing file in paths
 */
export async function findPath(paths: string | string[], opts?: ResolvePathOptions, pathType: "file" | "dir" = "file"): Promise<string | undefined> {
  const happliance = opts?.virtual ? tryUseHappliance() : undefined;

  for (const path of toArray(paths)) {
    const rPath = await resolvePath(path, opts);

    if (opts?.virtual && existsInVFS(rPath, happliance)) return rPath;
    if (await existsSensitive(rPath)) {
      const _isDir = await isDirectory(rPath);
      if (!pathType || (pathType === "file" && !_isDir) || (pathType === "dir" && _isDir)) return rPath;
    }
  }

  return undefined;
}

/**
 * Resolve path aliases respecting Happliance alias options
 */
export function resolveAlias(path: string, alias?: Record<string, string>): string {
  if (!alias) alias = tryUseHappliance()?.options.alias || {};
  return _resolveAlias(path, alias);
}

export interface Resolver {
  resolve(...path: string[]): string;
  resolvePath(path: string, opts?: ResolvePathOptions): Promise<string>;
}

/**
 * Create a relative resolver
 */
export function createResolver(base: string | URL): Resolver {
  if (!base) throw new Error("`base` argument is missing for createResolver(base)!");

  base = base.toString();
  if (base.startsWith("file://")) base = dirname(fileURLToPath(base));

  return {
    resolve: (...path) => resolve(base as string, ...path),
    resolvePath: (path, opts) => resolvePath(path, { cwd: base as string, ...opts }),
  };
}

export async function resolveHapplianceModule(base: string, paths: string[]) {
  const resolved = [];
  const resolver = createResolver(base);

  for (const path of paths) {
    if (path.startsWith(base)) resolved.push(path.split("/index.ts")[0]);
    else {
      const resolvedPath = await resolver.resolvePath(path);
      resolved.push(resolvedPath.slice(0, resolvedPath.lastIndexOf(path) + path.length));
    }
  }

  return resolved;
}

async function existsSensitive(path: string) {
  if (!existsSync(path)) return false;

  const dirFiles = await fs.readdir(dirname(path));
  return dirFiles.includes(basename(path));
}

async function isDirectory(path: string) {
  return await fs.lstat(path).then((stat) => stat.isDirectory());
}

function existsInVFS(path: string, happliance = tryUseHappliance()) {
  if (!happliance) return false;
  if (path in happliance.vfs) return true;
  const templates = happliance.apps.default?.templates ?? happliance.options.build.templates;
  return templates.some((template) => template.dst === path);
}

export async function resolveFiles(path: string, pattern: string | string[], opts: { followSymbolicLinks?: boolean } = {}) {
  const files = await globby(pattern, { cwd: path, followSymbolicLinks: opts.followSymbolicLinks ?? true });
  return files
    .map((p) => resolve(path, p))
    .filter((p) => !isIgnored(p))
    .sort();
}
