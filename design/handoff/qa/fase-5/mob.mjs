import {launch} from '../lib.mjs';
import {openApp,tour} from './tour.mjs';
const D='/tmp/claude-0/-home-user-nexus-cursor/23818a15-c2a0-58ad-967d-8552718fc8b0/scratchpad/qa-card/fase-5/';
const [file,tag]=process.argv.slice(2);
const b=await launch();
const {p}=await openApp(b,{url:'file://'+file+'?edition=claude',width:420,height:900});
await tour(p,async(n)=>{ await p.waitForTimeout(500); await p.screenshot({path:`${D}mob-${tag}-${n}.png`}); },['hoje','tarefas']);
const ov=await p.evaluate(()=>document.documentElement.scrollWidth+'/'+innerWidth);
console.log(tag,ov); await b.close();
