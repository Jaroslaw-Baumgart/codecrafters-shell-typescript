import type {
  CommandLine,
  RedirectMode,
  Redirection,
  RedirectStream,
  Word,
} from "../parser/ast";
import type { SourceSpan } from "../lexer/token";

export interface ExpandedRedirection {
  stream: RedirectStream;
  mode: RedirectMode;
  path: string;
}

export interface ExpandedCommand {
  name: string;
  args: string[];
  redirects: ExpandedRedirection[];
  background: boolean;
}

export interface ExpansionResult {
  command: ExpandedCommand | null;
  diagnostics: Array<{ message: string; span: SourceSpan }>;
}

function expandWord(word: Word): string {
  return word.parts
    .map((part) => part.value)
    .join("");
}

function expandRedirection(
  redirection: Redirection,
): ExpandedRedirection {
  return {
    stream: redirection.stream,
    mode: redirection.mode,
    path: expandWord(redirection.target),
  };
}

export function expandCommandLine(
  commandLine: CommandLine,
): ExpansionResult {
  const command = commandLine.body;

  if (!command) {
    return {
      command: null,
      diagnostics: [],
    };
  }

  const words: string[] = [];
  const redirects: ExpandedRedirection[] = [];

  for (const part of command.parts) {
    switch (part.type) {
      case "word":
        words.push(expandWord(part));
        break;

      case "redirection":
        redirects.push(expandRedirection(part));
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

  const expandedCommand: ExpandedCommand = {
    name,
    args,
    redirects,
    background: commandLine.background,
  };

  return {
    command: expandedCommand,
    diagnostics: [],
  };
}
