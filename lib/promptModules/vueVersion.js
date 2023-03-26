export default (cli) => {
  cli.injectPrompt({
    name: 'vueVersion',
    message: '选择 vue.js 版本',
    type: 'list',
    choices: [
      {
        name: '3.x',
        value: 'vue3',
      },
      {
        name: '2.x',
        value: 'vue2',
      },
    ],
    default: 'vue3',
  })
}
