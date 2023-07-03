import "auto";

export default auto({
  id: "react-component",
  title: "React Component",
  params: {
    name: {
      title: "Component Name",
      type: "string",
      required: true,
    },
    path: {
      title: "Component Path",
      type: "string",
      defaultValue: ({ project, params }) => {
        if (project.hasDirectory("src/components")) {
          return `src/components/${params.name}`;
        }
        if (project.hasDirectory("components")) {
          return `components/${params.name}`;
        }
      },
    },
  },
  isValid: (project) => project.hasDependency("react"),
  run: async ({ project, params, fileMap, self, t }) => {
    console.log("Running:", self.id);

    project.createDirectory(params.path);

    project.writeFile(t(`${params.path}/index.ts`), t(fileMap["index.ts"]));
    project.writeFile(t(`${params.path}/${params.name}.tsx`), t(fileMap["__name__.tsx"]));
    if (project.hasDependency("jest")) {
      project.writeFile(t(`${params.path}/${params.name}.test.tsx`), t(fileMap["__name__.test.tsx"]));
    }
    if (project.hasDependency("storybook")) {
      project.writeFile(t(`${params.path}/${params.name}.stories.tsx`), t(fileMap["__name__.stories.tsx"]));
    }
  },
});
