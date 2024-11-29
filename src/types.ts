import { Project } from "./Project";
import { debug } from "./utils/logger";

type ParamType = "boolean" | "number" | "string";

type ParamValueType<T extends ParamType> = T extends "boolean"
  ? boolean
  : T extends "number"
    ? number
    : T extends "string"
      ? string
      : never;

type ScriptParam<T extends ParamType, P extends Record<string, ParamType>> = {
  title: string;
  type: T;
  defaultValue?:
    | ParamValueType<T>
    | ((args: { project: Project; params: { [K in keyof P]: ParamValueType<P[K]> } }) => ParamValueType<T> | undefined);
  required?: boolean;
};

type Params<T extends Record<string, ParamType> = Record<string, ParamType>> = {
  [K in keyof T]: ScriptParam<T[K], T> & { type: T[K] };
};

type Script<P extends Record<string, ParamType>> = {
  id: string;
  title?: string;
  params?: Params<P>;
  isValid?: (project: Project) => boolean;
  run: (args: {
    cwd: string;
    project: Project;
    self: Script<P>;
    params: { [K in keyof P]: ParamValueType<P[K]> };
    files: { path: string; content: string }[];
    fileMap: Record<string, string>;
    t: (text: string, params?: Record<string, boolean | number | string>) => string;
  }) => void;
};

const getDefaultParamValue = <T extends ParamType>(type: T) => {
  debug("Getting default value for param type:", type);
  const defaultValues: Record<ParamType, ParamValueType<ParamType>> = {
    boolean: false,
    number: 0,
    string: "",
  };
  const value = defaultValues[type] as ParamValueType<T>;
  debug("Default value:", value);
  return value;
};

const autoSymbol = Symbol.for("auto");

const auto = <P extends Record<string, ParamType>>(script: Script<P>) => {
  debug("Initializing auto script:", script.id);
  debug("Script configuration:", {
    id: script.id,
    title: script.title,
    params: script.params,
    isValid: script.isValid,
  });

  return {
    [autoSymbol]: true,
    ...script,
    isLocal: false,
    path: "",
    bootstrapParams: () => {
      debug("Bootstrapping params for script:", script.id);
      const params = Object.fromEntries(
        Object.entries(script.params ?? {}).map(([key, param]) => {
          debug("Processing param:", { key, param });
          let value = getDefaultParamValue(param.type);
          if (typeof param.defaultValue !== "function" && param.defaultValue !== undefined) {
            value = param.defaultValue;
            debug("Using static default value:", { key, value });
          }
          return [key, { ...param, value }];
        }) as [keyof P, ScriptParam<P[keyof P], P> & { value: ParamValueType<P[keyof P]> }][]
      );
      debug("Bootstrapped params:", params);
      return params;
    },
  };
};

type AutoType = typeof auto;
type AutoReturnType = ReturnType<AutoType>;

export type { AutoReturnType, AutoType, Params, ParamType, ParamValueType, Script, ScriptParam };
export { auto, autoSymbol };
