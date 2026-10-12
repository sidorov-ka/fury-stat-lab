import {optimize} from './simulator.js?v=friendly-build-20261012';
self.onmessage=e=>{try{const result=optimize(e.data,p=>self.postMessage({type:'progress',...p}));self.postMessage({type:'result',result});}catch(e){self.postMessage({type:'error',message:e.message});}};
