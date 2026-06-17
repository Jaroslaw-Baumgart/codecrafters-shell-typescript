export function parseArgs(line: string): string[] {
  const args: string[] = [];
  let current = "";
  let inSingleQuotes = false;
  let inDoubleQuotes = false;
  let currentStarted = false;
  let escaping = false;

  for (const char of line) {
    if (char === "'" && !inDoubleQuotes){
      inSingleQuotes = !inSingleQuotes;
      currentStarted = true;
      continue;
    }
    if (char === '"' && !inSingleQuotes){
      inDoubleQuotes = !inDoubleQuotes;
      currentStarted = true;
      continue;
    }
    if (char === '\\' && !inSingleQuotes && !inDoubleQuotes){
      escaping = true;
      currentStarted = true;
      continue;
    }

    if (/\s/.test(char) && !inSingleQuotes && !inDoubleQuotes) {
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

