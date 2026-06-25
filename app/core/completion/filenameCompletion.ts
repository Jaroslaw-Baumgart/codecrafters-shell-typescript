import { readdirSync } from "node:fs"
import { resolve } from "node:fs";
import type { ShellContext } from "../shell/shellContext"
import type { CompletionSource } from "./completion"

export function filenameSource(
  shellContext: ShellContext,
): CompletionSource {
  return (context) => {
    if (context.target !== "argument") return [];

    const { directoryPart, filePrefix } = splitFilenamePrefix(context.prefix);
    const directoryToSearch = resolve(shellContext.cwd, directoryPart);

    try {
      return readdirSync(directoryToSearch)
        .filter((name) => name.startsWith(filePrefix))
        .map((name) => ({
          insertText: name,
          displayText: name,
          suffix: " " as const,
        }));
    } catch {
        return [];
    }
  };
}

function splitFilenamePrefix(prefix: string): {
    directoryPart: string;
    filePrefix: string;
} {
    const slashIndex = prefix.lastIndexOf("/");

    if (slashIndex === -1) {
        return {
            directoryPart: "",
            filePrefix: prefix,
        };
    }

    return {
        directoryPart: prefix.slice(0, slashIndex + 1),
        filePrefix: prefix.slice(slashIndex + 1),
    };
}