import { defineComponent, h, ref } from "vue";

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

export const Accordion = defineComponent({
  name: "Accordion",
  props: {
    items: {
      type: Array as () => AccordionItem[],
      default: () => DEFAULT_ACCORDION_ITEMS,
    },
    type: {
      type: String as () => AccordionType,
      default: "single",
    },
    defaultOpenIds: {
      type: Array as () => string[],
      default: () => ["item-1"],
    },
    ariaLabel: {
      type: String,
      default: "Accordion",
    },
  },
  setup(props) {
    const openIds = ref<string[]>([...props.defaultOpenIds]);

    return () =>
      h(
        "div",
        {
          class: "w-full rounded-lg border bg-card text-card-foreground shadow-sm",
          role: "presentation",
          "aria-label": props.ariaLabel,
        },
        props.items.map((item) => {
          const contentId = `${item.id}-content`;
          const triggerId = `${item.id}-trigger`;
          const isOpen = openIds.value.includes(item.id);

          return h("section", { key: item.id, class: "border-b last:border-b-0" }, [
            h("h3", [
              h(
                "button",
                {
                  id: triggerId,
                  type: "button",
                  "aria-controls": contentId,
                  "aria-expanded": String(isOpen),
                  disabled: item.disabled,
                  class:
                    "flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50",
                  onClick: () => {
                    openIds.value = nextOpenIds(openIds.value, item.id, props.type);
                  },
                },
                [
                  h("span", item.trigger),
                  h("span", { class: "text-xs text-muted-foreground" }, isOpen ? "Open" : "Closed"),
                ],
              ),
            ]),
            h(
              "div",
              {
                id: contentId,
                role: "region",
                "aria-labelledby": triggerId,
                hidden: !isOpen,
                class: "px-4 pb-4 pt-1 text-sm text-muted-foreground",
              },
              item.content,
            ),
          ]);
        }),
      );
  },
});
