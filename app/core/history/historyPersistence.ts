import { readFileSync, writeFileSync } from "node:fs";

export function readHistoryFile(path: string): string[] {
    return readFileSync(path, "utf8")
        .split(/\r?\n/)
        .filter((line) => line.length > 0);
}

export function writeHistoryFile(
    path: string,
    commands: readonly string[],
): void {
  writeFileSync(path, serializeHistory(commands), "utf8");
}

function serializeHistory(commands: readonly string[]): string{
    return commands.length === 0
        ? ""
        : `${commands.join("\n")}\n`
}