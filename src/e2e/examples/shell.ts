import { execa } from "execa";
import type { Test } from "../index";

export const shell: Test = {
  run: async (cwd) => {
    const { stdout } = await execa("auto", ["run", "shell"], { cwd });

    return { stdout };
  },
  expected: {
    stdout: `
Info: Using main repository: ~/.config/auto
Info: Running ~/.config/auto/shell.ts
  "license": "MIT",
"Hello, root"
"1"
"2"
[ '"1"', '"2"' ]
0`,
  },
};
