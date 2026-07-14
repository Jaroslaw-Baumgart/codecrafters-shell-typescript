# TypeScript Shell

[![CodeCrafters progress](https://backend.codecrafters.io/progress/shell/db477fc1-c743-4e48-bbc9-60415b39afa2)](https://app.codecrafters.io/users/Jaroslaw-Baumgart?r=2qF)

A small Unix-like command shell implemented from scratch in TypeScript. The
project was created as part of the
[CodeCrafters "Build Your Own Shell" challenge](https://app.codecrafters.io/courses/shell/overview)
and then extended with a modular architecture, command completion, persistent
history, variables, pipelines, redirection, and background jobs.

The goal is educational: to explore how command-line input is tokenized,
parsed, expanded, and ultimately executed as a built-in command or child
process.

## Features

- Interactive REPL built on Node's readline API
- Lexer supporting single quotes, double quotes, and escaped characters
- Parser producing a typed command and pipeline AST
- External command lookup through `PATH`
- Built-ins: `cd`, `pwd`, `echo`, `exit`, `type`, `history`, `jobs`, `declare`, and `complete`
- Pipelines between built-in and external commands
- Standard output and error redirection with overwrite and append modes
- Background execution and basic job reporting
- Shell variables and environment-variable expansion
- Persistent command history through `HISTFILE`
- Filename, executable, built-in, and programmable completion
- Cross-platform executable lookup, including Windows `PATHEXT` support

## Architecture

Command processing is split into focused stages:

```text
User input
    |
    v
Lexer -> Tokens -> Parser -> AST -> Expansion -> Executor
                                                |       |
                                                |       +-> External process
                                                +----------> Built-in command
```

The source code is organized around these responsibilities:

```text
app/
|-- adapters/              Terminal integration
|-- core/
|   |-- completion/        Completion sources and specifications
|   |-- execution/         Built-ins, processes, pipelines, and redirects
|   |-- expansion/         Variable and word expansion
|   |-- history/           In-memory and persistent command history
|   |-- jobs/              Background job state and reporting
|   |-- lexer/             Input tokenization
|   |-- parser/            AST construction
|   |-- shell/             Shell lifecycle and shared context
|   `-- variables/         Shell variable storage
`-- main.ts                Application entry point
```

The core communicates with the terminal through small TypeScript interfaces.
Process execution and terminal behavior are kept outside the parsing logic,
which makes individual stages easier to understand and test independently.

## Requirements

- [Bun](https://bun.sh/) 1.3 or newer

## Running locally

Install dependencies:

```sh
bun install
```

Start the shell:

```sh
bun run dev
```

On a Unix-like system, the CodeCrafters launcher can also be used:

```sh
./your_program.sh
```

## Example session

```console
$ declare PROJECT=TypeScript
$ echo "Hello from $PROJECT"
Hello from TypeScript
$ echo "one two three" | wc -w
3
$ echo "first line" > output.txt
$ echo "second line" >> output.txt
$ type echo
echo is a shell builtin
$ sleep 2 &
[1] 12345
$ jobs
[1]+  Running                 sleep 2 &
```

Exact external commands and output may differ between operating systems.

## Design highlights

- Discriminated unions model lexer tokens, AST nodes, quote state, and job state.
- `Map` and `Set` provide explicit registries and deduplication for built-ins,
  jobs, variables, completion specifications, and executable names.
- Immutable public command models prevent execution stages from accidentally
  changing parsed and expanded input.
- Dependency injection at process and terminal boundaries keeps the shell core
  decoupled from Node-specific I/O.
- Source spans are retained through lexing and parsing to support useful syntax
  diagnostics.

## Known limitations

This project implements a deliberately selected subset of shell behavior and is
not intended to replace Bash, Zsh, or another POSIX shell. It does not currently
provide the complete POSIX grammar, command substitution, glob expansion, input
redirection, logical operators such as `&&` and `||`, or full process-group and
signal-based job control.

## CodeCrafters

The project follows the CodeCrafters shell challenge and can be submitted to
its remote test suite with:

```sh
codecrafters submit
```
