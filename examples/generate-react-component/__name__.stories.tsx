import type { StoryObj, Meta } from "@storybook/react";
import { __name__ } from "./__name__";
import type { __name__Props } from "./__name__";

const meta: Meta<typeof __name__> = {
  title: "__name__",
  component: __name__,
};
export default meta;

type Story = StoryObj<__name__Props>;

export const Default: Story = {
  args: {},
};
