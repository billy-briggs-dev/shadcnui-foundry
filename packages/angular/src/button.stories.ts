import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { ButtonComponent } from "./button.js";

const meta = {
  title: "Angular/Button",
  component: ButtonComponent,
  decorators: [
    moduleMetadata({
      imports: [ButtonComponent],
    }),
  ],
  args: {
    label: "Button",
    variant: "default",
    size: "default",
    disabled: false,
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DestructiveLarge: Story = {
  args: {
    label: "Delete",
    variant: "destructive",
    size: "lg",
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
