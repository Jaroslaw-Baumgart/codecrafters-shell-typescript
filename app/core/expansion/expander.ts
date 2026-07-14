import type {
  CommandLine,
  RedirectMode,
  Redirection,
  RedirectStream,
  Word,
  SimpleCommand,
} from "../parser/ast";
import type { SourceSpan } from "../lexer/token";
import type { VariableStore } from "../variables/variableStore";
import type { ShellEnvironment } from "../shell/shellContext";

export interface ExpandedRedirection {
  readonly stream: RedirectStream;
  readonly mode: RedirectMode;
  readonly path: string;
}

export interface ExpansionContext {
  readonly variables: VariableStore;
  readonly env: ShellEnvironment;
}

export interface ExpandedCommand {
  readonly name: string;
  readonly args: readonly string[];
  readonly redirects: readonly ExpandedRedirection[];
}

export interface ExpandedPipeline {
  readonly commands: readonly ExpandedCommand[];
  readonly background: boolean;
}

export interface ExpansionDiagnostic {
  readonly message: string;
  readonly span: SourceSpan;
}

export interface ExpansionResult {
  readonly pipeline: ExpandedPipeline | null;
  readonly diagnostics: readonly ExpansionDiagnostic[];
}

function expandWord(
  word: Word,
  context: ExpansionContext,
): string {
  return word.parts
    .map((part) => {
      if (part.quote === "single" || part.escaped) {
        return part.value;
      }

      return expandParameters(part.value, context);
    })
    .join("");
}

function expandRedirection(
  redirection: Redirection,
  context: ExpansionContext,
): ExpandedRedirection {
  return {
    stream: redirection.stream,
    mode: redirection.mode,
    path: expandWord(redirection.target, context),
  };
}

export function expandCommandLine(
  commandLine: CommandLine,
  context: ExpansionContext,
): ExpansionResult {
  const pipeline = commandLine.body;

  if (!pipeline) {
    return {
      pipeline: null,
      diagnostics: [],
    };
  }

  const commands: ExpandedCommand[] = [];
  const diagnostics: ExpansionDiagnostic[] = [];

  for (const command of pipeline.commands) {
    const expanded = expandSimpleCommand(command, context);
    diagnostics.push(...expanded.diagnostics);

    if (expanded.command) {
      commands.push(expanded.command);
    }
  }

  if (diagnostics.length > 0) {
    return {
      pipeline: null,
      diagnostics,
    };
  }

  return {
    pipeline: {
      commands,
      background: commandLine.background,
    },
    diagnostics: [],
  };
}

function expandSimpleCommand(
  command: SimpleCommand,
  context: ExpansionContext,
): {
  command: ExpandedCommand | null;
  diagnostics: ExpansionDiagnostic[];
} {
  const words: string[] = [];
  const redirects: ExpandedRedirection[] = [];

  for (const part of command.parts) {
    switch (part.type) {
      case "word": {
        words.push(expandWord(part, context));
        break;
      }

      case "redirection":
        redirects.push(expandRedirection(part, context));
        break;
    }
  }

  const [name, ...args] = words;

  if (!name) {
    return {
      command: null,
      diagnostics: [
        {
          message: "Expected command name",
          span: { ...command.span },
        },
      ],
    };
  }

  return {
    command: {
      name,
      args,
      redirects,
    },
    diagnostics: [],
  };
}

function expandParameters(
  value: string,
  context: ExpansionContext,
): string {
  return value
    .replace(
      /\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g,
      (_match, name: string) => variableValue(name, context),
    )
    .replace(
      /\$([A-Za-z_][A-Za-z0-9_]*)/g,
      (_match, name: string) => variableValue(name, context),
    );
}

function variableValue(
  name: string,
  context: ExpansionContext,
): string {
  return context.variables.get(name)?.value
    ?? context.env[name]
    ?? "";
}