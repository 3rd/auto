# ![Logo](https://github.com/3rd/auto/assets/59587503/301898ff-8e00-4d53-b250-d710d380c42e) Auto

[![NPM version](https://badgers.space/npm/version/@andrei.fyi/auto)](https://www.npmjs.com/package/@andrei.fyi/auto)
[![License](https://badgers.space/github/license/3rd/auto)](https://github.com/3rd/auto/blob/master/LICENSE)
![Contributions welcome](https://honey.badgers.space/badge/contributions/welcome/blue)

**<ins>Auto</ins>** is a **TypeScript-powered command-line automation tool**.
\
Write and execute _global_ and _project-local_ scripts.

It's kind of like [zx](https://github.com/google/zx), but:

- <ins>TypeScript-focused</ins>
- Scripts are organized in <ins>repositories</ins> (no shebangs)
- With many goodies

![auto](https://github.com/3rd/auto/assets/59587503/5bc46d72-9372-4a2f-b286-2716e9062c3f)

Use Auto to:

- Generate files and projects
- Create interactive scripts
- Create context-aware automations

External resources:

- [Generating React Components with Auto - andrei.fyi](https://andrei.fyi/blog/auto-generating-react-components)

<br/>

## Features

- **TypeScript-powered**: Write scripts with TypeScript and enjoy full type-checking support.
- **Global and local scripts**: Share scripts between projects or define project-specific scripts.
- **Script parameters**: Auto turns script parameters into interactive prompts.
- **Script validation & filtering**: Control the conditions for which a script is valid.
- **Global utilities and helpers**: Auto injects several useful packages and custom helpers as globals.
- **Context awareness**: Auto collects information about the project you're currently in.
- **Auto-config**: Prompts to create a script repo and auto-configure `tsconfig.json`.
- **REPL**: Useful REPL to explore the execution context, available globals, and scripts.

## Installation

Auto is published on NPM as [@andrei.fyi/auto](https://www.npmjs.com/package/@andrei.fyi/auto).
\
If you want to get the standalone experience, with global script support, you should install it globally.
\
If you only want to use it inside a project, you should install it locally.

```sh
# install Auto globally
npm install -g @andrei.fyi/auto # or pnpm, yarn, or your favourite tool

# install Auto locally (and add a "auto run [script-id]" script in package.json)
npm install -D @andrei.fyi/auto
```

## CLI Usage

You can interact with Auto's CLI by running `auto` in your terminal:

- **`auto ls`** - list the available scripts for the current context
- **`auto run <script-id>`** - run a script by `id`
- **`auto repl`** - enter the REPL

## Getting started (project)

This is a quick guide of how to setup Auto in your project:

1. Install Auto as a development dependency.

   ```sh
   npm install -D @andrei.fyi/auto
   ```

2. Create an `auto` or `.auto` directory inside the project root.
3. Run `auto ls` and allow Auto to auto-configure `./auto/tsconfig.json`.
4. Create a script file `./auto/hello.ts`

   ```ts
   import "auto";

   export default auto({
     id: "hello",
     title: "Say Hello",
     run() {
       console.log("Hello from an Auto script!");
     },
   });
   ```

5. Run `auto ls` inside your project and notice how your script is listed.
6. Run `auto run hello` to execute the script.

## Script resolution

When Auto runs, it first tries to find your scripts.

First it looks for a global script repository, a directory located at:

- `~/.config/auto` on Linux
- `~/Library/Preferences/auto` on macOS
- `%APPDATA%\auto\Config` on Windows _(why are you doing this to yourself?)_

Second, it tries to resolve the root of the project you may be in, based on your `cwd`.
\
To do this, it scans up the file tree until it finds a _project marker_ pattern, or reaches the root.
\
If there's no match, the current directory is considered the project root.
\
Currently the patterns it looks for are:
[`package.json`, `go.mod`, `Makefile`, `.git`]

Third, it looks for a local script repository, which is an `auto` or `.auto` directory, in the project root.

Fourth it loads all Auto scripts from both your global and local repositories.
\
If there is a local script that has the same `id` as a global script it overrides it.
\
If there are two scripts that share the same `id`, and the same locality, it panics.

## Auto scripts

> Check out the [examples](examples) library for reference.

Auto scripts are TypeScript modules that have their `default` export the result of an `auto(...)` call.
\
The `auto(...)` function is injected at runtime by `import "auto"`, which also imports the global types.
\
Both the `import "auto"` and `export default auto(...)` are required for scripts to work.

This is the skeleton of an Auto script:

```ts
import "auto";

export default auto({
  id: "my-script",
  title: "My Script",
  params: {
    myParam: {
      title: "Component Name",
      type: "string", // "string" | "number" | "boolean"
      required: true,
      // defaultValue: ({ project, params }) => string|undefined
    },
  },
  // isValid: (project) => project.hasDependency("something"),
  run: async ({ cwd, project, params, files, self, t, files, fileMap }) => {
    //          ^ contextual variables and helpers
    // instructions
  },
});
```

To get a better understanding how it all ties together, you can look at the [type of a script](src/types.ts):

```ts
export type Script<P extends Record<string, ParamType>> = {
  id: string;
  title?: string;
  params?: Params<P>;
  isValid?: (project: Project) => boolean;
  run: (args: {
    cwd: string;
    fileMap: Record<string, string>;
    files: { path: string; content: string }[];
    params: { [K in keyof P]: ParamValueType<P[K]> };
    project: Project;
    self: Script<P>;
    t: (text: string, params?: Record<string, string | number | boolean>) => string;
  }) => void;
};
```

### Contextual variables and helpers

Your script's `run()` function is called with a dictionary that contains the following contextual variables and helpers:

- **`cwd: string`** - The directory you called `auto` from.
- **`fileMap: Proxy<{}>`** - proxied map that resolves the content of files, relative to the script file
  - For example, if your script is `special.ts`, and there is a directory `interests` next to it, and there's a file named `rule.txt` inside it, you can get its content by accessing `fileMap["interests/rule.txt"]`.
- **`files: { path, content }[]`** - the deeply-listed list of files inside the directory the current script is in.
  - Note: the current script file will not be included in `files`
- **`params: Record<key,value>`** - dictionary of your script's param keys and user-provided values.
- **`project: Project`** - The current `Project`, a small abstraction that provides some helpers:
  - **`Project.isGoProject`** - `true` in a Go project
  - **`Project.isTypeScriptProject`** - `true` in a TypeScript project
  - **`Project.isJavaScriptProject`** - `true` in a JavaScript project
  - **`Project.isNodeProject`** - `true` in a Node.js project (shallow, checks for `@types/node`)
  - **`Project.dependencies`** - `{ name, version }[]` of dependencies for Go and JS projects
  - **`Project.hasDependency(name, version?)`** - checks if the project has a dependency
  - **`Project.hasAnyDependency(names)`** - checks if the project has any of a list of dependencies (by name)
  - **`Project.resolvePath(...paths)`** - resolve a path relative to the project root
  - **`Project.hasPath(...paths)`** - resolve and check if a project-relative path exists
  - **`Project.hasFile(...paths)`** - resolve and check if a project-relative path is a file
  - **`Project.readFile(path)`** - read a project-relative file
  - **`Project.readJSON(path)`** - read a project-relative JSON file
  - **`Project.writeFile(path, content)`** - write a project-relative file
  - **`Project.hasDirectory(...paths)`** - resolve and check if a project-relative path is a directory
  - **`Project.createDirectory(path)`** - create a project-relative directory
- **`t(text, data?: { [key]: value })`** - helper string templating function that replaces `__key__` with the provided value
  - Note: If no data is provided, it uses the `params` dictionary.
- **`self: Script`** - the current script itself, useful for introspection ~~and meditation~~

### Globals

Auto injects many helpers into the [global scope](src/globals/index.ts).

**External helpers:**

- **`$`**, **`$$`**, **`execa`**, **`execaSync`** - process execution utilities provided by [execa](https://github.com/sindresorhus/execa)
- **`chalk`** - [chalk](https://github.com/chalk/chalk)
- **`fs`** - [fs-extra](https://github.com/jprichardson/node-fs-extra)
- **`glob`** - [glob](https://github.com/isaacs/node-glob)
- **`lodash`** - [lodash](https://github.com/lodash/lodash)
- **`which`** - [which](https://github.com/npm/node-which)
- **`inquirer`** - [@inquirer/prompts](https://github.com/SBoudrias/Inquirer.js/), also aliased to `prompt`

**Internal helpers:**

- **`sleep(milliseconds: number): Promise<void>`**
- shell-like helpers: **`cwd()`**, **`cd()`**, **`pwd`**

## Contributing

Contributions to the Auto project are welcome!
\
Whether it's a bug report, a new feature, or feedback on the project, I'd love to hear from you.
