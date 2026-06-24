import { accessSync, constants, readdirSync, statSync } from "node:fs";
import { delimiter, extname, isAbsolute, resolve, sep } from "node:path";
import { platform } from "node:process";
import type { ShellEnvironment } from "../shell/shellContext";

export interface PathLookupContext {
  cwd: string;
  env: ShellEnvironment;
}

export function findExecutable(
  command: string,
  context: PathLookupContext,
): string | null {
  if (!command) return null;
  const extensions = executableExtensions(context);

  if (containsPathSeparator(command)) {
    const path = isAbsolute(command) ? command : resolve(context.cwd, command);
    return executableCandidates(path, extensions).find((item) => isExecutable(item, extensions))
      ?? null;
  }

  for (const directory of pathDirectories(context)) {
    const path = resolve(directory, command);
    const candidate = executableCandidates(path, extensions)
      .find((item) => isExecutable(item, extensions));
    if (candidate) return candidate;
  }
  return null;
}

export function findExecutableNames(
  prefix: string,
  context: PathLookupContext,
): string[] {
  if (containsPathSeparator(prefix)) return [];
  const matches = new Set<string>();
  const extensions = executableExtensions(context);

  for (const directory of pathDirectories(context)) {
    try {
      for (const entry of readdirSync(directory)) {
        if (
          entry.startsWith(prefix) &&
          isExecutable(resolve(directory, entry), extensions)
        ) {
          matches.add(entry);
        }
      }
    } catch {
      // Invalid and inaccessible PATH entries are ignored by shells.
    }
  }
  return [...matches].sort();
}

function pathDirectories(context: PathLookupContext): string[] {
  const path = context.env.PATH ?? context.env.Path;
  if (path === undefined) return [];
  return path.split(delimiter).map((directory) => resolve(context.cwd, directory || "."));
}

function containsPathSeparator(value: string): boolean {
  return value.includes("/") || value.includes(sep);
}

function executableExtensions(context: PathLookupContext): ReadonlySet<string> | null {
  if (platform !== "win32") return null;
  const pathExt = context.env.PATHEXT ?? ".COM;.EXE;.BAT;.CMD";
  return new Set(pathExt.split(";").map((extension) => extension.toUpperCase()));
}

function executableCandidates(
  path: string,
  extensions: ReadonlySet<string> | null,
): string[] {
  if (!extensions || extname(path)) return [path];
  return [...extensions].map((extension) => path + extension);
}

function isExecutable(
  path: string,
  extensions: ReadonlySet<string> | null,
): boolean {
  try {
    if (extensions && !extensions.has(extname(path).toUpperCase())) return false;
    if (!statSync(path).isFile()) return false;
    if (!extensions) accessSync(path, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}
