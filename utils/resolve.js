import path from "node:path";
import url from "node:url";
import fs from "fs-extra";
import { createRequire } from "node:module";

export const loadJSON = (filePath, importMetaUrl) => {
	const reg = /\S+.json$/g;
	if (reg.test(filePath)) {
		const require = createRequire(importMetaUrl);
		return require(filePath);
	} else {
		throw new Error("loadJSON 参数必须是一个 json 文件");
	}
};

export const resolvePackage = () => {
	return loadJSON("../package.json", import.meta.url);
};

export const getFileName = (importMetaUrl) => {
	return url.fileURLToPath(importMetaUrl);
};

export const getDirname = (importMetaUrl) => {
	return path.dirname(url.fileURLToPath(importMetaUrl));
};

export const resolveProjectPkg = () => {
	let pkg = {};
	const pkgPath = path.join(process.cwd(), "package.json");

	if (fs.existsSync(pkgPath)) {
		try {
			pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
		} catch (error) {
			console.log(error);
		}
	}

	return pkg;
};

export const getCliContext = () => {
	return path.join(getFileName(import.meta.url), "../");
};

export const getFileContent = (filePath) => {
	return fs.readFileSync(path.join(getCliContext(), filePath), "utf-8");
};
