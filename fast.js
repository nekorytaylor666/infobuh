// save-cms.js
const fs = require("fs");

const b64Input = "";
const outFile = "";

// убираем пробелы/переносы строк (часто появляются при копировании)
const clean = b64Input.replace(/\s+/g, "");

const buf = Buffer.from(clean, "base64");
fs.writeFileSync(outFile, buf);

console.log(`Wrote ${buf.length} bytes to ${outFile}`);
