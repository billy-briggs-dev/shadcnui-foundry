export type AccordionType = "single" | "multiple";

export type AccordionItem = {
  id: string;
  trigger: string;
  content: string;
  disabled?: boolean;
};

export const DEFAULT_ACCORDION_ITEMS: AccordionItem[] = [
  {
    id: "item-1",
    trigger: "What is shadcnui-foundry?",
    content: "A shared multi-framework component library.",
  },
  {
    id: "item-2",
    trigger: "How do I consume components?",
    content: "Import from the framework package index and render directly.",
  },
  {
    id: "item-3",
    trigger: "Is accessibility included?",
    content: "Yes, trigger and region attributes are wired for keyboard/screen readers.",
    disabled: true,
  },
];

export function nextOpenIds(current: string[], id: string, type: AccordionType): string[] {
  const hasId = current.includes(id);
  if (type === "single") {
    return hasId ? [] : [id];
  }
  return hasId ? current.filter((entry) => entry !== id) : [...current, id];
}
