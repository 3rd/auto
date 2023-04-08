import { asTemplate } from "../../types";

const content = {
  "src/components/{{name}}/{{name}}.tsx": `
    import React from "react";

    export interface {{name}}Props {
    }

    export const {{name}} = (props: {{name}}Props) => {
      return (
        <div>{{name}}</div>
      );
    };
  `,
};

export default asTemplate({
  id: "react-component",
  title: "React Component",
  params: {
    name: {
      title: "Component Name",
      type: "string",
    },
    // age: {
    //   title: "Age",
    //   type: "number",
    // },
    // test: {
    //   title: "Yes?",
    //   type: "boolean",
    // },
  },
  isValidForContext: (context) => context.project.isReactProject,
  generate: ({ context, params, template }) => {
    console.log("Running generator:", template.id);
    console.log({ context, params });

    // expect to have a src/components folder
    if (!context.project.hasDirectory("src/components")) {
      throw new Error("src/components folder not found");
    }

    // create a new folder with the component name
    const componentDirectoryPath = `src/components/${params.name}`;
    console.log("Creating directory:", componentDirectoryPath);
    context.project.createDirectory(componentDirectoryPath);

    // write files
    for (const [filePath, fileContent] of Object.entries(content)) {
      const filePathWithParams = filePath.replace(/{{(\w+)}}/g, (_, key) => {
        if (key in params) return (params as any)[key];
        return `{{${key}}}`;
      });
      const fileContentWithParams = fileContent.replace(/{{(\w+)}}/g, (_, key) => {
        if (key in params) return (params as any)[key];
        return `{{${key}}}`;
      });

      console.log("Writing file:", filePathWithParams);
      console.log("Writing file content:", fileContentWithParams);
      context.project.writeFile(filePathWithParams, fileContentWithParams);
    }
  },
});
