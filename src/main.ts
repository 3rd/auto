/* eslint-disable no-await-in-loop */
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import repl from "node:repl";

import { cli as cleye, command } from "cleye";
import chalk from "chalk";
import envPaths from "env-paths";
import fs from "fs-extra";
import spawn from "cross-spawn";
import { globSync } from "glob";

import packageJson from "../package.json";
import * as prompt from "./utils/prompt";
import { tildify } from "./utils/path";
import { autoSymbol, AutoReturnType } from "./types";
import Project from "./context/Project";

const createListCommand = (project: Project, templates: AutoReturnType[]) =>
  command({ name: "list", alias: "ls", flags: { all: Boolean } }, (argv) => {
    const filteredTemplates = argv.flags.all ? templates : templates.filter((t) => !t.isValid || t.isValid(project));
    for (const template of filteredTemplates) {
      console.log(
        chalk.grey("-"),
        chalk.magenta(`<${template.id}>`),
        chalk.cyan(template.title ?? ""),
        template.isLocal ? chalk.blue("(local)") : chalk.yellow("(main)")
      );
    }
  });

const createRunCommand = (project: Project, templates: AutoReturnType[]) =>
  command({ name: "run", alias: "r", parameters: ["<generator id>"] }, async (argv) => {
    const { generatorId } = argv._;
    const template = templates.find((t) => t.id === generatorId);

    if (!template) {
      console.error(chalk.red(`Error: Template "%s" not found.`), generatorId);
      process.exit(1);
    }
    if (template.isValid && !template.isValid(project)) {
      console.error(chalk.red(`Error: Template "%s" is not valid for this context.`), generatorId);
      process.exit(1);
    }

    console.log(chalk.blue("Info:"), "Running", chalk.magenta(tildify(template.path)));

    // gather params
    const templateParams = template.bootstrapParams();
    for (const [_, param] of Object.entries(templateParams)) {
      // dynamic default values
      if (typeof param.defaultValue === "function") {
        const value = param.defaultValue({
          project,
          params: Object.fromEntries(
            Object.entries(templateParams).map(([key, currentParam]) => {
              return [key, currentParam.value];
            })
          ),
        });
        if (value !== undefined) param.value = value;
      }

      // eslint-disable-next-line default-case
      switch (param.type) {
        case "boolean": {
          param.value = await prompt.confirm(param.title, param.value as boolean);
          break;
        }
        case "number": {
          param.value = await prompt.number(param.title, param.value as number);
          break;
        }
        case "string": {
          param.value = await prompt.string(param.title, param.value as string);
          if (param.required && param.value === "") {
            console.error(chalk.red(`Error: Parameter "%s" is required.`), param.title);
            process.exit(1);
          }
          break;
        }
      }
    }
    const paramValues = Object.fromEntries(
      Object.entries(templateParams).map(([key, param]) => {
        return [key, param.value];
      })
    );

    const t = (text: string, params: Record<string, string | number | boolean> = paramValues) => {
      let result = text;
      for (const [key, value] of Object.entries(params)) {
        result = result.replace(new RegExp(`__${key}__`, "g"), String(value));
      }
      return result;
    };

    // collect template files
    const templateDir = dirname(template.path);
    const files = globSync("**/*", { cwd: templateDir, dot: true, nodir: true, ignore: template.path }).map((path) => {
      return {
        path,
        get content() {
          return fs.readFileSync(resolve(templateDir, path), "utf-8");
        },
      };
    });

    // run the template
    template.run({
      cwd: process.cwd(),
      project: Project.resolveFromDirectory(process.cwd()),
      self: template,
      params: paramValues as Parameters<typeof template.run>[0]["params"],
      files,
      get fileMap() {
        return new Proxy(
          {},
          {
            get(_, path) {
              if (typeof path !== "string") throw new Error("Invalid path.");
              if (!fs.existsSync(resolve(templateDir, path))) throw new Error(`File "${path}" not found.`);
              return fs.readFileSync(resolve(templateDir, path as string), "utf-8");
            },
          }
        );
      },
      t,
    });
  });

const createReplCommand = (project: Project, templates: AutoReturnType[]) =>
  command({ name: "repl" }, async () => {
    (global as any).project = project;
    (global as any).templates = templates;
    const r = repl.start({
      prompt: chalk.greenBright("> "),
      useGlobal: true,
      terminal: true,
    });
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    r.setupHistory(resolve(envPaths(packageJson.name, { suffix: "" }).cache, "history"), () => {});
  });

const main = async () => {
  const isParentProcess = typeof process.send !== "function";

  // main repo
  const developmentRepositoryPath = resolve(dirname(fileURLToPath(import.meta.url)), "..", "examples");
  const configRepositoryPath = envPaths(packageJson.name, { suffix: "" }).config;
  const envRepositoryPath = process.env.AUTO_REPO;
  let mainRepositoryPath = fs.existsSync(developmentRepositoryPath)
    ? developmentRepositoryPath
    : envRepositoryPath ?? configRepositoryPath;
  const hasMainRepository = fs.existsSync(mainRepositoryPath);
  if (hasMainRepository && isParentProcess) {
    console.log(chalk.blue("Info:"), "Using main repository:", chalk.magenta(tildify(mainRepositoryPath)));
  }

  // local repo
  const localRepositoryPaths = ["./auto", "./.auto"].map((p) => resolve(process.cwd(), p));
  const localRepositoryPath = localRepositoryPaths.find((p) => fs.existsSync(p));
  if (localRepositoryPath && isParentProcess) {
    console.log(chalk.blue("Info:"), "Using local repository:", chalk.magenta(tildify(localRepositoryPath)));
  }

  // resolve repos
  const repositoryPaths: string[] = [];
  if (hasMainRepository) repositoryPaths.push(mainRepositoryPath);
  if (localRepositoryPath) repositoryPaths.push(localRepositoryPath);

  // no repo found
  if (repositoryPaths.length === 0) {
    console.error(chalk.red("Error:"), "Cannot resolve repository directory, to fix this either:");
    console.log(`- Create a directory at: ${chalk.magenta(tildify(configRepositoryPath))}`);
    console.log(`- Or set the ${chalk.cyan("$AUTO_REPO")} environment variable.`);

    // auto-create main repo (~/.config/auto)
    const ok = await prompt.confirm(
      `Do you want me to create a directory at ${chalk.magenta(tildify(configRepositoryPath))}?`
    );
    if (ok) {
      await fs.mkdirp(configRepositoryPath);
      console.log(chalk.green("Success:"), "Created directory at", chalk.magenta(tildify(configRepositoryPath)));
      mainRepositoryPath = configRepositoryPath;
    } else {
      process.exit(1);
    }
  }

  if (isParentProcess) {
    const argv = process.argv.slice(1);
    const esmLoaderPath = require.resolve("tsx");

    // auto-setup repo/tsconfig.json
    for (const repoPath of repositoryPaths) {
      const tsconfigPath = resolve(repoPath, "tsconfig.json");
      if (!fs.existsSync(tsconfigPath)) {
        console.log(
          chalk.yellow.bold("Warning:"),
          "Cannot find",
          // eslint-disable-next-line sonarjs/no-nested-template-literals
          `${chalk.magenta(`${tildify(repoPath)}/`)}${chalk.cyan("tsconfig.json")}`
        );

        const ok = await prompt.confirm("Do you want me to set it up?");
        if (ok) {
          const pathToDist = resolve(dirname(fileURLToPath(import.meta.url)), "..", "dist");
          await fs.writeFile(
            tsconfigPath,
            JSON.stringify({ compilerOptions: { strict: true, lib: [], typeRoots: [pathToDist] } }, null, 2)
          );
          console.log(
            chalk.green("Success:"),
            "Wrote",
            chalk.cyan("tsconfig.json"),
            "to",
            chalk.magenta(tildify(tsconfigPath))
          );
        }
      }
    }

    const childProcess = spawn(process.execPath, ["--loader", esmLoaderPath, ...argv], {
      stdio: ["inherit", "inherit", "inherit", "ipc"],
      env: {
        ...process.env,
        NODE_OPTIONS: ["--experimental-specifier-resolution=node", "--no-warnings=ExperimentalWarning"].join(" "),
      },
    });
    childProcess.on("close", (code) => process.exit(code!));
    return;
  }

  const templateMap: Record<string, AutoReturnType> = {};

  const files = repositoryPaths.flatMap((repositoryPath) =>
    globSync(`${repositoryPath}/**/*.ts`).map((path) => ({ repositoryPath, path }))
  );
  const importedModules = await Promise.all(
    files.map(async (file) => {
      try {
        return { file, module: await import(file.path) };
      } catch {
        // console.log(chalk.red("Skipped:"), "Loading error:", chalk.magenta(file.path));
        return null;
      }
    })
  );
  const modules = importedModules.filter(Boolean) as { file: typeof files[0]; module: { default: AutoReturnType } }[];

  for (const { file, module } of modules) {
    if (!file || !module) continue;

    if (module.default[autoSymbol]) {
      const { repositoryPath, path } = file;
      const isLocal = repositoryPath === localRepositoryPath;
      const template: AutoReturnType = { ...module.default, path, isLocal };

      const previousTemplate = templateMap[template.id];
      if (
        (previousTemplate?.isLocal && template.isLocal) ||
        (previousTemplate && !previousTemplate.isLocal && !template.isLocal)
      ) {
        console.error(chalk.red("Fatal:"), "Duplicate template:", chalk.magenta(template.id));
        console.log(chalk.grey("-"), "First found at:", chalk.magenta(tildify(previousTemplate.path)));
        console.log(chalk.grey("-"), "Second found at:", chalk.magenta(tildify(path)));
        process.exit(1);
      }

      templateMap[template.id] = template;
      // console.log(chalk.green("Success:"), "Loaded:", chalk.magenta(path));
    } else {
      // console.log(chalk.yellow("Skipped:"), "Not a module:", chalk.magenta(file.path));
    }
  }

  const project = Project.resolveFromDirectory(process.cwd());
  const templates = Object.values(templateMap);

  const cli = cleye({
    name: packageJson.name,
    version: packageJson.version,
    commands: [
      createListCommand(project, templates),
      createRunCommand(project, templates),
      createReplCommand(project, templates),
    ],
  });
  if (!cli.command) cli.showHelp();
};

main();
