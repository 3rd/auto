export default {
  cwd() {
    return process.cwd();
  },
  cd(path: TemplateStringsArray | string) {
    process.chdir(typeof path === "string" ? path : path[0]);
    return process.cwd();
  },
  get pwd() {
    return process.cwd();
  },
  set pwd(path: string) {
    process.chdir(path);
  },
};
