import * as types from "../types";
import _sleep from "./sleep";
import shell from "./shell";

Object.assign(global, {
  asTemplate: types.asTemplate,
  sleep: _sleep,
  cd: shell.cd,
  cwd: shell.cwd,
});

declare global {
  const asTemplate: types.AsTemplateType;
  const sleep: typeof _sleep;
  const cd: typeof shell.cd;
  const cwd: typeof shell.cwd;
}
