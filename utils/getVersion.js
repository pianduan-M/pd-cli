import { resolveProjectPkg } from "./resolve.js";

/**
 *
 * @param {string} packageName
 * @returns
 */
export const getVersionByName = (packageName) => {
  let result = [];
  const pkg = resolveProjectPkg();
  const dependencies = pkg.dependencies || {};
  let version = dependencies[packageName];

  if (version) {
    version = version.charAt(0) === "^" ? version.slice(1) : version;
    result = version.split(".");
  }

  return result;
};
