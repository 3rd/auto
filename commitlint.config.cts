module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [2, "always", ["feat", "fix", "chore", "test", "docs", "revert"]],
    "body-max-line-length": [0, "always"],
    "footer-max-line-length": [0, "always"],
  },
};
