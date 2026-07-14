export interface ShellEnvironment {
  readonly HOME?: string;
  readonly HISTFILE?: string;
  readonly PATH?: string;
  readonly Path?: string;
  readonly PATHEXT?: string;
  readonly [name: string]: string | undefined;
}

export class ShellContext {
  private currentDirectory: string;
  private status = 0;
  private shouldExit = false;

  readonly env: ShellEnvironment;

  constructor(cwd: string, env: ShellEnvironment) {
    this.currentDirectory = cwd;
    this.env = { ...env };
  }

  get cwd(): string {
    return this.currentDirectory;
  }

  get lastExitCode(): number {
    return this.status;
  }

  get exitRequested(): boolean {
    return this.shouldExit;
  }

  changeDirectory(directory: string): void {
    this.currentDirectory = directory;
  }

  setLastExitCode(exitCode: number): void {
    this.status = exitCode;
  }

  requestExit(exitCode = 0): void {
    this.status = exitCode;
    this.shouldExit = true;
  }
}
