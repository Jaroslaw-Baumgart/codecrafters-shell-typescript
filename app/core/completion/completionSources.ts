import type { BuiltinRegistry } from "../execution/types";
import { findExecutableNames } from "../execution/pathLookup";
import type { ShellContext } from "../shell/shellContext";
import type { CompletionSource } from "./completion";
import { filenameSource } from "./filenameCompletion"

export function completionSources(
  builtins: BuiltinRegistry,
  shellContext: ShellContext,
): CompletionSource[] {
  return [
    builtinSource(builtins),
    executableSource(shellContext),
    filenameSource(shellContext),
  ];
}

function builtinSource(builtins: BuiltinRegistry): CompletionSource {
  const names = [...builtins.keys()].sort();
  return (context) => {
    if (context.target !== "command") return [];
    return names
      .filter((name) => name.startsWith(context.prefix))
      .map((name) => ({
        insertText: name,
        displayText: name,
        suffix: " ",
      }));
  };
}

function executableSource(shellContext: ShellContext): CompletionSource {
  return (context) => {
    if (context.target !== "command") return [];
    return findExecutableNames(context.prefix, shellContext).map((name) => ({
      insertText: name,
      displayText: name,
      suffix: " ",
    }));
  };
}
