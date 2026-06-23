// externalCommands.ts
import { spawnSync } from "child_process";
import path from "path";
import fs from "fs";
import type { OutputWriter } from "./output";

export function findExecutableNamesInPath(prefix: string): string[] {
  const paths = (process.env.PATH ?? "").split(path.delimiter);
  const matches = new Set<string>();

  for (const directory of paths) {
    try {
      const entries = fs.readdirSync(directory);

      for (const entry of entries) {
        if (!entry.startsWith(prefix)) {
          continue;
        }

        const fullPath = path.join(directory, entry);

        try {
          fs.accessSync(fullPath, fs.constants.X_OK);
          matches.add(entry);
        } catch {
          // not executable
        }
      }
    } catch {
      // ignore invalid PATH entries
    }
  }

  return [...matches];
}

export function findExecutableInPath(command: string): string | null {
  const paths = (process.env.PATH ?? "").split(path.delimiter);

  for (const directory of paths) {
    const fullPath = path.join(directory, command);

    try {
      fs.accessSync(fullPath, fs.constants.X_OK);
      return fullPath;
    } catch {
      // file does not exist or is not executable
    }
  }

  return null;
}

export function handleExternalCommand(
    command: string, 
    args: string[],
    output: OutputWriter,
): void {
  const executablePath = findExecutableInPath(command);

  if (!executablePath) {
    output.writeErrorLine(`${command}: command not found`);
    return;
  }

  spawnSync(command, args, {
    stdio: ["inherit", output.stdout, output.stderr],
  });
}
