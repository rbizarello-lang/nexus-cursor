import fs from 'fs';
const tokens = fs.readFileSync('tokens2.css','utf8').replace(/\.th-ard \{/, '.th-ard, .th-all {');
const DOC=(s)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24"><rect x="2" y="1" width="20" height="22" rx="3" fill="#4285f4"/><path d="M14 1 22 9h-6a2 2 0 0 1-2-2z" fill="#8ab4f8"/><rect x="6" y="12" width="12" height="1.7" rx="0.85" fill="#fff"/><rect x="6" y="15.6" width="12" height="1.7" rx="0.85" fill="#fff"/><rect x="6" y="19.2" width="7.5" height="1.7" rx="0.85" fill="#fff"/></svg>`;
const css = `
${tokens}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:var(--cx-font);}
.wrap{display:flex;gap:0;flex-wrap:wrap}
.th{font-family:var(--cx-font);padding:14px;background:var(--cx-surface);color:var(--cx-ink)}
.th h4{font:600 11px var(--cx-mono);margin:0 0 8px;color:var(--cx-ink-2)}
.cols{display:flex;gap:10px}
.col{width:110px;min-height:84px;padding:8px 6px 9px;border:1px solid var(--cx-line);display:flex;flex-direction:column;gap:5px;position:relative;background:var(--cx-surface)}
.cap{font:500 9px var(--cx-mono);color:var(--cx-ink-3);width:110px}
.ixt{display:inline-flex;align-items:center;justify-content:center;height:16px;padding:0 5px;border-radius:3px;font:700 9px/1 var(--cx-mono);letter-spacing:.05em;text-transform:uppercase;width:100%}
.ixt.u{background:var(--cx-red);color:var(--cx-on-solid)}
.ixt.i{background:var(--cx-red-soft);color:var(--tag-i-ink);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--cx-red) 42%,transparent)}
.ixt.c{color:var(--cx-red);box-shadow:inset 0 0 0 1px var(--cx-red);font-weight:600}
.ixg{display:flex;flex-direction:column;gap:3px}
.ft{margin-top:auto;padding-top:6px;min-height:24px}
.doc{display:inline-flex;flex:none}
/* ---- T1 capsule of slim pills + icon ---- */
.t1 .ft{display:flex;justify-content:flex-end}
.t1 .cap1{display:inline-flex;align-items:center;gap:6px;padding:3px 4px 3px 6px;border-radius:7px;background:var(--cx-surface-2);box-shadow:inset 0 0 0 1px var(--cx-line)}
.t1 .p{display:flex;gap:2px;height:18px}
.t1 .p i{width:4px;border-radius:2px;background:var(--cx-line-strong)}
.t1 .p i.d{background:var(--cx-green)}.t1 .p i.n{background:var(--cx-blue)}
.t1 .sep{width:1px;height:18px;background:var(--cx-line)}
/* ---- T2 rail ---- */
.t2 .ft{display:flex}
.t2 .rail{flex:1;display:flex;align-items:center;gap:5px;height:24px;padding:0 3px 0 6px;border-radius:7px;background:var(--cx-surface-2);box-shadow:inset 0 0 0 1px var(--cx-line)}
.t2 .p{display:flex;gap:2px;height:18px}
.t2 .p i{width:4px;border-radius:2px;background:var(--cx-line-strong)}
.t2 .p i.d{background:var(--cx-green)}.t2 .p i.n{background:var(--cx-blue)}
.t2 .ln{flex:1;height:0;border-top:1.5px dotted var(--cx-line-strong);margin:0 1px}
.t2 .ln.done{border-top:1.5px solid var(--cx-green)}
.t2 .rail.noest .ln{visibility:hidden}
.t2 .rail.nopeca{padding-right:6px}
/* ---- T3 staircase ---- */
.t3 .ft{display:flex;justify-content:flex-end;align-items:flex-end;gap:6px}
.t3 .p{display:flex;gap:2px;align-items:flex-end;height:18px}
.t3 .p i{width:4px;border-radius:1.5px;background:var(--cx-line-strong)}
.t3 .p i.d{background:var(--cx-green)}.t3 .p i.n{background:var(--cx-blue)}
/* ---- T4 meter ---- */
.t4 .ft{display:flex;justify-content:flex-end;align-items:center;gap:6px}
.t4 .m{display:flex;gap:1.5px;height:18px;width:44px;padding:2px;border-radius:5px;box-shadow:inset 0 0 0 1px var(--cx-line-strong)}
.t4 .m i{flex:1;border-radius:1.5px;background:transparent}
.t4 .m i.d{background:var(--cx-green)}.t4 .m i.n{background:var(--cx-blue)}
.t4 .m i.d:first-child,.t4 .m i.n:first-child{border-radius:3px 1.5px 1.5px 3px}
.t4 .nub{width:2px;height:7px;margin-left:-5px;border-radius:0 2px 2px 0;background:var(--cx-line-strong)}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.55}}
i.n{animation:pulse 2s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){i.n{animation:none}}
`;
const tagsets=[['u','i','c'],['i'],['c'],[]];
const states=[
 {name:'2/4 doing', s:['d','n','',''], peca:1},
 {name:'all done', s:['d','d','d','d'], peca:1},
 {name:'1/4, no peça', s:['n','','',''], peca:0},
 {name:'no esteira, peça', s:null, peca:1},
 {name:'6 etapas, peça', s:['d','d','d','n','',''], peca:1},
];
const tags=(k)=>`<div class="ixg">${k.map(x=>`<span class="ixt ${x}">${{u:'URGENTE',i:'IMPORTANTE',c:'COMPLEXO'}[x]}</span>`).join('')}</div>`;
function ft(t,st){
  const bars=(st.s||[]).map(s=>`<i class="${s}"></i>`).join('');
  const n=(st.s||[]).length;
  const doc=st.peca?`<span class="doc">${DOC(18)}</span>`:'';
  if(t==='t1'){
    if(!st.s&&!st.peca) return '';
    return `<div class="ft"><span class="cap1">${st.s?`<span class="p">${bars}</span>`:''}${st.s&&st.peca?'<span class="sep"></span>':''}${doc}</span></div>`;
  }
  if(t==='t2'){
    if(!st.s&&!st.peca) return '';
    const allDone=st.s&&st.s.every(x=>x==='d');
    return `<div class="ft"><span class="rail${st.s?'':' noest'}${st.peca?'':' nopeca'}">${st.s?`<span class="p">${bars}</span><span class="ln${allDone?' done':''}"></span>`:'<span class="ln"></span>'}${doc}</span></div>`;
  }
  if(t==='t3'){
    const sb=(st.s||[]).map((s,i)=>`<i class="${s}" style="height:${Math.round(8+10*(i+1)/n)}px"></i>`).join('');
    return `<div class="ft">${st.s?`<span class="p">${sb}</span>`:''}${doc}</div>`;
  }
  if(t==='t4'){
    return `<div class="ft">${st.s?`<span class="m">${bars}</span>`:''}${doc}</div>`;
  }
}
let html=`<style>${css}</style><div class="wrap">`;
for(const th of ['th-ard','th-noite','th-graf']){
  html+=`<div class="th ${th}" style="background:var(--cx-surface)">`;
  for(const t of ['t1','t2','t3','t4']){
    html+=`<h4>${t}</h4><div class="cols ${t}">`;
    states.forEach((st,i)=>{ const k=tagsets[i%4]; html+=`<div><div class="col">${tags(k)}${ft(t,st)}</div><div class="cap">${st.name}</div></div>`; });
    html+=`</div><div style="height:12px"></div>`;
  }
  html+=`</div>`;
}
html+='</div>';
fs.writeFileSync('explore.html',`<!doctype html><meta charset=utf8>${html}`);
