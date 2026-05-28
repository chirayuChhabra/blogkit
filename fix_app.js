const fs = require('fs');
let text = fs.readFileSync('src/client/app.js', 'utf8');
text = text.replace(/\\\\'/g, "\\'");
fs.writeFileSync('src/client/app.js', text);
