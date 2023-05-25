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
const { stdout } = await $`auto ls`;
const expectedGlobalScriptsOutput = `
Info: Using main repository: ~/.config/auto
- <shell> Shell-like usage (main)
- <prompts> Auto prompts (main)
- <fetch> Fetch (main)
`;
assert.ok(stdout.trim() === expectedGlobalScriptsOutput.trim(), "Global script listing is invalid.");
