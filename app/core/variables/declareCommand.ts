import { exitCode } from "node:process";
import type {
  BuiltinHandler,
  BuiltinInvocation,
  ExecutionResult,
} from "../execution/types";

import type { VariableStore } from "./variableStore";

export function createDeclareBuiltin(
  variables: VariableStore,
): BuiltinHandler {
  return (invocation) => declareBuiltin(invocation, variables);
}

function declareBuiltin(
  { args, output }: BuiltinInvocation,
  variables: VariableStore,
): ExecutionResult {
  if (args[0] === "-p") {
    const name = args[1];

    if (!name) {
      output.stderr.write("declare: -p: missing variable name\n");
      return { exitCode: 1 };
    }

    const variable = variables.get(name);

    if (!variable) {
      output.stderr.write(`declare: ${name}: not found\n`);
      return { exitCode: 1 };
    }

    output.stdout.write(
      `declare -- ${variable.name}="${variable.value}"\n`,
    );

    return { exitCode: 0 };
  }

  let exitCode = 0;

  for (const assignment of args) {
    const separatorIndex = assignment.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const name = assignment.slice(0, separatorIndex);
    const value = assignment.slice(separatorIndex + 1);

    if (!isValidVariableName(name)) {
      output.stderr.write(
        `declare: \`${assignment}': not a valid identifier\n`,
      );
      exitCode = 1;
      continue;
    }

    variables.set(name, value);
  }

  return { exitCode };
}

function isValidVariableName(name: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
}