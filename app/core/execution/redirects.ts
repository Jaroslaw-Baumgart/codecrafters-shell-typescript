import { closeSync, openSync, writeSync } from "node:fs";
import type { ExpandedRedirection } from "../expansion/expander";
import type { OutputData } from "../ports";
import type { CommandOutput, OutputChannel } from "./types";
import { resolve } from "node:path";

export interface OpenedCommandOutput {
  output: CommandOutput;
  close(): void;
}

export function openCommandOutput(
  defaultOutput: CommandOutput,
  redirects: readonly ExpandedRedirection[],
  cwd: string,
): OpenedCommandOutput {
  let stdout: OutputChannel = defaultOutput.stdout;
  let stderr: OutputChannel = defaultOutput.stderr;
  const descriptors: number[] = [];

  try {
    for (const redirect of redirects) {
      const path = resolve(cwd, redirect.path);
      const descriptor = openSync(path, redirect.mode === "append" ? "a" : "w");
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
