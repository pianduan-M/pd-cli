import fs from "fs-extra";
import path from "path";
import inquirer from "inquirer";
import chalk from "chalk";
import { getDirname } from "../../utils/resolve.js";
import { pageContent, handleCopyTemplate } from "./pageContent.js";
import { firstToLowerCase } from "../../utils/common.js";
import { getVersionByName } from "../../utils/getVersion.js";

const pageContentDirPath = path.join(
	getDirname(import.meta.url),
	"../../template/router"
);
const baseTemplateVue2 = path.join(pageContentDirPath, "template-vue2.vue");
const baseTemplateVue3 = path.join(pageContentDirPath, "template-vue3.vue");
const routeOptionDirname = path.join(
	process.cwd(),
	"src/router/routes/modules"
);

const generateRoutePage = async (path, cliOptions) => {
	const { routes, template } = cliOptions;

	const routesConfigs = getRoutesConfig(routes);

	generateRouteFile(routesConfigs, path);

	await generateRoutePageFiles(path, routesConfigs, template);
};

const generateRoutePageFiles = async (targetPath, configs, template) => {
	targetPath = targetPath || "src/views";

	for (let config of configs) {
		// name:[test;test]
		if (config.includes("[") && config.includes("]")) {
			config = config.trim();
			const configSplitArr = config.split(":");
			const name = configSplitArr[0].trim();
			const childrenConfigStr = configSplitArr[1].trim();
			const childrenConfigs = childrenConfigStr
				.replace("[", "")
				.replace("]", "")
				.split(";")
				.map((config) => config.trim());
			const childrenPath = targetPath + "/" + name;

			await generateRoutePageFiles(childrenPath, childrenConfigs, template);
		} else {
			await generateRoutePageFile(targetPath, config, template);
		}
	}
};

// 根据配置生成组件文件
const generateRoutePageFile = async (targetPath, config, template) => {
	const baseDirPath = path.join(process.cwd(), targetPath);
	let name =
		typeof config === "string" ? config : firstToLowerCase(config.name);

	if (!name) {
		throw new Error("无效的路由文件名");
	}

	const targetDirname = path.join(baseDirPath, name);

	if (template) {
		switch (template) {
			case "pageContent":
				await pageContent(targetPath + "/" + name);
				break;

			default:
				console.log("无效的模板名称");
				process.exit(1);
		}
	} else {
		const vueVersion = getVersionByName("vue");
		const temPath = vueVersion[0] === 3 ? baseTemplateVue3 : baseTemplateVue2;
		const targetFilename = path.join(targetDirname, "index.vue");

		let merge = false;
		if (!fs.existsSync(targetDirname)) {
			fs.mkdirSync(targetDirname, { recursive: true });
		} else {
			const { action } = await inquirer.prompt([
				{
					name: "action",
					type: "list",
					message: `存在 ${name} 同名目录`,
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
				console.log(`\nRemoving ${chalk.cyan(targetDirname)}...`);
				await fs.remove(targetDirname);
				fs.mkdirSync(targetDirname, { recursive: true });
			} else if (action === "merge") {
				merge = true;
			}
		}

		const componentName = name.charAt(0).toLocaleUpperCase() + name.slice(1);

		if (!fs.existsSync(targetDirname)) {
			fs.mkdirSync(targetDirname, { recursive: true });
		}

		handleCopyTemplate(merge, targetFilename, temPath, componentName);
	}
};

const generateRouteFile = (configs, targetPath) => {
	if (!fs.existsSync(routeOptionDirname)) {
		fs.mkdirSync(routeOptionDirname, { recursive: true });
	}

	configs.forEach((config) => {
		let route;
		let filename = typeof config === "string" ? config : config.name;

		if (config.includes("[") && config.includes("]")) {
			config = config.trim();
			const configSplitArr = config.split(":");
			filename = configSplitArr[0].trim();

			const childrenConfigStr = configSplitArr[1].trim();
			const childrenConfigs = childrenConfigStr
				.replace("[", "")
				.replace("]", "")
				.split(";")
				.map((config) => config.trim());
			const childrenPath = targetPath + "/" + filename;

			route = [];

			childrenConfigs.forEach((item) => {
				route.push(generateRouteOptions(item, childrenPath));
			});
		} else {
			route = generateRouteOptions(config, targetPath);
		}
		const routeStr = routeToJSON(route);

		const redirect = Array.isArray(route) ? route[0].path : route.path;

		const routeName = filename.charAt(0).toUpperCase() + filename.slice(1);
		const fileContent = [
			`import Layout from '@/layout'`,
			"\n",
			"export default {",
			" path:'/',",
			" component:Layout,",
			` name:${routeName},`,
			` redirect:'${redirect}',`,
			` children:[`,
			`   ${routeStr}`,
			` ]`,
			`}`,
		];

		const routeOptionFilename = path.join(routeOptionDirname, `${filename}.js`);

		fs.writeFileSync(routeOptionFilename, fileContent.join("\n"));
	});
};

const routeToJSON = (route) => {
	let result;

	if (Array.isArray(route)) {
		result = [];

		route.forEach((item) => {
			result.push(routeToJSON(item));
		});
		result = result.join(",\n");
	} else {
		result = JSON.stringify(route);
		result = result.replaceAll('"##', "");
		result = result.replaceAll('##"', "");
	}

	return result.replaceAll(",", ",\n");
};

// 根据配置生成路由配置项
const generateRouteOptions = (config, targetPath) => {
	targetPath = targetPath || "/views";

	let route;
	const name =
		typeof config === "string" ? config : firstToLowerCase(config.name);

	let targetFilename = path.join(targetPath, `${name}/index.vue`);

	targetFilename =
		targetFilename.charAt(0) !== "/" ? "/" + targetFilename : targetFilename;

	if (typeof config === "string") {
		route = {
			path: `/${config}`,
			name: config.charAt(0).toUpperCase() + config.slice(1),
			component: `##()=>import('@${targetFilename}')##`,
		};
	} else {
		route = { ...config };

		const children = config.children;
		if (children && children.length) {
			route.children = children.map((item) =>
				generateRouteOptions(item, targetPath + "/" + name)
			);
		}
	}

	return route;
};

const getRoutesConfig = (routes = "") => {
	if (!routes) return [];

	try {
		routes = JSON.parse(routes);
	} catch (error) {}

	if (typeof routes === "string") {
		routes = routes.split(",");
	}

	return routes;
};

export const router = generateRoutePage;

// test
// generateRoutePage("", {
// 	routes: "name,age,weight,height,interest:[sing;jump;rap]",
// 	template: "pageContent",
// });
