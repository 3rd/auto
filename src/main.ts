/* eslint-disable no-await-in-loop */
import { cli as cleye, command } from "cleye";
import enquirer from "enquirer";
import fs from "fs-extra";
import * as execa from "execa";
import packageJson from "../package.json";
import templates from "./templates";
import Context from "./context/Context";

const context = new Context();

const listCommand = command(
  {
    name: "list",
    alias: "ls",
    flags: {
      all: Boolean,
    },
  },
  (argv) => {
    for (const template of templates.filter((t) => (argv.flags.all ? true : t.isValidForContext(context)))) {
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
      const type = param.type as unknown;
      if (type === "boolean") {
        const { value } = await enquirer.prompt<{ value: string }>({
          type: "confirm",
          name: "value",
          message: param.title,
          initial: param.value,
        });
        param.value = value;
      }
      if (type === "number") {
        const { value } = await enquirer.prompt<{ value: string }>({
          type: "numeral",
          name: "value",
          message: param.title,
          initial: param.value,
        });
        param.value = value;
      }
      if (type === "string") {
        const { value } = await enquirer.prompt<{ value: string }>({
          type: "input",
          name: "value",
          message: param.title,
          initial: param.value,
        });
        param.value = value;
      }
    }

    const paramValues = Object.fromEntries(Object.entries(params).map(([key, param]) => [key, param.value]));

    template.generate({
      context,
      template,
      params: paramValues as Parameters<typeof template.generate>[0]["params"],
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
