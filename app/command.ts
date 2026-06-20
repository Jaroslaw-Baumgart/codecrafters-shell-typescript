export interface ParsedCommand {
    command: string,
    args: string[],
    stdoutRedirect? : string;
}

export function parseCommand(tokens: string[]): ParsedCommand | null {
    const command = tokens[0];

    if(!command) {
        return null;
    }

    const args: string[] = [];
    let stdoutRedirect: string | undefined;

    for (let i = 1; i < tokens.length; i++) {
        const token = tokens[i]

        if (token === ">" || token === "1>"){
            stdoutRedirect = tokens[i + 1];
            i++;
            continue;
        }

        args.push(token);
    }

    return {
        command,
        args,
        stdoutRedirect,
    };
}