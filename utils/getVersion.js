import { resolveProjectPkg } from "./resolve.js";

/**
 *
 * @param {string} packageName
 * @returns {array} 切割的版本号
 */
export const getVersionByName = (packageName) => {
	let result = [];
	const pkg = resolveProjectPkg();
	const dependencies = pkg.dependencies || pkg.devDependencies || {};
	const devDependencies = pkg.devDependencies || {};
	let version = dependencies[packageName] || devDependencies[packageName];

	if (version) {
		version = version.charAt(0) === "^" ? version.slice(1) : version;
		result = version.split(".");
	}

	return result;
};
