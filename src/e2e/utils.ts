import fs from "fs-extra";
import { resolve as resolvePath } from "path";
import { execa } from "execa";

export const runCommandWithInputs = (
  command: string,
  inputs: { on: string; value: string }[],
  opts?: { cwd: string }
) => {
  const [cmd, ...args] = command.split(" ");
  return new Promise<{ stdout: string }>((resolve, reject) => {
    const proc = execa(cmd, args, { ...opts, stdin: "pipe" });
    proc.stdin!.setDefaultEncoding("utf8");

    let stdout = "";
    let stdoutChunk = "";
    let currentInputIndex = 0;

    const loop = () => {
      if (currentInputIndex === inputs.length) {
        proc.stdin!.end();
      } else if (stdoutChunk.includes(inputs[currentInputIndex].on)) {
        console.log(" - Simulating input:", inputs[currentInputIndex].value);
        stdoutChunk = "";
        proc.stdin!.write(inputs[currentInputIndex].value + "\n");
        currentInputIndex++;
      }
    };

    proc.stdout!.on("data", (chunk) => {
      stdout += chunk;
      stdoutChunk += chunk;
      loop();
    });

    proc.stderr!.on("data", (chunk) => {
      console.error(chunk.toString());
      reject(new Error("Error in stderr"));
    });

    proc.on("exit", () => resolve({ stdout }));
  });
};

export const lazyRead = (filePath: string, modifier?: (value: string) => string) => () => {
  const value = fs.readFileSync(filePath, "utf8").trim();
  return modifier ? modifier(value) : value;
};

export const generateMockProject = async (files: Record<string, string>) => {
  const projectPath = await fs.mkdtemp("/tmp/auto-e2e");
  for (const [path, content] of Object.entries(files)) {
    // eslint-disable-next-line no-await-in-loop
    await fs.outputFile(resolvePath(projectPath, path), content);
  }
  return projectPath;
};
