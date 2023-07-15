import _Module from "module";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

type ModuleType = {
  _resolveFilename: ResolveFilenameSignature;
};

type ResolveFilenameSignature = (
  request: string,
  parent: NodeJS.Module | null,
  isMain?: boolean,
  options?: any
) => string;

const Module = _Module as unknown as ModuleType;
const autoLoaderPath = resolve(dirname(fileURLToPath(import.meta.url)), "globals/index.cjs");

const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === "auto") return autoLoaderPath;

  return resolveFilename.call(this, request, parent, isMain, options);
};
