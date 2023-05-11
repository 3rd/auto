import "auto";

const files = {
  index: 'export * from "./__name__";',
  component: `
import React from "react";

export interface __name__Props {
}

export const __name__ = (props: __name__Props) => {
  return (
    <div>__name__</div>
  );
};`.trim(),
  storybook: `
import { ComponentStory } from "@storybook/react";
import { __name__, __name__Props } from "./__name__";

export default {
  title: "__name__",
  component: __name__,
};

const Template: ComponentStory<typeof __name__> = (props: __name__Props) => {
  return <__name__ {...props} />;
};

export const Default = Template.bind({});
Default.args = {};`.trim(),
};

export default auto({
  id: "react-component-inline",
  title: "React Component (inline)",
  params: {
    name: {
      title: "Component Name",
      type: "string",
    },
  },
  isValid: (project) => project.hasDependency("react"),
  run: async ({ project, params, self, t }) => {
    console.log("Running:", self.id);

    const componentDirectoryPath = await prompt.string(
      "Target path:",
      `${project.hasDirectory("src/components") ? "src/components" : ""}/${params.name}`
    );

    // component directory
    console.log("Creating directory:", componentDirectoryPath);
    project.createDirectory(componentDirectoryPath);

    // component
    project.writeFile(t(`${componentDirectoryPath}/__name__.tsx`), t(files.component));

    // index
    project.writeFile(t(`${componentDirectoryPath}/index.ts`), t(files.index));

    // story (storybook)
    if (project.hasDependency("@storybook/react")) {
      project.writeFile(t(`${componentDirectoryPath}/__name__.stories.tsx`), t(files.storybook));
    }

    // test (testing-library)
    if (project.hasDependency("@testing-library/react")) {
      const hasUserEvent = project.hasDependency("@testing-library/user-event");
      const content = t(
        [
          'import { render, screen } from "@testing-library/react";',
          hasUserEvent && 'import userEvent from "@testing-library/user-event";',
          `
import { __name__ } from "./__name__";

describe("__name__", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.todo("should render");
});`.trim(),
        ]
          .filter(Boolean)
          .join("\n")
      );
      project.writeFile(t(`${componentDirectoryPath}/__name__.test.tsx`), content);
    }
  },
});
