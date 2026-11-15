// Copies the web game into www/ for the native apps
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..'),out=path.join(root,'www');
const keep=['index.html','tv.html','join.html','app.css','tv.css','app.js','tv.js','join.js','data.js','back.js','net.js','manifest.webmanifest','sw.js','assets','lib'];
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out);
for(const k of keep)fs.cpSync(path.join(root,k),path.join(out,k),{recursive:true});
console.log('www ready');
