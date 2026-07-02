import { spawn } from "node:child_process";

import type { ShellContext } from "../shell/shellContext";
import type { CompletionContext, CompletionSource } from "./completion";
import type { CompletionSpecStore } from "./completionSpecStore";

export function programmableCompletionSource(
  completionSpecs: CompletionSpecStore,
  shellContext: ShellContext,
): CompletionSource {
  return async (context) => {
    if (context.target !== "argument") return [];
    if (!context.commandName) return [];

    const spec = completionSpecs.get(context.commandName);
    if (!spec) return [];

    const output = await runCompleter(
      spec.completerPath,
      shellContext,
      completerArgs(context),
    );

    return output
      .split(/\r?\n/)
      .filter((line) => line.length > 0)
      .map((line) => ({
        insertText: line,
        displayText: line,
        suffix: " " as const,
        kind: "argument" as const,
      }));
  };
}

function runCompleter(
  completerPath: string,
  shellContext: ShellContext,
  args: readonly string[],
): Promise<string> {
  return new Promise((resolve) => {
    const child = spawn(completerPath, [...args], {
      cwd: shellContext.cwd,
      env: { ...shellContext.env },
      stdio: ["ignore", "pipe", "ignore"],
    });

    let stdout = "";

    child.stdout.on("data", (data: Uint8Array) => {
      stdout += data.toString();
    });

    child.on("error", () => {
      resolve("");
    });

    child.on("close", () => {
      resolve(stdout);
    });
  });
}

function completerArgs(context: CompletionContext): string[] {
  return [
    context.commandName ?? "",
    context.prefix,
    previousWord(context),
  ];
}

function previousWord(context: CompletionContext): string {
  if (context.currentWordIndex <= 1) {
    return "";
  }

  return context.words[context.currentWordIndex - 1] ?? "";
}
