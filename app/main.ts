import { NodeTerminal } from "./adapters/nodeTerminal";
import { createShell } from "./core/shell/createShell";
import { runShell } from "./core/shell/shellEngine";

const { shell, terminal } = createShell({
  cwd: process.cwd(),
  env: process.env,
  createTerminal: (complete) => new NodeTerminal(complete),
});

process.exitCode = await runShell(shell, terminal);
