import type { Emitter, TransformedComponent } from "@shadcnui-foundry/core";
import type { GeneratedFile, PipelineResult } from "@shadcnui-foundry/ir";

type ReactPropSpec = {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  description?: string;
};

type ReactVariantSpec = {
  name: string;
  values: string[];
  defaultValue?: string;
};

type ReactA11ySpec = {
  roles: string[];
  requiredAttributes: string[];
  optionalAttributes: string[];
};

type ReactSpec = {
  componentName: string;
  propsInterface: ReactPropSpec[];
  variants: ReactVariantSpec[];
  a11y: ReactA11ySpec;
};

function isIdentifier(name: string): boolean {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name);
}

function toPropKey(name: string): string {
  return isIdentifier(name) ? name : `"${name}"`;
}

function mapBaseElement(role: string | undefined): {
  htmlTag: string;
  domElement: string;
  attrType: string;
} {
  switch (role) {
    case "button":
      return {
        htmlTag: "button",
        domElement: "HTMLButtonElement",
        attrType: "ButtonHTMLAttributes",
      };
    case "textbox":
      return { htmlTag: "input", domElement: "HTMLInputElement", attrType: "InputHTMLAttributes" };
    case "checkbox":
      return { htmlTag: "input", domElement: "HTMLInputElement", attrType: "InputHTMLAttributes" };
    case "switch":
      return {
        htmlTag: "button",
        domElement: "HTMLButtonElement",
        attrType: "ButtonHTMLAttributes",
      };
    case "tab":
      return {
        htmlTag: "button",
        domElement: "HTMLButtonElement",
        attrType: "ButtonHTMLAttributes",
      };
    case "link":
      return { htmlTag: "a", domElement: "HTMLAnchorElement", attrType: "AnchorHTMLAttributes" };
    case "menu":
      return { htmlTag: "ul", domElement: "HTMLUListElement", attrType: "HTMLAttributes" };
    case "menuitem":
      return { htmlTag: "li", domElement: "HTMLLIElement", attrType: "HTMLAttributes" };
    case "listbox":
      return { htmlTag: "ul", domElement: "HTMLUListElement", attrType: "HTMLAttributes" };
    case "option":
      return { htmlTag: "li", domElement: "HTMLLIElement", attrType: "HTMLAttributes" };
    case "navigation":
      return { htmlTag: "nav", domElement: "HTMLElement", attrType: "HTMLAttributes" };
    case "dialog":
      return { htmlTag: "dialog", domElement: "HTMLDialogElement", attrType: "HTMLAttributes" };
    default:
      return { htmlTag: "div", domElement: "HTMLDivElement", attrType: "HTMLAttributes" };
  }
}

function escapeJsString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\"/g, '\\"');
}

function ensureVariantProps(props: ReactPropSpec[], variants: ReactVariantSpec[]): ReactPropSpec[] {
  const merged = new Map<string, ReactPropSpec>();

  for (const prop of props) {
    merged.set(prop.name, prop);
  }

  for (const variant of variants) {
    if (merged.has(variant.name)) {
      continue;
    }

    merged.set(variant.name, {
      name: variant.name,
      type: variant.values.map((value) => `"${value}"`).join(" | ") || "string",
      required: false,
      ...(variant.defaultValue !== undefined && {
        defaultValue: `"${escapeJsString(variant.defaultValue)}"`,
      }),
      description: `Variant: ${variant.name}`,
    });
  }

  return [...merged.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function createA11yPropSpecs(a11y: ReactA11ySpec): ReactPropSpec[] {
  const attrs = [...new Set([...a11y.requiredAttributes, ...a11y.optionalAttributes])].sort(
    (a, b) => a.localeCompare(b),
  );

  return attrs
    .filter((attr) => attr.startsWith("aria-"))
    .map((attr) => ({
      name: attr,
      type: "string",
      required: a11y.requiredAttributes.includes(attr),
      description: `Accessibility attribute: ${attr}`,
    }));
}

export class ReactEmitter implements Emitter {
  readonly framework = "react";

  async emit(transformed: TransformedComponent): Promise<PipelineResult<GeneratedFile[]>> {
    const { componentName, propsInterface, variants, a11y } = transformed.spec as ReactSpec;
    const isOverlayComponent = ["dialog", "popover", "dropdown-menu", "select"].includes(
      transformed.componentId,
    );
    const allProps = ensureVariantProps(propsInterface, variants);
    const a11yProps = createA11yPropSpecs(a11y);
    const allPropsWithA11y = [
      ...new Map([...allProps, ...a11yProps].map((prop) => [prop.name, prop])).values(),
    ]
      .filter((prop) => prop.name !== "children")
      .sort((a, b) => a.name.localeCompare(b.name));

    const primaryRole = a11y.roles[0];
    const roleAttr = primaryRole ? ` role="${primaryRole}"` : "";
    const baseElement = mapBaseElement(primaryRole);

    const propsLines = allPropsWithA11y.map((p) => {
      const opt = p.required ? "" : "?";
      const comment = p.description ? `  /** ${p.description} */\n` : "";
      return `${comment}  ${toPropKey(p.name)}${opt}: ${p.type};`;
    });

    const defaultsLines = allPropsWithA11y
      .filter((p) => p.defaultValue !== undefined && isIdentifier(p.name))
      .map((p) => `  ${p.name} = ${p.defaultValue},`);

    const variantNames = [...variants]
      .map((variant) => variant.name)
      .sort((a, b) => a.localeCompare(b));
    const variantDataAttrs = variantNames
      .map((name) => `        data-${name}={${name} !== undefined ? ${name} : undefined}`)
      .join("\n");

    const attributePropType = `React.${baseElement.attrType}<${baseElement.domElement}>`;

    const classNameBase = escapeJsString(transformed.componentId);

    const overlayImports = isOverlayComponent ? 'import { createPortal } from "react-dom";\n' : "";

    const overlayState = isOverlayComponent
      ? `    const overlayRef = React.useRef<${baseElement.domElement} | null>(null);
    const [open, setOpen] = React.useState(false);

    React.useEffect(() => {
      if (!open) return;

      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") setOpen(false);
      };

      const trapFocus = (event: KeyboardEvent) => {
        if (event.key !== "Tab") return;
        const root = overlayRef.current;
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

      document.addEventListener("keydown", onKeyDown);
      document.addEventListener("keydown", trapFocus);
      return () => {
        document.removeEventListener("keydown", onKeyDown);
        document.removeEventListener("keydown", trapFocus);
      };
    }, [open]);

`
      : "";

    const overlayTriggerAttrs = isOverlayComponent
      ? `
        aria-hidden={!open}
        onClick={() => setOpen((value) => !value)}`
      : "";

    const overlayReturn = isOverlayComponent
      ? `    const overlayContent = (
      <${baseElement.htmlTag}
        ref={overlayRef}${roleAttr}
${variantDataAttrs}
        className={cn("${classNameBase}", className)}
        {...props}
      />
    );

    if (!open || typeof document === "undefined") {
      return (
        <${baseElement.htmlTag}
          ref={ref}${roleAttr}
${variantDataAttrs}
${overlayTriggerAttrs}
          className={cn("${classNameBase}", className)}
          {...props}
        />
      );
    }

    // Portal rendering strategy: overlays mount into document.body.
    return createPortal(overlayContent, document.body);`
      : `    return (
      <${baseElement.htmlTag}
        ref={ref}${roleAttr}
${variantDataAttrs}
        className={cn("${classNameBase}", className)}
        {...props}
      />
    );`;

    const content = `// @generated by shadcnui-foundry — DO NOT EDIT MANUALLY
// Run \`foundry generate ${transformed.componentId}\` to regenerate
import * as React from "react";
${overlayImports}import { cn } from "../utils/cn.js";

export interface ${componentName}Props extends ${attributePropType} {
${propsLines.join("\n")}
}

const ${componentName} = React.forwardRef<${baseElement.domElement}, ${componentName}Props>(
  function ${componentName}(
    {
${defaultsLines.join("\n")}
      className,
      ...props
    },
    ref
  ) {
${overlayState}${overlayReturn}
  }
);
${componentName}.displayName = "${componentName}";

export { ${componentName} };
`;

    const file: GeneratedFile = {
      path: `${transformed.componentId}/${componentName}.tsx`,
      content,
      componentId: transformed.componentId,
      framework: "react",
      generated: true,
      irHash: "",
    };

    return { success: true, data: [file] };
  }
}
