import { readdirSync } from "node:fs"
import type { ShellContext } from "../shell/shellContext"
import type { CompletionSource } from "./completion"

export function filenameSource(
  shellContext: ShellContext,
): CompletionSource {
  return (context) => {
    if (context.target !== "argument") return [];

    try {
      return readdirSync(shellContext.cwd)
        .filter((name) => name.startsWith(context.prefix))
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