export type QuoteMode = "unquoted" | "single" | "double";

export interface SourceSpan {
  start: number;
  end: number;
}

export interface WordPart {
  value: string;
  quote: QuoteMode;
  escaped: boolean;
  span: SourceSpan;
}

export interface WordToken {
  type: "word";
  parts: WordPart[];
  span: SourceSpan;
}

export const REDIRECT_OPERATORS = [
  "1>>",
  "2>>",
  "1>",
  "2>",
  ">>",
  ">",
] as const;

export type RedirectOperator = (typeof REDIRECT_OPERATORS)[number];

export interface RedirectToken {
  type: "redirect";
  operator: RedirectOperator;
  span: SourceSpan;
}

export type Token = WordToken | RedirectToken;

export interface LexerDiagnostic {
  message: string;
  span: SourceSpan;
}

export interface LexerResult {
  tokens: Token[];
  diagnostics: LexerDiagnostic[];
  finalQuoteMode: QuoteMode;
}
