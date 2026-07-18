import type { ExpandedCommand } from "../expansion/expander";
import type { OutputData } from "../ports";
import type { ShellContext } from "../shell/shellContext";

export interface OutputChannel {
  write(data: OutputData): void;
}

export interface CommandOutput {
  stdout: OutputChannel;
  stderr: OutputChannel;
}

export interface ExecutionResult {
  exitCode: number;
}

export interface BuiltinInvocation {
  args: readonly string[];
  context: ShellContext;
  output: CommandOutput;
}

export type BuiltinHandler = (
  invocation: BuiltinInvocation,
) => ExecutionResult | Promise<ExecutionResult>;

export type BuiltinRegistry = ReadonlyMap<string, BuiltinHandler>;

export type RunExternalCommand = (
  command: ExpandedCommand,
  context: ShellContext,
  output: CommandOutput,
) => Promise<ExecutionResult>;
