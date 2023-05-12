/* eslint-disable no-await-in-loop */
import { resolve } from "node:path";
import repl from "node:repl";
import { command } from "cleye";
import chalk from "chalk";
import envPaths from "env-paths";
import Project from "../Project";
import { AutoReturnType } from "../types";
import packageJson from "../../package.json";

export const createReplCommand = (project: Project, scripts: AutoReturnType[]) =>
  command({ name: "repl" }, async () => {
    (global as any).project = project;
    (global as any).scripts = scripts;
    const r = repl.start({
      prompt: chalk.greenBright("> "),
      useGlobal: true,
      terminal: true,
    });
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    r.setupHistory(resolve(envPaths(packageJson.name, { suffix: "" }).cache, "history"), () => {});
  });
