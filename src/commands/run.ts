/* eslint-disable no-await-in-loop */
import * as fs from "node:fs";
import { command } from "cleye";
import chalk from "chalk";
import { globSync } from "glob";
import * as inquirer from "@inquirer/prompts";
import { Project } from "../Project";
import { AutoReturnType } from "../types";
import { tildify } from "../utils/path";
import { dirname, resolve } from "node:path";
import * as log from "../utils/logger";

const toKebabCase = (str: string) => {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
};

const createRunCommand = (project: Project, scripts: AutoReturnType[]) =>
  command(
    {
      name: "run",
      alias: "r",
      parameters: ["<script id>"],
      flags: {
        help: { type: Boolean, alias: "h" },
      },
      allowUnknownFlags: true,
    },
    async (argv) => {
      const { scriptId } = argv._;
      const script = scripts.find((t) => t.id === scriptId);

      if (!script) {
        console.error(chalk.red(`Error: script "%s" not found.`), scriptId);
        process.exit(1);
      }
      if (script.isValid && !script.isValid(project)) {
        console.error(chalk.red(`Error: script "%s" is not valid for this context.`), scriptId);
        process.exit(1);
      }

      console.log(chalk.blue("Info:"), "Running", chalk.magenta(tildify(script.path)));

      // gather params
      const scriptParams = script.bootstrapParams();

      // get CLI-passed params
      const cliParams: Record<string, any> = {};

      for (const [key, param] of Object.entries(scriptParams)) {
        // cli values
        const cliValue = (argv.unknownFlags[key] ?? argv.unknownFlags[toKebabCase(key)] ?? [])[0];
        if (cliValue !== undefined) {
          switch (param.type) {
            case "boolean":
              param.value = cliValue === "true" || cliValue === true;
              break;
            case "number":
              param.value = Number(cliValue);
              break;
            case "string":
              param.value = cliValue;
              break;
          }
          cliParams[key] = cliValue;
          log.debug("CLI value", key, cliValue);
          continue;
        }

        // dynamic default values
        if (typeof param.defaultValue === "function") {
          const value = param.defaultValue({
            project,
            params: Object.fromEntries(
              Object.entries(scriptParams).map(([key, currentParam]) => {
                return [key, currentParam.value];
              })
            ),
          });
          if (value !== undefined) param.value = value;
        }

        // input values
        if (!(key in cliParams)) {
          switch (param.type) {
            case "boolean": {
              param.value = await inquirer.confirm({
                message: param.title,
                default: param.value as boolean,
              });
              break;
            }
            case "number": {
              const stringValue = await inquirer.input({
                message: param.title,
                default: param.value.toString(),
              });
              param.value = Number(stringValue);
              break;
            }
            case "string": {
              param.value = await inquirer.input({
                message: param.title,
                default: param.value as string,
              });
              if (param.required && param.value === "") {
                console.error(chalk.red(`Error: Parameter "%s" is required.`), param.title);
                process.exit(1);
              }
              break;
            }
          }
        }
      }

      const paramValues = Object.fromEntries(
        Object.entries(scriptParams).map(([key, param]) => {
          return [key, param.value];
        })
      );

      const t = (text: string, params: Record<string, boolean | number | string> = paramValues) => {
        let result = text;
        for (const [key, value] of Object.entries(params)) {
          result = result.replace(new RegExp(`__${key}__`, "g"), String(value));
        }

        return result;
      };

      // collect script files
      const scriptDir = dirname(script.path);
      const files = globSync("**/*", { cwd: scriptDir, dot: true, nodir: true, ignore: script.path }).map((path) => {
        return {
          path,
          get content() {
            return fs.readFileSync(resolve(scriptDir, path), "utf8");
          },
        };
      });

      // run the script
      script.run({
        cwd: process.cwd(),
        files,
        params: paramValues as Parameters<typeof script.run>[0]["params"],
        project: Project.resolveFromPath(process.cwd()),
        self: script,
        get fileMap() {
          return new Proxy(
            {},
            {
              get(_, path) {
                if (typeof path !== "string") throw new Error("Invalid path.");
                if (!fs.existsSync(resolve(scriptDir, path))) throw new Error(`File "${path}" not found.`);
                return fs.readFileSync(resolve(scriptDir, path as string), "utf8");
              },
            }
          );
        },
        t,
      });
    }
  );

export { createRunCommand };
