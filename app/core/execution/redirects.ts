import { closeSync, openSync, writeSync } from "node:fs";
import type { ExpandedRedirection } from "../expansion/expander";
import type { OutputData, TerminalOutput } from "../ports";
import type { CommandOutput, OutputChannel } from "./types";

export interface OpenedCommandOutput {
  output: CommandOutput;
  close(): void;
}

export function openCommandOutput(
  terminal: TerminalOutput,
  redirects: readonly ExpandedRedirection[],
): OpenedCommandOutput {
  let stdout: OutputChannel = { write: (data) => terminal.write(data) };
  let stderr: OutputChannel = { write: (data) => terminal.writeError(data) };
  const descriptors: number[] = [];

  try {
    for (const redirect of redirects) {
      const descriptor = openSync(redirect.path, redirect.mode === "append" ? "a" : "w");
      descriptors.push(descriptor);
      const channel = fileChannel(descriptor);
      if (redirect.stream === "stdout") stdout = channel;
      else stderr = channel;
    }
  } catch (error) {
    tryCloseAll(descriptors);
    throw error;
  }

  let closed = false;
  return {
    output: { stdout, stderr },
    close(): void {
      if (closed) return;
      closed = true;
      closeAll(descriptors);
    },
  };
}

function fileChannel(descriptor: number): OutputChannel {
  return {
    write(data: OutputData): void {
      if (typeof data === "string") writeSync(descriptor, data);
      else writeSync(descriptor, data);
    },
  };
}

function closeAll(descriptors: readonly number[]): void {
  let failure: unknown;
  for (const descriptor of [...descriptors].reverse()) {
    try {
      closeSync(descriptor);
    } catch (error) {
      failure ??= error;
    }
  }
  if (failure) throw failure;
}

function tryCloseAll(descriptors: readonly number[]): void {
  try {
    closeAll(descriptors);
  } catch {
    // Preserve the original error that interrupted redirect setup.
  }
}
