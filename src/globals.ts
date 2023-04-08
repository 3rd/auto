import * as types from "./types";

Object.assign(global, {
  asTemplate: types.asTemplate,
});

declare global {
  const asTemplate: types.AsTemplateType;
}
