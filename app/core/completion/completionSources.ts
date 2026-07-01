import type { BuiltinRegistry } from "../execution/types";
import { findExecutableNames } from "../execution/pathLookup";
import type { ShellContext } from "../shell/shellContext";
import type { CompletionSource } from "./completion";
import { filenameSource } from "./filenameCompletion";
import type { CompletionSpecStore } from "./completionSpecStore";
import { programmableCompletionSource } from "./programmableCompletion";

export function completionSources(
  builtins: BuiltinRegistry,
  shellContext: ShellContext,
  completionSpecs: CompletionSpecStore,
): CompletionSource[] {
  return [
    builtinSource(builtins),
    executableSource(shellContext),
    argumentSource(completionSpecs, shellContext),
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
        suffix: " " as const,
        kind: "command" as const,
      }));
  };
}

function executableSource(shellContext: ShellContext): CompletionSource {
  return (context) => {
    if (context.target !== "command") return [];
    return findExecutableNames(context.prefix, shellContext).map((name) => ({
      insertText: name,
      displayText: name,
      suffix: " " as const,
      kind: "command" as const,
    }));
  };
}

function argumentSource(
  completionSpecs: CompletionSpecStore,
  shellContext: ShellContext,
): CompletionSource {
  const programmable = programmableCompletionSource(completionSpecs, shellContext);
  const filename = filenameSource(shellContext);

  return (context) => {
    if (context.target !== "argument") return [];

    if (context.commandName && completionSpecs.get(context.commandName)) {
      return programmable(context);
    }

    return filename(context);
  };
}
