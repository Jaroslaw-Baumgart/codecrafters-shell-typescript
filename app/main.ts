import { parseArgs } from "./parser";
import { createBuiltins } from "./builtins";
import { handleExternalCommand } from "./externalCommands";
import { parseCommand } from "./command";
import { createOutputWriter } from "./output";
import { createInterface, type Interface } from "readline";
import { createCompleter } from "./completion";

let rl: Interface;
let isClosed = false;

const builtins = createBuiltins({
  close: () => {
    isClosed = true;
    rl.close();
  },
});

rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "$ ",
  completer: createCompleter({
    builtinNames: [...builtins.keys()],
    enabledBuiltinNames: new Set(["echo", "exit"]),
    onBell: () => {
      process.stdout.write("\x07");
    },
    onDisplayMatches: (matches, line) => {
      process.stdout.write(`\n${matches.join(" ")}\n$ ${line}`);
    },
  }),
});


// TODO: Uncomment the code below to pass the first stage


rl.prompt();
rl.on("line", (line: string) => {

  const tokens = parseArgs(line);
  const parsedCommand = parseCommand(tokens);

  if (!parsedCommand) {
    rl.prompt();
    return;
  }

  const output = createOutputWriter(
    parsedCommand.stdoutRedirect,
    parsedCommand.stderrRedirect
  );

  try {
    const handler = builtins.get(parsedCommand.command);
  
    if (handler) {
      handler(parsedCommand.args, output);
    } else {
      handleExternalCommand(
        parsedCommand.command,
        parsedCommand.args,
        output,
      );
    }
} finally {
  output.close();

  if(!isClosed){
    rl.prompt();
  }
}
});

//codecrafters submit
