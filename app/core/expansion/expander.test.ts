import { describe, expect, test } from "bun:test";

import { lexShell } from "../lexer/shellLexer";
import { parseShell } from "../parser/shellParser";
import { VariableStore } from "../variables/variableStore";
import { expandCommandLine, type ExpandedPipeline } from "./expander";
import { stdout } from "bun";

describe("expandCommandLine", () => {
  test("expands an environment variable", () => {
    const pipeline = expand("echo $HOME", {
      HOME: "/home/user",
    });

    expect(pipeline.commands).toHaveLength(1);
    expect(pipeline.commands[0]?.name).toBe("echo");
    expect(pipeline.commands[0]?.args).toEqual(["/home/user"]);
  });

  test("does not expand variables inside single quotes", () => {
    const pipeline = expand("echo '$HOME'", {
      HOME: "/home/user",
    });

    expect(pipeline.commands[0]?.args).toEqual(["$HOME"]);
  });

  test("does not expand an escaped variable", () => {
    const pipeline = expand("echo \\$HOME", {
      HOME: "/home/user",
    });

    expect(pipeline.commands[0]?.args).toEqual(["$HOME"]);
  });

  test("preserves an empty quoted argument", () => {
    const pipeline = expand('echo ""');

    expect(pipeline.commands[0]?.name).toBe("echo");
    expect(pipeline.commands[0]?.args).toEqual([""]);
  });

  test("prefers a shell variable over the environment", () => {
    const piepeline = expand(
      "echo $NAME",
      {
        NAME: "environment",
      },
      {
        NAME: "shell",
      },
    );

    expect(piepeline.commands[0]?.args).toEqual(["shell"]);
  });

  test("expands a variable in a redirect path", () => {
    const pipeline = expand("echo hello > $OUTPUT_FILE", {
      OUTPUT_FILE: "result.txt",
    });

    expect(pipeline.commands[0]?.redirects).toEqual([
      {
        stream: "stdout",
        mode: "overwrite",
        path: "result.txt",
      },
    ]);
  });
});

function expand(
  input: string,
  environment: Record<string, string> = {},
  shellVariables: Record<string, string> = {},
): ExpandedPipeline {
  const lexed = lexShell(input);

  expect(lexed.diagnostics).toEqual([]);

  const parsed = parseShell(lexed.tokens);

  expect(parsed.diagnostics).toEqual([]);

  const variables = new VariableStore();

  for (const [name, value] of Object.entries(shellVariables)) {
    variables.set(name, value);
  }

  const result = expandCommandLine(parsed.ast, {
    variables,
    env: environment,
  });

  expect(result.diagnostics).toEqual([]);

  if (!result.pipeline) {
    throw new Error("Expected an expanded pipeline");
  }

  return result.pipeline;
}
