import { NodeTerminal } from "./adapters/nodeTerminal";
import { createCompletion } from "./core/completion/completion";
import { completionSources } from "./core/completion/completionSources";

import { createBuiltins } from "./core/execution/builtins";
import { createExecutor } from "./core/execution/executor";
import { runShell, ShellEngine } from "./core/shell/shellEngine";
import { ShellContext } from "./core/shell/shellContext";

const context = new ShellContext(process.cwd(), process.env);

const builtins = createBuiltins();
const complete = createCompletion(completionSources(builtins, context));
const terminal = new NodeTerminal(complete);
const execute = createExecutor(builtins, terminal);
const shell = new ShellEngine(context, terminal, execute);

process.exitCode = await runShell(shell, terminal);
