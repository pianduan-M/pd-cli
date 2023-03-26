export default (cli) => {
  cli.injectPrompt({
    name: "projectType",
    message: "选择项目类型版本",
    type: "list",
    choices: [
      {
        name: "基础模版",
        value: "base",
      },
      {
        name: "admin",
        value: "admin",
      },
      {
        name: "大屏",
        value: "screen",
      },
      {
        name: "移动端",
        value: "mobile",
      },
      {
        name: "uniapp",
        value: "uniapp",
      },
    ],
    default: "base",
  });
};
