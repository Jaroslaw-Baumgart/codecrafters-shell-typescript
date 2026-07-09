import { connect } from "bun";
import type { BuiltinHandler } from "../execution/types";
import type { HistoryEntry, HistoryStore } from "./historyStore";

export function createHistoryBuiltin(
    history: HistoryStore,
): BuiltinHandler {
    return({ output }) => {
        for (const entry of history.list()) {
            output.stdout.write(formatHistoryEntry(entry));
        }

        return { exitCode: 0 };
    };
}

function formatHistoryEntry(entry: HistoryEntry): string {
    return `${entry.id.toString().padStart(5)}  ${entry.command}\n`;
}