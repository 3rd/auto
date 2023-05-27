import "auto";
import { ExecaChildProcess } from "execa";

export default auto({
  id: "shell",
  title: "Shell-like usage",
  run: async ({ project }) => {
    cd(project.rootDirectory);

    console.log((await execa("cat", ["package.json"]).pipeStdout?.(execa("grep", ["license"])))?.stdout);

    const whoami = await $`whoami`;
    await $`echo "Hello, ${whoami}"`.pipeStdout?.(process.stdout);

    console.log(
      (
        await Promise.all(
          [
            async () => {
              await sleep(100);
              return $`echo "1"`.pipeStdout?.(process.stdout);
            },
            async () => {
              await sleep(200);
              return $`echo "2"`.pipeStdout?.(process.stdout);
            },
          ].map((f) => f())
        )
      ).map((p) => p?.stdout)
    );

    const name = "auto-foo-bar-baz";
    await $`mkdir -p /tmp/${name}`;
    console.log((await $`ls /tmp/${name}`).exitCode);
  },
});
