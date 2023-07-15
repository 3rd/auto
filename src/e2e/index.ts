/* eslint-disable no-await-in-loop */
/* eslint-disable unicorn/no-await-expression-member */
import { resolve } from "node:path";
import fs from "fs-extra";
import assert from "node:assert";
import { setupTSConfig } from "../setup";
import { getGlobalRepositoryPath } from "../utils/path";
import { commands as commandTests } from "./commands";
import * as exampleTests from "./examples";
import { generateMockProject } from "./utils";

type Test = {
  name?: string;
  run: (cwd: string) => Promise<{
    stdout?: string;
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  } | void>;
  project?: Record<string, string>;
  prepare?: (cwd: string) => Promise<void>; // cwd is the mocked project cwd if present, or the current pwd
  expected: {
    stdout?: string | ((args: { cwd?: string }) => string);
    files?: Record<string, string | ((v: string) => string)>;
  };
};

// global setup
const globalRepositoryPath = getGlobalRepositoryPath();
console.log(`Setting up global repository at: ${globalRepositoryPath}`);
await fs.mkdirp(globalRepositoryPath);
await fs.copy("./examples", globalRepositoryPath);
const tsConfigPath = resolve(globalRepositoryPath, "tsconfig.json");
await setupTSConfig(tsConfigPath);

// generate tsconfig
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

const tests = { ...commandTests, ...exampleTests };
for (const [name, test] of Object.entries(tests)) {
  let cwd = process.cwd();
  console.log(`Testing: ${test.name ?? name}`);
  if (test.project) {
    const projectPath = await generateMockProject(test.project);
    cwd = projectPath;
    console.log(`  - Generated mock project at: ${projectPath}`);
  }
  if (test.prepare) {
    await test.prepare(cwd);
  }
  const result = await test.run(cwd);
  if (test.expected.stdout) {
    if (!result?.stdout) throw new Error(`Test "${test.name ?? name}" doesn't provide stdout.`);
    const expectedStdout =
      typeof test.expected.stdout === "function" ? test.expected.stdout({ cwd }) : test.expected.stdout;
    assert.equal(result.stdout.trim(), expectedStdout.trim(), `Test "${test.name ?? name}" stdout is invalid.`);
  }
  if (test.expected.files) {
    for (const [path, expectedContent] of Object.entries(test.expected.files)) {
      const filePath = resolve(cwd, path);
      const actualContent = await fs.readFile(filePath, "utf8");
      assert.equal(
        actualContent.trim(),
        (typeof expectedContent === "function" ? expectedContent(actualContent).trim() : expectedContent).trim(),
        `Test "${test.name ?? name}" file ${path} is invalid.`
      );
    }
  }
}

export type { Test };
