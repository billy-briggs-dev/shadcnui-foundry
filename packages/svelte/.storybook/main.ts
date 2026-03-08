import type { StorybookConfig } from "@storybook/svelte-vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

const config: StorybookConfig = {
  framework: {
    name: "@storybook/svelte-vite",
    options: {
      docgen: false,
    },
  },
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: [],
  core: {
    disableTelemetry: true,
  },
  async viteFinal(baseConfig) {
    const plugins = baseConfig.plugins ?? [];

    return {
      ...baseConfig,
      plugins: [
        ...plugins,
        svelte({
          include: [/\.svelte$/, /@storybook\/svelte\/static\/.*\.svelte$/],
        }),
      ],
    };
  },
};

export default config;
