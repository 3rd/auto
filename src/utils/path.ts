import os from "node:os";
import envPaths from "env-paths";
import { findUpSync } from "find-up";
import { resolve } from "node:path";

const rootMatchingConfigurations = [
  { match: "package.json", type: "file" },
  { match: "go.mod", type: "file" },
  { match: "Makefile", type: "file" },
  { match: ".git", type: "directory" },
] as const;

const tildify = (path: string) => path.replace(os.homedir(), "~");

const getGlobalRepositoryPath = () => {
  return envPaths("auto", { suffix: "" }).config;
};

const resolveProjectRoot = (cwd: string) => {
  let root = cwd;
  for (const { match, type } of rootMatchingConfigurations) {
    const foundPath = findUpSync(match, { cwd: root, type });
    if (foundPath) {
      root = resolve(foundPath, "..");
      break;
    }
  }
  return root;
};

export { getGlobalRepositoryPath, resolveProjectRoot, tildify };
