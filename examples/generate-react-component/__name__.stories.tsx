import { ComponentStory } from "@storybook/react";
import { __name__, __name__Props } from "./__name__";

export default {
  title: "__name__",
  component: __name__,
};

const Template: ComponentStory<typeof __name__> = (props: __name__Props) => {
  return <__name__ {...props}/>;
};

export const Default = Template.bind({});
Default.args = {};
