import buttonSource from "@generated/vue/button/Button.vue?raw";
import cardSource from "@generated/vue/card/Card.vue?raw";
import inputSource from "@generated/vue/input/Input.vue?raw";
import type { Meta, StoryObj } from "@storybook/vue3";

type ShellStoryArgs = {
  title: string;
  description: string;
  source: string;
};

const ShellStory = (args: ShellStoryArgs) => ({
  setup() {
    return { args };
  },
  template: `
    <main style="margin:0 auto;max-width:960px;font-family:Inter, Segoe UI, system-ui, sans-serif;padding:2rem 1rem 3rem;">
      <h1 style="margin-top:0;">{{ args.title }}</h1>
      <p style="color:#4b5563;line-height:1.6;">{{ args.description }}</p>

      <section style="border:1px dashed #94a3b8;border-radius:12px;padding:1rem;margin-bottom:1rem;">
        <button style="border:0;border-radius:8px;background:#41b883;color:#032019;padding:0.5rem 0.9rem;">Button</button>
        <div style="height:0.75rem;"></div>
        <input placeholder="Type here" style="border:1px solid #94a3b8;border-radius:8px;max-width:260px;padding:0.45rem 0.6rem;width:100%;" />
      </section>

      <pre style="background:#0f221f;border-radius:8px;color:#e6fff8;margin:0;max-height:340px;overflow:auto;padding:0.8rem;"><code>{{ args.source }}</code></pre>
    </main>
  `,
});

const meta = {
  title: "Generated/Vue",
  render: (args) => ShellStory(args),
  parameters: {
    docs: {
      description: {
        component:
          "Preview generated Vue outputs in Storybook while keeping source snippets visible for quick inspection.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<ShellStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Button: Story = {
  args: {
    title: "Vue Button",
    description: "Generated shell preview and source for Button.",
    source: buttonSource,
  },
};

export const Input: Story = {
  args: {
    title: "Vue Input",
    description: "Generated shell preview and source for Input.",
    source: inputSource,
  },
};

export const Card: Story = {
  args: {
    title: "Vue Card",
    description: "Generated shell preview and source for Card.",
    source: cardSource,
  },
};
