import { createInterface, type Interface } from "node:readline";
import { stdin, stdout, stderr } from "node:process";

import type { Complete, CompletionResult } from "../core/completion/completion";
import type { OutputData, Terminal } from "../core/ports";

type ReadlineResult = [matches: string[], replace: string];

export class NodeTerminal implements Terminal {
  private readonly readline: Interface;

  constructor(private readonly complete?: Complete) {
    this.readline = createInterface({
      input: stdin,
      output: stdout,
      completer: complete
        ? (
            line: string,
            callback: (error: Error | null, result: ReadlineResult) => void,
          ) => {
            void this.completeLine(line)
              .then((result) => callback(null, result))
              .catch((error: unknown) => {
                const completionError =
                  error instanceof Error ? error : new Error(String(error));

                callback(completionError, [[], line]);
              });
          }
        : undefined,
    });
  }

  lines(): AsyncIterable<string> {
    return this.readline;
  }

  prompt(text: string): void {
    this.readline.setPrompt(text);
    this.readline.prompt();
  }

  write(data: OutputData): void {
    stdout.write(data);
  }

  writeError(data: OutputData): void {
    stderr.write(data);
  }

  bell(): void {
    stdout.write("\x07");
  }

  pauseInput(): void {
    this.readline.pause();
  }

  resumeInput(): void {
    this.readline.resume();
  }

  close(): void {
    this.readline.close();
  }

  private async completeLine(line: string): Promise<ReadlineResult> {
    return this.toReadlineResult(await this.complete!(line));
  }

  private toReadlineResult(result: CompletionResult): ReadlineResult {
    if (result.bell) this.bell();
    if (result.displayCandidates.length > 0) {
      const names = result.displayCandidates
        .map((item) => item.displayText)
        .join("  ");
      this.write(`\n${names}\n`);
      this.readline.prompt(true);
    }
    return [
      result.replacement === null ? [] : [result.replacement],
      result.replaceText,
    ];
  }
}
