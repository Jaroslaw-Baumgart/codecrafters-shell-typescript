import { statSync } from "node:fs";
import { resolve } from "node:path";

import type { CompletionSpecStore } from "../completion/completionSpecStore";
import type { JobStore } from "../jobs/jobStore";
import type { HistoryStore } from "../history/historyStore";
import { createHistoryBuiltin } from "../history/historyCommand";
import { createJobsBuiltin } from "../jobs/jobsCommand";
import { createCompleteBuiltin } from "./completeCommand";
import { findExecutable } from "./pathLookup";

import type {
  BuiltinHandler,
  BuiltinInvocation,
  BuiltinRegistry,
  ExecutionResult,
} from "./types";
import { exitCode } from "node:process";

export function createBuiltins(
  completionSpecs: CompletionSpecStore,
  jobs: JobStore,
  history: HistoryStore,
): BuiltinRegistry {
  const builtins = new Map<string, BuiltinHandler>();

  builtins.set("exit", exitBuiltin);
  builtins.set("echo", echoBuiltin);
  builtins.set("pwd", pwdBuiltin);
  builtins.set("cd", cdBuiltin);
  builtins.set("type", createTypeBuiltin(builtins));
  builtins.set("complete", createCompleteBuiltin(completionSpecs));
  builtins.set("jobs", createJobsBuiltin(jobs));
  builtins.set("history", createHistoryBuiltin(history));
  builtins.set("declare", () => ({ exitCode: 0 }));

  return builtins;
}

function exitBuiltin({
  args,
  context,
  output,
}: BuiltinInvocation): ExecutionResult {
  if (args.length > 1) {
    output.stderr.write("exit: too many arguments\n");
    return { exitCode: 1 };
  }

  const argument = args[0];

  if (argument === undefined) {
    context.requestExit(context.lastExitCode);
    return { exitCode: context.lastExitCode };
  }

  if (!/^-?\d+$/.test(argument)) {
    output.stderr.write(
      `exit: ${argument}: numeric argument required\n`,
    );

    context.requestExit(2);
    return { exitCode: 2 };
  }

  const exitCode = normalizeExitCode(Number(argument));

  context.requestExit(exitCode);

  return { exitCode };
}

function echoBuiltin({
  args,
  output,
}: BuiltinInvocation): ExecutionResult {
  output.stdout.write(`${args.join(" ")}\n`);
  return { exitCode: 0 };
}

function pwdBuiltin({
  context,
  output,
}: BuiltinInvocation): ExecutionResult {
  output.stdout.write(`${context.cwd}\n`);
  return { exitCode: 0 };
}

function cdBuiltin({
  args,
  context,
  output,
}: BuiltinInvocation): ExecutionResult {
  const requestedDirectory = args[0];
  const homeDirectory = context.env.HOME;

  const target =
    requestedDirectory === undefined ||
    requestedDirectory === "~"
      ? homeDirectory
      : requestedDirectory;

  if (!target) {
    output.stderr.write("cd: HOME not set\n");
    return { exitCode: 1 };
  }

  const absolutePath = resolve(context.cwd, target);

  try {
    if (!statSync(absolutePath).isDirectory()) {
      throw new Error("Not a directory");
    }

    context.changeDirectory(absolutePath);
    return { exitCode: 0 };
  } catch {
    output.stderr.write(
      `cd: ${target}: No such file or directory\n`,
    );

    return { exitCode: 1 };
  }
}

function createTypeBuiltin(
  builtins: BuiltinRegistry,
): BuiltinHandler {
  return ({ args, context, output }) => {
    const name = args[0];

    if (!name) {
      output.stderr.write("type: missing operand\n");
      return { exitCode: 1 };
    }

    if (builtins.has(name)) {
      output.stdout.write(
        `${name} is a shell builtin\n`,
      );

      return { exitCode: 0 };
    }

    const executable = findExecutable(name, context);

    if (executable) {
      output.stdout.write(
        `${name} is ${executable}\n`,
      );

      return { exitCode: 0 };
    }

    output.stdout.write(`${name}: not found\n`);
    return { exitCode: 1 };
  };
}

function normalizeExitCode(exitCode: number): number {
  return ((exitCode % 256) + 256) % 256;
}
