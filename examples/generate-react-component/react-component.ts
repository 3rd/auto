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
      },
    },
  },
  isValid: (project) => project.hasDependency("react"),
  run: async ({ project, params, files, self, t }) => {
    console.log("Running:", self.id);

    project.createDirectory(params.path);

    for (const file of files) {
      project.writeFile(t(`${params.path}/${file.path}`), t(file.content));
    }
  },
});
