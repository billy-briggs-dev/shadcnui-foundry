import type { Emitter, TransformedComponent } from "@shadcnui-foundry/core";
import type {
  ComponentIR,
  GeneratedFile,
  PipelineResult,
  Prop,
  Variant,
} from "@shadcnui-foundry/ir";

function toPascalCase(value: string): string {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function isIdentifier(value: string): boolean {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value);
}

function toSafeIdentifier(value: string): string {
  if (isIdentifier(value)) {
    return value;
  }

  const normalized = value
    .replace(/[^A-Za-z0-9_$]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0)
    .map((part, index) =>
      index === 0
        ? part.charAt(0).toLowerCase() + part.slice(1)
        : part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join("");

  if (normalized.length > 0 && isIdentifier(normalized)) {
    return normalized;
  }

  return `prop${toPascalCase(value.replace(/[^A-Za-z0-9]+/g, "-"))}`;
}

function mapBaseTag(role: string | undefined): string {
  switch (role) {
    case "button":
      return "button";
    case "textbox":
      return "input";
    case "checkbox":
      return "input";
    case "switch":
      return "button";
    case "tab":
      return "button";
    case "menu":
      return "ul";
    case "menuitem":
      return "li";
    case "listbox":
      return "ul";
    case "option":
      return "li";
    case "navigation":
      return "nav";
    case "dialog":
      return "dialog";
    default:
      return "div";
  }
}

function mapPropertyType(prop: Prop): string {
  if ((prop.type === "enum" || prop.type === "union") && prop.values && prop.values.length > 0) {
    return prop.values.map((value) => `"${value}"`).join(" | ");
  }

  switch (prop.type) {
    case "string":
      return "string";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "array":
      return "unknown[]";
    case "object":
      return "Record<string, unknown>";
    case "function":
      return "(...args: unknown[]) => unknown";
    default:
      return "unknown";
  }
}

function ensureVariantProps(props: Prop[], variants: Variant[]): Prop[] {
  const merged = new Map<string, Prop>();

  for (const prop of props) {
    merged.set(prop.name, prop);
  }

  for (const variant of variants) {
    if (merged.has(variant.name)) {
      continue;
    }

    merged.set(variant.name, {
      name: variant.name,
      type: "enum",
      values: variant.values,
      required: false,
      ...(variant.defaultValue !== undefined && { defaultValue: `"${variant.defaultValue}"` }),
      forwarded: false,
      description: `Variant: ${variant.name}`,
    });
  }

  return [...merged.values()]
    .filter((prop) => prop.name !== "children")
    .sort((a, b) => a.name.localeCompare(b.name));
}

function inferDefault(prop: Prop): string | undefined {
  if (prop.defaultValue !== undefined) {
    return prop.defaultValue;
  }

  if (prop.type === "boolean") {
    return "false";
  }

  return undefined;
}

export class LitEmitter implements Emitter {
  readonly framework = "lit";

  async emit(transformed: TransformedComponent): Promise<PipelineResult<GeneratedFile[]>> {
    const componentName = toPascalCase(transformed.componentId);
    const tagName = `foundry-${transformed.componentId}`;
    const isOverlayComponent = ["dialog", "popover", "dropdown-menu", "select"].includes(
      transformed.componentId,
    );
    const ir = (transformed.spec as { ir?: ComponentIR }).ir;
    const props = ir ? ensureVariantProps(ir.props, ir.variants) : [];
    const ariaAttrs = ir
      ? [...new Set([...ir.a11y.requiredAttributes, ...ir.a11y.optionalAttributes])].filter(
          (attr) => attr.startsWith("aria-"),
        )
      : [];

    const allProps: Prop[] = [
      ...props,
      ...ariaAttrs
        .filter((attr) => !props.some((prop) => prop.name === attr))
        .map((attr) => ({
          name: attr,
          type: "string" as const,
          required: false,
          forwarded: false,
          description: `Accessibility attribute: ${attr}`,
        })),
    ];

    const sortedAllProps = [...allProps].sort((a, b) => a.name.localeCompare(b.name));
    const propBindingByName = new Map<string, string>();
    const usedIdentifiers = new Set<string>();

    for (const prop of sortedAllProps) {
      let identifier = toSafeIdentifier(prop.name);
      let suffix = 1;
      while (usedIdentifiers.has(identifier)) {
        identifier = `${toSafeIdentifier(prop.name)}${suffix}`;
        suffix += 1;
      }
      usedIdentifiers.add(identifier);
      propBindingByName.set(prop.name, identifier);
    }

    const propertyLines = sortedAllProps.map((prop) => {
      const type = mapPropertyType(prop);
      const defaultValue = inferDefault(prop);
      const init = defaultValue !== undefined ? ` = ${defaultValue}` : "";
      const binding = propBindingByName.get(prop.name);
      if (!binding) {
        return "";
      }
      return `  @property({ attribute: ${JSON.stringify(prop.name)} }) ${binding}!: ${type}${init};`;
    });

    const variantAttrs = ir
      ? [...ir.variants]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((variant) => {
            const binding = propBindingByName.get(variant.name) ?? toSafeIdentifier(variant.name);
            return `      data-${variant.name}=\"\${this.${binding} ?? ""}\"`;
          })
          .join("\n")
      : "";

    const ariaBindings = sortedAllProps
      .filter((prop) => prop.name.startsWith("aria-"))
      .map((prop) => {
        const binding = propBindingByName.get(prop.name) ?? toSafeIdentifier(prop.name);
        return `      ${prop.name}=\"\${this.${binding} ?? ""}\"`;
      })
      .join("\n");

    const role = ir?.a11y.roles[0];
    const roleLine = role ? `      role=\"${role}\"\n` : "";
    const baseTag = mapBaseTag(role);

    const overlayMembers = isOverlayComponent
      ? `  @property({ type: Boolean }) open = false;

  private onDocumentKeydown = (event: KeyboardEvent): void => {
    if (!this.open) return;
    if (event.key === "Escape") {
      this.open = false;
      return;
    }

    if (event.key !== "Tab") return;

    const root = this.renderRoot.querySelector<HTMLElement>("[data-foundry-overlay=\"${transformed.componentId}\"]");
    if (!root) return;
    const focusable = root.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener("keydown", this.onDocumentKeydown);
  }

  override disconnectedCallback(): void {
    document.removeEventListener("keydown", this.onDocumentKeydown);
    super.disconnectedCallback();
  }
`
      : "";

    const overlayMembersBlock = overlayMembers.length > 0 ? `${overlayMembers}\n` : "";
    const classSpacer = overlayMembers.length > 0 ? "\n" : "";

    const overlayRender = isOverlayComponent
      ? `    if (!this.open) {
      return html\`<button class=\"${transformed.componentId}-trigger\" @click=\${() => (this.open = true)}>Open</button>\`;
    }

    // Portal rendering strategy: keep host mounted while overlay content is fixed and body-level layered.
    return html\`
      <${baseTag}
        data-foundry-overlay=\"${transformed.componentId}\"
${roleLine}${variantAttrs}
${ariaBindings}
        style=\"position: fixed; inset: 0; z-index: 1000;\"
      >
        <slot></slot>
      </${baseTag}>
    \`;`
      : `    return html\`
      <${baseTag}
${roleLine}${variantAttrs}
${ariaBindings}
      >
        <slot></slot>
      </${baseTag}>
    \`;`;

    const content = `// @generated by shadcnui-foundry — DO NOT EDIT MANUALLY
// Run \`foundry generate ${transformed.componentId}\` to regenerate
import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("${tagName}")
export class ${componentName}Element extends LitElement {
${propertyLines.join("\n")}
${overlayMembersBlock}${classSpacer}
  override render() {
${overlayRender}
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "${tagName}": ${componentName}Element;
  }
}
`;
    return {
      success: true,
      data: [
        {
          path: `${transformed.componentId}/${tagName}.ts`,
          content,
          componentId: transformed.componentId,
          framework: "lit",
          generated: true,
          irHash: "",
        },
      ],
    };
  }
}
