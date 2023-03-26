import { downloadTemplate } from "../utils/download.js";
import { error, clearConsole } from "../utils/logger.js";
import { logWithSpinner, stopSpinner } from "../utils/spinner.js";

export default async function update() {
  logWithSpinner("download local template");
  try {
    await downloadTemplate();
  } catch (e) {
    error("update local template failed");
  }
  clearConsole();

  stopSpinner();

  process.exit(1);
}
