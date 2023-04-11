import fs from "fs-extra";
import path from "path";
import inquirer from "inquirer";
import chalk from "chalk";
import { getDirname } from "../../utils/resolve.js";

const pageContentDirPath = path.join(
	getDirname(import.meta.url),
	"../../template/pageContent"
);
const pageContentTemPath = path.join(pageContentDirPath, "index.vue");
const pageContentHookDirPath = path.join(pageContentDirPath, "hooks");

const generatePageContent = async (dirPath) => {
	// 根据传入的目录最后一级作为文件名
	let dirnameFilePath, merge, dirname;
	// 如果有传入目录 先判断有没有该目录，没有先创建目录，传入的目录基于命令行目录拼接
	if (dirPath) {
		const existsPaths = dirPath.split("/");
		dirname = existsPaths[existsPaths.length - 1];
		dirnameFilePath = path.join(dirPath, `${dirname}.vue`);

		dirPath = path.join(process.cwd(), dirPath);

		if (!fs.existsSync(dirPath)) {
			fs.mkdirSync(dirPath, { recursive: true });
		}
	}

	// 判断传入路径，没有的话再当前命令所在目录生成文件（index.vue)
	dirPath = dirPath || process.cwd();
	let filePath = path.join(dirPath, "index.vue");

	// 先判断目录下有没有 index.vue 文件
	if (fs.existsSync(filePath)) {
		// 如果有，在判断有没有传入要生成的文件路径 如果有按照路径最后一级作为文件名称
		if (dirnameFilePath && !fs.existsSync(dirnameFilePath)) {
			filePath = dirnameFilePath;
		} else {
			// 如果存在index.vue 并没有传入路径，提示选择
			const { action } = await inquirer.prompt([
				{
					name: "action",
					type: "list",
					message: `该目录下存在 index.vue 文件，请选择一下操作`,
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
				console.log(`\nRemoving ${chalk.cyan(filePath)}...`);
				await fs.remove(filePath);
			} else if (action === "merge") {
				merge = true;
			}
		}
	}

	handleCopyTemplate(merge, filePath, pageContentTemPath, dirname);

	handleCopyPageContentHook(dirPath);
};

/**
 * 根据文件路径 模板路径生成 vue 页面
 * @param {boolean} merge
 * @param {string} filePath
 * @param {string} temPath
 * @param {string} dirname
 */
export const handleCopyTemplate = (
	merge = false,
	filePath,
	temPath,
	dirname
) => {
	if (merge) {
		handleCopyPageContentVueByMerge(filePath, temPath);
	} else {
		handleCopyPageContentVue(filePath, temPath, dirname);
	}
};

// 不需要合并 直接生成文件
const handleCopyPageContentVue = (filePath, temPath, dirname = "Index") => {
	let pageContentTem = fs.readFileSync(temPath, "utf-8");
	if (dirname) {
		pageContentTem = pageContentTem.replaceAll(
			"##index##",
			dirname.charAt(0).toLocaleUpperCase() + dirname.slice(1)
		);
	}
	fs.writeFileSync(filePath, pageContentTem);
};

// 需要合并 合并文件
const handleCopyPageContentVueByMerge = (filePath, temPath) => {
	let pageContentTem = fs.readFileSync(temPath, "utf-8");
	const originFile = fs.readFileSync(filePath, "utf-8");

	const isCRLF = originFile.includes("\r\n");
	const isLF = originFile.includes("\n");
	const isCR = originFile.includes("\r");
	let endOfLine;

	if (isCRLF) {
		endOfLine = "\r\n";
	}
	if (isLF) {
		endOfLine = "\n";
	}
	if (isCR) {
		endOfLine = "\r";
	}

	let originFileArr = originFile.split(endOfLine);

	// 合并模板
	originFileArr = mergeTemplate(originFileArr, pageContentTem);
	// 合并js
	originFileArr = mergeScript(originFileArr, pageContentTem);

	fs.writeFileSync(filePath, originFileArr.join("\n"));
};

const mergeTemplate = (originFileArr, pageContentTem) => {
	const templateReg = /<template>([\s\S]*)<\/template>/gi;
	const templateMatches = templateReg.exec(pageContentTem)[1];

	let templateIndex = -1;

	originFileArr.forEach((item, index) => {
		if (item.includes("</template>")) {
			templateIndex = index;
		}
	});

	if (templateIndex > -1) {
		originFileArr.splice(templateIndex, 0, templateMatches);
	}

	return originFileArr;
};

const mergeScript = (originFileArr, pageContentTem) => {
	const templateReg = /<script \S*>([\s\S]*)<\/script>/gi;
	const templateMatches = templateReg.exec(pageContentTem)[1];

	let templateIndex = -1;

	originFileArr.forEach((item, index) => {
		if (item.includes("import")) {
			templateIndex = index;
		}
	});

	if (templateIndex > -1) {
		originFileArr.splice(templateIndex + 1, 0, templateMatches);
	}

	return originFileArr;
};

// copy hook
const handleCopyPageContentHook = (dirPath) => {
	const usePageContentHookSourcePath = path.join(
		pageContentHookDirPath,
		"usePageContent.js"
	);

	let usePageContentHookSource = fs.readFileSync(
		usePageContentHookSourcePath,
		"utf8"
	);

	const usePageFormHookSourcePath = path.join(
		pageContentHookDirPath,
		"usePageForm.js"
	);

	let usePageFormHookSource = fs.readFileSync(
		usePageFormHookSourcePath,
		"utf8"
	);

	const hookDirPath = path.join(dirPath, "hooks");

	// 检查是否有 hooks 文件夹
	if (!fs.existsSync(hookDirPath)) {
		fs.mkdirSync(hookDirPath, { recursive: true });
	}

	const usePageContentHookTargetPath = path.join(
		hookDirPath,
		"usePageContent.js"
	);

	if (fs.existsSync(usePageContentHookTargetPath)) {
		const targetFile = fs.readFileSync(usePageContentHookTargetPath, "utf-8");
		usePageContentHookSource = targetFile + usePageContentHookSource;
	}

	const usePageFormHookTargetPath = path.join(hookDirPath, "usePageForm.js");

	if (fs.existsSync(usePageFormHookTargetPath)) {
		const targetFile = fs.readFileSync(usePageFormHookTargetPath, "utf-8");
		usePageFormHookSource = targetFile + usePageFormHookSource;
	}

	fs.writeFileSync(
		usePageContentHookTargetPath,
		usePageContentHookSource,
		"utf-8"
	);
	fs.writeFileSync(usePageFormHookTargetPath, usePageFormHookSource, "utf-8");
};

export const pageContent = generatePageContent;
