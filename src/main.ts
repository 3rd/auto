/* eslint-disable no-await-in-loop */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cli as cleye } from "cleye";
import chalk from "chalk";
import fs from "fs-extra";
import spawn from "cross-spawn";
import { globSync } from "glob";
import * as inquirer from "@inquirer/prompts";

import packageJson from "../package.json";
import { getGlobalRepositoryPath, resolveProjectRoot, tildify } from "./utils/path";
import * as log from "./utils/logger";
import { createListCommand } from "./commands/list";
import { createRunCommand } from "./commands/run";
import { createReplCommand } from "./commands/repl";
import { AutoReturnType, autoSymbol } from "./types";
import { setupPackage, setupTSConfig } from "./setup";
import { Project } from "./Project";

const main = async () => {
  log.debug("Starting auto...");
  const isParentProcess = typeof process.send !== "function";
  log.debug("Is parent process:", isParentProcess);

  // main repo
  const developmentRepositoryPath = resolve(dirname(fileURLToPath(import.meta.url)), "..", "examples");
  const globalRepositoryPath = getGlobalRepositoryPath();
  const envRepositoryPath = process.env.AUTO_REPO;
  log.debug("Repository paths:", {
    development: developmentRepositoryPath,
    global: globalRepositoryPath,
    env: envRepositoryPath,
  });

  let mainRepositoryPath =
    envRepositoryPath ??
    globalRepositoryPath ??
    (fs.existsSync(developmentRepositoryPath) ? developmentRepositoryPath : null);
  const hasMainRepository = fs.existsSync(mainRepositoryPath);
  log.debug("Selected main repository:", mainRepositoryPath);
  log.debug("Main repository exists:", hasMainRepository);

  if (hasMainRepository && isParentProcess) {
    console.log(chalk.blue("Info:"), "Using main repository:", chalk.magenta(tildify(mainRepositoryPath)));
  }

  // local repo
  const projectRoot = resolveProjectRoot(process.cwd());
  log.debug("Project root:", projectRoot);
  const localRepositoryPaths = ["./auto", "./.auto"].map((p) => resolve(projectRoot, p));
  log.debug("Checking local repository paths:", localRepositoryPaths);
  const localRepositoryPath = localRepositoryPaths.find((p) => fs.existsSync(p));
  log.debug("Local repository:", localRepositoryPath);

  if (localRepositoryPath && isParentProcess) {
    console.log(chalk.blue("Info:"), "Using local repository:", chalk.magenta(tildify(localRepositoryPath)));
  }

  // resolve repos
  const repositoryPaths: string[] = [];
  if (hasMainRepository) repositoryPaths.push(mainRepositoryPath);
  if (localRepositoryPath) repositoryPaths.push(localRepositoryPath);
  log.debug("Final repository paths:", repositoryPaths);

  // no repo found
  if (repositoryPaths.length === 0) {
    log.debug("No repositories found");
    log.error("Cannot resolve repository directory, to fix this either:");
    console.log(`- Create a directory at: ${chalk.magenta(tildify(globalRepositoryPath))}`);
    console.log(
      `- Create a directory at:\n  ${chalk.magenta(resolve(projectRoot, "auto"))}\nor\n  ${chalk.magenta(
        resolve(projectRoot, ".auto")
      )}`
    );
    console.log(`- Or set the ${chalk.cyan("$AUTO_REPO")} environment variable.`);

    // auto-create main repo (~/.config/auto)
    const ok = await inquirer.confirm({
      message: `Do you want me to create a directory at ${chalk.magenta(tildify(globalRepositoryPath))}?`,
    });
    if (ok) {
      await fs.mkdirp(globalRepositoryPath);
      console.log(chalk.green("Success:"), "Created directory at", chalk.magenta(tildify(globalRepositoryPath)));
      mainRepositoryPath = globalRepositoryPath;
    } else process.exit(1);
  }

  if (isParentProcess) {
    const argv = process.argv.slice(1);
    const esmLoaderPath = require.resolve("tsx");
    const cjsAutoLoaderPath = resolve(dirname(fileURLToPath(import.meta.url)), "loader-cjs.cjs");
    const esmAutoLoaderPath = resolve(dirname(fileURLToPath(import.meta.url)), "loader-esm.mjs");

    // auto-setup repo/tsconfig.json
    for (const repoPath of repositoryPaths) {
      const tsConfigPath = resolve(repoPath, "tsconfig.json");
      if (!fs.existsSync(tsConfigPath)) {
        console.log(
          chalk.yellow.bold("Warning:"),
          "Cannot find",
          // eslint-disable-next-line sonarjs/no-nested-template-literals
          `${chalk.magenta(`${tildify(repoPath)}/`)}${chalk.cyan("tsconfig.json")}`
        );

        const ok = await inquirer.confirm({ message: "Do you want me to set it up?" });
        if (ok) {
          await setupTSConfig(tsConfigPath);
          console.log(
            chalk.green("Success:"),
            "Wrote",
            chalk.cyan("tsconfig.json"),
            "to",
            chalk.magenta(tildify(tsConfigPath))
          );
        }
      }
    }

    // auto-setup repo/package.json with { "type": "module" }
    for (const repoPath of repositoryPaths) {
      const repoPackageJsonPath = resolve(repoPath, "package.json");

      if (!fs.existsSync(repoPackageJsonPath)) {
        console.log(
          chalk.yellow.bold("Warning:"),
          "Cannot find",
          // eslint-disable-next-line sonarjs/no-nested-template-literals
          `${chalk.magenta(`${tildify(repoPath)}/`)}${chalk.cyan("package.json")}`
        );

        const ok = await inquirer.confirm({ message: "Do you want me to set it up?" });
        if (ok) {
          await setupPackage(repoPackageJsonPath);
          console.log(
            chalk.green("Success:"),
            "Wrote",
            chalk.cyan("package.json"),
            "to",
            chalk.magenta(tildify(repoPackageJsonPath))
          );
        }
      }
    }

    const childProcess = spawn(
      process.execPath,
      ["-r", cjsAutoLoaderPath, "--import", esmLoaderPath, `--loader`, `${esmAutoLoaderPath}`, ...argv],
      {
        stdio: ["inherit", "inherit", "inherit", "ipc"],
        env: {
          ...process.env,
          NODE_OPTIONS: ["--experimental-specifier-resolution=node", "--no-warnings=ExperimentalWarning"].join(" "),
        },
      }
    );
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
  const modules = importedModules.filter(Boolean) as {
    file: (typeof files)[0];
    module: { default?: AutoReturnType };
  }[];

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
      log.debug("Loaded:", path);
    } else {
      log.debug("Skipped:", "Not a module:", file.path);
    }
  }

  log.debug("Loaded scripts:", Object.keys(scriptMap));

  const project = Project.resolveFromPath(process.cwd());
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
