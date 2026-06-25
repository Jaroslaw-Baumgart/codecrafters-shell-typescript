import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import type { ShellContext } from "../shell/shellContext";
import type { CompletionCandidate, CompletionSource } from "./completion";

export function filenameSource(shellContext: ShellContext): CompletionSource {
  return (context) => {
    if (context.target !== "argument") return [];

    const { directoryPart, entryPrefix } = splitPathPrefix(context.prefix);
    const directoryToSearch = resolve(shellContext.cwd, directoryPart);

    try {
      return readdirSync(directoryToSearch, { withFileTypes: true })
        .filter((entry) => entry.name.startsWith(entryPrefix))
        .map((entry): CompletionCandidate => {
          const isDirectory = entry.isDirectory();
          const insertText =
            directoryPart + entry.name + (isDirectory ? "/" : "");

          return {
            insertText,
            displayText: insertText,
            suffix: isDirectory ? "" : " ",
            kind: isDirectory ? "directory" : "file",
          };
        });
    } catch {
      return [];
    }
  };
}

function splitPathPrefix(prefix: string): {
  directoryPart: string;
  entryPrefix: string;
} {
  const slashIndex = prefix.lastIndexOf("/");

  if (slashIndex === -1) {
    return {
      directoryPart: "",
      entryPrefix: prefix,
    };
  }

  return {
    directoryPart: prefix.slice(0, slashIndex + 1),
    entryPrefix: prefix.slice(slashIndex + 1),
  };
}
