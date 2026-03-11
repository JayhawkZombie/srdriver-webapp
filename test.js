import fs from "fs";

const data = await fs.promises.readFile("tsconfig.json", "utf8");
const tsconfig = JSON.parse(data);

console.log(tsconfig);
