import { execa } from "execa";
import readline from "readline";
import { loadOptions } from "../lib/options.js";
import { logWithSpinner, stopSpinner } from "./spinner.js";


function toStartOfLine(stream) {
  if (!chalk.supportsColor) {
    stream.write("\r");
    return;
  }
  readline.cursorTo(stream, 0);
}

function renderProgressBar(curr, total) {
  const ratio = Math.min(Math.max(curr / total, 0), 1);
  const bar = ` ${curr}/${total}`;
  const availableSpace = Math.max(0, process.stderr.columns - bar.length - 3);
  const width = Math.min(total, availableSpace);
  const completeLength = Math.round(width * ratio);
  const complete = `#`.repeat(completeLength);
  const incomplete = `-`.repeat(width - completeLength);
  toStartOfLine(process.stderr);
  process.stderr.write(`[${complete}${incomplete}]${bar}`);
}

export const executeCommand = (command, args, cwd) => {
  return new Promise((resolve, reject) => {
    const child = execa(command, args, {
      cwd,
      stdio: ["inherit", "inherit", command === "yarn" ? "pipe" : "inherit"],
    });

    // filter out unwanted yarn output
    if (command === "yarn") {
      child.stderr.on("data", (buf) => {
        const str = buf.toString();
        if (/warning/.test(str)) {
          return;
        }

        // progress bar
        const progressBarMatch = str.match(/\[.*\] (\d+)\/(\d+)/);
        if (progressBarMatch) {
          // since yarn is in a child process, it's unable to get the width of
          // the terminal. reimplement the progress bar ourselves!
          renderProgressBar(progressBarMatch[1], progressBarMatch[2]);
          return;
        }

        process.stderr.write(buf);
      });
    }

    child.on("close", (code) => {
      console.log(code, "code");
      if (code !== 0) {
        reject(new Error(`command failed: ${command} ${args.join(" ")}`));
        return;
      }
      resolve();
    });
  });
};


export async function installPlugins(args) {
  const packageManager = loadOptions().packageManager || "npm";
  const context = process.cwd();
  logWithSpinner("installing plugins ...");
  await executeCommand(
    packageManager,
    [packageManager === "npm" ? "i" : "add", ...args, "--save-dev"],
    context
  );
  stopSpinner();
}
