import { createInterface } from "readline";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "$ ",
});

// TODO: Uncomment the code below to pass the first stage


rl.prompt();
rl.on("line", (line: string) =>{
  const trimmedLine = line.trim();
  const [command, ...args] = trimmedLine.split(" ");

  switch (command) {
    case "exit":
      rl.close();
      break;
    case "echo":
      console.log(args.join(" "));  
      rl.prompt();
      break;
    default:
      console.log(`${command}: command not found`);
      rl.prompt();
  }
});
//codecrafters submit