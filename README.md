# TypeScript Shell

[![CodeCrafters progress](https://backend.codecrafters.io/progress/shell/db477fc1-c743-4e48-bbc9-60415b39afa2)](https://app.codecrafters.io/users/Jaroslaw-Baumgart?r=2qF)

A Unix-like command shell built from scratch in TypeScript. It turns raw command-line input into tokens and a typed abstract syntax tree, performs variable expansion, and executes built-in or external commands.

The project started as the [CodeCrafters "Build Your Own Shell" challenge](https://app.codecrafters.io/courses/shell/overview) and grew into a modular exploration of parsing, process execution, terminal I/O, and shell state management.

## Highlights

| Area | Supported behavior |
| --- | --- |
| Parsing | Quoted strings, escaped characters, pipelines, redirects, and background operators |
| Execution | Built-in commands, external programs discovered through `PATH`, and multi-stage pipelines |
| Redirection | Standard output and standard error with overwrite and append modes |
| Shell state | Variables, environment expansion, command history, and background jobs |
| Completion | Built-ins, executables, filenames, and programmable completers |
| Portability | Unix executable lookup and Windows `PATHEXT` support |

Built-in commands: `cd`, `pwd`, `echo`, `exit`, `type`, `history`, `jobs`, `declare`, and `complete`.

## Quick start

### Requirements

- [Bun](https://bun.sh/) 1.3 or newer

### Install and run

```sh
git clone https://github.com/Jaroslaw-Baumgart/codecrafters-shell-typescript.git
cd codecrafters-shell-typescript
bun install
bun run dev
```

On Unix-like systems, the included launcher is also available:

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

External commands and their output depend on the operating system.

## How it works

Each command passes through a focused processing pipeline:

```text
                    +-------------------+
                    |  Shell variables  |
                    |  and environment  |
                    +---------+---------+
                              |
                              v
Input -> Lexer -> Tokens -> Parser -> AST -> Expander -> Executor
                                                        |      |
                                                        |      +-> Built-in
                                                        |
                                                        +--------> Child process
```

- The **lexer** preserves quote and escape information while producing tokens with source spans.
- The **parser** builds a typed AST for commands, pipelines, redirects, and background execution.
- The **expander** resolves shell and environment variables without expanding single-quoted or escaped text.
- The **executor** routes commands to built-ins or child processes and connects pipeline stages and output streams.
- The **shell layer** owns the interactive lifecycle and coordinates history, completion, jobs, and shared context.

## Project structure

```text
app/
|-- adapters/              Node terminal integration
|-- core/
|   |-- completion/        Completion engine and candidate sources
|   |-- execution/         Built-ins, processes, pipelines, and redirects
|   |-- expansion/         Variable and word expansion
|   |-- history/           In-memory and persistent command history
|   |-- jobs/              Background job storage and reporting
|   |-- lexer/             Input tokenization and diagnostics
|   |-- parser/            AST definitions and construction
|   |-- shell/             Shell lifecycle and shared context
|   `-- variables/         Shell variable storage
`-- main.ts                Application entry point
```

The core depends on small TypeScript ports instead of terminal implementation details. This keeps parsing and execution concerns separate from Node-specific I/O and makes individual stages independently testable.

## Testing

Run the test suite with:

```sh
bun test
```

The tests currently cover lexer behavior and expansion rules, including quoting, escaping, empty arguments, environment variables, shell-variable precedence, pipelines, and redirects.

## Engineering decisions

- Discriminated unions model tokens, AST nodes, quote modes, redirects, and job states.
- Read-only command models protect parsed and expanded data from mutation during execution.
- `Map` and `Set` provide explicit registries for built-ins, jobs, variables, completion specifications, and executable names.
- Dependency injection at terminal and execution boundaries keeps the shell core decoupled from platform-specific I/O.
- Source spans flow through lexing and parsing to produce precise syntax diagnostics.
- The project uses strict TypeScript checks, including unused-symbol and implicit-return validation.

## Current scope

This shell intentionally implements a practical subset of shell behavior rather than the complete POSIX specification. It does not currently support:

- command substitution;
- glob expansion;
- input redirection;
- logical operators such as `&&` and `||`;
- full process-group and signal-based job control.

It is an educational implementation and should not be used as a replacement for Bash, Zsh, or another production shell.

## CodeCrafters

The project can be submitted to the CodeCrafters remote test suite with:

```sh
codecrafters submit
```
## Contact

- GitHub: [Jaroslaw-Baumgart](https://github.com/Jaroslaw-Baumgart)
- Email: [jaroslawbaumgart@gmail.com](mailto:jaroslawbaumgart@gmail.com)
