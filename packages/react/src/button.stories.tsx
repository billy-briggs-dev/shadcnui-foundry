import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button.js";

const meta = {
  title: "React/Button",
  component: Button,
  args: {
    children: "Button",
    variant: "default",
    size: "default",
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DestructiveLarge: Story = {
  args: {
    children: "Delete",
    variant: "destructive",
    size: "lg",
  },
};

export const AccessibilityFocus: Story = {
  args: {
    children: "Toggle notifications",
    variant: "secondary",
    "aria-label": "Toggle notifications",
    "aria-pressed": true,
  },
};
