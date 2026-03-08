import buttonSource from "@generated/lit/button/foundry-button.ts?raw";
import cardSource from "@generated/lit/card/foundry-card.ts?raw";
import inputSource from "@generated/lit/input/foundry-input.ts?raw";
import type { Meta, StoryObj } from "@storybook/web-components";

type ShellStoryArgs = {
  title: string;
  description: string;
  source: string;
};

function renderShell(args: ShellStoryArgs): HTMLElement {
  const host = document.createElement("main");
  host.style.margin = "0 auto";
  host.style.maxWidth = "960px";
  host.style.fontFamily = "Inter, Segoe UI, system-ui, sans-serif";
  host.style.padding = "2rem 1rem 3rem";

  const escapedSource = args.source
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

  host.innerHTML = `
    <h1 style="margin-top:0;">${args.title}</h1>
    <p style="color:#4b5563;line-height:1.6;">${args.description}</p>

    <section style="border:1px dashed #94a3b8;border-radius:12px;padding:1rem;margin-bottom:1rem;">
      <button style="border:0;border-radius:8px;background:#324fff;color:#fff;padding:0.5rem 0.9rem;">Button</button>
      <div style="height:0.75rem;"></div>
      <input placeholder="Type here" style="border:1px solid #94a3b8;border-radius:8px;max-width:260px;padding:0.45rem 0.6rem;width:100%;" />
    </section>

    <pre style="background:#151515;border-radius:8px;color:#f0f0f0;margin:0;max-height:340px;overflow:auto;padding:0.8rem;"><code>${escapedSource}</code></pre>
  `;

  return host;
}

const meta = {
  title: "Generated/Lit",
  render: (args) => renderShell(args),
  parameters: {
    docs: {
      description: {
        component:
          "Preview generated Lit outputs in Storybook while keeping source snippets visible for quick inspection.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<ShellStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Button: Story = {
  args: {
    title: "Lit Button",
    description: "Generated shell preview and source for Button.",
    source: buttonSource,
  },
};

export const Input: Story = {
  args: {
    title: "Lit Input",
    description: "Generated shell preview and source for Input.",
    source: inputSource,
  },
};

export const Card: Story = {
  args: {
    title: "Lit Card",
    description: "Generated shell preview and source for Card.",
    source: cardSource,
  },
};
