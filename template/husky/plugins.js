export const huskyPlugins = ["husky", "lint-staged"];

export const commitPlugins =[
  'commitlint',
  "@commitlint/config-conventional",
  "commitizen",
  "commitlint-config-cz",
  "cz-customizable",
  
]

export const lintStagedConfig = {
  "*.{js,jsx,ts,tsx,vue,css,scss}": ["prettier --write .", "eslint  --fix"],
  "*.md": ["prettier --write"],
};
