import type { SourceSpan, WordPart } from "../lexer/token";

export interface CommandLine {
  type: "command-line";
  body: SimpleCommand | null;
  background: boolean;
  span: SourceSpan;
}

export interface SimpleCommand {
  type: "simple-command";
  parts: SimpleCommandPart[];
  span: SourceSpan;
}

export type SimpleCommandPart = Word | Redirection;

export interface Word {
  type: "word";
  parts: WordPart[];
  span: SourceSpan;
}

export type RedirectStream = "stdout" | "stderr";

export type RedirectMode = "overwrite" | "append";

export interface Redirection {
  type: "redirection";
  stream: RedirectStream;
  mode: RedirectMode;
  target: Word;
  span: SourceSpan;
}