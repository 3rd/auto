import { Project } from "./Project";

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
  const defaultValues: Record<ParamType, ParamValueType<ParamType>> = {
    boolean: false,
    number: 0,
    string: "",
  };
  return defaultValues[type] as ParamValueType<T>;
};

const autoSymbol = Symbol.for("auto");

const auto = <P extends Record<string, ParamType>>(script: Script<P>) => {
  return {
    [autoSymbol]: true,
    ...script,
    isLocal: false,
    path: "",
    bootstrapParams: () => {
      if (!script.params) return {};
      return Object.fromEntries(
        Object.entries(script.params).map(([key, param]) => {
          let value = getDefaultParamValue(param.type);
          if (typeof param.defaultValue !== "function" && param.defaultValue !== undefined) value = param.defaultValue;

          return [key, { ...param, value }];
        }) as [keyof P, ScriptParam<P[keyof P], P> & { value: ParamValueType<P[keyof P]> }][]
      );
    },
  };
};

type AutoType = typeof auto;
type AutoReturnType = ReturnType<AutoType>;

export type { AutoReturnType, AutoType, Params, ParamType, ParamValueType, Script, ScriptParam };
export { auto, autoSymbol };
