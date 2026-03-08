import { LitElement, type PropertyValues, css, html, unsafeCSS } from "lit";

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

const tw = css`${unsafeCSS(`
  .accordion-root{width:100%;border-radius:.5rem;border:1px solid hsl(var(--border));background:hsl(var(--card));color:hsl(var(--card-foreground));box-shadow:0 1px 2px rgba(0,0,0,.06)}
  .accordion-item{border-bottom:1px solid hsl(var(--border))}
  .accordion-item:last-child{border-bottom:none}
  .accordion-trigger{display:flex;width:100%;align-items:center;justify-content:space-between;padding:.75rem 1rem;text-align:left;font-size:.875rem;font-weight:500;background:transparent;border:none;cursor:pointer}
  .accordion-trigger[disabled]{opacity:.5;cursor:not-allowed}
  .accordion-content{padding:.25rem 1rem 1rem;font-size:.875rem;color:hsl(var(--muted-foreground))}
  .accordion-state{font-size:.75rem;color:hsl(var(--muted-foreground))}
`)}`;

export class AccordionElement extends LitElement {
  static override properties = {
    items: { attribute: false },
    type: { type: String },
    defaultOpenIds: { attribute: false },
    ariaLabel: { type: String, attribute: "aria-label" },
  };

  static override styles = [tw];

  items: AccordionItem[] = DEFAULT_ACCORDION_ITEMS;
  type: AccordionType = "single";
  defaultOpenIds: string[] = ["item-1"];
  override ariaLabel = "Accordion";
  private openIds: string[] = ["item-1"];

  override createRenderRoot(): this {
    return this;
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("defaultOpenIds")) {
      this.openIds = [...this.defaultOpenIds];
    }
  }

  private toggle(id: string): void {
    this.openIds = nextOpenIds(this.openIds, id, this.type);
    this.requestUpdate();
  }

  private isOpen(id: string): boolean {
    return this.openIds.includes(id);
  }

  override render() {
    return html`
      <div class="accordion-root" role="presentation" aria-label=${this.ariaLabel}>
        ${this.items.map((item) => {
          const open = this.isOpen(item.id);
          return html`
            <section class="accordion-item">
              <h3>
                <button
                  id=${`${item.id}-trigger`}
                  class="accordion-trigger"
                  type="button"
                  aria-controls=${`${item.id}-content`}
                  aria-expanded=${String(open)}
                  ?disabled=${Boolean(item.disabled)}
                  @click=${() => this.toggle(item.id)}
                >
                  <span>${item.trigger}</span>
                  <span class="accordion-state">${open ? "Open" : "Closed"}</span>
                </button>
              </h3>
              <div
                id=${`${item.id}-content`}
                role="region"
                aria-labelledby=${`${item.id}-trigger`}
                ?hidden=${!open}
                class="accordion-content"
              >
                ${item.content}
              </div>
            </section>
          `;
        })}
      </div>
    `;
  }
}

if (!customElements.get("foundry-accordion")) {
  customElements.define("foundry-accordion", AccordionElement);
}
