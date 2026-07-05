import "auto";

export default auto({
  id: "shell",
  title: "Shell-like usage",
  run: async ({ project }) => {
    cd(project.rootDirectory);

    console.log((await execa("cat", ["package.json"]).pipe("grep", ["license"])).stdout);

    const whoami = await $`whoami`;
    await $({ stdout: ["pipe", "inherit"] })`echo "Hello, ${whoami}"`;

    console.log(
      (
        await Promise.all(
          [
            async () => {
              await sleep(100);
              return $({ stdout: ["pipe", "inherit"] })`echo "1"`;
            },
            async () => {
              await sleep(200);
              return $({ stdout: ["pipe", "inherit"] })`echo "2"`;
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
