import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import { DEFAULT_ACCORDION_ITEMS } from "./accordion.js";
import "./accordion.js";

const meta = {
  title: "Lit/Accordion",
  args: {
    items: DEFAULT_ACCORDION_ITEMS,
    type: "single",
    defaultOpenIds: ["item-1"],
    ariaLabel: "Lit accordion",
  },
  render: ({ items, type, defaultOpenIds, ariaLabel }) =>
    html`<foundry-accordion
			.items=${items}
			.type=${type}
			.defaultOpenIds=${defaultOpenIds}
			aria-label=${ariaLabel}
		></foundry-accordion>`,
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MultipleOpen: Story = {
  args: {
    type: "multiple",
    defaultOpenIds: ["item-1", "item-2"],
  },
};

export const AccessibilityFocus: Story = {
  args: {
    ariaLabel: "Frequently asked questions accordion",
    items: DEFAULT_ACCORDION_ITEMS.map((item, index) => ({
      ...item,
      trigger: `${index + 1}. ${item.trigger}`,
    })),
  },
};
