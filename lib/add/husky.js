import inquirer from "inquirer";
import path from "node:path";
import fs from "fs-extra";
import { getFileName, resolveProjectPkg } from "../../utils/resolve.js";
import { eslint as eslintFn } from "./eslint.js";
import { prettier as prettierFn } from "./prettier.js";
import { getVersionByName } from "../../utils/getVersion.js";
import { installPlugins, executeCommand } from "../../utils/executeCommand.js";
import { loadOptions, saveOptions } from "../options.js";
import { log } from "../../utils/logger.js";

import {
	huskyPlugins,
	commitPlugins,
	lintStagedConfig,
} from "../../template/husky/plugins.js";

export const husky = async (options) => {
	if (options.packageManager) {
		saveOptions({
			packageManager: options.packageManager,
		});
	}

	await checkEslintPrettier(options);
	await installHuskyPlugin(options);
	await installCommitlint(options);
};

async function installCommitlint() {
	await installPlugins(commitPlugins);

	const context = process.cwd();

	//  package.json 中添加 commit 指令, 执行 `git-cz` 指令
	await executeCommand("npm", ["set-script", "commit", "git-cz"], context);

	// 复制 commitlint.config.js 文件
	fs.copyFileSync(
		path.join(
			getFileName(import.meta.url),
			`../../../template/husky/commitlint.config.js`
		),
		path.join(context, "commitlint.config.js")
	);

	// 复制 .cz-config.js 文件
	fs.copyFileSync(
		path.join(
			getFileName(import.meta.url),
			`../../../template/husky/.cz-config.js`
		),
		path.join(context, ".cz-config.js")
	);

	// package.json 中写入 commit 配置
	const pkg = resolveProjectPkg();
	const pkgPath = path.join(context, "package.json");
	pkg.config = pkg.config || {};
	pkg.config.commitizen = {
		path: "./node_modules/cz-customizable",
	};

	pkg["lint-staged"] = lintStagedConfig;

	fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, "	"), "utf-8");
	// await executeCommand("npx", [
	//   "prettier",
	//   "--write",
	//   ".package.json",
	//   context,
	// ]);
}

async function installHuskyPlugin() {
	await installPlugins(huskyPlugins);

	const packageManager = loadOptions().packageManager || "npm";
	const context = process.cwd();
	const scripts = ["set-script", "prepare", "husky install"];

	if (!fs.existsSync(path.join(context, ".git"))) {
		await executeCommand("git", ["init"], context);
	}

	// 在package.json中添加脚本
	await executeCommand(packageManager, scripts, context);
	// 初始化husky,将 git hooks 钩子交由,husky执行
	await executeCommand("npm", ["run", "prepare"], context);
	// 初始化 husky, 会在根目录创建 .husky 文件夹
	await executeCommand(
		"npx",
		["husky", "add", ".husky/pre-commit", "npx lint-staged"],
		context
	);
}

async function checkEslintPrettier() {
	await checkEslint();
	await checkPrettier();
}

async function checkEslint() {
	const eslint = getVersionByName("eslint");

	if (eslint.length === 0) {
		const { action } = await inquirer.prompt([
			{
				name: "action",
				type: "confirm",
				message: `该项目没有安装 eslint 是否安装 eslint?`,
				default: false,
			},
		]);

		if (!action) {
			log("exit pd-cli");
			return process.exit(1);
		}

		await eslintFn();
	}
}

async function checkPrettier() {
	const prettier = getVersionByName("prettier");

	if (prettier.length === 0) {
		const { action } = await inquirer.prompt([
			{
				name: "action",
				type: "confirm",
				message: `该项目没有安装 prettier 是否安装 prettier?`,
				default: false,
			},
		]);

		if (!action) {
			log("exit pd-cli");
			return process.exit(1);
		}

		await prettierFn();
	}
}
