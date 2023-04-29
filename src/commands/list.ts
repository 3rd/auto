import { command } from "cleye";
import chalk from "chalk";
import Project from "../Project";
import { AutoReturnType } from "../types";

export const createListCommand = (project: Project, templates: AutoReturnType[]) =>
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
