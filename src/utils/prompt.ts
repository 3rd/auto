import { prompt, Prompt } from "enquirer";

export const confirm = async (message: string, initialValue?: boolean) => {
  const { value } = await prompt<{ value: boolean }>({
    type: "confirm",
    name: "value",
    message,
    initial: initialValue,
  });
  return value;
};

export const string = async (message: string, initialValue?: string) => {
  const { value } = await prompt<{ value: string }>({
    type: "input",
    name: "value",
    message,
    initial: initialValue,
  });
  return value;
};

export const number = async (message: string, initialValue?: number) => {
  const { value } = await prompt<{ value: number }>({
    type: "numeral",
    name: "value",
    message,
    initial: initialValue === 0 ? undefined : initialValue,
  });
  return value ?? 0;
};

// type SelectOptions =
//   | {}
//   | {
//       type: "select";
//     }
//   | {
//       type: "multiselect";
//       limit?: number;
//     }
//   | {
//       type: "autocomplete";
//       footer?: string;
//       initialIndex?: number;
//       multiple?: boolean;
//       suggest?: (value: string) => string[];
//     };
// export const select = async (message: string, choices: string[], options: SelectOptions = {}) => {
//   const { ...otherOptions } = options;
//   const handler = new Prompt({
//     ...otherOptions,
//     type: "type" in options ? options.type : "select",
//     name: "value",
//     message,
//     choices,
//   });
//   return handler.run();
// };

export default {
  confirm,
  string,
  number,
};
