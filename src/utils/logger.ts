import chalk from "chalk";

export const debug = (message: string, ...args: any[]) => {
  if (process.env.DEBUG) {
    console.log(chalk.yellow(`[DEBUG] ${message}`), ...args);
  }
};

export const error = (message: string, ...args: any[]) => {
  console.error(`[ERROR] ${message}`, ...args);
};
