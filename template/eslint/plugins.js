export const basePlugins = [
  "eslint",
  "@babel/core",
  "@babel/eslint-parser",
  "eslint-config-alloy",
];

export const reactPlugins = [
  ...basePlugins,
  "@babel/preset-react@latest",
  "eslint-plugin-react",
];

export const vuePlugins = [
  ...basePlugins,
  "vue-eslint-parser",
  "eslint-plugin-vue",
];

export const vue2Plugins = [
  "eslint@7",
  "@babel/core",
  "@babel/eslint-parser",
  "@vue/cli-plugin-eslint",
  "eslint-plugin-vue",
];

export const tsPlugins = [
  "eslint",
  "typescript",
  "@typescript-eslint/parser",
  "@typescript-eslint/eslint-plugin",
  "eslint-config-alloy",
];

export const reactTsPlugins = [
  "eslint",
  "typescript",
  "@typescript-eslint/parser",
  "@typescript-eslint/eslint-plugin",
  "eslint-plugin-react",
  "eslint-config-alloy",
];

export const vueTsPlugins = [
  "@babel/core",
  "@babel/eslint-parser",
  "@typescript-eslint/eslint-plugin",
  "@typescript-eslint/parser",
  "@vue/eslint-config-typescript",
  "eslint",
  "eslint-config-alloy",
  "eslint-plugin-vue",
  "vue-eslint-parser",
];
