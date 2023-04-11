import fs from "fs-extra";
import path from "path";

export function copyFolder(source, target) {
	if (!fs.existsSync(target)) {
		fs.mkdirSync(target);
	}

	const files = fs.readdirSync(source);

	for (let i = 0; i < files.length; i++) {
		const file = files[i];

		// 如果存在子文件夹，则递归调用
		if (fs.statSync(path.join(source, file)).isDirectory()) {
			copyFolder(path.join(source, file), path.join(target, file));
			continue;
		}

		// 否则，拷贝文件
		fs.copyFileSync(path.join(source, file), path.join(target, file));
	}
}
