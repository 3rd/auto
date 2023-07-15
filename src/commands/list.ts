import { command } from "cleye";
import chalk from "chalk";
import { Project } from "../Project";
import { AutoReturnType } from "../types";

const createListCommand = (project: Project, scripts: AutoReturnType[]) =>
  command({ name: "list", alias: "ls", flags: { all: Boolean } }, (argv) => {
    const filteredScripts = argv.flags.all ? scripts : scripts.filter((t) => !t.isValid || t.isValid(project));
    for (const script of filteredScripts) {
      console.log(
        chalk.grey("-"),
        chalk.magenta(`<${script.id}>`),
        chalk.cyan(script.title ?? ""),
        script.isLocal ? chalk.blue("(local)") : chalk.yellow("(main)")
      );
    }
  });

export { createListCommand };
