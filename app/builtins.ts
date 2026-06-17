import fs from "fs";
import path from "path";

export type BuiltinHandler = (args: string[]) => void;

interface BuiltinContext {
  close: () => void;
  prompt: () => void;
}

export function createBuiltins(context: BuiltinContext): Map<string, BuiltinHandler> {
  const builtins = new Map<string, BuiltinHandler>();

  builtins.set("exit", () => {
    context.close();
  });

  builtins.set("echo", (args: string[]) => {
    console.log(args.join(" "));
    context.prompt();
  });

  builtins.set("type", (args: string[]) => {
    const [name] = args;

    if (builtins.has(name)) {
      console.log(`${name} is a shell builtin`);
      context.prompt();
      return;
    }

    const executablePath = findExecutableInPath(name);

    if (executablePath) {
      console.log(`${name} is ${executablePath}`);
    } else {
      console.log(`${name}: not found`);
    }

    context.prompt();
  });

  builtins.set("pwd", () => {
    console.log(process.cwd());
    context.prompt();
  });

  builtins.set("cd", (args: string[]) => {
    let directory = args[0]?.trim() ?? "";

    if (directory === "~") {
      directory = process.env.HOME ?? "";
    }

    try {
      process.chdir(directory);
    } catch {
      console.log(`cd: ${directory}: No such file or directory`);
    }

    context.prompt();
  });

  return builtins;
}

export function findExecutableInPath(command: string): string | null {
  const paths = (process.env.PATH ?? "").split(path.delimiter);

  for (const directory of paths) {
    const fullPath = path.join(directory, command);

    try {
      fs.accessSync(fullPath, fs.constants.X_OK);
      return fullPath;
    } catch {
      // file does not exist or is not executable
    }
  }

  return null;
}
