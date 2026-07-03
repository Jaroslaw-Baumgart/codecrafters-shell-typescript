import type {
  RedirectOperator,
  SourceSpan,
  Token,
  WordToken,
} from "../lexer/token";
import type {
  CommandLine,
  Redirection,
  RedirectMode,
  RedirectStream,
  SimpleCommandPart,
  Word,
} from "./ast";

export interface ParserResult {
  ast: CommandLine;
  diagnostics: Array<{ message: string; span: SourceSpan }>;
}

export function parseShell(tokens: readonly Token[]): ParserResult {
  const span = commandSpan(tokens);
  const background = tokens[tokens.length - 1]?.type === "background";
  const commandTokens = background ? tokens.slice(0, -1) : tokens;

  if (commandTokens.length === 0) {
    return {
      ast: {
        type: "command-line",
        body: null,
        background,
        span,
      },
      diagnostics: [],
    };
  }

  const parts: SimpleCommandPart[] = [];
  const diagnostics: ParserResult["diagnostics"] = [];

  for (let index = 0; index < commandTokens.length; index++) {
    const token = commandTokens[index];
    if (token.type === "word") {
      parts.push(toWord(token));
      continue;
    }

    if (token.type === "background") {
      diagnostics.push({
        message: "Unexpected &",
        span: token.span,
      });
      continue;
    }

    const target = commandTokens[index + 1];
    if (!target || target.type !== "word") {
      diagnostics.push({
        message: `Expected redirect target after ${token.operator}`,
        span: { start: token.span.end, end: token.span.end },
      });
      continue;
    }

    parts.push(toRedirection(token.operator, token.span, toWord(target)));
    index++;
  }

  return {
    ast: {
      type: "command-line",
      body: { type: "simple-command", parts, span },
      background,
      span,
    },
    diagnostics,
  };
}

function toWord(token: WordToken): Word {
  return { type: "word", parts: [...token.parts], span: { ...token.span } };
}

function toRedirection(
  operator: RedirectOperator,
  operatorSpan: SourceSpan,
  target: Word,
): Redirection {
  return {
    type: "redirection",
    stream: redirectStream(operator),
    mode: redirectMode(operator),
    target,
    span: { start: operatorSpan.start, end: target.span.end },
  };
}

function commandSpan(tokens: readonly Token[]): SourceSpan {
  const first = tokens[0];
  const last = tokens[tokens.length - 1];
  return first && last
    ? { start: first.span.start, end: last.span.end }
    : { start: 0, end: 0 };
}

function redirectStream(operator: RedirectOperator): RedirectStream {
  return operator.startsWith("2") ? "stderr" : "stdout";
}

function redirectMode(operator: RedirectOperator): RedirectMode {
  return operator.endsWith(">>") ? "append" : "overwrite";
}
