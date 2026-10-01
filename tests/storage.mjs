import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../dist/storage.js',import.meta.url),'utf8');
const {createStore,mergeDefaults,STORAGE_KEY}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const memory=new Map(),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)};
let store=createStore(storage);
const build={state:{attrs:{dex:80},items:{weapon1:{id:'test',level:9,traits:[{id:'crit',level:4}]}},active:['skill'],specs:{skill:['trait']}},weapon:'weapon2'};
const simulation={manual:{crossMin:87,crossMax:400},controls:{'sim-source':'manual','sim-auto':false},overrides:{skill:{cast:.3,pve:1.2}}};
assert.equal(store.save('build',build),true);store.save('simulation',simulation);
store=createStore(storage);assert.deepEqual(store.get('build'),build);assert.deepEqual(store.get('simulation'),simulation);
assert.deepEqual(mergeDefaults({attrs:{dex:10,str:10},newField:50},{attrs:{dex:80}}),{attrs:{dex:80,str:10},newField:50});
assert.equal(mergeDefaults(12,NaN),12);
for(const raw of ['broken',JSON.stringify({version:99,build})]){memory.set(STORAGE_KEY,raw);const bad=createStore(storage);assert.equal(bad.save('build',{}),false);assert.equal(memory.get(STORAGE_KEY),raw);}
let status='';const denied=createStore({getItem:()=>null,setItem:()=>{throw Error('quota')}},s=>status=s);assert.equal(denied.save('build',build),false);assert.match(status,/Не удалось сохранить/);
console.log('Storage tests passed: round trip, defaults migration, future/corrupt preservation, unavailable storage.');
