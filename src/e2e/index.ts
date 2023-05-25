import { resolve } from "node:path";
import fs from "fs-extra";
import { setupTSConfig } from "../setup";
import { getGlobalRepositoryPath } from "../utils/path";
import assert from "node:assert";

// global setup
const globalRepositoryPath = getGlobalRepositoryPath();
await fs.mkdirp(globalRepositoryPath);
await fs.copy("./examples", globalRepositoryPath);
const tsConfigPath = resolve(globalRepositoryPath, "tsconfig.json");
setupTSConfig(tsConfigPath);

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
