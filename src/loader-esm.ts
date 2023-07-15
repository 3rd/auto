import { resolve as nodeResolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import fs from "fs";

const autoLoaderPath = nodeResolve(dirname(fileURLToPath(import.meta.url)), "globals/index.mjs");

async function resolve(specifier: string, context: unknown, next: Function) {
  if (specifier === "auto") {
    return { url: `file://${autoLoaderPath}`, shortCircuit: true };
  }
  return next(specifier, context);
}

async function load(url: string, context: unknown, next: Function) {
  if (url === autoLoaderPath) {
    const code = fs.readFileSync(autoLoaderPath, "utf8");
    return {
      format: "module",
      source: code,
    };
  }
  return next(url, context);
}

export { load, resolve };
