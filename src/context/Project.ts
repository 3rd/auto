import fs from "fs-extra";

type Dependency = {
  name: string;
  version?: string;
};

class Project {
  rootDirectory: string;

  constructor(rootDirectory: string) {
    this.rootDirectory = rootDirectory;
  }

  hasPath(path: string) {
    return fs.existsSync(`${this.rootDirectory}/${path}`);
  }

  hasFile(path: string) {
    return this.hasPath(path) && fs.lstatSync(`${this.rootDirectory}/${path}`).isFile();
  }

  hasDirectory(path: string) {
    return this.hasPath(path) && fs.lstatSync(`${this.rootDirectory}/${path}`).isDirectory();
  }

  readFile(path: string) {
    return fs.readFileSync(`${this.rootDirectory}/${path}`, "utf8");
  }

  readJSON(path: string) {
    return fs.readJsonSync(`${this.rootDirectory}/${path}`);
  }

  writeFile(path: string, content: string) {
    const fullPath = `${this.rootDirectory}/${path}`;
    console.log("Writing file (full): ", fullPath);
    if (fs.existsSync(fullPath)) {
      throw new Error(`File already exists: ${fullPath}`);
    }
    fs.writeFileSync(fullPath, content);
  }

  createDirectory(path: string) {
    const fullPath = `${this.rootDirectory}/${path}`;
    if (fs.existsSync(fullPath)) {
      throw new Error(`Directory already exists: ${fullPath}`);
    }
    fs.mkdirSync(fullPath);
  }

  resolvePath(path: string) {
    return `${this.rootDirectory}/${path}`;
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

  get isReactProject() {
    return this.isJavaScriptProject && this.hasDependency("react");
  }

  get isVueProject() {
    return this.isJavaScriptProject && this.hasDependency("vue");
  }

  get isSvelteProject() {
    return this.isJavaScriptProject && this.hasDependency("svelte");
  }

  get isGoProject() {
    return this.hasFile("go.mod");
  }

  get dependencies() {
    const dependencies: Dependency[] = [];
    if (this.isJavaScriptProject) {
      const packageJson = this.readJSON("package.json");
      for (const [name, version] of Object.entries({
        ...(packageJson.dependencies ?? {}),
        ...(packageJson.devDependencies ?? {}),
      })) {
        dependencies.push({ name, version: typeof version === "string" ? version : undefined });
      }
    }
    if (this.isGoProject) {
      const goMod = this.readFile("go.mod");
      const requireLines = goMod.match(/require \(([\s\S]*?)\)/)?.[1];
      if (requireLines) {
        for (const module of requireLines.trim().split("\n")) {
          const [name, version] = module.trim().split(" ");
          dependencies.push({ name, version });
        }
      }
    }
    return dependencies;
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
