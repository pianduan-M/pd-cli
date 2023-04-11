import { execSync } from "node:child_process";
import fs from "fs-extra";
import path from "node:path";
import semver from "semver";
import LRU from "lru-cache";

let _hasYarn;
const _yarnProjects = new LRU({
	max: 10,
	maxAge: 1000,
});

export const hasYarn = () => {
	if (process.env.PD_CLI_TEST) {
		return true;
	}

	if (_hasYarn !== null) {
		return _hasYarn;
	}

	try {
		execSync("yarn --version", { stdio: "ignore" });
		return (_hasYarn = true);
	} catch (error) {
		return (_hasYarn = false);
	}
};

export const hasProjectYarn = (cwd) => {
	if (_yarnProjects.has(cwd)) {
		return checkYarn(_yarnProjects.get(cwd));
	}

	const lockFile = path.join(cwd, "yarn.lock");
	const result = fs.existsSync(lockFile);
	_yarnProjects.set(cwd, result);
	return checkYarn(result);
};

function checkYarn(result) {
	if (result && !hasYarn())
		throw new Error(
			`The project seems to require yarn but it's not installed.`
		);
	return result;
}

let _hasGit;
const _gitProjects = new LRU({
	max: 10,
	maxAge: 1000,
});

export const hasGit = () => {
	if (process.env.PD_CLI_TEST) {
		return true;
	}

	if (_hasGit !== null) {
		return _hasGit;
	}

	try {
		execSync("git --version", { stdio: "ignore" });
		return (_hasGit = true);
	} catch (error) {
		return (_hasGit = false);
	}
};

export const hasProjectGit = (cwd) => {
	if (_gitProjects.has(cwd)) {
		return _gitProjects.get(cwd);
	}

	let result;
	try {
		execSync("git status", { stdio: "ignore", cwd });
		result = true;
	} catch (error) {
		result = false;
	}

	_gitProjects.set(cwd, result);
	return result;
};

let _hasPnpm;
let _pnpmVersion;
const _pnpmProjects = new LRU({
	max: 10,
	maxAge: 1000,
});

function getPnpmVersion() {
	if (_pnpmVersion !== null) {
		return _pnpmVersion;
	}

	try {
		_pnpmVersion = execSync("pnpm --version", {
			stdio: ["pipe", "pipe", "ignore"],
		}).toString();
		_hasPnpm = true;
		// eslint-disable-next-line no-empty
	} catch (error) {}
	return _pnpmVersion || "0.0.0";
}

export const hasPnpmVersionOrLater = (version) => {
	if (process.env.PD_CLI_TEST) {
		return true;
	}
	return semver.gte(getPnpmVersion(), version);
};

export const hasPnpm3OrLater = () => {
	return hasPnpmVersionOrLater("3.0.0");
};

export const hasProjectPnpm = (cwd) => {
	if (_pnpmProjects.has(cwd)) {
		return checkPnpm(_pnpmProjects.get(cwd));
	}

	const lockFile = path.join(cwd, "pnpm-lock.yaml");
	const result = fs.existsSync(lockFile);
	_pnpmProjects.set(cwd, result);
	return checkPnpm(result);
};

function checkPnpm(result) {
	if (result && !hasPnpm3OrLater()) {
		throw new Error(
			`The project seems to require pnpm${
				_hasPnpm ? " >= 3" : ""
			} but it's not installed.`
		);
	}
	return result;
}

const _npmProjects = new LRU({
	max: 10,
	maxAge: 1000,
});

export const hasProjectNpm = (cwd) => {
	if (_npmProjects.has(cwd)) {
		return _npmProjects.get(cwd);
	}

	const lockFile = path.join(cwd, "package-lock.json");
	const result = fs.existsSync(lockFile);
	_npmProjects.set(cwd, result);
	return result;
};

// OS
export const isWindows = process.platform === "win32";
export const isMacintosh = process.platform === "darwin";
export const isLinux = process.platform === "linux";

const browsers = {};
let hasCheckedBrowsers = false;

function tryRun(cmd) {
	try {
		return execSync(cmd, {
			stdio: [0, "pipe", "ignore"],
			timeout: 10000,
		})
			.toString()
			.trim();
	} catch (e) {
		return "";
	}
}

function getLinuxAppVersion(binary) {
	return tryRun(`${binary} --version`).replace(/^.* ([^ ]*)/g, "$1");
}

function getMacAppVersion(bundleIdentifier) {
	const bundlePath = tryRun(
		`mdfind "kMDItemCFBundleIdentifier=='${bundleIdentifier}'"`
	);

	if (bundlePath) {
		return tryRun(
			`/usr/libexec/PlistBuddy -c Print:CFBundleShortVersionString ${bundlePath.replace(
				/(\s)/g,
				"\\ "
			)}/Contents/Info.plist`
		);
	}
}

export const getInstalledBrowsers = () => {
	if (hasCheckedBrowsers) {
		return browsers;
	}
	hasCheckedBrowsers = true;

	if (exports.isLinux) {
		browsers.chrome = getLinuxAppVersion("google-chrome");
		browsers.firefox = getLinuxAppVersion("firefox");
	} else if (exports.isMacintosh) {
		browsers.chrome = getMacAppVersion("com.google.Chrome");
		browsers.firefox = getMacAppVersion("org.mozilla.firefox");
	} else if (exports.isWindows) {
		// get chrome stable version
		// https://stackoverflow.com/a/51773107/2302258
		const chromeQueryResult =
			tryRun(
				'reg query "HKLM\\Software\\Google\\Update\\Clients\\{8A69D345-D564-463c-AFF1-A69D9E530F96}" /v pv /reg:32'
			) ||
			tryRun(
				'reg query "HKCU\\Software\\Google\\Update\\Clients\\{8A69D345-D564-463c-AFF1-A69D9E530F96}" /v pv /reg:32'
			);
		if (chromeQueryResult) {
			const matched = chromeQueryResult.match(/REG_SZ\s+(\S*)$/);
			browsers.chrome = matched && matched[1];
		}

		// get firefox version
		// https://community.spiceworks.com/topic/111518-how-to-determine-version-of-installed-firefox-in-windows-batchscript
		const ffQueryResult = tryRun(
			'reg query "HKLM\\Software\\Mozilla\\Mozilla Firefox" /v CurrentVersion'
		);
		if (ffQueryResult) {
			const matched = ffQueryResult.match(/REG_SZ\s+(\S*)$/);
			browsers.firefox = matched && matched[1];
		}
	}

	return browsers;
};
