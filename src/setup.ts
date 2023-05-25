import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import fs from "fs-extra";

export const setupTSConfig = (tsConfigPath: string) => {
  const pathToDistGlobals = resolve(dirname(fileURLToPath(import.meta.url)), "..", "dist", "globals");
  return fs.writeFile(
    tsConfigPath,
    JSON.stringify(
      {
        compilerOptions: {
          strict: true,
          lib: [],
          jsx: "react-jsx",
          baseUrl: ".",
          typeRoots: [pathToDistGlobals],
          paths: {
            auto: [pathToDistGlobals],
          },
        },
      },
      null,
      2
    )
  );
};
