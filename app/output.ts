import fs from "fs";


export interface OutputWriter {
    stdout: "inherit" | number;
    writeLine: (text: string) => void;
    close: () => void;
}

export function createOutputWriter(stdoutRedirect?: string): OutputWriter {
    if (!stdoutRedirect) {
        return {
            stdout: "inherit",
            writeLine: (text: string) =>{
                console.log(text);
            },
            close: () => {},
        };
    }

    const fd = fs.openSync(stdoutRedirect, "w");

    return {
        stdout: fd,
        writeLine: (text: string) => {
            fs.writeSync(fd, `${text}\n`);
        },
        close: () => {
            fs.closeSync(fd);
        },
    };
}