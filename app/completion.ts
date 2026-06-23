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
    onMissingCompletion?: () => void;
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
    return builtinNames
    .filter((name) => {
        return enabledBuiltinNames.has(name) && name.startsWith(prefix);
    })
    .map((name) => `${name} `);
}

function completeExecutables(prefix: string): string[] {
    return findExecutableNamesInPath(prefix).map((name) => `${name} `);
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
    
    return (line: string): [string[], string] => {
        const context = getCompletionContext(line);
        const sources = sourcesByTarget.get(context.target) ?? [];

        const matches = [
            ...new Set(
                sources.flatMap((source) => source(context.prefix))
            ),
        ];

        if (matches.length === 0) {
            options.onMissingCompletion?.();
        }

        return [matches, context.prefix];
    };
}