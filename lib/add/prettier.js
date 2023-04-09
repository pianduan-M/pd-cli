import inquirer from "inquirer";
import path from "node:path";
import fs from "fs-extra";
import os from "node:os";
import chalk from "chalk";
import { getFileName } from "../../utils/resolve.js";
import { getVersionByName } from "../../utils/getVersion.js";
import { checkProjectRcFile } from "../../utils/rcPath.js";
import { installPlugins } from "../../utils/executeCommand.js";
import { merge } from "lodash-es";
import { log } from "../../utils/logger.js";

import {
  basePlugins,
  vue2Plugins,
  vue2PrettierEslintConfigExtends,
} from "../../template/prettier/plugins.js";

import vscodeSettings from "../../template/prettier/settings.js";

export const prettier = async () => {
  const vueVersion = getVersionByName("vue");

  await handleInstallBaseProject(vueVersion);

  await handleInstalLVue2Project(vueVersion);
};

// 通用方法
async function handleInstallBaseProject(vueVersion) {
  if (vueVersion.length && vueVersion[0] === "2") return;

  await installPlugins(basePlugins);

  const prettierrc = fs.readFileSync(
    path.resolve(
      getFileName(import.meta.url),
      "../../../template/prettier/.prettierrc.js"
    )
  );

  await writePrettierrc(prettierrc);
}

// vue2 项目专用
async function handleInstalLVue2Project(vueVersion) {
  if (!vueVersion.length || vueVersion[0] !== "2") return;

  await installPlugins(vue2Plugins);

  const prettierrc = fs.readFileSync(
    path.resolve(
      getFileName(import.meta.url),
      "../../../template/prettier/.prettierrc.js"
    )
  );

  await writePrettierrc(prettierrc);

  const eslintrc = await readEslintRcFile();

  eslintrc.extends = vue2PrettierEslintConfigExtends;

  const eslintRcPath = path.join(process.cwd(), ".eslintrc.js");

  fs.writeFileSync(
    eslintRcPath,
    `module.exports = ${JSON.stringify(eslintrc)}`
  );
}

// 读取 eslintrc 并修改
async function readEslintRcFile() {
  const eslintRcPath = path.join(process.cwd(), ".eslintrc.js");
  let rcFile = fs.readFileSync(eslintRcPath, "utf-8");
  const temporaryRcFile = path.join(os.homedir(), ".eslintrc.cjs");
  fs.writeFileSync(temporaryRcFile, rcFile);
  const oldEslintrc = await import(temporaryRcFile);
  await fs.remove(temporaryRcFile);
  return oldEslintrc.default;
}

// 写入配置文件
async function writePrettierrc(prettierrc) {
  const context = process.cwd();
  const prettierrcPath = path.join(process.cwd(), ".prettierrc.js");
  const prettierignorePath = path.resolve(process.cwd(), ".prettierignore");
  const editorconfigPath = path.resolve(process.cwd(), ".editorconfig");

  const isExistsPrettierrcFile = checkProjectRcFile(".prettierrc.js");
  const isExistsPrettierignoreFile = checkProjectRcFile(".prettierignore");
  const isExistsEditorconfigFile = checkProjectRcFile(".prettierignore");

  if (isExistsPrettierrcFile) {
    const { action } = await inquirer.prompt([
      {
        name: "action",
        type: "list",
        message: `该项目已经存在 .prettierrc.js 文件`,
        choices: [
          { name: "Overwrite", value: "overwrite" },
          { name: "Cancel", value: false },
        ],
      },
    ]);

    if (!action) {
      return;
    } else if (action === "overwrite") {
      console.log(`\nRemoving ${chalk.cyan(prettierrcPath)}...`);
      await fs.remove(prettierrcPath);
    }
  }

  if (prettierrc) {
    fs.writeFileSync(prettierrcPath, prettierrc, "utf-8");
  }

  if (!isExistsPrettierignoreFile) {
    fs.copyFileSync(
      path.join(
        getFileName(import.meta.url),
        `../../../template/prettier/.prettierignore`
      ),
      path.join(context, ".prettierignore")
    );
  }

  if (!isExistsEditorconfigFile) {
    fs.copyFileSync(
      path.join(
        getFileName(import.meta.url),
        `../../../template/prettier/.editorconfig`
      ),
      path.join(context, ".editorconfig")
    );
  }

  setVsCodeSettingJson(vscodeSettings);

  log("done.");
}

// 设置 .vscode/settings.json
function setVsCodeSettingJson(config) {
  const context = process.cwd();
  const vscodeSettingDir = path.join(context, ".vscode");
  const settingPath = path.join(context, ".vscode/settings.json");
  const isSetting = checkProjectRcFile(".vscode/settings.json");

  if (isSetting) {
    const oldSetting = JSON.parse(fs.readFileSync(settingPath));
    config = merge(oldSetting, config);
  }

  // 检查是否有 .vscode 文件夹
  if (!fs.existsSync(vscodeSettingDir)) {
    fs.mkdirSync(vscodeSettingDir, { recursive: true });
  }

  fs.writeFileSync(settingPath, JSON.stringify(config), "utf-8");
}
