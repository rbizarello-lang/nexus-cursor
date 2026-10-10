import {launch,setup} from './lib.mjs';
import {seed} from './seed.mjs';
const b=await launch();
export async function open(width, theme, height){
  const ctx=await b.newContext({viewport:{width,height}}); await setup(ctx);
  const p=await ctx.newPage();
  p.on('dialog',d=>d.accept());
  const errs=[]; p.on('console',m=>{if(m.type()==='error')errs.push(m.text())}); p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  await p.goto('file:///home/user/nexus-cursor/Nexus.html?edition=claude');
  await p.waitForTimeout(1200);
  await p.click('button[title="Ajustes"]'); await p.waitForTimeout(300);
  if (theme!=='Ardósia') { await p.click(`.settings-panel button:text-is("${theme}")`); await p.waitForTimeout(300); }
  await p.click('text=Resetar / carregar dados demo'); await p.waitForTimeout(3500);
  const info=await seed(p);
  await p.reload(); await p.waitForTimeout(1500);
  if (width<700) { await p.click('button[aria-label="Abrir menu"]'); await p.waitForTimeout(500); }
  await p.click('button[title="Intimações"]'); await p.waitForTimeout(1200);
  return {p,ctx,errs,info};
}
if (process.argv[1].endsWith('app3.mjs')) {
  const info=[];
  for (const [w,t,h] of [[1920,'Ardósia',2600],[1280,'Ardósia',2800],[420,'Ardósia',900],[1920,'Noite',2600],[1280,'Noite',2800],[420,'Grafite',900]]) {
    const {p,ctx,errs,info:si}=await open(w,t,h);
    const tag=`${w}-${t}`;
    const el=await p.$('.cx-it-list');
    if (w<700) await p.screenshot({path:`s-${tag}-full.png`,fullPage:true}); 
    await el.screenshot({path:`s-${tag}-list.png`});
    const m=await p.evaluate(()=>{const l=document.querySelector('.cx-it-list');const rows=[...l.querySelectorAll('.cx-ix')];return {lw:l.clientWidth,n:rows.length,hs:rows.map(r=>Math.round(r.getBoundingClientRect().height)),docOver:document.documentElement.scrollWidth>innerWidth, clipped: rows.map((r,i)=>[...r.querySelectorAll('*')].filter(e=>{const b=e.getBoundingClientRect(),rb=r.getBoundingClientRect();return b.width>0&&(b.right>rb.right+1||b.left<rb.left-1)}).map(e=>e.className+'|'+Math.round(e.getBoundingClientRect().right-r.getBoundingClientRect().right)).slice(0,3)).filter(a=>a.length)}});
    console.log(tag, JSON.stringify(si), JSON.stringify(m), errs);
    await ctx.close();
  }
  await b.close();
}
