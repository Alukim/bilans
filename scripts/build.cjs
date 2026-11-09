const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
fs.mkdirSync(path.join(root,'dist'),{recursive:true});
for(const name of ['index.html','style.css','engine.js','app.js'])fs.copyFileSync(path.join(root,name),path.join(root,'dist',name));
fs.writeFileSync(path.join(root,'dist','.nojekyll'),'');
console.log('Gotowe: dist/ — statyczne pliki na dowolny hosting.');
