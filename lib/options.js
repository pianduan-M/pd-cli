import fs from "node:fs";
import cloneDeep from "lodash.clonedeep";
import { error } from "../utils/logger.js";
import { exit } from "../utils/exit.js";
import { getRcPath } from "../utils/rcPath.js";

export const rcPath = getRcPath(".pdrc");

let cachedOptions;
export const loadOptions = () => {
  if (cachedOptions) {
    return cachedOptions;
  }
  if (fs.existsSync(rcPath)) {
    try {
      cachedOptions = JSON.parse(fs.readFileSync(rcPath, "utf-8"));
    } catch (error) {
      error(
        `Error loading saved preferences: ` +
          `~/.vuerc may be corrupted or have syntax errors. ` +
          `Please fix/delete it and re-run vue-cli in manual mode.\n` +
          `(${e.message})`
      );
      exit(1);
    }
    return cachedOptions;
  } else {
    return {};
  }
};

export const saveOptions = (toSave) => {
  const options = Object.assign(cloneDeep(loadOptions()), toSave);

  cachedOptions = options;

  try {
    fs.writeFileSync(rcPath, JSON.stringify(options, null, 2));
    return true;
  } catch (e) {
    error(
      `Error saving preferences: ` +
        `make sure you have write access to ${rcPath}.\n` +
        `(${e.message})`
    );
  }
};

export const savePreset = (name, preset) => {
  const presets = cloneDeep(loadOptions().presets || {});
  presets[name] = preset;
  return saveOptions({ presets });
};
