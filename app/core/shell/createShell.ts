import type { Complete } from "../completion/completion";
import { createCompletion } from "../completion/completion";
import { completionSources } from "../completion/completionSources";
import { CompletionSpecStore } from "../completion/completionSpecStore";
import { createBuiltins } from "../execution/builtins";
import { createExecutor } from "../execution/executor";
import { JobStore } from "../jobs/jobStore";
import type { Terminal } from "../ports";
import { ShellContext, type ShellEnvironment } from "./shellContext";
import { ShellEngine } from "./shellEngine";

export interface CreateShellOptions {
  cwd: string;
  env: ShellEnvironment;
  createTerminal: (complete: Complete) => Terminal;
}

export interface CreatedShell {
  shell: ShellEngine;
  terminal: Terminal;
}

export function createShell({
  cwd,
  env,
  createTerminal,
}: CreateShellOptions): CreatedShell {
  const context = new ShellContext(cwd, env);

  const completionSpecs = new CompletionSpecStore();
  const jobs = new JobStore();
  const builtins = createBuiltins(completionSpecs, jobs);
  const complete = createCompletion(
    completionSources(builtins, context, completionSpecs),
  );
  const terminal = createTerminal(complete);
  const execute = createExecutor(builtins, terminal, jobs);
  const shell = new ShellEngine(context, terminal, execute);

  return { shell, terminal };
}
