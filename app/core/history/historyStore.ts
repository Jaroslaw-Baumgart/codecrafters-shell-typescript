export interface HistoryEntry {
    id: number;
    command: string;
}

export class HistoryStore {
    private nextId = 1;
    private appendCursor = 0;
    private readonly entries: HistoryEntry[] = [];

    commands(): string[] {
        return this.entries.map((entry) => entry.command);
    }

    pendingAppendCommands(): string[] {
        return this.entries
            .slice(this.appendCursor)
            .map((entry) => entry.command);
    }

    markAppended(): void {
        this.appendCursor = this.entries.length;
    }

    add(command: string): HistoryEntry {
        const entry = {
            id: this.nextId++,
            command,
        };

        this.entries.push(entry);
        return entry;
    }

    addAll(commands: readonly string[]): void {
        for (const command of commands) {
            this.add(command);
        }
    }


    list(): HistoryEntry[] {
        return [...this.entries];
    }

    recent(limit: number): HistoryEntry[] {
        return this.entries.slice(-Math.max(0, limit));
    }

    getById(id: number): HistoryEntry | undefined {
        return this.entries.find((entry) => entry.id === id);
    }

    getByOffsetFormEnd(offset: number): HistoryEntry | undefined {
        return this.entries[this.entries.length - 1 - offset];
    }

    size(): number {
        return this.entries.length;
    }

}
