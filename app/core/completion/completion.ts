import { lexShell } from "../lexer/shellLexer";
import type { QuoteMode, Token, WordToken } from "../lexer/token";

export type CompletionTarget = "command" | "argument" | "redirect-target";
export type CompletionCandidateKind =
  | "command"
  | "file"
  | "directory"
  | "argument";

export interface CompletionCandidate {
  insertText: string;
  displayText: string;
  suffix: "" | " ";
  kind: CompletionCandidateKind;
}

export interface CompletionContext {
  target: CompletionTarget;
  commandName: string | null;
  words: string[];
  currentWordIndex: number;
  prefix: string;
  replaceText: string;
  quoteMode: QuoteMode;
  line: string;
  cursor: number;
}

export interface CompletionResult {
  replacement: string | null;
  replaceText: string;
  bell: boolean;
  displayCandidates: CompletionCandidate[];
}

export type CompletionSource = (
  context: CompletionContext,
) => CompletionCandidate[] | Promise<CompletionCandidate[]>;

export type Complete = (
  line: string,
  cursor?: number,
) => Promise<CompletionResult>;

export function createCompletion(sources: readonly CompletionSource[]): Complete {
  let lastAmbiguousKey: string | null = null;

  return async (line, cursor = line.length) => {
    const context = completionContext(line, cursor);

    const sourceResults = await Promise.all(
      sources.map((source) => source(context)),
    );

    const candidates = normalizeCandidates(
      context,
      sourceResults.flat(),
    );

    if (candidates.length === 0) {
      lastAmbiguousKey = null;
      return result(context, null, true);
    }

    if (candidates.length === 1) {
      lastAmbiguousKey = null;
      const candidate = candidates[0];
      return result(
        context,
        formatValue(candidate.insertText, context.quoteMode, true) + candidate.suffix,
      );
    }

    const commonPrefix = longestCommonPrefix(candidates.map((item) => item.insertText));
    if (commonPrefix.length > context.prefix.length) {
      lastAmbiguousKey = null;
      return result(context, formatValue(commonPrefix, context.quoteMode, false));
    }

    const key = `${line}\u0001${cursor}\u0001${candidates.map((item) => item.insertText).join("\u0000")}`;
    const repeated = key === lastAmbiguousKey;
    lastAmbiguousKey = key;

    return {
      replacement: null,
      replaceText: context.replaceText,
      bell: !repeated,
      displayCandidates: repeated ? candidates : [],
    };
  };
}

function wordTokens(tokens: readonly Token[]): WordToken[] {
  return tokens.filter(
    (token): token is WordToken => token.type === "word",
  );
}

function wordValues(words: readonly WordToken[]): string[] {
  return words.map(wordValue);
}

function currentWordIndex(
  words: readonly WordToken[],
  activeWord: WordToken | null,
): number {
  if (!activeWord) return words.length;

  const index = words.indexOf(activeWord);
  return index === -1 ? words.length : index;
}

function completionContext(line: string, cursor: number): CompletionContext {
  const { tokens, finalQuoteMode } = lexShell(line.slice(0, cursor), {
    tolerateIncomplete: true,
  });
  const activeWord = findActiveWord(tokens, cursor);
  const target = findTarget(tokens, activeWord);
  const start = activeWord?.span.start ?? cursor;
  const words = wordTokens(tokens);
  const values = wordValues(words);

  return {
    target,
    commandName: values[0] ?? null,
    words: values,
    currentWordIndex: currentWordIndex(words, activeWord),
    prefix: activeWord ? wordValue(activeWord) : "",
    replaceText: line.slice(start, cursor),
    quoteMode: finalQuoteMode,
    line,
    cursor,
  };
}

function findTarget(
  tokens: readonly Token[],
  activeWord: WordToken | null,
): CompletionTarget {
  let wordIndex = 0;
  let redirectTarget = false;

  for (const token of tokens) {
    if (token.type === "redirect") {
      redirectTarget = true;
      continue;
    }

    if (redirectTarget) {
      redirectTarget = false;
      if (token === activeWord) return "redirect-target";
      continue;
    }

    if (token === activeWord) return wordIndex === 0 ? "command" : "argument";
    wordIndex++;
  }

  if (redirectTarget) return "redirect-target";
  return wordIndex === 0 ? "command" : "argument";
}

function findActiveWord(tokens: readonly Token[], cursor: number): WordToken | null {
  const token = tokens[tokens.length - 1];
  return token?.type === "word" && token.span.end === cursor ? token : null;
}

function wordValue(word: WordToken): string {
  return word.parts.map((part) => part.value).join("");
}

function normalizeCandidates(
  context: CompletionContext,
  candidates: readonly CompletionCandidate[],
): CompletionCandidate[] {
  const unique = new Map<string, CompletionCandidate>();
  for (const candidate of candidates) {
    if (candidate.insertText.startsWith(context.prefix) && !unique.has(candidate.insertText)) {
      unique.set(candidate.insertText, candidate);
    }
  }
  return [...unique.values()].sort((a, b) => a.insertText.localeCompare(b.insertText));
}

function result(
  context: CompletionContext,
  replacement: string | null,
  bell = false,
): CompletionResult {
  return { replacement, replaceText: context.replaceText, bell, displayCandidates: [] };
}

function longestCommonPrefix(values: readonly string[]): string {
  let prefix = values[0] ?? "";
  for (const value of values.slice(1)) {
    while (!value.startsWith(prefix)) prefix = prefix.slice(0, -1);
  }
  return prefix;
}

function formatValue(value: string, quote: QuoteMode, closeQuote: boolean): string {
  if (quote === "single") {
    return `'${value.replaceAll("'", "'\\''")}${closeQuote ? "'" : ""}`;
  }
  if (quote === "double") {
    return `"${value.replace(/["\\]/g, "\\$&")}${closeQuote ? '"' : ""}`;
  }
  return value.replace(/[\s\\'">]/g, "\\$&");
}
