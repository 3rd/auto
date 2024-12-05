import "auto";

export default auto({
  id: "react-component",
  title: "React Component",
  params: {
    path: {
      title: "Component Path",
      type: "string",
      defaultValue: ({ project }) => {
        if (project.hasDirectory("src/components")) {
          return `src/components/`;
        }
        if (project.hasDirectory("components")) {
          return `components/`;
        }
      },
    },
  },
  isValid: (project) => project.hasDependency("react"),
  run: async ({ project, params, fileMap, self, t }) => {
    console.log("Running:", self.id);

    const parts = params.path.split("/");
    const name = parts.pop();
    if (!name) throw new Error(`Invalid name: ${name}`);

    project.createDirectory(params.path);

    const template: typeof t = (text: string) => t(text, { ...params, name });

    project.writeFile(template(`${params.path}/index.ts`), template(fileMap["index.ts"]));
    project.writeFile(template(`${params.path}/${name}.tsx`), template(fileMap["__name__.tsx"]));
    if (project.hasDependency("jest") || project.hasDependency("@testing-library/react")) {
      project.writeFile(template(`${params.path}/${name}.test.tsx`), template(fileMap["__name__.test.tsx"]));
    }
    if (project.hasDependency("storybook")) {
      project.writeFile(template(`${params.path}/${name}.stories.tsx`), template(fileMap["__name__.stories.tsx"]));
    }
  },
});
