import type { BuiltinHandler } from "../execution/types";
import type { HistoryEntry, HistoryStore } from "./historyStore";
import {
  appendHistoryFile,
  readHistoryFile,
  writeHistoryFile,
} from "./historyPersistence";

export function createHistoryBuiltin(history: HistoryStore): BuiltinHandler {
  return ({ args, output }) => {
    try {
      switch (args[0]) {
        case "-r": {
          const path = historyFilePath(args);
          if (!path) {
            output.stderr.write("history: -r: missing file path\n");

            return { exitCode: 1 };
          }

          history.addAll(readHistoryFile(path));
          return { exitCode: 0 };
        }

        case "-w": {
          const path = historyFilePath(args);
          if (!path) {
            output.stderr.write("history: -r: missing file path\n");

            return { exitCode: 1 };
          }

          writeHistoryFile(path, history.commands());
          return { exitCode: 0 };
        }

        case "-a": {
          const path = historyFilePath(args);
          if (!path) {
            output.stderr.write("history: -r: missing file path\n");

            return { exitCode: 1 };
          }

          appendHistoryFile(path, history.pendingAppendCommands());
          history.markAppended();
          return { exitCode: 0 };
        }

        default: {
          const entries = selectedEntries(history, args);

          for (const entry of entries) {
            output.stdout.write(formatHistoryEntry(entry));
          }

          return { exitCode: 0 };
        }
      }
    } catch (error) {
      output.stderr.write(`history: ${errorMessage(error)}\n`);

      return { exitCode: 1 };
    }
  };
}

function historyFilePath(args: readonly string[]): string | null {
  return args[1] ?? null;
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

  return history.recent(count);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
