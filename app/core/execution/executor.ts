import type { ExpandedCommand } from "../expansion/expander";
import type { ExecutionTerminal } from "../ports";
import type { ShellContext } from "../shell/shellContext";

import { runExternalCommand } from "./externalRunner";
import { openCommandOutput } from "./redirects";

import type {
  BuiltinRegistry,
  ExecutionResult,
  RunExternalCommand,
} from "./types";

export type ExecuteCommand = (
  command: ExpandedCommand,
  context: ShellContext,
) => Promise<ExecutionResult>;

export function createExecutor(
  builtins: BuiltinRegistry,
  terminal: ExecutionTerminal,
  runExternal: RunExternalCommand = runExternalCommand,
): ExecuteCommand {
  return async (command, context) => {
    let openedOutput;

    try {
      openedOutput = openCommandOutput(terminal, command.redirects);
    } catch (error) {
      terminal.writeError(`${command.name}: ${errorMessage(error)}\n`);
      return finishExecution(context, 1);
    }

    try {
      const builtin = builtins.get(command.name);

      let result: ExecutionResult;
      if (builtin) {
        result = await builtin({ args: command.args, context, output: openedOutput.output });
      } else {
        terminal.pauseInput();
        try {
          result = await runExternal(command, context, openedOutput.output);
        } finally {
          terminal.resumeInput();
        }
      }

      context.setLastExitCode(result.exitCode);
      return result;
    } catch (error) {
      openedOutput.output.stderr.write(
        `${command.name}: ${errorMessage(error)}\n`,
      );

      return finishExecution(context, 1);
    } finally {
      openedOutput.close();
    }
  };
}

function finishExecution(
  context: ShellContext,
  exitCode: number,
): ExecutionResult {
  context.setLastExitCode(exitCode);
  return { exitCode };
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : String(error);
}
