import { spawn } from "node:child_process";

import type { ExpandedCommand } from "../expansion/expander";
import type { JobStore } from "../jobs/jobStore";
import type { ShellContext } from "../shell/shellContext";
import { findExecutable } from "./pathLookup";
import type { CommandOutput, ExecutionResult } from "./types";

export function startBackgroundCommand(
  command: ExpandedCommand,
  context: ShellContext,
  output: CommandOutput,
  jobs: JobStore,
): ExecutionResult {
  const executable = findExecutable(command.name, context);

  if (!executable) {
    output.stderr.write(`${command.name}: command not found\n`);
    return { exitCode: 127 };
  }

  const child = spawn(executable, command.args, {
    argv0: command.name,
    cwd: context.cwd,
    env: { ...context.env },
    stdio: ["inherit", "pipe", "pipe"],
  });

  if (!child.pid) {
    output.stderr.write(
      `${command.name}: failed to start process\n`,
    );
    return { exitCode: 1 };
  }

  child.stdout.on("data", (data: Uint8Array) => output.stdout.write(data));
  child.stderr.on("data", (data: Uint8Array) => output.stderr.write(data));

  const job = jobs.add(child.pid, commandText(command));

  child.on("exit", (exitCode) => {
    jobs.markDone(job.id, exitCode ?? 1);
  });

  output.stdout.write(`[${job.id}] ${job.pid}\n`);

  return { exitCode: 0 };
}

function commandText(command: ExpandedCommand): string {
  return [command.name, ...command.args].join(" ");
}
