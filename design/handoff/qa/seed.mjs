export async function seed(p){
  await p.evaluate(()=>{
    const KEY='nexus_fiscal_v2';
    let r=localStorage.getItem(KEY);
    const u8=new Uint8Array(r.length-5); for(let i=5;i<r.length;i++)u8[i-5]=r.charCodeAt(i);
    const d=JSON.parse(pako.inflate(u8,{to:'string'}));
    const I=d.intimations;
    const day=(n)=>{const x=new Date();x.setDate(x.getDate()+n);return x.toISOString().slice(0,10);};
    const long='Ante o exposto, requer a Requerida: a) a intimação da União (Fazenda Nacional/PGFN) para que concorde com a conversão em renda dos depósitos judiciais vinculados ao processo executivo; b) a suspensão do incidente até a apreciação do pedido. Indeferido, por ora, o pedido de suspensão do incidente; manifeste-se a exequente no prazo de 15 dias sobre a certidão do oficial de justiça.';
    const teors=['Intimada a Fazenda para se manifestar sobre a exceção de pré-executividade no prazo de 10 dias.', long, 'Julgo improcedentes os embargos. Custas pela embargante.', 'Vistos. Considerando a impugnação apresentada pela Defensoria Pública da União, na condição de curadora especial do requerido citado por edital, intime-se a União para réplica no prazo de 15 dias. ¶ Após, abra-se vista ao Ministério Público Federal.'];
    I.forEach((x,i)=>{ if(i%2===0 && !x.decisionSummary) x.decisionSummary=teors[(i/2)%teors.length]; });
    const open=I.filter(x=>!x.responseAction);
    open[0].notesList=['Avaliar embargos de declaração (omissão sobre a prescrição)'];
    open[1].notesList=['Primeira nota antiga','Segunda nota','CONTEXTUALIZAR COM O OUTRO IDPJ','atualizar operação com SIDA','Defender a necessidade de transferência de valores em montante suficiente para satisfação do débito objeto do outro IDPJ (execução se faz no interesse do credor; crédito tributário não se submete à recuperação)'];
    open[2].notesList=['Antigravity + fable. Leitura e complementação pós, onde e se cabível','Conferir tese do Tema 1.209/STJ antes de fechar a peça'];
    open[2].urgent=true; open[2].className='Ação Anulatória de Débito Fiscal';
    open[3].partyName='SCALTECH-COMERCIO IMPORTACAO E EXPORTACAO DE MAQUINAS E EQUIPAMENTOS INDUSTRIAIS LTDA - EM RECUPERAÇÃO JUDICIAL';
    open[3]._importFlag='new'; open[3].hasPending=true; open[3].minutaUrl='https://docs.google.com/document/d/x';
    open[4]._importFlag='updated'; open[4].dateStart='2026-09-25';
    open[5].dateDeadline=''; open[5].dateStart='';
    open[6].dateStart='2026-09-28'; open[6].urgent=true; open[6].notesList=['Aguardar resposta da coordenação. Em caso de rescisão, pedir prosseguimento. Em caso de manutenção, avaliar.'];
    open[7].className='Embargos à Execução Fiscal'; open[7].decisionSummary='';
    const est=(cur,lbl,ago)=>({etapas:[{id:'e1',label:'Extração do relatório e triagem',status:cur>0?'done':'doing'},{id:'e2',label:lbl,status:cur===1?'doing':cur>1?'done':'todo'},{id:'e3',label:'Revisão',status:cur===2?'doing':'todo'},{id:'e4',label:'Protocolo',status:'todo'}],updatedAt:new Date(Date.now()-ago*864e5).toISOString()});
    open[0].esteira=est(1,'Leitura e ajustes',9); open[1].esteira=est(1,'Redação fina com título muito longo para testar o corte da linha da esteira na identidade',7); open[3].esteira=est(2,'Revisão',3);
    // resolvidas
    const ra=(t,pt,desc,o)=>({type:t,peticionType:pt,description:desc,respondedAt:day(o)});
    open[8].responseAction=ra('peticionamento','Manifestação','Impugnação ao IDPJ protocolada',-2);
    open[9].responseAction=ra('ciencia',null,'',-1);
    open[10].responseAction=ra('outra',null,'Reunião com a coordenação sobre a estratégia de execução e depois providências complementares extensas para testar quebra de linha',-20);
    open[11].status='analisado';
    // operação EM SUBSTITUIÇÃO
    const sub=d.operations.find(o=>/substitui/i.test(o.name||o.title||''));
    window.__subOp = sub && sub.id;
    if (sub) { open[12].operationId=sub.id; open[13].operationId=sub.id; open[8].operationId=sub.id; open[14].operationId=sub.id; open[14].notesList=['nota em substituição']; }
    const json=JSON.stringify(d); const z=pako.deflate(json,{level:6});
    let s=''; for(let i=0;i<z.length;i+=0x8000) s+=String.fromCharCode.apply(null,z.subarray(i,i+0x8000));
    localStorage.setItem(KEY,'DFL1|'+s);
    window.__seedInfo={n:I.length,sub:sub&&sub.name,keys:Object.keys(open[0])};
  });
  return await p.evaluate(()=>window.__seedInfo);
}
