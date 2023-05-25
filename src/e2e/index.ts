/* eslint-disable unicorn/no-await-expression-member */
import { resolve } from "node:path";
import fs from "fs-extra";
import { setupTSConfig } from "../setup";
import { getGlobalRepositoryPath } from "../utils/path";
import assert from "node:assert";
import { $ } from "execa";

// global setup
const globalRepositoryPath = getGlobalRepositoryPath();
await fs.mkdirp(globalRepositoryPath);
await fs.copy("./examples", globalRepositoryPath);
const tsConfigPath = resolve(globalRepositoryPath, "tsconfig.json");
await setupTSConfig(tsConfigPath);

// generates tsconfig
assert(await fs.exists(tsConfigPath));
const tsConfig = await fs.readJson(tsConfigPath);
assert.deepEqual(
  tsConfig,
  {
    compilerOptions: {
      strict: true,
      lib: [],
      jsx: "react-jsx",
      baseUrl: ".",
      typeRoots: ["/root/source/dist/globals"],
      paths: {
        auto: ["/root/source/dist/globals"],
      },
    },
  },
  "Generated tsconfig.json is invalid."
);

// lists global scripts
let { stdout } = await $`auto ls`;
let expected = `
Info: Using main repository: ~/.config/auto
- <shell> Shell-like usage (main)
- <prompts> Auto prompts (main)
- <fetch> Fetch (main)
`;
assert.equal(stdout.trim(), expected.trim(), "Global script listing is invalid.");

// example: shell
stdout = (await $`auto run shell`).stdout;
expected = `
Info: Using main repository: ~/.config/auto
Info: Running ~/.config/auto/shell.ts
  "license": "MIT",
"Hello, root"
"1"
"2"
[ '"1"', '"2"' ]
0
`;
assert.equal(stdout.trim(), expected.trim(), "Example shell script failed.");
