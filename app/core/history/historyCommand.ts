import { connect } from "bun";
import type { BuiltinHandler } from "../execution/types";
import type { HistoryEntry, HistoryStore } from "./historyStore";

export function createHistoryBuiltin(
    history: HistoryStore,
): BuiltinHandler {
    return({ args, output }) => {
        const entries = selectedEntries(history, args);

        for (const entry of history.list()) {
            output.stdout.write(formatHistoryEntry(entry));
        }

        return { exitCode: 0 };
    };
}

function formatHistoryEntry(entry: HistoryEntry): string {
    return `${entry.id.toString().padStart(5)}  ${entry.command}\n`;
}

function selectedEntries(
    history: HistoryStore,
    args: readonly string[],
): HistoryEntry[] {
    const limit = args[0];

    if (limit === undefined) {
        return history.list();
    }

    const count = Number(limit);

    if (!Number.isFinite(count)) {
        return history.list();
    }

    return history.recent(count)
}