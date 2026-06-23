type CompletionTarget = "command" | "argument";


type CompletionContext = {
    target: CompletionTarget;
    prefix: string;
    //tokenIndex: number;
};

//type CompletionSource = (prefix: string) => string [];

type CreateCompleterOptions = {
    builtinNames: string[];
    enabledBuiltinNames: Set<string>;
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

export function createCompleter(options: CreateCompleterOptions){
    return (line: string): [string[], string] => {
        const context = getCompletionContext(line);

        if (context.target !== "command") {
            return [[], context.prefix];
        }

        const matches = completeBuiltins(
            context.prefix,
            options.builtinNames,
            options.enabledBuiltinNames
        );

        return [matches, context.prefix];
    }
}