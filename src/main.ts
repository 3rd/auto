/* eslint-disable no-await-in-loop */
import { cli as cleye, command } from "cleye";
import { prompt } from "enquirer";
import fs from "fs-extra";
import execa from "execa";
import packageJson from "../package.json";
import templates from "./templates";
import Context from "./context/Context";

const context = new Context();
// console.log(context.project.rootDirectory);
// console.log(context.project.isGoProject);
// console.log(context.project.dependencies);

const listCommand = command(
  {
    name: "list",
    alias: "ls",
    flags: {
      all: Boolean,
    },
  },
  (argv) => {
    const filteredTemplates = templates.filter((template) =>
      argv.flags.all ? true : template.isValidForContext(context)
    );
    for (const template of filteredTemplates) {
      console.log(`[${template.id}] ${template.title}`);
    }
  }
);

const runCommand = command(
  {
    name: "run",
    alias: "r",
    parameters: ["<generator id>"],
    flags: {
      dry: Boolean,
    },
  },
  async (argv) => {
    const { generatorId } = argv._;
    const template = templates.find((t) => t.id === generatorId);
    if (!template) {
      console.error(`Template ${generatorId} not found`);
      process.exit(1);
    }
    if (!template.isValidForContext(context)) {
      console.error(`Template ${generatorId} is not valid for this context`);
      process.exit(1);
    }
    const params = template.bootstrapParams();
    for (const [_, param] of Object.entries(params)) {
      if ((param.meta.type as unknown) === "boolean") {
        const { value } = await prompt<{ value: string }>({
          type: "confirm",
          name: "value",
          message: param.meta.title,
          initial: param.value,
        });
        param.value = value;
      }
      if ((param.meta.type as unknown) === "number") {
        const { value } = await prompt<{ value: string }>({
          type: "numeral",
          name: "value",
          message: param.meta.title,
          initial: param.value,
        });
        param.value = value;
      }
      if ((param.meta.type as unknown) === "string") {
        const { value } = await prompt<{ value: string }>({
          type: "input",
          name: "value",
          message: param.meta.title,
          initial: param.value,
        });
        param.value = value;
      }
    }
    const paramValues = Object.fromEntries(Object.entries(params).map(([key, param]) => [key, param.value])) as {
      [K in keyof typeof params]: typeof params[K]["value"];
    };
    template.generate({
      context,
      params: paramValues,
      template,
      lib: { fs, execa },
    });
  }
);

const cli = cleye({
  name: packageJson.name,
  alias: "gen",
  version: packageJson.version,
  commands: [listCommand, runCommand],
});
if (!cli.command) cli.showHelp();
