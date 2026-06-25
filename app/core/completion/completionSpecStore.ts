export interface CompletionSpec {
  command: string;
  completerPath: string;
}

export class CompletionSpecStore {
  private readonly specs = new Map<string, CompletionSpec>();

  register(command: string, completerPath: string): void {
    this.specs.set(command, { command, completerPath });
  }

  unregister(command: string): boolean {
    return this.specs.delete(command);
  }

  get(command: string): CompletionSpec | undefined {
    return this.specs.get(command);
  }

  format(command: string): string | undefined {
    const spec = this.get(command);
    if (!spec) return undefined;

    return `complete -C '${spec.completerPath}' ${spec.command}`;
  }
}
