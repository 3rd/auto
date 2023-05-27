import * as http from "http";
import { execa } from "execa";
import type { Test } from "../index";

export const fetch: Test = {
  run: async (cwd) => {
    const server = http.createServer((_, res) => {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Hello");
    });
    server.listen(9123);

    const { stdout } = await execa("auto", ["run", "fetch"], { cwd });

    server.close();

    return { stdout };
  },
  expected: {
    stdout: `
Info: Using main repository: ~/.config/auto
Info: Running ~/.config/auto/fetch.ts
Hello`,
  },
};
