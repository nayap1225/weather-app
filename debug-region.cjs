const fs = require("fs");
const path = require("path");

const regionsPath = path.join(__dirname, "src/data/regions.json");
const content = fs.readFileSync(regionsPath, "utf8");
const regions = JSON.parse(content);

const result = regions.filter((r) => r.name.includes("독산"));
console.log(JSON.stringify(result, null, 2));
