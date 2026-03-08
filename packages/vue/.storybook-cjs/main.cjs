/** @type {import('@storybook/vue3-vite').StorybookConfig} */
module.exports = {
  framework: "@storybook/vue3-vite",
  stories: ["../stories/**/*.stories.@(ts|tsx)"],
  addons: [],
  core: {
    disableTelemetry: true,
  },
};
