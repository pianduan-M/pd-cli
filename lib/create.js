import path from "node:path";
import inquirer from "inquirer";
import fs from "fs-extra";
import chalk from "chalk";
import { exit } from "../utils/exit.js";
import validateProjectName from "validate-npm-package-name";
import { getPromptModules } from "../utils/createTools.js";
import { stopSpinner } from "../utils/spinner.js";
import { error, clearConsole } from "../utils/logger.js";
import { Creator } from "./Creator.js";

async function create(projectName, options) {
  if (options.proxy) {
    process.env.HTTP_PROXY = options.proxy;
  }

  const cwd = options.cwd || process.cwd();
  const inCurrent = projectName === ".";
  const name = inCurrent ? path.relative("../", cwd) : projectName;
  const targetDir = path.resolve(cwd, projectName || ".");

  // 检查项目名是否重名
  const result = validateProjectName(name);
  if (!result.validForNewPackages) {
    console.error(chalk.red(`Invalid project name: "${name}"`));
    result.errors &&
      result.errors.forEach((err) => {
        console.error(chalk.red.dim("Error: " + err));
      });
    result.warnings &&
      result.warnings.forEach((warn) => {
        console.error(chalk.red.dim("Warning: " + warn));
      });
    exit(1);
  }

  // 检查路径是否存在
  if (fs.existsSync(targetDir) && !options.merge) {
    // 如果存在目录
    // 覆盖
    if (options.force) {
      await fs.remove(targetDir);
    } else {
      // 不覆盖
      await clearConsole();
      if (inCurrent) {
        const { ok } = await inquirer.prompt([
          {
            name: "ok",
            type: "confirm",
            message: `Generate project in current directory?`,
          },
        ]);

        if (!ok) {
          return;
        }
      } else {
        const { action } = await inquirer.prompt([
          {
            name: "action",
            type: "list",
            message: `Target directory ${chalk.cyan(
              targetDir
            )} already exists. Pick an action:`,
            choices: [
              { name: "Overwrite", value: "overwrite" },
              { name: "Merge", value: "merge" },
              { name: "Cancel", value: false },
            ],
          },
        ]);

        if (!action) {
          return;
        } else if (action === "overwrite") {
          console.log(`\nRemoving ${chalk.cyan(targetDir)}...`);
          await fs.remove(targetDir);
        }
      }
    }
  }

  const promptModules = await getPromptModules();
  const creator = new Creator(name, targetDir, promptModules);

  await creator.create(options);
}

export default (...args) => {
  return create(...args).catch((err) => {
    stopSpinner(false); // do not persist
    error(err);
    exit(1);
  });
};
