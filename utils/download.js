import download from "download-git-repo";
import fs from "fs-extra";
import { logWithSpinner, stopSpinner } from "./spinner.js";

import { getTemplateDir } from "./rcPath.js";

const repositoryTemplatePath =
  "direct:https://github.com/pianduan-M/vue-template.git#dev";

export async function downloadTemplate() {
  const templateDir = getTemplateDir();

  if (fs.existsSync(templateDir)) {
    await fs.remove(templateDir);
  }

  return new Promise((resolve, reject) => {
    download(repositoryTemplatePath, templateDir, { clone: true }, (err) => {
      console.log(err);
      if (err) return reject(err);
      resolve();
    });
  });
}

export const downloadTemplateByUrl = async (url, dirname) => {
  return new Promise((resolve, reject) => {
    logWithSpinner("模版下载中");

    download(`direct:${url}`, dirname, { clone: true }, (err) => {
      logWithSpinner("模版下载成功");
      stopSpinner();
      if (err) return reject(err);
      resolve();
    });
  });
};
