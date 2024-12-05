# [1.5.0](https://github.com/3rd/auto/compare/v1.4.1...v1.5.0) (2024-12-05)

### Bug Fixes

- prioritize global repo over dev depo ([b25d8a9](https://github.com/3rd/auto/commit/b25d8a9a2db5cc840a4b70d78b240fd04cd3d9b8))

### Features

- add support for passing params directly ([b9a7d77](https://github.com/3rd/auto/commit/b9a7d7707378ba289fbebee657b7ac435a26ad6d))

## [1.4.1](https://github.com/3rd/auto/compare/v1.4.0...v1.4.1) (2024-1-18)

### Bug Fixes

- node 20 tsx loader crash ([7d7a3f3](https://github.com/3rd/auto/commit/7d7a3f356db5e09c04c1df7bb932c985f00e5c0b))
- upgrade ci node to 21 ([4257b0d](https://github.com/3rd/auto/commit/4257b0d74632d82f37dc3ac0d11e39de89fd364c))

# [1.4.0](https://github.com/3rd/auto/compare/v1.3.1...v1.4.0) (2023-11-01)

### Bug Fixes

- update & fix tests failing due to missing pnpm ([b13dd1f](https://github.com/3rd/auto/commit/b13dd1fa4ddea0657c4b0cab480f1ab024c7f0e2))

### Features

- add override flag to project.writeFile() ([2a3373a](https://github.com/3rd/auto/commit/2a3373af34759e042d98b161637647278838d311))
- setup package.json for repos to ensure { type: "module" } ([c046d55](https://github.com/3rd/auto/commit/c046d55d1e9e0e36b0ccceb159ac8ba8f796442b))

## [1.3.1](https://github.com/3rd/auto/compare/v1.3.0...v1.3.1) (2023-07-15)

### Bug Fixes

- switch to pnpm and upgrade deps ([60897c8](https://github.com/3rd/auto/commit/60897c8e74e5691c9ef58e0f29a57d6ad322dab2))

# [1.3.0](https://github.com/3rd/auto/compare/v1.2.0...v1.3.0) (2023-06-03)

### Features

- remove node-fetch-native in favor of Node 18's builtin fetch ([523153c](https://github.com/3rd/auto/commit/523153cb584101749f6595f72e9d71604b74c4b4))

# [1.2.0](https://github.com/3rd/auto/compare/v1.1.2...v1.2.0) (2023-05-29)

### Features

- resolve local repo from project root ([edab091](https://github.com/3rd/auto/commit/edab091fec74c249bbc0e2020bf1d3fcd6357ae9))

## [1.1.2](https://github.com/3rd/auto/compare/v1.1.1...v1.1.2) (2023-05-27)

### Bug Fixes

- use fs.outputFile for project.writeFile ([4279f9d](https://github.com/3rd/auto/commit/4279f9d32920510d7f062a487eac7324251c02d4))

## [1.1.1](https://github.com/3rd/auto/compare/v1.1.0...v1.1.1) (2023-05-25)

### Bug Fixes

- wait for tsconfig write ([5f2a1d7](https://github.com/3rd/auto/commit/5f2a1d79dd828007ea39c83374131865f9e93dea))

# [1.1.0](https://github.com/3rd/auto/compare/v1.0.0...v1.1.0) (2023-05-25)

### Bug Fixes

- fix broken enquirer import ([531d00e](https://github.com/3rd/auto/commit/531d00e0cb6fc64c88c4ef6c96d9667e30cc1df6))
- switch to ESM ([55c8309](https://github.com/3rd/auto/commit/55c83091d6659ca592fa6a8471d2c30077feab44))

### Features

- replace enquirer with inquirer ([5185db2](https://github.com/3rd/auto/commit/5185db250556a54de6ed2e474c5e1d9c4563c6bc))

# 1.0.0 (2023-05-25)

### Bug Fixes

- @types/\* resolution ([216a4af](https://github.com/3rd/auto/commit/216a4afd68f96223d5234b2d19e9f985f328ea2e))
- add ESM loader ([c861ce0](https://github.com/3rd/auto/commit/c861ce0e2c2d800cd00ddbfe4477374f14bc8d72))
- auto loader patch with cjs ([ed524c8](https://github.com/3rd/auto/commit/ed524c83d448a566df2ab6a54bf1c1d84b65a732))
- disable default libs in repo tsconfig.json ([cb58392](https://github.com/3rd/auto/commit/cb58392d3a743ae5cf1e7736df3952e63d5071b0))
- react component generator example ([0574c70](https://github.com/3rd/auto/commit/0574c704e00bc8914909629fd87c15cc7cbd4625))
- set global repo path to ~/.config/auto and add note about local repos ([1072316](https://github.com/3rd/auto/commit/1072316de0ea4c4ce88b677784213b17886d7aab))

### Features

- add fetch global ([2224b6e](https://github.com/3rd/auto/commit/2224b6e59b2353c8ea995f41fb58d2c4680b7bcc))
- add local repository support (./auto, ./.auto) ([c51146b](https://github.com/3rd/auto/commit/c51146bcac0d5c035c7276b2f3f5839fdaab45f5))
- auto-setup tsconfig.json for user in repository ([0424d9d](https://github.com/3rd/auto/commit/0424d9dd27283a9925a5dc2b64a49260582ec5b6))
- boostrap auto/globals ([aabe2ad](https://github.com/3rd/auto/commit/aabe2adebdf96757440ce99abccfd97d702b6704))
- change auto-generated tsconfig.json to default to react-jsx ([6978a31](https://github.com/3rd/auto/commit/6978a31beee8b7258506b5160152076067bc73e6))
- configurable repository path (~/.config/auto and env) ([6d01e5c](https://github.com/3rd/auto/commit/6d01e5c01f8395059ef9b5460dd9ddd8ad35e8ab))
- dynamic template loading ([4aae631](https://github.com/3rd/auto/commit/4aae6311c68e9ecad3c41fe555376ed619343d57))
- file abstraction, templating, type rework, dynamic default param values ([d8558bc](https://github.com/3rd/auto/commit/d8558bca89c5efcf5f20200db1f434b2a66b65c7))
- global utilities ([63caf8e](https://github.com/3rd/auto/commit/63caf8e6f62735ebddbba86e078c4b3d3874303b))
- override "auto" imports using a custom loader ([601f8e2](https://github.com/3rd/auto/commit/601f8e24fec3e66c9ed18b3acae54db8a7e2f9e2))
- prompt wrapper ([7b589f1](https://github.com/3rd/auto/commit/7b589f1b2c63f8adecddd4790d238b6d3eb0b621))
- repl - enable term mode and add history support ([0c3e65a](https://github.com/3rd/auto/commit/0c3e65a81b2e6a64092d8aeaada585bf0e4e6242))
- repl and more global utilities ([7aeae9a](https://github.com/3rd/auto/commit/7aeae9a0f7119e03fdd3e411b579f6a4d5c0285a))
- replace generate({ substitute }) with global mustache ([c62e031](https://github.com/3rd/auto/commit/c62e031973068d875e34a63fae0a776a8d562016))
- **setup:** configure semantic-release and setup release action ([f5a48ff](https://github.com/3rd/auto/commit/f5a48ff54ce868e2eba2b6eaf8614b8dc1193565))
- use a symbol to filter valid modules and discard errored imports ([ff05205](https://github.com/3rd/auto/commit/ff052056571d0564fcabd282d2d681e67aff76cc))
