import semver from "semver";
import chalk from "chalk";
import { resolvePackage } from "../utils/resolve.js";
// 一个做参数解析的工具包，这个工具可以用来解析process.argv的参数
import minimist from "minimist";
import { program } from "commander";
import create from "../lib/create.js";
import update from "../lib/update.js";
import generate from "../lib/Generator.js";

const pkg = resolvePackage();
const requiredVersion = pkg.engines.node;

function checkNodeVersion(wanted, id) {
  if (!semver.satisfies(process.version, wanted, { includePrerelease: true })) {
    console.log(
      chalk.red(
        "You are using Node " +
          process.version +
          ", but this version of " +
          id +
          " requires Node " +
          wanted +
          ".\nPlease upgrade your Node version."
      )
    );
    process.exit(1);
  }
}

// 检查 node 版本
checkNodeVersion(requiredVersion, "pd-cli");

// 版本
program.version(`pd-cli ${pkg.version}`).usage("<command> [options]");

// 创建
program
  .command("create <app-name>")
  .description("create a new project by template")
  // 直接指定模版名称
  .option("-t, --template <templateName>", "模版名称")
  // 使用默认配置
  // .option("-d, --default", "Skip prompts and use default preset")
  // 指定包管理工具
  .option(
    "-m, --packageManager <command>",
    "Use specified npm client when installing dependencies"
  )
  // 初始化 git 信息
  .option(
    "-g, --git [message]",
    "Force git initialization with initial commit message"
  )
  // 跳过初始化 git
  .option("-n, --no-git", "Skip git initialization")
  // 存在同名目录直接覆盖名称
  .option("-f, --force", "Overwrite target directory if it exists")
  // 合并目标目录
  .option("--merge", "Merge target directory if it exists")
  // 使用代理
  // .option("-x, --proxy <proxyUrl>", "Use specified proxy when creating project")
  .action((name, options) => {
    if (minimist(process.argv.slice(3))._.length > 1) {
      console.log(
        chalk.yellow(
          "\n Info: You provided more than one argument. The first one will be used as the app's name, the rest are ignored."
        )
      );
    }
    // --git makes commander to default git to true
    if (process.argv.includes("-g") || process.argv.includes("--git")) {
      options.forceGit = true;
    }
    create(name, options);
  });

// 更新 模版
program
  .command("update")
  .description("更新命令")
  .action(() => {
    if (minimist(process.argv.slice(3))._.length > 1) {
      console.log(
        chalk.yellow(
          "\n Info: You provided more than one argument. The first one will be used as the app's update type, the rest are ignored."
        )
      );
    }

    update();
  });

// 生成文件
program
  .command("g <name> [path]")
  .description("generates component file")
  // 生成路由时的配置
  .option("-r, --routes <routes>", "根据配置生成路由页面")
  .option("-t, --template <template>", "生成路由页面时使用的模版")
  .action((name, path, options) => {
    generate(name, path, options);
  });

program.parse(process.argv);
