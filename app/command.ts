const STDOUT_REDIRECT_OPERATORS = new Set([">", "1>"]);
const STDERR_REDIRECT_OPERATORS = new Set(["2>"]);

export interface ParsedCommand {
    command: string,
    args: string[],
    stdoutRedirect? : string,
    stderrRedirect?: string;
}

export function parseCommand(tokens: string[]): ParsedCommand | null {
    const command = tokens[0];

    if(!command) {
        return null;
    }

    const args: string[] = [];
    let stdoutRedirect: string | undefined;
    let stderrRedirect: string | undefined;

    for (let i = 1; i < tokens.length; i++) {
        const token = tokens[i]

        if (STDOUT_REDIRECT_OPERATORS.has(token)){
            stdoutRedirect = tokens[i + 1];
            i++;
            continue;
        }

        if (STDERR_REDIRECT_OPERATORS.has(token)){
            stderrRedirect = tokens[i + 1];
            i++;
            continue;
        }

        args.push(token);
    }

    return {
        command,
        args,
        stdoutRedirect,
        stderrRedirect,
    };
}