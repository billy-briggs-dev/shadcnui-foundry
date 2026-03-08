import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./button.js";

const meta = {
  title: "Lit/Button",
  args: {
    label: "Button",
    variant: "default",
    size: "default",
    disabled: false,
  },
  render: ({ label, variant, size, disabled, ariaLabel, ariaPressed }) =>
    html`<foundry-button
      .label=${label}
      .variant=${variant}
      .size=${size}
      .disabled=${disabled}
      aria-label=${ariaLabel ?? ""}
      aria-pressed=${ariaPressed ?? ""}
    ></foundry-button>`,
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const GhostIcon: Story = {
  args: {
    label: "☆",
    variant: "ghost",
    size: "icon",
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
