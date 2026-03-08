const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..", "..", "..");

/** @type {import('@storybook/vue3-vite').StorybookConfig} */
module.exports = {
  framework: "@storybook/vue3-vite",
  stories: ["../stories/**/*.stories.@(ts|tsx)"],
  addons: [],
  core: {
    disableTelemetry: true,
  },
  async viteFinal(config) {
    return {
      ...config,
      resolve: {
        ...(config.resolve || {}),
        alias: {
          ...(config.resolve?.alias || {}),
          "@generated": path.resolve(repoRoot, "generated"),
        },
      },
      server: {
        ...(config.server || {}),
        fs: {
          ...(config.server?.fs || {}),
          allow: [repoRoot],
        },
      },
    };
  },
};
