import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const sha = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
writeFileSync("ios/App/App/public/build.txt", `5\n${sha}\n`);
