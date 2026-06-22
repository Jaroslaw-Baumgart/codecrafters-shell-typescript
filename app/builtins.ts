import { findExecutableInPath } from "./externalCommands";
import type { OutputWriter } from "./output";

export type BuiltinHandler = (args: string[], output: OutputWriter) => void;

interface BuiltinContext {
  close: () => void;
}

export function createBuiltins(context: BuiltinContext): Map<string, BuiltinHandler> {
  const builtins = new Map<string, BuiltinHandler>();

  builtins.set("exit", () => {
    context.close();
  });

  builtins.set("echo", (args, output) => {
    output.writeLine(args.join(" "));
  });

  builtins.set("type", (args, output) => {
    const [name] = args;

    if (!name) {
      output.writeErrorLine("type: missing operand");
      return;
    }

    if (builtins.has(name)) {
      output.writeLine(`${name} is a shell builtin`);
      return;
    }

    const executablePath = findExecutableInPath(name);

    if (executablePath) {
      output.writeLine(`${name} is ${executablePath}`);
    } else {
      output.writeLine(`${name}: not found`);
    }
  });

  builtins.set("pwd", (_args, output) => {
    output.writeLine(process.cwd());
  });

  builtins.set("cd", (args, output) => {
    const directory = args[0] ?? "";

    let target = directory;
    if (target === "~") {
      target = process.env.HOME ?? "";
    }

    try {
      process.chdir(target);
    } catch {
      output.writeErrorLine(`cd: ${target}: No such file or directory`);
    }
  });

  return builtins;
}

