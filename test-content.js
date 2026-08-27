// Node-only bootstrap used by automated tests; browsers use data-loader.js.
const fs=require('node:fs');
const path=require('node:path');
const schema=require('./content-schema.js');
const names=['maps','orbs','towers','achievements','tutorial','waves','difficulties'];
const raw=Object.fromEntries(names.map(name=>[name,JSON.parse(fs.readFileSync(path.join(__dirname,'data',`${name}.json`),'utf8'))]));
module.exports=schema.build(raw);
