import Context from "./context/Context";

type Library = {
  fs: typeof import("fs-extra");
  execa: typeof import("execa");
};

type ParamType = "boolean" | "number" | "string";

type ParamValueType<T extends ParamType> = T extends "boolean"
  ? boolean
  : T extends "number"
  ? number
  : T extends "string"
  ? string
  : never;

interface TemplateParam<Type extends ParamType> {
  title: string;
  type: Type;
  defaultValue?: ParamValueType<Type>;
}

export interface Template<P extends Record<string, TemplateParam<ParamType>>> {
  id: string;
  title: string;
  params: P;
  isValidForContext: (context: Context) => boolean;
  generate: (args: {
    context: Context;
    template: Template<P>;
    params: { [K in keyof P]: ParamValueType<P[K]["type"]> };
    lib: Library;
  }) => void;
}

const getDefaultParamValue = <T extends ParamType>(type: T): ParamValueType<T> => {
  return (() => {
    if (type === "boolean") return false;
    if (type === "number") return 0;
    if (type === "string") return "";
  })() as ParamValueType<T>;
};

export const asTemplate = <P extends Record<string, TemplateParam<ParamType>>>(template: Template<P>) => {
  return {
    ...template,
    bootstrapParams: () => {
      const params: Record<string, any> = {};
      for (const [key, param] of Object.entries<TemplateParam<ParamType>>(template.params)) {
        params[key] = {
          ...param,
          value: param.defaultValue ?? getDefaultParamValue(param.type),
        };
      }
      return params as {
        [K in keyof P]: P[K] & {
          value: ParamValueType<P[K]["type"]>;
        };
      };
    },
  };
};
