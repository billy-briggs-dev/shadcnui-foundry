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

function mapPropTypeToTs(prop: Prop): string {
  if (prop.type === "enum" && prop.values && prop.values.length > 0) {
    return prop.values.map((value) => `"${value}"`).join(" | ");
  }

  if (prop.type === "union" && prop.values && prop.values.length > 0) {
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
    case "node":
      return "unknown";
    case "ref":
      return "unknown";
    case "union":
      return "unknown";
    case "enum":
      return "string";
    default:
      return "unknown";
  }
}

function inferDefaultValue(prop: Prop): string | undefined {
  if (typeof prop.defaultValue === "string" && prop.defaultValue.trim().length > 0) {
    return prop.defaultValue;
  }

  if (prop.type === "boolean") {
    return "false";
  }

  if (prop.type === "string") {
    return '""';
  }

  return undefined;
}

function createInputFields(props: Prop[]): string {
  if (props.length === 0) {
    return "";
  }

  return props
    .map((prop) => {
      const tsType = mapPropTypeToTs(prop);
      const defaultValue = inferDefaultValue(prop);
      const optionalSuffix = prop.required ? "" : "?";
      const initializer = defaultValue !== undefined ? ` = ${defaultValue}` : "";
      return `  @Input() ${prop.name}${optionalSuffix}: ${tsType}${initializer};`;
    })
    .join("\n");
}

function mergeVariantProps(props: Prop[], variants: Variant[]): Prop[] {
  const byName = new Map<string, Prop>();

  for (const prop of props) {
    byName.set(prop.name, prop);
  }

  for (const variant of variants) {
    if (byName.has(variant.name)) {
      continue;
    }

    byName.set(variant.name, {
      name: variant.name,
      type: "enum",
      values: variant.values,
      required: false,
      defaultValue: variant.defaultValue ? `"${variant.defaultValue}"` : undefined,
      forwarded: false,
    });
  }

  return [...byName.values()]
    .filter((prop) => prop.name !== "children")
    .sort((a, b) => a.name.localeCompare(b.name));
}

function mapOverlayTag(role: string | undefined): string {
  switch (role) {
    case "textbox":
      return "input";
    case "button":
      return "button";
    default:
      return "div";
  }
}

export class AngularEmitter implements Emitter {
  readonly framework = "angular";

  async emit(transformed: TransformedComponent): Promise<PipelineResult<GeneratedFile[]>> {
    const componentName = toPascalCase(transformed.componentId);
    const selector = `foundry-${transformed.componentId}`;
    const isOverlayComponent = ["dialog", "popover", "dropdown-menu", "select"].includes(
      transformed.componentId,
    );
    const maybeIr = (transformed.spec as { ir?: ComponentIR }).ir;
    const overlayRole = maybeIr?.a11y.roles[0];
    const overlayTag = mapOverlayTag(overlayRole);
    const props = maybeIr ? mergeVariantProps(maybeIr.props, maybeIr.variants) : [];
    const inputFields = createInputFields(props);
    const usesInputs = inputFields.length > 0;
    const shouldUseOverlayClass = isOverlayComponent;

    const imports = shouldUseOverlayClass
      ? usesInputs
        ? "{ Component, ElementRef, HostListener, Input, OnDestroy, OnInit, Renderer2, inject }"
        : "{ Component, ElementRef, HostListener, OnDestroy, OnInit, Renderer2, inject }"
      : usesInputs
        ? "{ Component, Input }"
        : "{ Component }";

    const overlayTemplate = isOverlayComponent
      ? `  template: \`
    <button type=\"button\" class=\"${transformed.componentId}-trigger\" (click)=\"openOverlay()\">Open</button>
    <${overlayTag}
      *ngIf=\"open\"
      class=\"${transformed.componentId} overlay\"
      tabindex=\"-1\"
      [attr.role]=\"'${overlayRole ?? ""}'\"
      [attr.data-foundry-overlay]=\"'${transformed.componentId}'\"
    >
      <ng-content />
    </${overlayTag}>
  \`,`
      : `  template: \`
    <div class=\"${transformed.componentId}\">
      <ng-content />
    </div>
  \`,`;

    const overlayClassBody = isOverlayComponent
      ? `
  readonly host = inject(ElementRef<HTMLElement>);
  readonly renderer = inject(Renderer2);
  open = false;

  ngOnInit(): void {
    // Portal rendering strategy: move host into document.body for overlay components.
    this.renderer.appendChild(document.body, this.host.nativeElement);
  }

  ngOnDestroy(): void {
    this.renderer.removeChild(document.body, this.host.nativeElement);
  }

  openOverlay(): void {
    this.open = true;
  }

  @HostListener("document:keydown", ["$event"])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (!this.open) return;
    if (event.key === "Escape") {
      this.open = false;
      return;
    }

    if (event.key !== "Tab") return;

    const root = this.host.nativeElement.querySelector<HTMLElement>("[data-foundry-overlay=\"${transformed.componentId}\"]");
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
  }
`
      : "";

    const classImplements = shouldUseOverlayClass ? " implements OnInit, OnDestroy" : "";
    const classBodySections = [inputFields, overlayClassBody].filter(
      (section) => section.length > 0,
    );
    const classBody = classBodySections.join("\n");

    const content = `// @generated by shadcnui-foundry — DO NOT EDIT MANUALLY
// Run \`foundry generate ${transformed.componentId}\` to regenerate
import ${imports} from "@angular/core";

@Component({
  selector: "${selector}",
  standalone: true,
${overlayTemplate}
})
export class ${componentName}Component${classImplements} {
${classBody}
}
`;
    return {
      success: true,
      data: [
        {
          path: `${transformed.componentId}/${transformed.componentId}.component.ts`,
          content,
          componentId: transformed.componentId,
          framework: "angular",
          generated: true,
          irHash: "",
        },
      ],
    };
  }
}
