import { LitElement, html } from "lit";

export type ButtonVariant =
  | "default"
  | "hover"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";

export type ButtonSize = "default" | "sm" | "lg" | "icon";

const BASE_BUTTON_CLASSES =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

const BUTTON_VARIANT_CLASSES: Record<ButtonVariant, string> = {
  default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
  hover: "bg-primary/90 text-primary-foreground shadow",
  destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
  outline:
    "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
  secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  link: "text-primary underline-offset-4 hover:underline",
};

const BUTTON_SIZE_CLASSES: Record<ButtonSize, string> = {
  default: "h-9 px-4 py-2",
  sm: "h-8 rounded-md px-3 text-xs",
  lg: "h-10 rounded-md px-8",
  icon: "h-9 w-9",
};

export function getButtonClassName(
  variant: ButtonVariant = "default",
  size: ButtonSize = "default",
  className?: string,
): string {
  return [
    BASE_BUTTON_CLASSES,
    BUTTON_VARIANT_CLASSES[variant],
    BUTTON_SIZE_CLASSES[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export class ButtonElement extends LitElement {
  static override properties = {
    variant: { type: String },
    size: { type: String },
    type: { type: String },
    disabled: { type: Boolean },
    label: { type: String },
    ariaLabel: { type: String, attribute: "aria-label" },
    ariaPressed: { type: String, attribute: "aria-pressed" },
    className: { type: String, attribute: "class-name" },
  };

  variant: ButtonVariant = "default";
  size: ButtonSize = "default";
  type: "button" | "submit" | "reset" = "button";
  disabled = false;
  label = "Button";
  override ariaLabel = "";
  override ariaPressed = "";
  override className = "";

  override createRenderRoot(): this {
    return this;
  }

  override render() {
    return html`<button
      type=${this.type}
      class=${getButtonClassName(this.variant, this.size, this.className)}
      ?disabled=${this.disabled}
      aria-label=${this.ariaLabel}
      aria-pressed=${this.ariaPressed}
    >
      <slot>${this.label}</slot>
    </button>`;
  }
}

if (!customElements.get("foundry-button")) {
  customElements.define("foundry-button", ButtonElement);
}
