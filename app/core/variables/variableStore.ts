export interface ShellVariable {
  name: string;
  value: string;
}

export class VariableStore {
  private readonly variables = new Map<string, string>();

  set(name: string, value: string): void {
    this.variables.set(name, value);
  }

  get(name: string): ShellVariable | undefined {
    const value = this.variables.get(name);

    if (value === undefined) {
      return undefined;
    }

    return { name, value };
  }

  has(name: string): boolean {
    return this.variables.has(name);
  }
}
