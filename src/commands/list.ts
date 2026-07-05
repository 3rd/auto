import cli from "gunsmith";
import chalk from "chalk";
import { z } from "zod";
import { GetCommandContext } from "../types";

const createListCommand = (getContext: GetCommandContext) =>
  cli.command("list", {
    alias: "ls",
    options: z.object({
      all: z
        .boolean()
        .default(false)
        .meta({ alias: "a", description: "include scripts not valid for the current project" }),
    }),
    run: async ({ options }) => {
      const { project, scripts } = await getContext();
      const filteredScripts = options.all ? scripts : scripts.filter((t) => !t.isValid || t.isValid(project));
      for (const script of filteredScripts) {
        console.log(
          chalk.grey("-"),
          chalk.magenta(`<${script.id}>`),
          chalk.cyan(script.title ?? ""),
          script.isLocal ? chalk.blue("(local)") : chalk.yellow("(main)")
        );
      }
    },
  });

export { createListCommand };
