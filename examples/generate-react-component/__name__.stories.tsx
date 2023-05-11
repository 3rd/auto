import type { StoryObj, Meta } from "@storybook/react";
import { __name__ } from "./__name__";

const meta: Meta<typeof __name__> = {
  title: "__name__",
  component: __name__,
};
export default meta;

type Story = StoryObj<typeof __name__>;

export const Default: Story = {
  args: {},
};
