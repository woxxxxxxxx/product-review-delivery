// Mechanical build: embeds the pristine template so file:// export needs no fetch.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../assets/review-kit');
const bundle={html:fs.readFileSync(path.join(root,'index.html'),'utf8'),css:{},js:{}};
for(const name of ['styles.css','workbench.css','flow.css','audience.css'])bundle.css[name]=fs.readFileSync(path.join(root,name),'utf8');
for(const name of ['data.js','presentation.js','app.js','workbench.js','flow.js','editor.js','rule-annotations.js','audience.js'])bundle.js[name]=fs.readFileSync(path.join(root,name),'utf8');
bundle.fingerprint=crypto.createHash('sha256').update(JSON.stringify(bundle)).digest('hex');
fs.writeFileSync(path.join(root,'bundle.js'),'window.REVIEW_BUNDLE='+JSON.stringify(bundle).replace(/</g,'\\u003c')+';\n');
console.log('Export bundle built from '+Object.keys(bundle.js).length+' scripts and '+Object.keys(bundle.css).length+' stylesheets.');
if(process.argv[2]){
 let html=bundle.html;
 // Optional reviewed presentation overlay: validation is not business approval.
 if(process.argv[3]){
  const doc=JSON.parse(fs.readFileSync(path.resolve(process.argv[3]),'utf8'));
  const M=JSON.parse(bundle.js['data.js'].replace(/^\s*window\.PRODUCT_REVIEW\s*=\s*/,'').replace(/;\s*$/,''));
  const P=require(path.join(root,'presentation.js'));
  const edits=P.validate(doc,M,bundle.fingerprint);
  const embedded={format:'pm-review-edits',version:1,project:doc.project,baseDigest:bundle.fingerprint,reviewStatus:'presentation-changes-require-review',instance:crypto.randomUUID(),edits};
  html=html.replace('<script id="embeddedEdits" type="application/json">null</script>',()=>'<script id="embeddedEdits" type="application/json">'+JSON.stringify(embedded).replace(/</g,'\\u003c')+'</script>');
 }
 for(const [name,css] of Object.entries(bundle.css))html=html.replace('<link rel="stylesheet" href="'+name+'">','<style>'+css+'</style>');
 for(const name of [...Object.keys(bundle.js),'bundle.js']){
  const source=name==='bundle.js'?'window.REVIEW_BUNDLE='+JSON.stringify(bundle).replace(/</g,'\\u003c')+';':bundle.js[name];
  html=html.replace('<script src="'+name+'"></script>',()=>'<script>'+source.replace(/<\/script/gi,'<\\/script')+'</script>');
 }
 fs.writeFileSync(path.resolve(process.argv[2]),html);
 console.log('Standalone HTML generated.');
}
