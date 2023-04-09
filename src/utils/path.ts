import os from "node:os";

export const tildify = (path: string) => path.replace(os.homedir(), "~");
