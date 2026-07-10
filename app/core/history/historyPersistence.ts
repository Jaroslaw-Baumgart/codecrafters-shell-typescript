import { readFileSync } from "node:fs";

export function readHistoryFile(path: string): string[] {
    return readFileSync(path, "utf8")
        .split(/\r?\n/)
        .filter((line) => line.length > 0);
}