import { stopSpinner } from "../utils/spinner.js";
import { error } from "../utils/logger.js";
import { exit } from "../utils/exit.js";
import * as generatorApi from "./generatorApi/index.js";

const generate = async (name, path,options) => {
  const generator = generatorApi[name];

  if (generator) {
    return generator(path);
  } else {
    error("无效的生成器指令");
    exit(1);
  }
};

export default (...args) => {
  return generate(...args).catch((err) => {
    stopSpinner(false); // do not persist
    error(err);
    exit(1);
  });
};
