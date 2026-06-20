import fs from "fs";


export interface OutputWriter {
    stdout: "inherit" | number;
    stderr: "inherit" | number;
    writeLine: (text: string) => void;
    writeErrorLine: (text: string) => void;
    close: () => void;
}

export function createOutputWriter(
    stdoutRedirect?: string,
    stderrRedirect?: string
): OutputWriter {
    const stdoutFd = stdoutRedirect ? fs.openSync(stdoutRedirect, "w"): undefined;
    const stderrFd = stderrRedirect ? fs.openSync(stderrRedirect, "w"): undefined;

    return {
        stderr: stderrFd ?? "inherit",
        stdout: stdoutFd ?? "inherit",

        writeLine: (text: string) => {
            if (stdoutFd !== undefined){
                fs.writeSync(stdoutFd, `${text}\n`);
            } else {
                console.error(text);
            }
        },

        writeErrorLine: (text: string) => {
            if (stderrFd !== undefined){
                fs.writeSync(stderrFd, `${text}\n`);
            } else {
                console.error(text);
            }
        },
    
        close: () => {
            if (stdoutFd !== undefined) {
                fs.closeSync(stdoutFd);
            }

            if (stderrFd !== undefined) {
                fs.closeSync(stderrFd);
            }
        },
    };
}