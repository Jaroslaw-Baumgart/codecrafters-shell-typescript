import type { CompletionSpecStore } from "../completion/completionSpecStore";
import type {
  BuiltinHandler,
  BuiltinInvocation,
  ExecutionResult,
} from "./types";

export function createCompleteBuiltin(
  completionSpecs: CompletionSpecStore,
): BuiltinHandler {
  return (invocation) => {
    switch (invocation.args[0]) {
      case "-C":
        return registerCompletion(completionSpecs, invocation);

      case "-p":
        return printCompletion(completionSpecs, invocation);

      default:
        return { exitCode: 0 };
    }
  };
}

function registerCompletion(
  completionSpecs: CompletionSpecStore,
  { args }: BuiltinInvocation,
): ExecutionResult {
  const completerPath = args[1];
  const command = args[2];

  if (!completerPath || !command) {
    return { exitCode: 1 };
  }

  completionSpecs.register(command, completerPath);

  return { exitCode: 0 };
}

function printCompletion(
  completionSpecs: CompletionSpecStore,
  { args, output }: BuiltinInvocation,
): ExecutionResult {
  const command = args[1];

  if (!command) {
    return { exitCode: 1 };
  }

  const formatted = completionSpecs.format(command);

  if (!formatted) {
    output.stdout.write(
      `complete: ${command}: no completion specification\n`,
    );

    return { exitCode: 1 };
  }

  output.stdout.write(`${formatted}\n`);

  return { exitCode: 0 };
}
