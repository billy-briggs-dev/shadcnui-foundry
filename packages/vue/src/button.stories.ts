import type { Meta, StoryObj } from "@storybook/vue3";
import { Button } from "./button.js";

const meta = {
  title: "Vue/Button",
  component: Button,
  args: {
    variant: "default",
    size: "default",
    className: "",
  },
  render: (args) => ({
    components: { Button },
    setup() {
      return { args };
    },
    template: '<Button v-bind="args">{{ args.label ?? "Button" }}</Button>',
  }),
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Button",
  },
};

export const OutlineSmall: Story = {
  args: {
    label: "Outline",
    variant: "outline",
    size: "sm",
  },
};

export const AccessibilityFocus: Story = {
  args: {
    label: "Toggle notifications",
    variant: "secondary",
    ariaLabel: "Toggle notifications",
    ariaPressed: "true",
  },
};
