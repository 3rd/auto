import * as _execa from "execa";
import _fs from "fs-extra";
import _glob from "glob";
import _which from "which";

import * as types from "../types";
import _sleep from "./sleep";
import shell from "./shell";

Object.assign(global, {
  // core
  asTemplate: types.asTemplate,
  // internal utils
  ...shell,
  sleep: _sleep,
  // external utils
  $: _execa.$,
  $$: _execa.$({ verbose: true }),
  execa: _execa.execa,
  execaSync: _execa.execaSync,
  fs: _fs,
  glob: _glob,
  which: _which,
});

// accessors
Object.defineProperty(global, "pwd", {
  get() {
    return shell.cwd();
  },
  set(path: string) {
    shell.cd(path);
  },
});

declare global {
  const asTemplate: types.AsTemplateType;
  const cd: typeof shell.cd;
  const cwd: typeof shell.cwd;
  const pwd: string;
  const sleep: typeof _sleep;
  const $: typeof _execa.$;
  const $$: typeof _execa.$;
  const execa: typeof _execa.execa;
  const execaSync: typeof _execa.execaSync;
  const fs: typeof _fs;
  const glob: typeof _glob;
  const which: typeof _which;
}
