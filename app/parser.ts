type ParserState = "normal" | "singleQuoted" | "doubleQuoted";

export function parseArgs(line: string): string[] {
  const args: string[] = [];
  let current = "";
  let currentStarted = false;
  let state: ParserState = "normal";

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (state === "normal") {
      if (char === "\\"){
        const nextChar = line[i +1];

        if (nextChar !== undefined) {
          current += nextChar;
          currentStarted = true;
          i++;
        } else {
          current += "\\";
          currentStarted = true;
        }

        continue;
      }

      if (char === "'") {
        state = "singleQuoted";
        currentStarted = true;
        continue;
      }

      if (char === '"') {
        state = "doubleQuoted";
        currentStarted = true;
        continue;
      }

      if (/\s/.test(char)) {
        if (currentStarted) {
          args.push(current);
          current = "";
          currentStarted = false;
        }

        continue;

      }

      current += char;
      currentStarted = true;
      continue;
    }

    if (state === "singleQuoted") {
      if (char === "'") {
        state = "normal";
        currentStarted = true;
        continue;
      }

      current += char;
      currentStarted = true;
      continue;
    }

    if (state === "doubleQuoted") {
      if (char === '"') {
        state = "normal";
        currentStarted = true;
        continue;
      }

      current += char;
      currentStarted = true;
      continue;
    }
  }

  if (currentStarted) {
    args.push(current);
  }

  return args;
}

