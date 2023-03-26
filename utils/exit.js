export const exitProcess =
  !process.env.PD_CLI_API_MODE && !process.env.PD_CLI_TEST;

export const exit = (code) => {
  if (exitProcess.exitProcess) {
    process.exit(code);
  } else if (code > 0) {
    throw new Error(`Process exited with code ${code}`);
  }
};
