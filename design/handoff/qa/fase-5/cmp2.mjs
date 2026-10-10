import fs from 'fs'; import zlib from 'zlib';
const D='/tmp/claude-0/-home-user-nexus-cursor/23818a15-c2a0-58ad-967d-8552718fc8b0/scratchpad/qa-card/fase-5/';
for(const th of ['Ardósia','Noite']){
  const A=JSON.parse(zlib.gunzipSync(fs.readFileSync(D+`computed-before-${th}.json.gz`))), B=JSON.parse(zlib.gunzipSync(fs.readFileSync(D+`computed-after-${th}.json.gz`)));
  let tot=0,diff=0,miss=0; const sum={};
  for(const sc of Object.keys(A)){
    const a=A[sc],b=B[sc]||[]; if(a.length!==b.length){console.log(th,sc,'COUNT',a.length,b.length);miss++;}
    const n=Math.min(a.length,b.length);
    for(let i=0;i<n;i++){tot++; if(a[i][0]!==b[i][0]){console.log(th,sc,'KEY',a[i][0].slice(0,80),'|',b[i][0].slice(0,80));diff++;continue;}
      if(a[i][1]!==b[i][1]){ const pa=Object.fromEntries(a[i][1].split(';').map(x=>{const j=x.indexOf(':');return [x.slice(0,j),x.slice(j+1)]})), pb=Object.fromEntries(b[i][1].split(';').map(x=>{const j=x.indexOf(':');return [x.slice(0,j),x.slice(j+1)]}));
        const ch=Object.keys({...pa,...pb}).filter(k=>pa[k]!==pb[k]).map(k=>k+': '+String(pa[k]).slice(0,40)+' -> '+String(pb[k]).slice(0,40));
        if(!ch.length) continue; diff++; const key=sc+' '+a[i][0].slice(0,70)+' :: '+ch.slice(0,4).join(' ; '); sum[key]=(sum[key]||0)+1;}}
  }
  console.log(th,'screens',Object.keys(A).length,'elements',tot,'diff',diff,'countMismatch',miss);
  Object.entries(sum).slice(0,40).forEach(([k,v])=>console.log('  ',v,k));
}
