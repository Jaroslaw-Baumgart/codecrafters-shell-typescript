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

export interface ExpandedRedirection {
  stream: RedirectStream;
  mode: RedirectMode;
  path: string;
}

export interface ExpansionContext {
  variables: VariableStore;
}

export interface ExpandedCommand {
  name: string;
  args: string[];
  redirects: ExpandedRedirection[];
}

export interface ExpandedPipeline {
  commands: ExpandedCommand[];
  background: boolean;
}

export interface ExpansionResult {
  pipeline: ExpandedPipeline | null;
  diagnostics: Array<{ message: string; span: SourceSpan }>;
}

function expandWord(
  word: Word,
  context: ExpansionContext,
): string {
  const value = word.parts
    .map((part) => part.value)
    .join("");

  return expandParameters(value, context.variables);
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
  const diagnostics: ExpansionResult["diagnostics"] = [];

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
  diagnostics: Array<{ message: string; span: SourceSpan }>;
} {
  const words: string[] = [];
  const redirects: ExpandedRedirection[] = [];

  for (const part of command.parts) {
    switch (part.type) {
      case "word":
        words.push(expandWord(part, context));
        break;

      case "redirection":
        redirects.push(expandRedirection(part, context));
        break;
    }
  }

  if (words.length === 0) {
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

  const [name, ...args] = words;

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
  variables: VariableStore,
): string {
  return value.replace(
    /\$([A-Za-z_][A-Za-z0-9_]*)/g,
    (_match, name: string) => variables.get(name)?.value ?? `$${name}`,
  );
}
