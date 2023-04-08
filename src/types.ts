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
  const defaultValues: Record<ParamType, ParamValueType<ParamType>> = {
    boolean: false,
    number: 0,
    string: "",
  };
  return defaultValues[type] as ParamValueType<T>;
};

export const asTemplate = <P extends Record<string, TemplateParam<ParamType>>>(template: Template<P>) => {
  return {
    ...template,
    bootstrapParams: () => {
      return Object.fromEntries(
        Object.entries<TemplateParam<ParamType>>(template.params).map(([key, param]) => [
          key,
          { ...param, value: param.defaultValue ?? getDefaultParamValue(param.type) },
        ])
      );
    },
  };
};
