import inquirer from "inquirer";
import path from "node:path";
import fs from "fs-extra";
import { execa } from "execa";
import { loadOptions, saveOptions } from "./options.js";
import {
	hasYarn,
	hasPnpm3OrLater,
	hasGit,
	hasProjectGit,
} from "../utils/env.js";
import PromptModuleAPI from "./PromptModuleAPI.js";
import { clearConsole, error, log, warn } from "../utils/logger.js";
import {
	isTemplatePath,
	hasTemplateByName,
	getTemplateNamePath,
} from "../utils/template.js";
import { downloadTemplateByUrl } from "../utils/download.js";
import { exit } from "../utils/exit.js";
import { copyFolder } from "../utils/writeFile.js";
import { executeCommand } from "../utils/executeCommand.js";

export class Creator {
	constructor(name, context, promptModules) {
		// 项目名
		this.name = name;
		// 项目文件地址
		this.context = process.env.PD_CLI_CONTEXT = context;

		// 询问配置文件，是否保存当前配置为预设的 Prompts 配置
		this.outroPrompts = this.resolveOutroPrompts();

		this.injectedPrompts = [];
		this.promptCompleteCbs = [];
		this.afterInvokeCbs = [];
		this.afterAnyInvokeCbs = [];

		this.run = this.run.bind(this);

		const promptAPI = new PromptModuleAPI(this);
		// 注入 prompt 配置
		promptModules.forEach((m) => m(promptAPI));
	}

	async create(cliOptions, preset = null) {
		const { template } = cliOptions;

		let templateName;

		if (template) {
			// git 链接
			if (isTemplatePath(template)) {
				await this.downloadTemplateByUrl(template); //
			} else if (await hasTemplateByName(template)) {
				// 模版名称
				templateName = template;
			} else {
				error(`没有找到 ${template} 模板`);
				exit(1);
				return;
			}
		} else {
			preset = await this.promptAndResolvePreset();
			templateName = this.resolveTemplateName(preset);
		}

		if (templateName) {
			const templateNamePath = getTemplateNamePath(templateName);

			// 复制模版到指定目录
			copyFolder(templateNamePath, this.context);
		}

		// 更改项目名
		this.changeTemplateProjectName();

		const packageManager =
			cliOptions.packageManager ||
			loadOptions().packageManager ||
			(hasYarn() ? "yarn" : null) ||
			(hasPnpm3OrLater() ? "pnpm" : "npm");

		await clearConsole();

		// install
		log(`⚙\u{fe0f}  Installing. This might take a while...`);
		try {
			await this.packageInstall(packageManager, ["install"], this.context);
		} catch (error) {
			return;
		}

		const shouldInitGit = this.shouldInitGit(cliOptions);

		if (shouldInitGit) {
			log(`🗃  Initializing git repository...`);
			await this.initGit(cliOptions);
		}
		log(`done`);
	}
	async packageInstall(...args) {
		try {
			await executeCommand(...args);
		} catch (error) {
			log(`🗃  安装依赖包失败，请手动安装`);
			return Promise.reject(error);
		}
	}

	resolveTemplateName(preset) {
		const temArr = ["template"];

		if (preset.projectType === "uniapp") {
			temArr.push("uniapp");
		} else {
			temArr.push(`${preset.vueVersion}`);
			if (preset.projectType !== "base") {
				temArr.push(preset.projectType);
			}
		}

		return temArr.join("-");
	}

	async initGit(cliOptions) {
		await this.run("git init");
		await this.run("git add -A");

		const msg = typeof cliOptions.git === "string" ? cliOptions.git : "init";
		let gitCommitFailed = false;
		try {
			await this.run("git", ["commit", "-m", msg, "--no-verify"]);
		} catch (e) {
			console.log(e);
			gitCommitFailed = true;
		}

		if (gitCommitFailed) {
			warn(
				`Skipped git commit due to missing username and email in git config, or failed to sign commit.\n` +
					`You will need to perform the initial commit yourself.\n`
			);
		}
	}

	changeTemplateProjectName() {
		const pkgPath = path.resolve(this.context, "package.json");
		const pkg = JSON.parse(fs.readFileSync(pkgPath));

		pkg.name = this.name;
		pkg.version = "0.0.1";

		fs.writeFileSync(pkgPath, JSON.stringify(pkg));
	}

	async downloadTemplateByUrl(template) {
		if (!/\#\S+$/.test(template)) {
			error("需要指定分支");
			exit(1);
			return;
		}
		await downloadTemplateByUrl(template, this.context);
	}

	run(command, args) {
		if (!args) {
			[command, ...args] = command.split(/\s+/);
		}
		return execa(command, args, { cwd: this.context });
	}

	async promptAndResolvePreset(answers = null) {
		// prompt
		if (!answers) {
			await clearConsole(true);
			answers = await inquirer.prompt(this.resolveFinalPrompts());
		}

		if (answers.packageManager) {
			saveOptions({
				packageManager: answers.packageManager,
			});
		}

		return answers;
	}
	resolveFinalPrompts() {
		const prompts = [...this.injectedPrompts, ...this.outroPrompts];
		return prompts;
	}

	resolveOutroPrompts() {
		const outroPrompts = [];

		// ask for packageManager once
		const savedOptions = loadOptions();

		if (!savedOptions.packageManager && (hasYarn() || hasPnpm3OrLater())) {
			const packageManagerChoices = [];

			if (hasYarn()) {
				packageManagerChoices.push({
					name: "Use Yarn",
					value: "yarn",
					short: "Yarn",
				});
			}

			if (hasPnpm3OrLater()) {
				packageManagerChoices.push({
					name: "Use PNPM",
					value: "pnpm",
					short: "PNPM",
				});
			}

			packageManagerChoices.push({
				name: "Use NPM",
				value: "npm",
				short: "NPM",
			});

			outroPrompts.push({
				name: "packageManager",
				type: "list",
				message:
					"Pick the package manager to use when installing dependencies:",
				choices: packageManagerChoices,
			});
		}

		return outroPrompts;
	}

	shouldInitGit(cliOptions) {
		if (!hasGit()) {
			return false;
		}
		// --git
		if (cliOptions.forceGit) {
			return true;
		}
		// --no-git
		if (cliOptions.git === false || cliOptions.git === "false") {
			return false;
		}
		// default: true unless already in a git repo
		return !hasProjectGit(this.context);
	}
}
