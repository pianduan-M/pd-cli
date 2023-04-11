export const getPromptModules = () => {
	return Promise.all(
		["vueVersion", "projectType"].map((file) =>
			import(`../lib/promptModules/${file}.js`)
		)
	).then((res) => res.map((item) => item.default));
};
