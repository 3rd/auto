import fs from "fs-extra";
import { resolve } from "node:path";
import chalk from "chalk";
import { resolveProjectRoot } from "./utils/path";

type Dependency = {
  name: string;
  version?: string;
};

class Project {
  rootDirectory: string;

  constructor(rootDirectory: string) {
    this.rootDirectory = rootDirectory;
  }

  static resolveFromPath(path: string = process.cwd()) {
    return new Project(resolveProjectRoot(path));
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
        ...(packageJson.dependencies ?? []),
        ...(packageJson.devDependencies ?? []),
        ...(packageJson.peerDependencies ?? []),
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

  hasPath(...paths: string[]) {
    return fs.existsSync(this.resolvePath(...paths));
  }

  hasFile(...paths: string[]) {
    return this.hasPath(...paths) && fs.lstatSync(this.resolvePath(...paths)).isFile();
  }

  readFile(...path: string[]) {
    return fs.readFileSync(this.resolvePath(...path), "utf8");
  }

  writeFile(path: string, content: string, overwrite = false) {
    const resolvedPath = this.resolvePath(path);
    console.log(chalk.blue("Writing file:"), resolvedPath);
    if (!overwrite && fs.existsSync(resolvedPath)) {
      throw new Error(`File already exists: ${resolvedPath}`);
    }

    fs.outputFileSync(resolvedPath, content);
  }

  hasDirectory(path: string) {
    return this.hasPath(path) && fs.lstatSync(this.resolvePath(path)).isDirectory();
  }

  createDirectory(path: string) {
    const resolvedPath = this.resolvePath(path);
    console.log(chalk.blue("Creating directory:"), resolvedPath);
    if (fs.existsSync(resolvedPath)) throw new Error(`Directory already exists: ${resolvedPath}`);

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

export { Project };
