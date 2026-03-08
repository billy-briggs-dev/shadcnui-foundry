import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Button from "./Button.svelte";

const meta = {
  title: "Svelte/Button",
  component: Button,
  args: {
    variant: "default",
    size: "default",
    disabled: false,
  },
  render: () => ({
    Component: Button,
  }),
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OutlineSmall: Story = {
  args: {
    variant: "outline",
    size: "sm",
  },
};

export const AccessibilityFocus: Story = {
  args: {
    variant: "secondary",
    ariaLabel: "Toggle notifications",
  },
};
