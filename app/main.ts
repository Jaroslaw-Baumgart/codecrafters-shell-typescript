import { createInterface } from "readline";
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "$ ",
});

// TODO: Uncomment the code below to pass the first stage

type BuiltinHandler = (args: string[]) => void;


const builtins = new Map<string, BuiltinHandler>([
  ["exit", handleExit],
  ["echo", handleEcho],
  ["type", handleType],
  ["pwd", handlePwd],
  ["cd", handleCd],
]); 

function handleExit(args: string[]): void {
  rl.close();
}

function handleEcho(args: string[]): void {
  console.log(args.join(" "));
  rl.prompt();
}

function handleType(args: string[]): void {
  const [name] = args;

  if (builtins.has(name)) {
    console.log(`${name} is a shell builtin`);
    rl.prompt();
    return;
  }

  const executablePath = findExecutableInPath(name);

  if (executablePath) {
    console.log(`${name} is ${executablePath}`);
  } else {
    console.log(`${name}: not found`);
  }

  rl.prompt();
}

function findExecutableInPath(command: string): string | null {
  const paths = (process.env.PATH ?? "").split(path.delimiter);

  // console.log(process.env.PATH);
  // console.log(paths);

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

function handlePwd(args: string[]): void {
  console.log(process.cwd());
  rl.prompt();
}

function handleCd(args: string[]): void{

  let directory = args[0].trim();
  //console.log(args[0]);

  if (directory === "~") {
    directory = process.env.HOME ?? "";
  }

  try {
    process.chdir(directory);
  } catch {
    console.log(`cd: ${directory}: No such file or directory`);
  }

  rl.prompt();
}


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

function parseArgs(line: string): string[] {
  const args: string[] = [];
  let current = "";
  let inSingleQuotes = false;
  let currentStarted = false;

  for (const char of line) {
    if (char === "'"){
      inSingleQuotes = !inSingleQuotes;
      currentStarted = true;
      continue;
    }

    if (/\s/.test(char) && !inSingleQuotes) {
      if (currentStarted){
        args.push(current);
        current = "";
        currentStarted = false;
      }
      continue;
    }

    current += char;
    currentStarted = true;
  }

  if (currentStarted) {
    args.push(current);
  }

  return args;
}



rl.prompt();
rl.on("line", (line: string) =>{
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
