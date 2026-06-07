import { createInterface } from "readline";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "$ ",
});

// TODO: Uncomment the code below to pass the first stage
rl.prompt();
rl.on("line", (line: string) => {
  console.log(`{${line}}: command not found`);
  rl.prompt();
});
//codecrafters submit