export default (cli) => {
  cli.injectPrompt({
    name: 'typescript',
    message: '是否使用 typescript',
    type: 'confirm',
  })
}
