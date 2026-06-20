import { createInterface } from "readline";
import { parseArgs } from "./parser";
import { createBuiltins } from "./builtins";
import { handleExternalCommand } from "./externalCommands";
import { parseCommand } from "./command";
import { createOutputWriter } from "./output";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "$ ",
});

let isClosed = false;

const builtins = createBuiltins({
  close: () => {
    isClosed = true;
    rl.close()
  },
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
      output.stdout,
      output.stderr,
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
