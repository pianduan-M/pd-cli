import download from "download-git-repo";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";

import { getTemplateDir } from "./rcPath.js";
import { downloadTemplate } from "./download.js";

import { log } from "./logger.js";

const templatePKGPath =
	"direct:https://github.com/pianduan-M/vue-template/raw/dev/package.json";

// 加载本地模版的 package.json 文件
function loadLocalTemplatePkg() {
	const templateDir = getTemplateDir();
	const localPkgPath = path.resolve(templateDir, "", "package.json");

	if (!fs.existsSync(localPkgPath)) return {};

	let pkg = fs.readFileSync(localPkgPath, "utf-8");
	if (pkg) {
		pkg = JSON.parse(pkg);
	}

	return pkg || {};
}

// 加载从线上下载的 package.json
async function loadPkgFromDir(dir) {
	const presetPath = path.join(dir, "package.json");
	if (!fs.existsSync(presetPath)) {
		throw new Error("remote / local preset does not contain preset.json!");
	}
	const pkg = await fs.readJson(presetPath);

	return pkg;
}

// 下载线上模版的 package.json 文件
async function loadRepositoryTemplatePkg() {
	const tmpdir = path.join(os.tmpdir(), "pd-cli", "template");

	await fs.remove(tmpdir);

	await new Promise((resolve, reject) => {
		download(templatePKGPath, tmpdir, { clone: false }, (err) => {
			if (err) return reject(err);
			resolve();
		});
	});

	return await loadPkgFromDir(tmpdir);
}

// 比较本地模版版本跟线上是否一样
export async function checkTemplateVersion() {
	let repositoryPkg;
	try {
		repositoryPkg = await loadRepositoryTemplatePkg();
	} catch (error) {
		log(error);
	}

	const localPkg = loadLocalTemplatePkg();
	return repositoryPkg.version === localPkg.version;
}

// 检查是否有模版
export const hasTemplateByName = async function (templateName) {
	const templateDir = getTemplateDir();

	if (!fs.existsSync(templateDir)) {
		await downloadTemplate();
	}

	const templatePath = getTemplateNamePath(templateName);
	if (!fs.existsSync(templatePath)) {
		log("模版不存在");
		return false;
	}

	return !!templatePath;
};

export const getTemplateNamePath = (templateName) => {
	const templateDir = getTemplateDir();
	return path.resolve(templateDir, "templates", templateName);
};

// 检查是否是 template 是 url
export const isTemplatePath = (template) => {
	const reg = /(^https?\S+|\S+\.git$)/g;
	return reg.test(template);
};
