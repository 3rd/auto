import fs from "fs-extra";
import { resolve } from "node:path";
import { findUpSync } from "find-up";
import chalk from "chalk";

type Dependency = {
  name: string;
  version?: string;
};

const rootMatchingConfigurations = [
  { match: "package.json", type: "file" },
  { match: "go.mod", type: "file" },
  { match: "Makefile", type: "file" },
  { match: ".git", type: "directory" },
] as const;

class Project {
  rootDirectory: string;

  constructor(rootDirectory: string) {
    this.rootDirectory = rootDirectory;
  }

  static resolveFromDirectory(directory: string = process.cwd()) {
    let rootDirectory = directory;
    for (const { match, type } of rootMatchingConfigurations) {
      const foundPath = findUpSync(match, { cwd: rootDirectory, type });
      if (foundPath) {
        rootDirectory = resolve(foundPath, "..");
        break;
      }
    }
    return new Project(rootDirectory);
  }

  get isGoProject() {
    return this.hasFile("go.mod");
  }

  get isJavaScriptProject() {
    return this.hasFile("package.json");
  }

  get isTypeScriptProject() {
    return this.isJavaScriptProject && this.hasFile("tsconfig.json");
  }

  get isNodeProject() {
    if (!this.isJavaScriptProject) return false;
    if (this.hasDependency("@types/node")) return true;
    const packageJson = this.readJSON("package.json");
    return packageJson?.engines?.node !== undefined;
  }

  get dependencies() {
    const dependencies: Dependency[] = [];
    if (this.isJavaScriptProject) {
      const packageJson = this.readJSON("package.json");
      for (const [name, version] of Object.entries({
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      })) {
        dependencies.push({ name, version: typeof version === "string" ? version : undefined });
      }
    }
    if (this.isGoProject) {
      const goMod = this.readFile("go.mod");
      const requireLines = /require \(([\S\s]*?)\)/.exec(goMod)?.[1];
      if (requireLines) {
        for (const module of requireLines.trim().split("\n")) {
          const [name, version] = module.trim().split(" ");
          dependencies.push({ name, version });
        }
      }
    }
    return dependencies;
  }

  resolvePath(...paths: string[]) {
    return resolve(this.rootDirectory, ...paths);
  }

  hasPath(path: string) {
    return fs.existsSync(this.resolvePath(path));
  }

  hasFile(path: string) {
    return this.hasPath(path) && fs.lstatSync(this.resolvePath(path)).isFile();
  }

  readFile(path: string) {
    return fs.readFileSync(this.resolvePath(path), "utf8");
  }

  writeFile(path: string, content: string) {
    const resolvedPath = this.resolvePath(path);
    console.log(chalk.blue("Writing file:"), resolvedPath);
    if (fs.existsSync(resolvedPath)) {
      throw new Error(`File already exists: ${resolvedPath}`);
    }
    fs.writeFileSync(resolvedPath, content);
  }

  hasDirectory(path: string) {
    return this.hasPath(path) && fs.lstatSync(this.resolvePath(path)).isDirectory();
  }

  createDirectory(path: string) {
    const resolvedPath = this.resolvePath(path);
    console.log(chalk.blue("Creating directory:"), resolvedPath);
    if (fs.existsSync(resolvedPath)) {
      throw new Error(`Directory already exists: ${resolvedPath}`);
    }
    fs.mkdirSync(resolvedPath, { recursive: true });
  }

  readJSON(path: string) {
    return fs.readJsonSync(this.resolvePath(path));
  }

  hasDependency(name: string, version?: string) {
    return this.dependencies.some((dependency) => {
      if (dependency.name !== name) return false;
      if (version && dependency.version !== version) return false;
      return true;
    });
  }

  hasAnyDependency(names: string[]) {
    return this.dependencies.some((dependency) => names.includes(dependency.name));
  }
}

export default Project;
