export default {
  cwd() {
    return process.cwd();
  },
  cd(path: string) {
    process.chdir(path);
  },
};
