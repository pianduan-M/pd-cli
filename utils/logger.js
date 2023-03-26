import readline from "node:readline";
import stripAnsi from "strip-ansi";
import chalk from "chalk";
import { stopSpinner } from "./spinner.js";

const format = (label, msg) => {
  return msg
    .split("\n")
    .map((line, i) => {
      return i === 0
        ? `${label} ${line}`
        : line.padStart(stripAnsi(label).length + line.length + 1);
    })
    .join("\n");
};

const chalkTag = (msg) => chalk.bgBlackBright.white.dim(` ${msg} `);

export const log = (msg = "", tag = null) => {
  tag ? console.log(format(chalkTag(tag), msg)) : console.log(msg);
};

export const info = (msg, tag = null) => {
  console.log(
    format(chalk.bgBlue.black(" INFO ") + (tag ? chalkTag(tag) : ""), msg)
  );
};

export const done = (msg, tag = null) => {
  console.log(
    format(chalk.bgGreen.black(" DONE ") + (tag ? chalkTag(tag) : ""), msg)
  );
};

export const warn = (msg, tag = null) => {
  console.warn(
    format(
      chalk.bgYellow.black(" WARN ") + (tag ? chalkTag(tag) : ""),
      chalk.yellow(msg)
    )
  );
};

export const error = (msg, tag = null) => {
  stopSpinner();
  console.error(
    format(chalk.bgRed(" ERROR ") + (tag ? chalkTag(tag) : ""), chalk.red(msg))
  );
  if (msg instanceof Error) {
    console.error(msg.stack);
  }
};

export const clearConsole = (title) => {
  if (process.stdout.isTTY) {
    const blank = "\n".repeat(process.stdout.rows);
    console.log(blank);
    readline.cursorTo(process.stdout, 0, 0);
    readline.clearScreenDown(process.stdout);
    if (title) {
      console.log(title);
    }
  }
};
