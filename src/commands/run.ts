/* eslint-disable no-await-in-loop */
import { command } from "cleye";
import chalk from "chalk";
import Project from "../Project";
import { AutoReturnType } from "../types";
import { tildify } from "../utils/path";
import { dirname, resolve } from "node:path";
import { globSync } from "glob";
import * as inquirer from "@inquirer/prompts";

export const createRunCommand = (project: Project, scripts: AutoReturnType[]) =>
  command({ name: "run", alias: "r", parameters: ["<generator id>"] }, async (argv) => {
    const { generatorId } = argv._;
    const script = scripts.find((t) => t.id === generatorId);

    if (!script) {
      console.error(chalk.red(`Error: script "%s" not found.`), generatorId);
      process.exit(1);
    }
    if (script.isValid && !script.isValid(project)) {
      console.error(chalk.red(`Error: script "%s" is not valid for this context.`), generatorId);
      process.exit(1);
    }

    console.log(chalk.blue("Info:"), "Running", chalk.magenta(tildify(script.path)));

    // gather params
    const scriptParams = script.bootstrapParams();
    for (const [_, param] of Object.entries(scriptParams)) {
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

      // eslint-disable-next-line default-case
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
      project: Project.resolveFromDirectory(process.cwd()),
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
  });
