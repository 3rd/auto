import { execa } from "execa";
import type { Test } from "../index";

export const list: Test = {
  name: "list.global",
  run: async (cwd) => {
    const { stdout } = await execa("auto", ["ls"], { cwd });

    return { stdout };
  },
  expected: {
    stdout: `
Info: Using main repository: ~/.config/auto
- <shell> Shell-like usage (main)
- <prompts> Auto prompts (main)
- <fetch> Fetch (main)
`,
  },
};
