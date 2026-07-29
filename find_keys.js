const fs = require('fs');
const content = fs.readFileSync('./src/data/zones.js', 'utf8');
const matches = [];
const regex = /^\s*\"([^\"]+)\"\s*:/mg;
let m;
while ((m = regex.exec(content)) !== null) {
  matches.push(m[1]);
}
console.log(JSON.stringify(matches, null, 2));
