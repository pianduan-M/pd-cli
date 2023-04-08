// 添加插件
import * as addPluginList from "./add/index.js";

const add = async (plugin, pluginOptions) => {
  const _plugin = addPluginList[plugin];

  if (_plugin) {
    return _plugin(pluginOptions);
  } else {
    error("无效的插件名");
    exit(1);
  }
};

export default (...args) => {
  return add(...args).catch((err) => {
    stopSpinner(false); // do not persist
    error(err);
    exit(1);
  });
};
