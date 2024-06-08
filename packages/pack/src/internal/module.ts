import { interopDefault, resolvePath, pathToFileURL } from "mlly";

export async function resolveModule(id: string, url: string | string[] = import.meta.url) {
  return await resolvePath(id, { url });
}

export async function tryResolveModule(id: string, url?: string | string[]) {
  try {
    return await resolveModule(id, url);
  } catch {
    return;
  }
}

export async function importModule(id: string, url?: string | string[]) {
  const resolvedPath = await resolveModule(id, url);
  return import(pathToFileURL(resolvedPath)).then(interopDefault);
}

export async function tryImportModule(id: string, url?: string | string[]) {
  try {
    return importModule(id, url).catch(() => undefined);
  } catch {
    return;
  }
}

export function getModulePaths(paths?: string[] | string) {
  return <string[]>[paths, process.cwd()].flat().filter(Boolean);
}
