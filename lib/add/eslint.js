import inquirer from "inquirer";
import path from "node:path";
import fs from "fs-extra";
import os from "node:os";
import chalk from "chalk";
import { getFileName } from "../../utils/resolve.js";
import { getVersionByName } from "../../utils/getVersion.js";
import { checkProjectRcFile } from "../../utils/rcPath.js";
import { loadOptions } from "../options.js";
import { executeCommand } from "../../utils/executeCommand.js";
import { logWithSpinner, stopSpinner } from "../../utils/spinner.js";
import { log } from "../../utils/logger.js";
import {
  basePlugins,
  reactPlugins,
  vuePlugins,
  vue2Plugins,
  tsPlugins,
  reactTsPlugins,
  vueTsPlugins,
} from "../../template/eslint/plugins.js";

export const eslint = async (option = {}) => {
  const vueVersion = getVersionByName("vue");
  const reactVersion = getVersionByName("react");
  const typescript = getVersionByName("typescript");
  const eslint = getVersionByName("eslint");

  // 如果项目已经有了 eslint 询问是否继续
  if (eslint.length) {
    const { action } = await inquirer.prompt([
      {
        name: "action",
        type: "confirm",
        message: `该项目已经安装了 eslint 是否继续`,
        default: false,
      },
    ]);

    if (!action) {
      log("exit pd-cli");
      return process.exit(1);
    }
  }

  // 基础 js 项目
  handleInstallBaseProject({ vueVersion, reactVersion, typescript });
  handleInstallTypescriptProject({ vueVersion, reactVersion, typescript });
  handleInstallReactProject({ vueVersion, reactVersion, typescript });
  handleInstallReactTsProject({ vueVersion, reactVersion, typescript });
  handleInstallVueProject({ vueVersion, reactVersion, typescript });
  handleInstallVueTsProject({ vueVersion, reactVersion, typescript });
};

// base
async function handleInstallBaseProject({
  vueVersion,
  reactVersion,
  typescript,
}) {
  // 有其中一个 说明不是普通的 js 项目
  if (vueVersion.length || reactVersion.length || typescript.length) return;

  await installPlugins(basePlugins);

  const baseConfig = fs.readFileSync(
    path.resolve(
      getFileName(import.meta.url),
      "../../../template/eslint/baseConfig.cjs"
    )
  );

  await writeEslintrcFile(baseConfig);
}

// typescript
async function handleInstallTypescriptProject({
  vueVersion,
  reactVersion,
  typescript,
}) {
  // 有其中一个 说明不是普通的 js 项目
  if (vueVersion.length || reactVersion.length || !typescript.length) return;

  await installPlugins(tsPlugins);

  const baseConfig = fs.readFileSync(
    path.resolve(
      getFileName(import.meta.url),
      "../../../template/eslint/tsConfig.cjs"
    )
  );

  await writeEslintrcFile(baseConfig);
}

// react
async function handleInstallReactProject({
  vueVersion,
  reactVersion,
  typescript,
}) {
  if (reactVersion.length && !typescript.length) {
    await installPlugins(reactPlugins);

    const baseConfig = fs.readFileSync(
      path.resolve(
        getFileName(import.meta.url),
        "../../../template/eslint/reactConfig.cjs"
      )
    );

    await writeEslintrcFile(baseConfig);
  }
}

// react typescript
async function handleInstallReactTsProject({
  vueVersion,
  reactVersion,
  typescript,
}) {
  if (reactVersion.length && typescript.length) {
    await installPlugins(reactTsPlugins);

    const baseConfig = fs.readFileSync(
      path.resolve(
        getFileName(import.meta.url),
        "../../../template/eslint/reactTsConfig.cjs"
      )
    );

    await writeEslintrcFile(baseConfig);
  }
}

// vue
async function handleInstallVueProject({
  vueVersion,
  reactVersion,
  typescript,
}) {
  if (vueVersion.length && !typescript.length) {
    await installPlugins(vueVersion[0] === "3" ? vuePlugins : vue2Plugins);
    const baseConfig = fs.readFileSync(
      path.resolve(
        getFileName(import.meta.url),
        `../../../template/eslint/vue${
          vueVersion[0] === "3" ? "" : 2
        }Config.cjs`
      )
    );

    await writeEslintrcFile(baseConfig);
  }
}

// vue typescript
async function handleInstallVueTsProject({
  vueVersion,
  reactVersion,
  typescript,
}) {
  if (vueVersion.length && typescript.length && vueVersion[0] === 3) {
    await installPlugins(vueTsPlugins);

    const baseConfig = fs.readFileSync(
      path.resolve(
        getFileName(import.meta.url),
        "../../../template/eslint/vueTsConfig.cjs"
      )
    );

    await writeEslintrcFile(baseConfig);
  }
}

async function installPlugins(args) {
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

async function readEslintRcFile() {
  const eslintRcPath = path.join(process.cwd(), ".eslintrc.js");
  let rcFile = fs.readFileSync(eslintRcPath, "utf-8");
  const temporaryRcFile = path.join(os.homedir(), ".eslintrc.cjs");
  fs.writeFileSync(temporaryRcFile, rcFile);
  const oldEslintrc = await import(temporaryRcFile);
  await fs.remove(temporaryRcFile);
  return oldEslintrc.default;
}

async function writeEslintrcFile(eslintrcConfig) {
  const eslintRcPath = path.join(process.cwd(), ".eslintrc.js");
  const isExistsEslintrcFile = checkProjectRcFile(".eslintrc.js");

  if (isExistsEslintrcFile) {
    const { action } = await inquirer.prompt([
      {
        name: "action",
        type: "list",
        message: `该项目已经存在 .eslintrc.js 文件`,
        choices: [
          { name: "Overwrite", value: "overwrite" },
          { name: "Cancel", value: false },
        ],
      },
    ]);

    if (!action) {
      return;
    } else if (action === "overwrite") {
      console.log(`\nRemoving ${chalk.cyan(eslintRcPath)}...`);
      await fs.remove(eslintRcPath);
    }
  }

  if (eslintrcConfig) {
    fs.writeFile(eslintRcPath, eslintrcConfig);
  }
}

eslint();