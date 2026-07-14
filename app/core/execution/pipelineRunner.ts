import { spawn, type ChildProcess } from "node:child_process";
import { PassThrough, type Readable, type Writable } from "node:stream";

import type { ExpandedCommand, ExpandedPipeline } from "../expansion/expander";
import type { ShellContext } from "../shell/shellContext";
import { findExecutable } from "./pathLookup";
import type {
  BuiltinRegistry,
  CommandOutput,
  ExecutionResult,
  OutputChannel,
} from "./types";

interface PipelineOutputChannel extends OutputChannel {
  close(): void;
}

interface PipelineStageOptions {
  command: ExpandedCommand;
  context: ShellContext;
  builtins: BuiltinRegistry;
  input: Readable | null;
  stdout: PipelineOutputChannel;
  stderr: OutputChannel;
  children: ChildProcess[];
}

export async function runPipeline(
  pipeline: ExpandedPipeline,
  context: ShellContext,
  output: CommandOutput,
  builtins: BuiltinRegistry,
): Promise<ExecutionResult> {
  const links = Array.from(
    { length: pipeline.commands.length - 1 },
    () => new PassThrough(),
  );
  const children: ChildProcess[] = [];

  for (const link of links) {
    link.on("error", () => {});
  }

  const tasks = pipeline.commands.map((command, index) => {
    const input = index === 0 ? null : links[index - 1];
    const stdout = index === pipeline.commands.length - 1
      ? terminalOutput(output.stdout)
      : streamOutput(links[index]);

    return runPipelineStage({
      command,
      context,
      builtins,
      input,
      stdout,
      stderr: output.stderr,
      children,
    });
  });

  const lastResult = await tasks[tasks.length - 1];

  for (const child of children) {
    if (isRunning(child)) {
      child.kill();
    }
  }

  await Promise.allSettled(tasks);

  return lastResult ?? { exitCode: 0 };
}

function streamOutput(stream: Writable): PipelineOutputChannel {
  return {
    write(data) {
      if (!stream.destroyed && !stream.writableEnded) {
        stream.write(data);
      }
    },
    close() {
      if (!stream.destroyed && !stream.writableEnded) {
        stream.end();
      }
    },
  };
}

function terminalOutput(output: OutputChannel): PipelineOutputChannel {
  return {
    write: (data) => output.write(data),
    close() {},
  };
}

async function runPipelineStage({
  command,
  context,
  builtins,
  input,
  stdout,
  stderr,
  children,
}: PipelineStageOptions): Promise<ExecutionResult> {
  const builtin = builtins.get(command.name);

  if (builtin) {
    input?.resume();

    try {
      return await builtin({
        args: command.args,
        context,
        output: { stdout, stderr },
      });
    } finally {
      stdout.close();
    }
  }

  return runExternalPipelineStage(
    command,
    context,
    input,
    stdout,
    stderr,
    children,
  );
}

function runExternalPipelineStage(
  command: ExpandedCommand,
  context: ShellContext,
  input: Readable | null,
  stdout: PipelineOutputChannel,
  stderr: OutputChannel,
  children: ChildProcess[],
): Promise<ExecutionResult> {
  const executable = findExecutable(command.name, context);

  if (!executable) {
    stderr.write(`${command.name}: command not found\n`);
    stdout.close();
    return Promise.resolve({ exitCode: 127 });
  }

  return new Promise((resolve) => {
    const child = spawn(executable, command.args, {
      argv0: command.name,
      cwd: context.cwd,
      env: { ...context.env },
      stdio: [input ? "pipe" : "inherit", "pipe", "pipe"],
    });

    children.push(child);

    if (child.stdin) {
      child.stdin.on("error", () => {});
    }

    if (input && child.stdin) {
      input.pipe(child.stdin);
    }

    child.stdout?.on("data", (data: Uint8Array) => stdout.write(data));
    child.stderr?.on("data", (data: Uint8Array) => stderr.write(data));

    let settled = false;
    const finish = (result: ExecutionResult): void => {
      if (settled) return;
      settled = true;
      stdout.close();
      resolve(result);
    };

    child.on("error", (error) => {
      stderr.write(`${command.name}: ${error.message}\n`);
      finish({ exitCode: 126 });
    });

    child.on("close", (exitCode) => {
      finish({ exitCode: exitCode ?? 1 });
    });
  });
}

function isRunning(child: ChildProcess): boolean {
  return child.exitCode === null && child.signalCode === null;
}
