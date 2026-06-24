export type OutputData = string | Uint8Array;

export interface TerminalOutput {
  write(data: OutputData): void;
  writeError(data: OutputData): void;
}

export interface ExecutionTerminal extends TerminalOutput {
  pauseInput(): void;
  resumeInput(): void;
}

export interface Terminal extends ExecutionTerminal {
  lines(): AsyncIterable<string>;
  prompt(text: string): void;
  bell(): void;
  close(): void;
}
