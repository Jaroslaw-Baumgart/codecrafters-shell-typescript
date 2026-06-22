export type RedirectStream = "stdout" | "stderr";
export type RedirectMode = "overwrite" | "append";

export interface Redirect {
  path: string;
  mode: RedirectMode;
}

export interface ParsedCommand {
  command: string;
  args: string[];
  stdoutRedirect?: Redirect;
  stderrRedirect?: Redirect;
}

type RedirectOperator = {
  stream: RedirectStream;
  mode: RedirectMode;
};

const REDIRECT_OPERATORS = new Map<string, RedirectOperator>([
  [">", { stream: "stdout", mode: "overwrite" }],
  ["1>", { stream: "stdout", mode: "overwrite" }],
  [">>", { stream: "stdout", mode: "append" }],
  ["1>>", { stream: "stdout", mode: "append" }],
  ["2>", { stream: "stderr", mode: "overwrite" }],
  ["2>>", { stream: "stderr", mode: "append" }],
]);

export function parseCommand(tokens: string[]): ParsedCommand | null {
  const command = tokens[0];

  if (!command) {
    return null;
  }

  const args: string[] = [];
  let stdoutRedirect: Redirect | undefined;
  let stderrRedirect: Redirect | undefined;

  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i];
    const redirectOperator = REDIRECT_OPERATORS.get(token);

    if (redirectOperator) {
      const path = tokens[i + 1];

      if (!path) {
        break;
      }

      const redirect: Redirect = {
        path,
        mode: redirectOperator.mode,
      };

      if (redirectOperator.stream === "stdout") {
        stdoutRedirect = redirect;
      } else {
        stderrRedirect = redirect;
      }

      i++;
      continue;
    }

    args.push(token);
  }

  return {
    command,
    args,
    stdoutRedirect,
    stderrRedirect,
  };
}