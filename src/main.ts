/* eslint-disable no-await-in-loop */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import repl from "node:repl";

import envPaths from "env-paths";
import chalk from "chalk";
import spawn from "cross-spawn";
import { cli as cleye, command } from "cleye";
import { globSync } from "glob";
import enquirer from "enquirer";
import fs from "fs-extra";

import packageJson from "../package.json";
import Context from "./context/Context";
import { autoSymbol, AutoType } from "./types";

const createListCommand = (context: Context, templates: ReturnType<AutoType>[]) =>
  command({ name: "list", alias: "ls", flags: { all: Boolean } }, (argv) => {
    const filteredTemplates = argv.flags.all
      ? templates
      : templates.filter((t) => !t.isValidForContext || t.isValidForContext(context));
    for (const template of filteredTemplates) {
      console.log(`[${template.id}] ${template.title}`);
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
    const templateParams = template.bootstrapParams();
    for (const [_, param] of Object.entries(templateParams)) {
      const type = param.type as unknown;
      if (type === "boolean") {
        const { value } = await enquirer.prompt<{ value: string }>({
          type: "confirm",
          name: "value",
          message: param.title,
          initial: param.value,
        });
        param.value = value;
      }
      if (type === "number") {
        const { value } = await enquirer.prompt<{ value: string }>({
          type: "numeral",
          name: "value",
          message: param.title,
          initial: param.value,
        });
        param.value = value;
      }
      if (type === "string") {
        const { value } = await enquirer.prompt<{ value: string }>({
          type: "input",
          name: "value",
          message: param.title,
          initial: param.value,
        });
        param.value = value;
      }
    }

    const paramValues = Object.fromEntries(Object.entries(templateParams).map(([key, param]) => [key, param.value]));

    console.log(chalk.magenta(`Running "%s"...`), template.id);
    template.generate({
      context,
      self: template,
      params: paramValues as Parameters<typeof template.generate>[0]["params"],
      substitute: (source, params: Partial<Parameters<typeof template.generate>[0]["params"]>) => {
        let result = source;
        for (const [key, value] of Object.entries(params)) {
          result = result.replace(new RegExp(`{{${key}}}`, "g"), value as string);
        }
        return result;
      },
    });
  });

const createReplCommand = (context: Context, templates: ReturnType<AutoType>[]) =>
  command({ name: "repl" }, async () => {
    (global as any).context = context;
    (global as any).templates = templates;
    repl.start({
      prompt: chalk.greenBright("> "),
      useGlobal: true,
    });
  });

const main = async () => {
  const developmentRepositoryPath = resolve(dirname(fileURLToPath(import.meta.url)), "..", "templates");
  const configRepositoryPath = envPaths(packageJson.name, { suffix: "" }).config;
  const envRepositoryPath = process.env.REPO;
  const repositoryPath = fs.existsSync(developmentRepositoryPath)
    ? developmentRepositoryPath
    : envRepositoryPath ?? configRepositoryPath;

  if (!fs.existsSync(repositoryPath)) {
    console.error(chalk.red("Error:"), "Cannot resolve repository directory, to fix this either:");
    console.log(`- Create a directory at: ${chalk.magenta(configRepositoryPath)}`);
    console.log(`- Or set the ${chalk.cyan("$REPO")} environment variable.`);

    // auto-create repo directory
    const { value: ok } = await enquirer.prompt<{ value: string }>({
      type: "confirm",
      name: "value",
      message: `Do you want me to create a directory at ${chalk.magenta(configRepositoryPath)}?`,
    });
    if (ok) {
      await fs.mkdirp(configRepositoryPath);
      console.log(chalk.green("Success:"), "Created directory at", chalk.magenta(configRepositoryPath));
    }
  }

  if (typeof process.send !== "function") {
    const argv = process.argv.slice(1);
    const esmLoaderPath = require.resolve("tsx");

    // auto-setup repo/tsconfig.json
    const tsconfigPath = resolve(repositoryPath, "tsconfig.json");
    if (!fs.existsSync(tsconfigPath)) {
      console.log(chalk.yellow.bold("Warning:"), "Cannot find", chalk.cyan("tsconfig.json"), "in your repository.");

      const { value: ok } = await enquirer.prompt<{ value: string }>({
        type: "confirm",
        name: "value",
        message: "Do you want me to set it up?",
      });
      if (ok) {
        const pathToDist = resolve(dirname(fileURLToPath(import.meta.url)), "..", "dist");
        await fs.writeFile(
          tsconfigPath,
          JSON.stringify({
            compilerOptions: {
              typeRoots: [pathToDist],
            },
          })
        );
        console.log(chalk.green("Success:"), "Wrote", chalk.cyan("tsconfig.json"), "to", chalk.magenta(tsconfigPath));
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

  const context = new Context();

  const templates: ReturnType<AutoType>[] = [];
  for (const file of globSync(`${repositoryPath}/**/*.ts`)) {
    try {
      const template = await import(file);
      if (!template.default[autoSymbol]) continue;
      templates.push(template.default);
    } catch {}
  }

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
