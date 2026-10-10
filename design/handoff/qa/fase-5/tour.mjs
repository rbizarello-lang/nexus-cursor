import {launch,setup} from '../lib.mjs';
export async function openApp(b,{url,width=1440,height=1000,theme='Ardósia',font='Geist'}){
  const ctx=await b.newContext({viewport:{width,height}}); await setup(ctx);
  const p=await ctx.newPage(); p.on('dialog',d=>d.accept());
  const errs=[]; p.on('console',m=>{if(m.type()==='error')errs.push(m.text())}); p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  await p.goto(url); await p.waitForTimeout(1200);
  await p.click('button[title="Ajustes"]'); await p.waitForTimeout(300);
  await p.click('text=Resetar / carregar dados demo'); await p.waitForTimeout(3500);
  await p.reload(); await p.waitForTimeout(1500);
  await p.click('button[title="Ajustes"]'); await p.waitForTimeout(300);
  if (theme!=='Ardósia') await p.click(`.settings-panel button:text-is("${theme}")`);
  if (font!=='Geist') await p.click(`.settings-panel button:text-is("${font}")`);
  await p.waitForTimeout(300);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  const open=await p.$('.settings-panel'); if(open){ await p.click('.settings-panel button:text-is("✕")').catch(()=>{}); await p.waitForTimeout(300); }
  if (width<700) { await p.click('button[aria-label="Abrir menu"]').catch(()=>{}); await p.waitForTimeout(400); }
  return {p,ctx,errs};
}
const S=async(p,ms=900)=>p.waitForTimeout(ms);
export async function tour(p,cap,only){
  const fails=[];
  const step=async(name,f)=>{ if(only&&!only.includes(name)) return; try{ await f(); }catch(e){ fails.push(name+': '+e.message.split('\n')[0].slice(0,100)); } };
  const nav=async(t)=>{ await p.click(`.cx-side button[title="${t}"]`,{timeout:4000}); await S(p,1100); };
  const menuIfMobile=async()=>{ if((await p.viewportSize()).width<700){ const mb=await p.$('button[aria-label="Abrir menu"]'); if(mb&&await mb.isVisible()){await mb.click();await S(p,400);} } };
  await step('hoje',async()=>{await nav('Hoje');await cap('hoje');});
  await step('intim-lista',async()=>{await menuIfMobile();await nav('Intimações');await cap('intim-lista');});
  await step('intim-quadro',async()=>{await p.click('.cx-seg button:has-text("Quadro")',{timeout:2500});await S(p);await cap('intim-quadro');});
  await step('intim-foco',async()=>{await p.click('.cx-seg button:has-text("Foco")',{timeout:2500});await S(p);await cap('intim-foco');});
  await step('intim-gaveta',async()=>{await p.click('.cx-seg button:has-text("Lista")',{timeout:2500});await S(p);await p.click('.cx-ix >> nth=1',{timeout:3000});await S(p);await cap('intim-gaveta');await p.keyboard.press('Escape');await S(p,400);});
  await step('modal',async()=>{await p.click('button:has-text("Nova intimação")',{timeout:3000});await S(p);await cap('modal');await p.keyboard.press('Escape');await S(p,400);});
  for(const [t,n] of [['Tarefas','tarefas'],['Mesa de intimações','mesa'],['Agenda','agenda'],['Acompanhar','acompanhar']]) await step(n,async()=>{await menuIfMobile();await nav(t);await cap(n);});
  await step('timeline',async()=>{await menuIfMobile();await nav('Linha do tempo');await cap('timeline-Panorama');
    for(const m of ['Frentes','Prescrição','Narrativa']){ await p.click(`.cx-seg.lg button:text-is("${m}")`,{timeout:2500});await S(p);await cap('timeline-'+m);} });
  await step('prazos',async()=>{await menuIfMobile();await nav('Prazos extintivos');await cap('prazos');});
  await step('carteira',async()=>{await menuIfMobile();await nav('Carteira');await cap('carteira');});
  await step('painel',async()=>{await menuIfMobile();await nav('Painel');await cap('painel');});
  await step('atividade',async()=>{await menuIfMobile();await nav('Minha atividade');await cap('atividade');});
  await step('biblioteca',async()=>{await menuIfMobile();await nav('Biblioteca');await cap('biblioteca');});
  await step('importar',async()=>{await menuIfMobile();await nav('Importar eproc');await cap('importar');});
  await step('op',async()=>{
    await menuIfMobile(); await nav('Carteira');
    await p.click('.cx-side .cx-nav-op >> nth=0'); await S(p,1000);
    const sub=async(t)=>{ await menuIfMobile(); await p.click(`.cx-nav-sub button:has-text("${t}")`,{timeout:3000}); await S(p,1200); };
    await sub('Visão geral'); await cap('op-visao');
    await step('op-frentes',async()=>{await p.click('.cx-bft tbody tr.r >> nth=0',{timeout:3000});await S(p,800);await cap('op-frentes');});
    await step('op-mural',async()=>{await p.evaluate(()=>document.querySelector('.cx-mu')?.scrollIntoView());await S(p,800);await cap('op-mural');});
    await step('op-apoio',async()=>{
      await p.evaluate(()=>document.querySelector('.cx-ap')?.scrollIntoView()); await S(p,500);
      const ids=await p.$$eval('.cx-ap-tabs [role=tab]',els=>els.map(e=>e.id));
      for(const id of ids){ await p.click('#'+id); await S(p,600); await cap('op-apoio-'+id.replace('cx-ap-tab-','')); }
    });
    for(const [t,n] of [['Processos e prescrição','op-processos'],['Inscrições','op-inscricoes'],['Partes','op-partes'],['Bens','op-bens'],['Tarefas','op-tarefas'],['Arquivos','op-arquivos'],['Importar','op-importar']]) await step(n,async()=>{await sub(t);await cap(n);
      if(n==='op-processos'){ await step('ficha',async()=>{ await p.click('.cx-pt-row .cx-pt-num >> nth=0',{timeout:3000}); await S(p,900); await cap('ficha'); await p.keyboard.press('Escape'); await S(p,400);}); }
      if(n==='op-inscricoes'){ await step('cda',async()=>{ await p.click('.cx-pt-row >> nth=1',{timeout:3000}); await S(p,900); await cap('cda'); await p.keyboard.press('Escape'); await S(p,400);}); }
    });
  });
  await step('config',async()=>{await p.click('button[title="Ajustes"]');await S(p,500);await cap('config');await p.click('.settings-panel button:text-is("✕")').catch(()=>{});await S(p,300);});
  return fails;
}
