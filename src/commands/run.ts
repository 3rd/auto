/* eslint-disable no-await-in-loop */
import { command } from "cleye";
import chalk from "chalk";
import Project from "../Project";
import { AutoReturnType } from "../types";
import { tildify } from "../utils/path";
import { dirname, resolve } from "node:path";
import { globSync } from "glob";

export const createRunCommand = (project: Project, templates: AutoReturnType[]) =>
  command({ name: "run", alias: "r", parameters: ["<generator id>"] }, async (argv) => {
    const { generatorId } = argv._;
    const template = templates.find((t) => t.id === generatorId);

    if (!template) {
      console.error(chalk.red(`Error: Template "%s" not found.`), generatorId);
      process.exit(1);
    }
    if (template.isValid && !template.isValid(project)) {
      console.error(chalk.red(`Error: Template "%s" is not valid for this context.`), generatorId);
      process.exit(1);
    }

    console.log(chalk.blue("Info:"), "Running", chalk.magenta(tildify(template.path)));

    // gather params
    const templateParams = template.bootstrapParams();
    for (const [_, param] of Object.entries(templateParams)) {
      // dynamic default values
      if (typeof param.defaultValue === "function") {
        const value = param.defaultValue({
          project,
          params: Object.fromEntries(
            Object.entries(templateParams).map(([key, currentParam]) => {
              return [key, currentParam.value];
            })
          ),
        });
        if (value !== undefined) param.value = value;
      }

      // eslint-disable-next-line default-case
      switch (param.type) {
        case "boolean": {
          param.value = await prompt.confirm(param.title, param.value as boolean);
          break;
        }
        case "number": {
          param.value = await prompt.number(param.title, param.value as number);
          break;
        }
        case "string": {
          param.value = await prompt.string(param.title, param.value as string);
          if (param.required && param.value === "") {
            console.error(chalk.red(`Error: Parameter "%s" is required.`), param.title);
            process.exit(1);
          }
          break;
        }
      }
    }
    const paramValues = Object.fromEntries(
      Object.entries(templateParams).map(([key, param]) => {
        return [key, param.value];
      })
    );

    const t = (text: string, params: Record<string, string | number | boolean> = paramValues) => {
      let result = text;
      for (const [key, value] of Object.entries(params)) {
        result = result.replace(new RegExp(`__${key}__`, "g"), String(value));
      }
      return result;
    };

    // collect template files
    const templateDir = dirname(template.path);
    const files = globSync("**/*", { cwd: templateDir, dot: true, nodir: true, ignore: template.path }).map((path) => {
      return {
        path,
        get content() {
          return fs.readFileSync(resolve(templateDir, path), "utf-8");
        },
      };
    });

    // run the template
    template.run({
      cwd: process.cwd(),
      project: Project.resolveFromDirectory(process.cwd()),
      self: template,
      params: paramValues as Parameters<typeof template.run>[0]["params"],
      files,
      get fileMap() {
        return new Proxy(
          {},
          {
            get(_, path) {
              if (typeof path !== "string") throw new Error("Invalid path.");
              if (!fs.existsSync(resolve(templateDir, path))) throw new Error(`File "${path}" not found.`);
              return fs.readFileSync(resolve(templateDir, path as string), "utf-8");
            },
          }
        );
      },
      t,
    });
  });
