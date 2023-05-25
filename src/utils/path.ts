import os from "node:os";
import envPaths from "env-paths";

export const tildify = (path: string) => path.replace(os.homedir(), "~");

export const getGlobalRepositoryPath = () => {
  return envPaths("auto", { suffix: "" }).config;
};
