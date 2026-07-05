/* eslint-disable no-await-in-loop */
import { resolve } from "node:path";
import repl from "node:repl";
import cli from "gunsmith";
import chalk from "chalk";
import { GetCommandContext } from "../types";
import { getGlobalCachePath } from "../utils/path";

const createReplCommand = (getContext: GetCommandContext) =>
  cli.command("repl", {
    run: async () => {
      const { project, scripts } = await getContext();
      (global as any).project = project;
      (global as any).scripts = scripts;
      const r = repl.start({
        prompt: chalk.greenBright("> "),
        useGlobal: true,
        terminal: true,
      });
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      r.setupHistory(resolve(getGlobalCachePath(), "history"), () => {});
      await new Promise<void>((resolveExit) => r.on("exit", resolveExit));
    },
  });

export { createReplCommand };
