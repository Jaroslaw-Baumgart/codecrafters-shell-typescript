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
  SimpleCommand,
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

  const diagnostics: ParserResult["diagnostics"] = [];
  const segments = splitPipeline(commandTokens);

  for (const segment of segments) {
    if (segment.length === 0) {
      diagnostics.push({
        message: "Expected command in pipeline",
        span,
      });
    }
  }

  const commands = segments
    .filter((segment) => segment.length > 0)
    .map((segment) => parseSimpleCommand(segment, diagnostics));

  return {
    ast: {
      type: "command-line",
      body: {
        type: "pipeline",
        commands,
        span,
      },
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

function splitPipeline(tokens: readonly Token[]): Token[][] {
  const segments: Token[][] = [[]];

  for (const token of tokens) {
    if (token.type === "pipe") {
      segments.push([]);
      continue;
    }

    segments[segments.length - 1].push(token);
  }

  return segments;
}

function parseSimpleCommand(
  tokens: readonly Token[],
  diagnostics: ParserResult["diagnostics"],
): SimpleCommand {
  const parts: SimpleCommandPart[] = [];
  const span = commandSpan(tokens);

  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];

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

    if (token.type === "pipe") {
      diagnostics.push({
        message: "Unexpected |",
        span: token.span,
      });
      continue;
    }

    const target = tokens[index + 1];

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
    type: "simple-command",
    parts,
    span,
  };
}
