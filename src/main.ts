/* eslint-disable no-await-in-loop */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import repl from "node:repl";

import { cli as cleye, command } from "cleye";
import chalk from "chalk";
import envPaths from "env-paths";
import fs from "fs-extra";
import spawn from "cross-spawn";
import { globSync } from "glob";

import Context from "./context/Context";
import packageJson from "../package.json";
import * as prompt from "./utils/prompt";
import { tildify } from "./utils/path";
import { autoSymbol, AutoType } from "./types";

const createListCommand = (context: Context, templates: ReturnType<AutoType>[]) =>
  command({ name: "list", alias: "ls", flags: { all: Boolean } }, (argv) => {
    const filteredTemplates = argv.flags.all
      ? templates
      : templates.filter((t) => !t.isValidForContext || t.isValidForContext(context));
    for (const template of filteredTemplates) {
      console.log(
        chalk.grey("-"),
        chalk.magenta(`<${template.id}>`),
        chalk.cyan(template.title ?? ""),
        template.isLocal ? chalk.blue("(local)") : chalk.yellow("(main)")
      );
    }
  });

const createRunCommand = (context: Context, templates: ReturnType<AutoType>[]) =>
  command({ name: "run", alias: "r", parameters: ["<generator id>"] }, async (argv) => {
    const { generatorId } = argv._;
    const template = templates.find((t) => t.id === generatorId);

    if (!template) {
      console.error(chalk.red(`Error: Template "%s" not found.`), generatorId);
      process.exit(1);
    }
    if (template.isValidForContext && !template.isValidForContext(context)) {
      console.error(chalk.red(`Error: Template "%s" is not valid for this context.`), generatorId);
      process.exit(1);
    }

    console.log(chalk.blue("Info:"), "Running", chalk.magenta(tildify(template.path)));

    const templateParams = template.bootstrapParams();
    for (const [_, param] of Object.entries(templateParams)) {
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
          break;
        }
      }
    }

    const paramValues = Object.fromEntries(Object.entries(templateParams).map(([key, param]) => [key, param.value]));

    template.run({
      context,
      self: template,
      params: paramValues as Parameters<typeof template.run>[0]["params"],
    });
  });

const createReplCommand = (context: Context, templates: ReturnType<AutoType>[]) =>
  command({ name: "repl" }, async () => {
    (global as any).context = context;
    (global as any).templates = templates;
    repl.start({
      prompt: chalk.greenBright("> "),
      useGlobal: true,
      terminal: false,
    });
  });

const main = async () => {
  // main repos
  const developmentRepositoryPath = resolve(dirname(fileURLToPath(import.meta.url)), "..", "templates");
  const configRepositoryPath = envPaths(packageJson.name, { suffix: "" }).config;
  const envRepositoryPath = process.env.REPO;
  let mainRepositoryPath = fs.existsSync(developmentRepositoryPath)
    ? developmentRepositoryPath
    : envRepositoryPath ?? configRepositoryPath;
  const hasMainRepository = fs.existsSync(mainRepositoryPath);
  if (hasMainRepository) {
    console.log(chalk.blue("Info:"), "Found main repository:", chalk.magenta(tildify(mainRepositoryPath)));
  }

  // local repos
  const localRepositoryPaths = ["./auto", "./.auto"].map((p) => resolve(process.cwd(), p));
  const localRepositoryPath = localRepositoryPaths.find((p) => fs.existsSync(p));
  const hasLocalRepository = Boolean(localRepositoryPath);
  if (localRepositoryPath) {
    console.log(chalk.blue("Info:"), "Found local repository:", chalk.magenta(tildify(localRepositoryPath)));
  }

  // resolve repos
  const repositoryPaths: string[] = [];
  if (hasMainRepository) repositoryPaths.push(mainRepositoryPath);
  if (localRepositoryPath) repositoryPaths.push(localRepositoryPath);

  // no repo found
  if (!hasMainRepository && !hasLocalRepository) {
    console.error(chalk.red("Error:"), "Cannot resolve repository directory, to fix this either:");
    console.log(`- Create a directory at: ${chalk.magenta(tildify(configRepositoryPath))}`);
    console.log(`- Or set the ${chalk.cyan("$REPO")} environment variable.`);

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

  if (typeof process.send !== "function") {
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

  const templateMap: Record<string, ReturnType<AutoType>> = {};

  const files = repositoryPaths.flatMap((repositoryPath) =>
    globSync(`${repositoryPath}/**/*.ts`).map((path) => ({ repositoryPath, path }))
  );
  const importedModules = (await Promise.all(
    files
      .map(async (file) => {
        try {
          return { file, module: await import(file.path) };
        } catch {
          console.log(chalk.red("Skipped:"), "Loading error:", chalk.magenta(file.path));
          return null;
        }
      })
      .filter(Boolean)
  )) as Array<{ file: typeof files[0]; module: any }>;

  for (const { file, module } of importedModules) {
    if (!file || !module) continue;

    if (module.default[autoSymbol]) {
      const { repositoryPath, path } = file;
      const isLocal = repositoryPath === localRepositoryPath;
      const template: ReturnType<AutoType> = { ...module.default, path, isLocal };

      const previousTemplate = templateMap[template.id];
      if (
        (previousTemplate?.isLocal && template.isLocal) ||
        (previousTemplate && !previousTemplate.isLocal && !template.isLocal)
      ) {
        console.error(chalk.red("Fatal:"), "Duplicate template:", chalk.magenta(template.id));
        console.log(chalk.grey("-"), "First found at:", chalk.magenta(tildify(previousTemplate.path)));
        console.log(chalk.grey("-"), "Second found at:", chalk.magenta(tildify(file.path)));
        process.exit(1);
      }

      templateMap[template.id] = template;
      console.log(chalk.green("Success:"), "Loaded:", chalk.magenta(file.path));
    } else {
      console.log(chalk.yellow("Skipped:"), "Not a module:", chalk.magenta(file.path));
    }
  }

  const context = new Context();
  const templates = Object.values(templateMap);

  const cli = cleye({
    name: packageJson.name,
    version: packageJson.version,
    commands: [
      createListCommand(context, templates),
      createRunCommand(context, templates),
      createReplCommand(context, templates),
    ],
  });
  if (!cli.command) cli.showHelp();
};

main();
