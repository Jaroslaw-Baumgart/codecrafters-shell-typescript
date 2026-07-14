import {
  REDIRECT_OPERATORS,
  type LexerResult,
  type QuoteMode,
  type RedirectOperator,
  type Token,
  type WordPart,
} from "./token";

type QuoteState = 
  | {
    mode: "unquoted";
    }
  | {
    mode: "single" | "double";
    start: number;
  };

export interface ShellLexerOptions {
  tolerateIncomplete?: boolean;
}

export function lexShell(
  input: string,
  options: ShellLexerOptions = {},
): LexerResult {
  const tokens: Token[] = [];
  const diagnostics: LexerResult["diagnostics"] = [];
  let index = 0;
  let quoteState: QuoteState = {
    mode: "unquoted",
  };
  let wordStart: number | null = null;
  let parts: WordPart[] = [];

  const append = (
    value: string,
    quote: QuoteMode,
    escaped: boolean,
    start: number,
    end: number,
  ): void => {
    wordStart ??= start;
    const previous = parts[parts.length - 1];
    if (
      previous &&
      !escaped &&
      !previous.escaped &&
      previous.quote === quote &&
      previous.span.end === start
    ) {
      previous.value += value;
      previous.span.end = end;
      return;
    }
    parts.push({ value, quote, escaped, span: { start, end } });
  };

  const finishWord = (end: number): void => {
    if (wordStart === null) return;
    tokens.push({
      type: "word",
      parts,
      span: { start: wordStart, end },
    });
    wordStart = null;
    parts = [];
  };

  const openQuote = (
    mode: Exclude<QuoteMode, "unquoted">
  ): QuoteState => {
    const start = index;

    wordStart ??= index;
    append("", mode, false, index + 1, index + 1);
    index++;
    
    return {
      mode,
      start,
    };
  };

  while (index < input.length) {
    const character = input[index];

    if (quoteState.mode === "single") {
      if (character === "'") {
        quoteState = {
          mode: "unquoted",
        };

        index++;
      } else {
        append(
          character,
          "single",
          false,
          index,
          index + 1
        );

        index++;
      }
      continue;
    }

    if (quoteState.mode === "double") {
      if (character === '"') {
        quoteState = {
          mode: "unquoted",
        };
        index++;
        continue;
      }

      if (character === "\\") {
        const next = input[index + 1];
        if (next === '"' || next === "\\") {
          append(next, "double", true, index, index + 2);
          index += 2;
          continue;
        }
      }

      append(character, "double", false, index, index + 1);
      index++;
      continue;
    }

    if (/\s/.test(character)) {
      finishWord(index);
      index++;
      continue;
    }

    if (character === "'") {
      quoteState = openQuote("single");
      continue;
    }
    if (character === '"') {
      quoteState = openQuote("double");
      continue;
    }

    if (character === "\\") {
      const next = input[index + 1];
      if (next === undefined) {
        append("\\", "unquoted", false, index, index + 1);
        index++;
      } else {
        append(next, "unquoted", true, index, index + 2);
        index += 2;
      }
      continue;
    }

    if (character === "&") {
      finishWord(index);
      tokens.push({
        type: "background",
        span: { start: index, end: index + 1 },
      });
      index++;
      continue;
    }

    if (character === "|") {
      finishWord(index);
      tokens.push({
        type: "pipe",
        span: { start: index, end: index + 1 },
      });
      index++;
      continue;
    }

    const redirect = matchRedirect(input, index, wordStart !== null);
    
    if (redirect) {
      finishWord(index);
      tokens.push({
        type: "redirect",
        operator: redirect,
        span: { start: index, end: index + redirect.length },
      });
      index += redirect.length;
      continue;
    }

    append(character, "unquoted", false, index, index + 1);
    index++;
  }

  finishWord(input.length);
  if (
    quoteState.mode !== "unquoted" &&
    !options.tolerateIncomplete
  ) {
    diagnostics.push({
      message: `Unclosed ${quoteState.mode} quote`,
      span: {
        start: quoteState.start,
        end: input.length 
      },
    });
  }

  return {
    tokens,
    diagnostics,
    finalQuoteMode: quoteState.mode
  };
}

function matchRedirect(
  input: string,
  index: number,
  wordStarted: boolean,
): RedirectOperator | null {
  return REDIRECT_OPERATORS.find(
    (operator) =>
      (!wordStarted || operator.startsWith(">")) && input.startsWith(operator, index),
  ) ?? null;
}
