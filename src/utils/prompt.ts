import enquirer from "enquirer";

export const confirm = async (message: string, initialValue?: boolean) => {
  const { value } = await enquirer.prompt<{ value: boolean }>({
    type: "confirm",
    name: "value",
    message,
    initial: initialValue,
  });
  return value;
};

export const string = async (message: string, initialValue?: string) => {
  const { value } = await enquirer.prompt<{ value: string }>({
    type: "input",
    name: "value",
    message,
    initial: initialValue,
  });
  return value;
};

export const number = async (message: string, initialValue?: number) => {
  const { value } = await enquirer.prompt<{ value: number }>({
    type: "numeral",
    name: "value",
    message,
    initial: initialValue === 0 ? undefined : initialValue,
  });
  return value ?? 0;
};

export default {
  confirm,
  string,
  number,
};
