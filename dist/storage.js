// Stable key: releases change the schema, never the user's storage address.
export const STORAGE_KEY='fury-lab.profile';
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
export function mergeDefaults(defaults,saved){
 if(Array.isArray(defaults))return defaults.map((v,i)=>saved?.[i]??v);
 if(object(defaults))return Object.fromEntries(Object.entries(defaults).map(([k,v])=>[k,mergeDefaults(v,object(saved)?saved[k]:undefined)]));
 return saved!==undefined&&typeof saved===typeof defaults&&(typeof saved!=='number'||Number.isFinite(saved))?saved:defaults;
}
export function createStore(storage,status=()=>{}){
 let data={version:1},blocked=false;
 try{const raw=storage.getItem(STORAGE_KEY);if(raw){const parsed=JSON.parse(raw);if(!object(parsed)||parsed.version!==1)throw Error('version');data=parsed;status('Параметры восстановлены из этого браузера.');}}
 catch{blocked=true;status('Не удалось прочитать сохранение. Оно оставлено без изменений; автосохранение отключено.');}
 return {
  get:key=>data[key],
  save(key,value){if(blocked)return false;data[key]=value;try{storage.setItem(STORAGE_KEY,JSON.stringify(data));status('Сохранено в этом браузере · параметры сохраняются при обновлениях');return true;}catch{status('Не удалось сохранить параметры в браузере. Не закрывай страницу.');return false;}}
 };
}
