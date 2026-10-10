import {launch} from '../lib.mjs';
import {openApp,tour} from './tour.mjs';
import fs from 'fs'; import zlib from 'zlib';
const D='/tmp/claude-0/-home-user-nexus-cursor/23818a15-c2a0-58ad-967d-8552718fc8b0/scratchpad/qa-card/fase-5/';
// usage: node snap.mjs computed <before|after> [theme] | shots <tag> <theme> <font> <width> [only]
const [mode,tag,theme='Ardósia',font='Geist',width='1440',only]=process.argv.slice(2);
const url=mode==='computed'&&tag==='before'?'file://'+D+'Nexus.before.html?edition=claude':'file:///home/user/nexus-cursor/Nexus.html?edition=claude';
const b=await launch();
const {p,errs}=await openApp(b,{url,theme,font,width:+width,height:mode==='computed'?1100:(+width<700?900:1500)});
const out={};
const cap=async(name)=>{
  await p.waitForTimeout(500);
  if(mode==='computed'){
    out[name]=await p.evaluate(()=>{
      const o=[];let i=0;
      document.querySelectorAll('[class*="cx-"]').forEach(e=>{
        const r=e.getBoundingClientRect(); if(!r.width&&!r.height) return;
        const cs=getComputedStyle(e); let s='';
        for(let k=0;k<cs.length;k++){const n=cs[k]; s+=n+':'+cs.getPropertyValue(n)+';';}
        s+='|rect:'+[r.x,r.y,r.width,r.height].map(v=>Math.round(v*10)/10).join(',');
        for(const ps of ['::before','::after']){const c=getComputedStyle(e,ps); if(c.content&&c.content!=='none'&&c.content!=='normal'){s+='|'+ps+':'+c.content+c.color+c.fontSize+c.display+c.width+c.height+c.backgroundColor;}}
        o.push([ (i++)+':'+e.tagName+'.'+String(e.className.baseVal??e.className).replace(/\s+/g,' '), s]);
      });
      return o;});
  } else {
    await p.screenshot({path:`${D}shots/${tag}-${theme}-${font}-${width}-${name}.png`,fullPage:false});
  }
};
fs.mkdirSync(D+'shots',{recursive:true});
const fails=await tour(p,cap,only?only.split(','):undefined);
if(mode==='computed') fs.writeFileSync(D+`computed-${tag}-${theme}.json.gz`,zlib.gzipSync(JSON.stringify(out)));
console.log(tag,theme,font,width,'FAILS',fails,'ERRS',errs);
await b.close();
