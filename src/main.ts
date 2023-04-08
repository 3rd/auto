/* eslint-disable no-await-in-loop */
import { resolve } from "path";
import spawn from "cross-spawn";
import { cli as cleye, command } from "cleye";
import { globSync } from "glob";
import fs from "fs-extra";
import * as execa from "execa";
import enquirer from "enquirer";
import packageJson from "../package.json";
import Context from "./context/Context";
import { asTemplate } from "./types";

const createListCommand = (context: Context, templates: ReturnType<typeof asTemplate>[]) =>
  command(
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

const createRunCommand = (context: Context, templates: ReturnType<typeof asTemplate>[]) =>
  command(
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
      const templateParams = template.bootstrapParams();
      for (const [_, param] of Object.entries(templateParams)) {
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

      const paramValues = Object.fromEntries(Object.entries(templateParams).map(([key, param]) => [key, param.value]));

      template.generate({
        context,
        self: template,
        params: paramValues as Parameters<typeof template.generate>[0]["params"],
        substitute: (source, params: Partial<Parameters<typeof template.generate>[0]["params"]>) => {
          let result = source;
          for (const [key, value] of Object.entries(params)) {
            result = result.replace(new RegExp(`{{${key}}}`, "g"), value as string);
          }
          return result;
        },
        lib: { fs, execa },
      });
    }
  );

const main = async () => {
  const templateRepositoryPath = "/home/rabbit/brain/config/home/templates";
  const tsconfigPath = resolve(templateRepositoryPath, "tsconfig.json");

  if (typeof process.send !== "function") {
    const argv = process.argv.slice(1);
    const esmLoaderPath = require.resolve("@esbuild-kit/esm-loader");

    const childProcess = spawn(process.execPath, ["--loader", esmLoaderPath, ...argv], {
      stdio: ["inherit", "inherit", "inherit", "ipc"],
      env: {
        ...process.env,
        NODE_OPTIONS: [
          "--experimental-specifier-resolution=node",
          "--no-warnings=ExperimentalWarning",
          `ESBK_TSCONFIG_PATH=${tsconfigPath}`,
        ].join(" "),
      },
    });
    childProcess.on("close", (code) => process.exit(code!));
    return;
  }

  const context = new Context();

  const templates: ReturnType<typeof asTemplate>[] = [];
  for (const file of globSync(`${templateRepositoryPath}/**/*.ts`)) {
    const template = await import(file);
    templates.push(template.default);
  }

  const cli = cleye({
    name: packageJson.name,
    version: packageJson.version,
    commands: [createListCommand(context, templates), createRunCommand(context, templates)],
  });
  if (!cli.command) cli.showHelp();
};

main();
