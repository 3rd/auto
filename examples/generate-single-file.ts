import "auto";

export default auto({
  id: "file",
  title: "Generate single file",
  run: async ({ project }) => {
    const type = await prompt.select({
      message: "Select type",
      choices: [
        {
          value: "tsconfig",
        },
      ],
    });

    if (type === "tsconfig") {
      if (project.hasFile("tsconfig.json")) {
        console.error("tsconfig.json already exists");
      }

      const base = {
        $schema: "https://json.schemastore.org/tsconfig",
        compilerOptions: {
          strict: true,
          allowJs: false,
          checkJs: false,
          noEmit: true,
          esModuleInterop: true,
          skipLibCheck: true,
        },
      };

      const templates = {
        node: {
          module: "Node16",
          target: "ES2022",
          lib: ["ES2023"],
          moduleResolution: "node16",
        },
        react: {
          module: "ESNext",
          target: "ESNext",
          lib: ["DOM", "DOM.Iterable", "ESNext"],
          moduleResolution: "bundler",
          jsx: "react-jsx",
          allowJs: false,
          allowSyntheticDefaultImports: true,
          esModuleInterop: false,
          isolatedModules: true,
          resolveJsonModule: true,
          skipLibCheck: true,
          useDefineForClassFields: true,
        },
      };

      const variant = await prompt.select({
        message: "Select variant",
        choices: Object.keys(templates).map((key) => ({ value: key })),
      });

      const template = templates[variant as keyof typeof templates];

      const options = await prompt.checkbox({
        message: "Select options",
        choices: [
          new prompt.Separator("Features"),
          { value: "noEmit", checked: true },
          { value: "allowJs" },
          { value: "checkJs" },
          new prompt.Separator("Rules"),
          { value: "allowUnreachableCode" },
          { value: "allowUnusedLabels" },
          { value: "exactOptionalPropertyTypes" },
          { value: "forceConsistentCasingInFileNames" },
          { value: "noFallthroughCasesInSwitch" },
          { value: "noImplicitOverride" },
          { value: "noImplicitReturns" },
          { value: "noPropertyAccessFromIndexSignature" },
          { value: "noUncheckedIndexedAccess" },
          { value: "noUnusedLocals" },
          { value: "noUnusedParameters" },
          new prompt.Separator("Paths"),
          { name: "@/* -> src/*", value: "@src" },
        ],
      });

      const config = {
        ...base,
        compilerOptions: {
          ...base.compilerOptions,
          ...template,
          ...options.reduce(
            (acc, option) => {
              if (option === "@src") {
                acc.baseUrl = ".";
                acc.paths = {
                  ...acc.paths,
                  "@/*": ["src/*"],
                };
                return acc;
              }
              acc[option] = true;
              return acc;
            },
            {} as Record<string, any>
          ),
        },
      };

      project.writeFile("tsconfig.json", JSON.stringify(config, null, 2));
      console.log("tsconfig.json created");
    }
  },
});
