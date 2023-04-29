import Project from "./context/Project";

export type ParamType = "boolean" | "number" | "string";

export type ParamValueType<T extends ParamType> = T extends "boolean"
  ? boolean
  : T extends "number"
  ? number
  : T extends "string"
  ? string
  : never;

export type TemplateParam<T extends ParamType, P extends Record<string, ParamType>> = {
  title: string;
  type: T;
  defaultValue?:
    | ParamValueType<T>
    | ((args: { project: Project; params: { [K in keyof P]: ParamValueType<P[K]> } }) => ParamValueType<T> | undefined);
  required?: boolean;
};

export type Params<T extends Record<string, ParamType> = Record<string, ParamType>> = {
  [K in keyof T]: TemplateParam<T[K], T> & { type: T[K] };
};

export type Template<P extends Record<string, ParamType>> = {
  id: string;
  title?: string;
  params?: Params<P>;
  isValid?: (project: Project) => boolean;
  run: (args: {
    cwd: string;
    project: Project;
    self: Template<P>;
    params: { [K in keyof P]: ParamValueType<P[K]> };
    files: { path: string; content: string }[];
    fileMap: Record<string, string>;
    t: (text: string, params?: Record<string, string | number | boolean>) => string;
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

export const autoSymbol = Symbol.for("auto");

export const auto = <P extends Record<string, ParamType>>(template: Template<P>) => {
  return {
    [autoSymbol]: true,
    ...template,
    isLocal: false,
    path: "",
    bootstrapParams: () => {
      if (!template.params) return {};
      return Object.fromEntries(
        Object.entries(template.params).map(([key, param]) => {
          let value = getDefaultParamValue(param.type);
          if (typeof param.defaultValue !== "function" && param.defaultValue !== undefined) {
            value = param.defaultValue;
          }
          return [key, { ...param, value }];
        }) as [keyof P, TemplateParam<P[keyof P], P> & { value: ParamValueType<P[keyof P]> }][]
      );
    },
  };
};

export type AutoType = typeof auto;
export type AutoReturnType = ReturnType<AutoType>;
