import { findExecutableNamesInPath } from "./externalCommands";

type CompletionTarget = "command" | "argument";

type CompletionSource = (prefix: string) => string [];


type CompletionContext = {
    target: CompletionTarget;
    prefix: string;
    //tokenIndex: number;
};

type CreateCompleterOptions = {
    builtinNames: string[];
    enabledBuiltinNames: Set<string>;
    onBell?: () => void;
    onDisplayMatches?: (matches: string[], line: string) => void;
};

function getCompletionContext(line: string): CompletionContext{
    const lastSpaceIndex = line.lastIndexOf(" ");
    const prefix = lastSpaceIndex === -1 ? line : line.slice(lastSpaceIndex + 1);

    return {
        target: lastSpaceIndex === -1 ? "command" : "argument",
        prefix,
        //tokenIndex: lastSpaceIndex === -1 ? 0 : 1,
    };
}

function completeBuiltins(
    prefix: string,
    builtinNames: string[],
    enabledBuiltinNames: Set<string>
): string[] {
     return builtinNames.filter((name) => {
        return enabledBuiltinNames.has(name) && name.startsWith(prefix);
    });
}

function completeExecutables(prefix: string): string[] {
    return findExecutableNamesInPath(prefix);
}

function areSameMatches(a: string[], b: string[]): boolean {
    return a.length === b.length && a.every((value, index) => value === b[index]);
}

export function createCompleter(options: CreateCompleterOptions){
    const sourcesByTarget = new Map<CompletionTarget, CompletionSource[]>([
        [
            "command",
            [
                (prefix) =>
                    completeBuiltins(
                        prefix,
                        options.builtinNames,
                        options.enabledBuiltinNames
                    ),
                completeExecutables,
            ],
        ],
        ["argument", []],
    ]);

    let lastMultipleCompletion:
        | { prefix: string; matches: string[] }
        | null = null;
    
    return (line: string): [string[], string] => {
        const context = getCompletionContext(line);
        const sources = sourcesByTarget.get(context.target) ?? [];

        const matches = [
            ...new Set(
                sources.flatMap((source) => source(context.prefix))
            ),
        ].sort();

        if (matches.length === 0) {
            lastMultipleCompletion = null;
            options.onBell?.();
            return [[], context.prefix];
        }

        if (matches.length === 1) {
            lastMultipleCompletion = null;
            return [[`${matches[0]} `], context.prefix];
        }

        const isRepeatedMultipleCompletion =
            lastMultipleCompletion !== null &&
            lastMultipleCompletion.prefix === context.prefix &&
            areSameMatches(lastMultipleCompletion.matches, matches);

            if(isRepeatedMultipleCompletion) {
                options.onDisplayMatches?.(matches, line);
            } else {
                options.onBell?.();
                lastMultipleCompletion ={
                    prefix: context.prefix,
                    matches
                };
            }

        return [[], context.prefix];
    };
}