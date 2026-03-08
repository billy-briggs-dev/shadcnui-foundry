import type { Meta, StoryObj } from "@storybook/vue3";
import { Accordion, DEFAULT_ACCORDION_ITEMS } from "./accordion.js";

const meta = {
  title: "Vue/Accordion",
  component: Accordion,
  args: {
    items: DEFAULT_ACCORDION_ITEMS,
    type: "single",
    defaultOpenIds: ["item-1"],
    ariaLabel: "Vue accordion",
  },
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
