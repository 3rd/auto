/* eslint-disable no-await-in-loop */
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { cli as cleye } from "cleye";
import chalk from "chalk";
import envPaths from "env-paths";
import fs from "fs-extra";
import spawn from "cross-spawn";
import { globSync } from "glob";

import packageJson from "../package.json";
import * as prompt from "./utils/prompt";
import { tildify } from "./utils/path";
import Project from "./Project";
import { createListCommand } from "./commands/list";
import { createRunCommand } from "./commands/run";
import { createReplCommand } from "./commands/repl";
import { autoSymbol, AutoReturnType } from "./types";

const main = async () => {
  const isParentProcess = typeof process.send !== "function";

  // main repo
  const developmentRepositoryPath = resolve(dirname(fileURLToPath(import.meta.url)), "..", "examples");
  const configRepositoryPath = envPaths("auto", { suffix: "" }).config;
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
    console.log(`- Create a directory at: ${chalk.magenta("./auto")} or ${chalk.magenta("./.auto")}`);
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
    const autoLoaderPath = resolve(dirname(fileURLToPath(import.meta.url)), "loader.mjs");

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
          const pathToDistGlobals = resolve(dirname(fileURLToPath(import.meta.url)), "..", "dist", "globals");
          await fs.writeFile(
            tsconfigPath,
            JSON.stringify(
              {
                compilerOptions: {
                  strict: true,
                  lib: [],
                  jsx: "react-jsx",
                  baseUrl: ".",
                  typeRoots: [pathToDistGlobals],
                  paths: {
                    auto: [pathToDistGlobals],
                  },
                },
              },
              null,
              2
            )
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

    const childProcess = spawn(process.execPath, ["--loader", esmLoaderPath, "--loader", autoLoaderPath, ...argv], {
      stdio: ["inherit", "inherit", "inherit", "ipc"],
      env: {
        ...process.env,
        NODE_OPTIONS: ["--experimental-specifier-resolution=node", "--no-warnings=ExperimentalWarning"].join(" "),
      },
    });
    childProcess.on("close", (code) => process.exit(code!));
    return;
  }

  const scriptMap: Record<string, AutoReturnType> = {};

  const files = repositoryPaths.flatMap((repositoryPath) =>
    globSync(`${repositoryPath}/**/*.ts`).map((path) => ({ repositoryPath, path }))
  );
  const importedModules = await Promise.all(
    files.map(async (file) => {
      try {
        return { file, module: await import(file.path) };
      } catch {
        // console.log(chalk.red("Skipped:"), "Loading error:", chalk.magenta(file.path));
        // console.error(error);
        return null;
      }
    })
  );
  const modules = importedModules.filter(Boolean) as { file: typeof files[0]; module: { default?: AutoReturnType } }[];

  for (const { file, module } of modules) {
    if (!file || !module) continue;

    if (module.default?.[autoSymbol]) {
      const { repositoryPath, path } = file;
      const isLocal = repositoryPath === localRepositoryPath;
      const script: AutoReturnType = { ...module.default, path, isLocal };

      const previousScript = scriptMap[script.id];
      if (
        (previousScript?.isLocal && script.isLocal) ||
        (previousScript && !previousScript.isLocal && !script.isLocal)
      ) {
        console.error(chalk.red("Fatal:"), "Duplicate script:", chalk.magenta(script.id));
        console.log(chalk.grey("-"), "First found at:", chalk.magenta(tildify(previousScript.path)));
        console.log(chalk.grey("-"), "Second found at:", chalk.magenta(tildify(path)));
        process.exit(1);
      }

      scriptMap[script.id] = script;
      // console.log(chalk.green("Success:"), "Loaded:", chalk.magenta(path));
    } else {
      // console.log(chalk.yellow("Skipped:"), "Not a module:", chalk.magenta(file.path));
    }
  }

  const project = Project.resolveFromDirectory(process.cwd());
  const scripts = Object.values(scriptMap);

  const cli = cleye({
    name: "auto",
    version: packageJson.version,
    commands: [
      createListCommand(project, scripts),
      createRunCommand(project, scripts),
      createReplCommand(project, scripts),
    ],
  });
  if (!cli.command) cli.showHelp();
};

main();
