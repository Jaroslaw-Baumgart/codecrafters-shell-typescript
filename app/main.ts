import { createInterface } from "readline";
import { spawnSync } from "child_process";
import { parseArgs } from "./parser";
import { createBuiltins, findExecutableInPath } from "./builtins";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "$ ",
});

const builtins = createBuiltins({
  close: () => rl.close(),
  prompt: () => rl.prompt(),
});

function handleExternalCommand(command: string, args: string[]): void {
  const executablePath = findExecutableInPath(command);

  if (!executablePath) {
    console.log(`${command}: command not found`);
    rl.prompt();
    return;
  }

  spawnSync(command, args, {
    stdio: "inherit",
  });

  rl.prompt();
}

// TODO: Uncomment the code below to pass the first stage







rl.prompt();
rl.on("line", (line: string) => {
  const args = parseArgs(line);
  const command = args[0];
  const commandArgs = args.slice(1);

  if (!command) {
    rl.prompt();
    return;
  }

  const handler = builtins.get(command);
  if (handler) {
    handler(commandArgs);
  } else {
    handleExternalCommand(command, commandArgs);
  }
});

//codecrafters submit
