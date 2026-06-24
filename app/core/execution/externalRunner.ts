import { spawn } from "node:child_process";
import type { ExpandedCommand } from "../expansion/expander";
import type { ShellContext } from "../shell/shellContext";
import { findExecutable } from "./pathLookup";
import type { CommandOutput, ExecutionResult } from "./types";

export function runExternalCommand(
  command: ExpandedCommand,
  context: ShellContext,
  output: CommandOutput,
): Promise<ExecutionResult> {
  const executable = findExecutable(command.name, context);
  if (!executable) {
    output.stderr.write(`${command.name}: command not found\n`);
    return Promise.resolve({ exitCode: 127 });
  }

  return new Promise((resolve) => {
    const child = spawn(executable, command.args, {
      cwd: context.cwd,
      env: { ...context.env },
      stdio: ["inherit", "pipe", "pipe"],
    });
    child.stdout.on("data", (data: Uint8Array) => output.stdout.write(data));
    child.stderr.on("data", (data: Uint8Array) => output.stderr.write(data));

    let settled = false;
    const finish = (exitCode: number): void => {
      if (settled) return;
      settled = true;
      resolve({ exitCode });
    };

    child.on("error", (error) => {
      output.stderr.write(`${command.name}: ${error.message}\n`);
      finish(126);
    });
    child.on("close", (exitCode) => finish(exitCode ?? 1));
  });
}
