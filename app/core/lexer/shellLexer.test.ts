import { describe, expect, test } from "bun:test";

import { lexShell } from "./shellLexer";
import type { Token, WordToken } from "./token";

describe("lexShell", () => {
  test("tokenizes a simple command", () => {
    const result = lexShell("echo hello");
    const words = wordTokens(result.tokens);

    expect(result.diagnostics).toEqual([]);
    expect(words).toHaveLength(2);

    expect(words[0]?.parts[0]?.value).toBe("echo");
    expect(words[1]?.parts[0]?.value).toBe("hello");
  });

  test("preserves an empty quoted argument", () => {
    const result = lexShell('echo ""');
    const words = wordTokens(result.tokens);

    expect(result.diagnostics).toEqual([]);
    expect(words).toHaveLength(2);

    expect(words[1]?.parts).toMatchObject([
      {
        value: "",
        quote: "double",
        escaped: false,
      },
    ]);
  });

  test("preserves single-quoted text", () => {
    const result = lexShell("echo '$HOME'");
    const words = wordTokens(result.tokens);

    expect(result.diagnostics).toEqual([]);
    expect(words).toHaveLength(2);

    expect(words[1]?.parts).toMatchObject([
      {
        value: "$HOME",
        quote: "single",
        escaped: false,
      },
    ]);
  });

  test("reports an unclosed double quote", () => {
    const result = lexShell('echo "hello');

    expect(result.diagnostics).toEqual([
      {
        message: "Unclosed double quote",
        span: {
          start: 5,
          end: 11,
        },
      },
    ]);

    expect(result.finalQuoteMode).toBe("double");
  });

  test("tokenizes pipeline and redirection operators", () => {
    const result = lexShell("echo hello | cat >> output.txt");

    expect(result.diagnostics).toEqual([]);

    expect(result.tokens.map((token) => token.type)).toEqual([
      "word",
      "word",
      "pipe",
      "word",
      "redirect",
      "word",
    ]);
  });
});

function wordTokens(tokens: readonly Token[]): WordToken[] {
  return tokens.filter((token): token is WordToken => token.type === "word");
}
