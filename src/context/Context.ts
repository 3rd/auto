import { resolve } from "node:path/posix";
import { findUpSync } from "find-up";
import Project from "./Project";

const rootMatchingConfigurations = [
  { match: "package.json", type: "file" },
  { match: "go.mod", type: "file" },
  { match: "Makefile", type: "file" },
  { match: ".git", type: "directory" },
] as const;

class Context {
  currentWorkingDirectory: string;
  project: Project;

  constructor(currentWorkingDirectory: string = process.cwd()) {
    this.currentWorkingDirectory = currentWorkingDirectory;

    let rootDirectory = currentWorkingDirectory;
    for (const { match, type } of rootMatchingConfigurations) {
      const foundPath = findUpSync(match, { cwd: currentWorkingDirectory, type });
      if (foundPath) {
        rootDirectory = resolve(foundPath, "..");
        break;
      }
    }

    this.project = new Project(rootDirectory);
  }
}

export default Context;
