import { Component } from "@angular/core";
import { type ButtonSize, type ButtonVariant, getButtonClassName } from "./button-utils.js";

@Component({
  selector: "foundry-button",
  standalone: true,
  inputs: ["variant", "size", "type", "disabled", "ariaLabel", "className", "label"],
  template: `
    <button
      [type]="type"
      [disabled]="disabled"
      [class]="classes"
      [attr.aria-label]="ariaLabel"
      [attr.aria-pressed]="ariaPressed"
    >
      <ng-content>{{ label }}</ng-content>
    </button>
  `,
})
export class ButtonComponent {
  variant: ButtonVariant = "default";
  size: ButtonSize = "default";
  type: "button" | "submit" | "reset" = "button";
  disabled = false;
  ariaLabel: string | null = null;
  ariaPressed: "true" | "false" | null = null;
  className = "";
  label = "Button";

  get classes(): string {
    return getButtonClassName(this.variant, this.size, this.className);
  }
}

export { getButtonClassName } from "./button-utils.js";
export type { ButtonSize, ButtonVariant } from "./button-utils.js";
