/* eslint-disable @shopify/restrict-full-import */
import * as _chalk from "chalk";
import * as _execa from "execa";
import * as _glob from "glob";
import * as _fs_t from "fs-extra";
import * as _lodash_t from "lodash";
import * as _which_t from "which";
import * as _inquirer from "@inquirer/prompts";
import _fs from "fs-extra";
import _lodash from "lodash";
import _which from "which";

import * as types from "../types";
import _sleep from "./sleep";
import shell from "./shell";

Object.assign(global, {
  // core
  auto: types.auto,
  // internal utils
  ...shell,
  sleep: _sleep,
  // external utils
  $$: _execa.$({ verbose: true }),
  $: _execa.$,
  chalk: _chalk,
  prompt: _inquirer,
  inquirer: _inquirer,
  execa: _execa.execa,
  execaSync: _execa.execaSync,
  fs: _fs,
  glob: _glob,
  lodash: _lodash,
  which: _which,
});

// accessors
Object.defineProperty(globalThis, "pwd", {
  get() {
    return shell.cwd();
  },
  set(path: string) {
    shell.cd(path);
  },
});

declare global {
  const auto: types.AutoType;
  const cd: typeof shell.cd;
  const pwd: string;
  // @ts-ignore damn you tsserver
  const sleep: typeof _sleep;
  const $$: typeof _execa.$;
  const $: typeof _execa.$;
  const chalk: typeof _chalk;
  const prompt: typeof _inquirer;
  const inquirer: typeof _inquirer;
  const execa: typeof _execa.execa;
  const execaSync: typeof _execa.execaSync;
  const glob: typeof _glob;
  const fs: typeof _fs_t;
  const lodash: typeof _lodash_t;
  const which: typeof _which_t;
}
