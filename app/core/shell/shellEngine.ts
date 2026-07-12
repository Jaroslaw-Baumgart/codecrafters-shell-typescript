import type { ExecuteCommand } from "../execution/executor";
import type { ExecutionResult } from "../execution/types";
import { expandCommandLine } from "../expansion/expander";
import { lexShell } from "../lexer/shellLexer";
import { parseShell } from "../parser/shellParser";
import type { Terminal, TerminalOutput } from "../ports";
import type { ShellContext } from "./shellContext";
import type { VariableStore } from "../variables/variableStore";

interface Diagnostic {
  message: string;
}

export class ShellEngine {
  constructor(
    readonly context: ShellContext,
    private readonly output: TerminalOutput,
    private readonly executeCommand: ExecuteCommand,
    private readonly variables: VariableStore,
    private readonly beforePrompt: () => void = () => {},
    private readonly recordHistory: (line: string) => void = () => {},
    private readonly onExit: () => void = () => {},
  ) {}

  preparePrompt(): void {
    this.beforePrompt();
  }

  finish(): void {
    this.onExit();
  }

  async execute(line: string): Promise<ExecutionResult> {
    if (line.trim().length > 0) {
      this.recordHistory(line);
    }

    const lexed = lexShell(line);
    if (lexed.diagnostics.length) return this.report(lexed.diagnostics);

    const parsed = parseShell(lexed.tokens);
    if (parsed.diagnostics.length) return this.report(parsed.diagnostics);

    const expanded = expandCommandLine(parsed.ast, {
      variables: this.variables,
    });

    if (expanded.diagnostics.length) return this.report(expanded.diagnostics);
    if (!expanded.pipeline) return { exitCode: this.context.lastExitCode };

    return this.executeCommand(expanded.pipeline, this.context);
  }

  private report(diagnostics: readonly Diagnostic[]): ExecutionResult {
    for (const diagnostic of diagnostics) {
      this.output.writeError(`shell: ${diagnostic.message}\n`);
    }
    this.context.setLastExitCode(2);
    return { exitCode: 2 };
  }
}

export async function runShell(
  shell: ShellEngine,
  terminal: Terminal,
  prompt = "$ ",
): Promise<number> {
  try {
    if (shell.context.exitRequested) return shell.context.lastExitCode;
    shell.preparePrompt();
    terminal.prompt(prompt);

    for await (const line of terminal.lines()) {
      await shell.execute(line);
      if (shell.context.exitRequested) break;
      shell.preparePrompt();
      terminal.prompt(prompt);
    }
    return shell.context.lastExitCode;
  } finally {
    shell.finish();
    terminal.close();
  }
}
