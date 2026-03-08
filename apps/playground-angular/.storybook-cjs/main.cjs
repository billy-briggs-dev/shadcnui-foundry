const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..", "..", "..");

/** @type {import('@storybook/html-vite').StorybookConfig} */
module.exports = {
  framework: "@storybook/html-vite",
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
