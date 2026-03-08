import type { StorybookConfig } from "@storybook/angular";
import { mergeConfig } from "vite";

const config: StorybookConfig = {
  framework: "@storybook/angular",
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: [],
  core: {
    disableTelemetry: true,
    builder: "@storybook/builder-vite",
  },
  async viteFinal(baseConfig) {
    return mergeConfig(baseConfig, {
      define: {
        // Storybook Angular's browser runtime expects this global define.
        STORYBOOK_ANGULAR_OPTIONS: JSON.stringify({}),
      },
    });
  },
};

export default config;
