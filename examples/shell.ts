import "auto";

export default auto({
  id: "shell",
  title: "Shell-like usage",
  run: async ({ project }) => {
    cd(project.rootDirectory);

    await execa("cat", ["package.json"]).pipeStdout?.(execa("grep", ["name"]));
    const branch = await $`git branch --show-current`;
    await $`echo "deploy --branch=${branch}"`.pipeStdout?.(process.stdout);

    await Promise.all([
      async () => {
        await sleep(1);
        await $`echo "1"`.pipeStdout?.(process.stdout);
      },
      async () => {
        await sleep(1);
        await $`echo "2"`.pipeStdout?.(process.stdout);
      },
    ]);

    const name = "foo bar";
    await $`mkdir -p /tmp/${name}`;
    console.log(await $`ls /tmp/${name}`);
  },
});
