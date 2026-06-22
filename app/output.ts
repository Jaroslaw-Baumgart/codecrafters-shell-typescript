import fs from "fs";
import type { Redirect } from "./command";

export interface OutputWriter {
  stdout: "inherit" | number;
  stderr: "inherit" | number;
  writeLine: (text: string) => void;
  writeErrorLine: (text: string) => void;
  close: () => void;
}

function openRedirect(redirect?: Redirect): number | undefined {
  if (!redirect) {
    return undefined;
  }

  const flag = redirect.mode === "append" ? "a" : "w";
  return fs.openSync(redirect.path, flag);
}

export function createOutputWriter(
  stdoutRedirect?: Redirect,
  stderrRedirect?: Redirect,
): OutputWriter {
  const stdoutFd = openRedirect(stdoutRedirect);
  const stderrFd = openRedirect(stderrRedirect);

  return {
    stdout: stdoutFd ?? "inherit",
    stderr: stderrFd ?? "inherit",

    writeLine: (text: string) => {
      if (stdoutFd !== undefined) {
        fs.writeSync(stdoutFd, `${text}\n`);
      } else {
        console.log(text);
      }
    },

    writeErrorLine: (text: string) => {
      if (stderrFd !== undefined) {
        fs.writeSync(stderrFd, `${text}\n`);
      } else {
        console.error(text);
      }
    },

    close: () => {
      if (stdoutFd !== undefined) {
        fs.closeSync(stdoutFd);
      }

      if (stderrFd !== undefined) {
        fs.closeSync(stderrFd);
      }
    },
  };
}