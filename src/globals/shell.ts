export default {
  cwd() {
    return process.cwd();
  },
  cd(path: string) {
    process.chdir(path);
  },
  get pwd() {
    return process.cwd();
  },
  set pwd(path: string) {
    process.chdir(path);
  },
};
