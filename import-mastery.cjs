// Input downloaded from https://rutl.org/builder-data/skill-mastery-v2.json
const fs=require('fs');
const d=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const weapons={};
for(const key of ['CR','WA_GR']){
 const t=d.weapons[key];
 weapons[key]={name:t.name,nodes:t.nodes.map(n=>({id:n.id,name:n.nameRu||n.name,text:n.descriptionRu||n.text,category:n.category,grade:n.gradeName,ring:n.circleIndex,type:n.type,max:Math.min(10,n.maxLevel||10),x:n.qx,y:n.qy,shape:n.visual?.shape,icon:'icons/mastery/'+n.icon.split('/').at(-1),required:n.requirement?.points||0,levels:n.levels?.map(l=>l.stats||[])||[],stats:n.stats||[]})),links:t.links.map(l=>({from:l.from,to:l.to,color:l.color,points:l.qpoints}))};
}
fs.writeFileSync('dist/mastery-data.js','// RUTL RU client data, retrieved 2026-09-25. Values retain source units.\nexport const TREES='+JSON.stringify(weapons)+';\n');
