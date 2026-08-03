const { useState, useEffect, useCallback, useRef, useMemo } = React;

const STORAGE_KEY = 'nexus_fiscal_v2';
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const defaultData = () => ({ operations: [], people: [], debts: [], executions: [], measures: [], assets: [], documents: [], prescriptionEvents: [], intimations: [], tasks: [], stickyNotes: [], watchlist: [], hearings: [], desk: [], models: [], importLogs: [], changeLog: [], links: { measurePeople: [], measureAssets: [], cdaResponsibilities: [] } });
// Sugestões de classificação da biblioteca de modelos (texto livre — só orientam o formulário)
const MODEL_CATEGORIES = ['Execução Fiscal', 'IDPJ', 'Cautelar Fiscal', 'Embargos', 'Exceção de pré-executividade', 'Recursos', 'Constrição / Penhora', 'Parcelamento / Suspensão', 'Outros'];
const MODEL_SUBCATEGORIES = ['Prescrição', 'Redirecionamento', 'Dissolução irregular', 'Grupo econômico', 'Sucessão empresarial', 'Fraude à execução', 'Excesso de execução', 'Nulidade da CDA', 'Indisponibilidade de bens', 'Outros'];
// Termos que ligam o texto de uma peça/intimação às matérias acima (busca livre da aba Modelos)
const MODEL_MATTER_HINTS = {
  'Prescrição': ['prescri', 'art. 40', 'artigo 40', 'súmula 314', 'sumula 314', 'intercorrente', 'quinquenal', 'decadên'],
  'Redirecionamento': ['redirecion', 'art. 135', 'artigo 135', 'sócio-gerente', 'socio-gerente', 'corresponsáv', 'corresponsav'],
  'Dissolução irregular': ['dissolu', 'súmula 435', 'sumula 435', 'encerramento irregular', 'baixa cadastral'],
  'Grupo econômico': ['grupo econômico', 'grupo economico', 'confusão patrimonial', 'confusao patrimonial', 'art. 50', 'artigo 50', 'desconsidera'],
  'Sucessão empresarial': ['sucess', 'art. 132', 'art. 133', 'artigo 132', 'artigo 133', 'incorpora', 'cisão', 'cisao', 'fusão', 'fusao'],
  'Fraude à execução': ['fraude', 'alien', 'art. 185', 'artigo 185', 'insolv'],
  'Excesso de execução': ['excesso de execu', 'valor excessivo', 'memória de cálculo', 'memoria de calculo'],
  'Nulidade da CDA': ['nulidade', 'certidão de dívida', 'certidao de divida', 'requisitos da cda', 'higidez'],
  'Indisponibilidade de bens': ['indisponibil', 'sisbajud', 'renajud', 'cnib', 'penhora', 'arresto', 'bacenjud'],
};
// Classifica um texto livre (peça colada) nas matérias, por incidência de termos
const guessMatters = (texto) => {
  const t = String(texto || '').toLowerCase();
  if (!t.trim()) return [];
  return Object.entries(MODEL_MATTER_HINTS)
    .map(([materia, termos]) => ({ materia, hits: termos.filter(k => t.includes(k)).length }))
    .filter(x => x.hits > 0)
    .sort((a, b) => b.hits - a.hits);
};

// ─── DADOS DE DEMONSTRAÇÃO (uso local/teste) ───
// Gera um dataset fictício, coerente e interligado, com datas relativas a "hoje"
// para popular os painéis (quadro semanal, agenda 30 dias, prescrição iminente, revisões).
// Todos os nomes/CPFs/CNPJs/processos são inventados.
const generateDemoData = () => {
  // Data local (meio-dia para evitar viradas de fuso/DST) no formato YYYY-MM-DD
  const iso = (n) => { const d = new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const ts = (n) => new Date(Date.now() + n*86400000).toISOString();
  const base = defaultData();
  return { ...base,
    operations: [
      { id:'op-demo-1', name:'Operação Fachada Norte', description:'Grupo econômico com interposição de pessoas e blindagem patrimonial no norte do PR.', status:'ativa', priority:'alta', classifications:['alta_relevancia','constricao_ativa'], opCategory:'alta_relevancia', reviewInterval:'mensal', lastReviewedAt: iso(-40), lastAccessed: ts(-1), createdAt: ts(-210) },
      { id:'op-demo-2', name:'Operação Laranjas do Vale', description:'Distribuidora usando interpostas pessoas; medida cautelar fiscal em curso.', status:'ativa', priority:'normal', classifications:['replicar','muitos_bens'], opCategory:'replicar', reviewInterval:'mensal', lastReviewedAt: iso(-20), lastAccessed: ts(-3), createdAt: ts(-160) },
      { id:'op-demo-3', name:'Operação Sucessão Empresarial Sul', description:'Sucessão de fato entre metalúrgicas; execução suspensa (art. 40) e embargos.', status:'ativa', priority:'normal', classifications:['em_andamento','recurso_interposto'], reviewInterval:'trimestral', lastReviewedAt: iso(-86), lastAccessed: ts(-8), createdAt: ts(-400) },
    ],
    people: [
      { id:'pe-1', operationId:'op-demo-1', name:'Comercial Fachada Norte LTDA', subtype:'PJ', cpfCnpj:'12.345.678/0001-90', role:'Devedora originária', operationRole:'alvo' },
      { id:'pe-2', operationId:'op-demo-1', name:'João Almeida Souza', subtype:'PF', cpfCnpj:'123.456.789-00', role:'Sócio administrador (redirecionado)', operationRole:'alvo' },
      { id:'pe-3', operationId:'op-demo-1', name:'Marina Ferreira Norte', subtype:'PF', cpfCnpj:'987.654.321-00', role:'Sócia — incluída por IDPJ', operationRole:'alvo' },
      { id:'pe-4', operationId:'op-demo-2', name:'Distribuidora Vale Verde EIRELI', subtype:'PJ', cpfCnpj:'22.333.444/0001-55', role:'Devedora originária', operationRole:'alvo' },
      { id:'pe-5', operationId:'op-demo-2', name:'Carlos Eduardo Menezes', subtype:'PF', cpfCnpj:'111.222.333-44', role:'Interposta pessoa (laranja)', operationRole:'alvo' },
      { id:'pe-6', operationId:'op-demo-3', name:'Indústria Metalúrgica Sul S/A', subtype:'PJ', cpfCnpj:'33.444.555/0001-22', role:'Sociedade sucedida', operationRole:'alvo' },
      { id:'pe-7', operationId:'op-demo-3', name:'Nova Metal Sul LTDA', subtype:'PJ', cpfCnpj:'44.555.666/0001-33', role:'Sucessora de fato', operationRole:'alvo' },
    ],
    debts: [
      { id:'cda-1', operationId:'op-demo-1', personId:'pe-1', cdaNumber:'90.6.23.000123-45', value:1250000, system:'SIDA', status:'ativa_ajuizada', prescriptionDate: iso(6), inscriptionDate: iso(-1500), processNumber:'5001234-56.2023.4.04.7001', tribute:'IRPJ' },
      { id:'cda-2', operationId:'op-demo-1', personId:'pe-1', cdaNumber:'90.6.23.000124-45', value:480000, system:'SIDA', status:'garantida', prescriptionDate: iso(410), inscriptionDate: iso(-1490), processNumber:'5001234-56.2023.4.04.7001', tribute:'CSLL' },
      { id:'cda-3', operationId:'op-demo-2', personId:'pe-4', cdaNumber:'90.6.22.000777-01', value:2340000, system:'Pandora', status:'ativa_ajuizada', prescriptionDate: iso(95), inscriptionDate: iso(-1800), processNumber:'5007777-88.2022.4.04.7002', tribute:'PIS/COFINS' },
      { id:'cda-4', operationId:'op-demo-2', personId:'pe-4', cdaNumber:'90.6.22.000778-01', value:150000, system:'SIDA', status:'parcelada', prescriptionDate: iso(620), tribute:'IRPJ' },
      { id:'cda-5', operationId:'op-demo-3', personId:'pe-6', cdaNumber:'90.6.19.000045-88', value:5600000, system:'SIDA', status:'suspensa_judicial', prescriptionDate: iso(130), inscriptionDate: iso(-2400), processNumber:'5000045-12.2019.4.04.7003', tribute:'IRPJ' },
      { id:'cda-6', operationId:'op-demo-3', personId:'pe-6', cdaNumber:'90.6.19.000046-88', value:320000, system:'SIDA', status:'ativa', prescriptionDate: iso(60), prescriptionHandled:true, prescriptionHandledAt: iso(-10), prescriptionHandledType:'declarada', tribute:'CSLL' },
    ],
    executions: [
      { id:'ex-1', operationId:'op-demo-1', processNumber:'5001234-56.2023.4.04.7001', className:'Execução Fiscal', court:'1ª Vara Federal de Maringá', processTag:'normal', status:'ativa', hasGuarantee:false, prescriptionInterrupted:true, analyticsRegistered:true, protocolDate: iso(-500) },
      { id:'ex-2', operationId:'op-demo-1', processNumber:'5009876-11.2024.4.04.7001', className:'Incidente de Desconsideração da Personalidade Jurídica', court:'1ª Vara Federal de Maringá', processTag:'idpj', status:'ativa', linkedExecutionIds:['ex-1'], protocolDate: iso(-120) },
      { id:'ex-3', operationId:'op-demo-2', processNumber:'5007777-88.2022.4.04.7002', className:'Execução Fiscal', court:'2ª Vara Federal de Londrina', processTag:'central', status:'ativa', hasGuarantee:true, protocolDate: iso(-800) },
      { id:'ex-4', operationId:'op-demo-2', processNumber:'5003333-22.2024.4.04.7002', className:'Medida Cautelar Fiscal', court:'2ª Vara Federal de Londrina', processTag:'cautelar_fiscal', status:'ativa', linkedExecutionIds:['ex-3'], protocolDate: iso(-90) },
      { id:'ex-5', operationId:'op-demo-3', processNumber:'5000045-12.2019.4.04.7003', className:'Execução Fiscal', court:'3ª Vara Federal de Curitiba', processTag:'normal', status:'suspensa', prescriptionForecast: iso(320), protocolDate: iso(-1600) },
      { id:'ex-6', operationId:'op-demo-3', processNumber:'5008888-77.2025.4.04.7003', className:'Embargos à Execução Fiscal', court:'3ª Vara Federal de Curitiba', processTag:'normal', status:'ativa', parentExecutionId:'ex-5', protocolDate: iso(-30) },
    ],
    assets: [
      { id:'as-1', operationId:'op-demo-1', description:'Imóvel — Matrícula 45.678 CRI Maringá', subtype:'imovel', value:900000, status:'indisponibilidade_ativa', registry:'45.678', holderId:'pe-1', analyticsRegistered:true, source:'CNIB', processRef:'5001234-56.2023.4.04.7001' },
      { id:'as-2', operationId:'op-demo-1', description:'Veículo — BMW X5 placa ABC1D23', subtype:'veiculo', value:280000, status:'indisponibilidade_requerida', holderId:'pe-2', source:'Renajud' },
      { id:'as-3', operationId:'op-demo-2', description:'Bloqueio de conta bancária', subtype:'conta_bancaria', value:145000, status:'indisponibilidade_ativa', holderId:'pe-4', source:'Sisbajud', processRef:'5003333-22.2024.4.04.7002' },
      { id:'as-4', operationId:'op-demo-3', description:'Participação societária — 40% Nova Metal Sul', subtype:'participacao', value:1200000, status:'controvertido', holderId:'pe-7', source:'Analytics' },
    ],
    intimations: [
      { id:'in-1', operationId:'op-demo-1', processNumber:'5001234-56.2023.4.04.7001', jurisdiction:'PR', className:'Execução Fiscal', partyName:'Comercial Fachada Norte LTDA', eventDescription:'Manifestar sobre exceção de pré-executividade — 15 dias', dateSent: iso(-3), dateStart: iso(-2), dateDeadline: iso(5), status:'pendente_analise', priority:'alta', difficulty:'alta', urgent:false },
      { id:'in-2', operationId:'op-demo-2', processNumber:'5007777-88.2022.4.04.7002', jurisdiction:'PR', className:'Embargos à Execução', partyName:'Distribuidora Vale Verde EIRELI', eventDescription:'Vista para réplica aos embargos — 15 dias', dateStart: iso(-3), dateDeadline: iso(12), status:'aguardando_subsidios', priority:'normal', difficulty:'media', urgent:false },
      { id:'in-3', operationId:'op-demo-1', processNumber:'5009876-11.2024.4.04.7001', jurisdiction:'PR', className:'IDPJ', partyName:'Marina Ferreira Norte', eventDescription:'Manifestação sobre instauração de IDPJ — 15 dias', dateStart: iso(-17), dateDeadline: iso(-2), status:'pendente_analise', priority:'alta', difficulty:'alta', urgent:true },
      { id:'in-4', operationId:'op-demo-3', processNumber:'5000045-12.2019.4.04.7003', jurisdiction:'PR', className:'Execução Fiscal', partyName:'Indústria Metalúrgica Sul S/A', eventDescription:'Ciência de decisão — arquivamento art. 40 LEF', dateDeadline: iso(20), status:'analisado', priority:'baixa', difficulty:'baixa', urgent:false },
    ],
    tasks: [
      { id:'ta-1', operationId:'op-demo-1', title:'Requerer extensão de penhora sobre imóvel matrícula 45.678', description:'Peticionar nos autos da EF requerendo ampliação da constrição.', priority:'alta', dueDate: iso(3), status:'pendente', taskVisibility:'global' },
      { id:'ta-2', operationId:'op-demo-2', title:'Elaborar réplica aos embargos à execução', description:'Rebater tese de excesso de execução.', priority:'media', dueDate: iso(9), status:'em_andamento', taskVisibility:'operation' },
      { id:'ta-3', operationId:'op-demo-3', title:'Analisar viabilidade de redirecionamento à sucessora', description:'Reunir provas da sucessão de fato para IDPJ.', priority:'media', dueDate: iso(-4), status:'pendente', taskVisibility:'global' },
      { id:'ta-4', operationId:'', title:'Revisar rotina de importação do eproc (geral)', description:'Tarefa geral, sem operação vinculada.', priority:'baixa', dueDate: iso(18), status:'pendente', taskVisibility:'global' },
    ],
    hearings: [
      { id:'he-1', operationId:'op-demo-1', date: iso(4), time:'14:30', processNumber:'5009876-11.2024.4.04.7001', parties:'FAZENDA NACIONAL X Marina Ferreira Norte', hearingType:'justificacao', status:'agendada', modality:'presencial', location:'1ª Vara Federal de Maringá', remindDays:'3', roteiro:'Sustentar caracterização do grupo econômico e confusão patrimonial.' },
      { id:'he-2', operationId:'op-demo-2', date: iso(24), time:'10:00', processNumber:'5007777-88.2022.4.04.7002', parties:'FAZENDA NACIONAL X Distribuidora Vale Verde EIRELI', hearingType:'instrucao', status:'agendada', modality:'virtual', location:'https://webex.jus.br/sala/2vf-londrina', remindDays:'5', roteiro:'Inquirição de testemunhas sobre a interposição de pessoas.' },
      { id:'he-3', operationId:'op-demo-3', date: iso(-5), time:'09:00', processNumber:'5000045-12.2019.4.04.7003', parties:'FAZENDA NACIONAL X Indústria Metalúrgica Sul S/A', hearingType:'una', status:'realizada', modality:'presencial', location:'3ª Vara Federal de Curitiba', remindDays:'3' },
    ],
    watchlist: [
      { id:'wa-1', operationId:'op-demo-2', processNumber:'5005555-44.2025.4.04.7002', parties:'FAZENDA NACIONAL X Distribuidora Vale Verde EIRELI', status:'movimentado', reason:'Aguardando homologação de acordo de parcelamento.', createdAt: ts(-15) },
      { id:'wa-2', operationId:'', processNumber:'5006666-55.2025.4.04.7000', parties:'FAZENDA NACIONAL X Terceiro Interessado', status:'aguardando', reason:'Possível conexão com a Operação Fachada Norte.', createdAt: ts(-5) },
    ],
    documents: [
      { id:'do-1', operationId:'op-demo-1', title:'Petição — Resposta à exceção de pré-executividade', url:'https://docs.google.com/document/d/exemplo-demo-1', type:'Manifestação', createdAt: ts(-2) },
      { id:'do-2', operationId:'op-demo-2', title:'Minuta — Réplica aos embargos', url:'https://docs.google.com/document/d/exemplo-demo-2', type:'Réplica', createdAt: ts(-1) },
    ],
    links: {
      measurePeople: [], measureAssets: [],
      cdaResponsibilities: [
        { id:'rl-1', cdaId:'cda-1', personId:'pe-1', role:'originario', basis:'Devedor originário', addedAt: ts(-200) },
        { id:'rl-2', cdaId:'cda-1', personId:'pe-2', role:'coresponsavel_redirecionamento', basis:'Redirecionamento art. 135 CTN — decisão evento 32', addedAt: ts(-100) },
        { id:'rl-3', cdaId:'cda-1', personId:'pe-3', role:'coresponsavel_idpj', basis:'Incluída por IDPJ — decisão evento 15', addedAt: ts(-110) },
        { id:'rl-4', cdaId:'cda-2', personId:'pe-1', role:'originario', basis:'Devedor originário', addedAt: ts(-200) },
        { id:'rl-5', cdaId:'cda-3', personId:'pe-4', role:'originario', basis:'Devedor originário', addedAt: ts(-300) },
        { id:'rl-6', cdaId:'cda-3', personId:'pe-5', role:'coresponsavel_idpj', basis:'Interposta pessoa — IDPJ deferido', addedAt: ts(-80) },
        { id:'rl-7', cdaId:'cda-4', personId:'pe-4', role:'originario', basis:'Devedor originário', addedAt: ts(-300) },
        { id:'rl-8', cdaId:'cda-5', personId:'pe-6', role:'originario', basis:'Devedor originário', addedAt: ts(-600) },
        { id:'rl-9', cdaId:'cda-5', personId:'pe-7', role:'sucessor_de_fato', basis:'Sucessão de fato — em apuração', addedAt: ts(-60) },
        { id:'rl-10', cdaId:'cda-6', personId:'pe-6', role:'originario', basis:'Devedor originário', addedAt: ts(-600) },
      ],
    },
  };
};

const RESPONSIBILITY_ROLES = {
  originario: { label: 'Devedor Originário', color: 'var(--green)', bg: 'rgba(64,168,112,0.15)', icon: '🟢', desc: 'Pessoa em face de quem o crédito foi originalmente constituído.' },
  coresponsavel_legal: { label: 'Corresponsável (Lei)', color: 'var(--blue)', bg: 'rgba(91,143,217,0.15)', icon: '🔵', desc: 'Corresponsável por força de lei — sucessão (art. 132/133 CTN), fusão, cisão, incorporação.' },
  coresponsavel_idpj: { label: 'Incluído por IDPJ', color: 'var(--pgfn-light)', bg: 'rgba(184,48,96,0.15)', icon: '🔴', desc: 'Pessoa incluída no polo passivo por decisão proferida em Incidente de Desconsideração da Personalidade Jurídica.' },
  coresponsavel_redirecionamento: { label: 'Redirecionamento', color: 'var(--yellow)', bg: 'rgba(212,168,56,0.15)', icon: '🟡', desc: 'Sócio-administrador alcançado por redirecionamento (art. 135 CTN).' },
  sucessor_de_fato: { label: 'Sucessor de Fato', color: 'var(--text-secondary)', bg: 'rgba(122,139,163,0.15)', icon: '◆', desc: 'Sucessão de fato pendente de reconhecimento judicial.' },
  terceiro_garantidor: { label: 'Garantidor', color: 'var(--text-muted)', bg: 'rgba(120,140,170,0.15)', icon: '⚪', desc: 'Terceiro que ofereceu garantia (não responde, mas patrimônio está vinculado).' }
};
const PERSON_OPERATION_ROLES = {
  alvo: { label: 'Alvo Direto', color: 'var(--pgfn-light)', desc: 'Pessoa contra a qual a operação é dirigida diretamente.' },
  relacionada: { label: 'Relacionada (análise)', color: 'var(--text-muted)', desc: 'Pessoa cadastrada para subsídio analítico — não é alvo direto neste momento.' }
};
// ─── MIGRAÇÕES ───
// Normaliza QUALQUER payload (cache local, pull da nuvem, restore de arquivo) para o
// formato corrente. Antes só o cache local passava por aqui — dados vindos da nuvem
// entravam crus e só se ajeitavam no reload seguinte.
const applyMigrations = (parsed) => {
  const merged = { ...defaultData(), ...(parsed || {}) };
  // Poda: importLogs crescem sem limite (diffs pesados) e ajudam a estourar o cache.
  // Mantém os 50 mais recentes; diffs completos só nos 10 últimos.
  if (Array.isArray(merged.importLogs) && merged.importLogs.length > 0) {
    const sorted = [...merged.importLogs].sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));
    const keep = sorted.slice(-50);
    const diffCut = Math.max(0, keep.length - 10);
    merged.importLogs = keep.map((l, i) => { if (i >= diffCut) return l; const { diff, ...rest } = l; return rest; });
  }
  // Migration: ensure links.cdaResponsibilities exists
  if (!merged.links) merged.links = {};
  if (!merged.links.cdaResponsibilities) merged.links.cdaResponsibilities = [];
  if (!merged.links.measurePeople) merged.links.measurePeople = [];
  if (!merged.links.measureAssets) merged.links.measureAssets = [];
  // Migration: every CDA with personId should have an "originario" record
  const existingOrig = new Set(merged.links.cdaResponsibilities.filter(r => r.role === 'originario').map(r => r.cdaId));
  (merged.debts || []).forEach(d => {
    if (d.personId && !existingOrig.has(d.id)) {
      merged.links.cdaResponsibilities.push({
        id: 'mig-' + d.id,
        cdaId: d.id,
        personId: d.personId,
        role: 'originario',
        basis: 'Migração automática (devedor originário)',
        addedAt: d.createdAt || new Date().toISOString()
      });
    }
  });
  // Migration: ensure every person has operationRole field (default 'alvo')
  (merged.people || []).forEach(p => { if (!p.operationRole) p.operationRole = 'alvo'; });
  // Migration: 'prazo_fechado' deixou de ser status — aberto/fechado deriva do prazo (dateDeadline).
  (merged.intimations || []).forEach(x => { if (x.status === 'prazo_fechado') x.status = 'pendente_analise'; });
  // Mesa de trabalho: descarta refs de itens que não existem mais
  if (Array.isArray(merged.desk) && merged.desk.length > 0) {
    const alive = { intimation: new Set((merged.intimations||[]).map(i => i.id)), task: new Set((merged.tasks||[]).map(t => t.id)), hearing: new Set((merged.hearings||[]).map(h => h.id)) };
    merged.desk = merged.desk.filter(x => x && alive[x.type] && alive[x.type].has(x.id));
  }
  return merged;
};
// ─── DIAGNÓSTICO DE INTEGRIDADE ───
// Varre os dados procurando inconsistências silenciosas (as que não quebram a tela,
// mas fazem número sumir): formatos divergentes de processo, órfãos, duplicatas.
// Cada achado traz `fix` quando a correção é segura e automatizável.
const runDiagnostics = (data) => {
  const d = data || {};
  const ops = d.operations || [], execs = d.executions || [], debts = d.debts || [];
  const intims = d.intimations || [], people = d.people || [], hearings = d.hearings || [];
  const tasks = d.tasks || [], assets = d.assets || [], desk = d.desk || [];
  const opIds = new Set(ops.map(o => o.id));
  const execIds = new Set(execs.map(e => e.id));
  const out = [];
  const add = (sev, id, titulo, itens, detalhe, fix) => { if (itens.length) out.push({ sev, id, titulo, itens, detalhe, fix }); };

  // 1. Mesmo processo gravado com formatos diferentes (raiz do cruzamento que falhava)
  const byDigits = {};
  const push = (col, x, label) => { const n = normProc(x.processNumber); if (!n) return; (byDigits[n] = byDigits[n] || []).push({ col, label, raw: x.processNumber }); };
  execs.forEach(x => push('executions', x, 'processo'));
  debts.forEach(x => push('debts', x, 'CDA ' + (x.cdaNumber || 's/n')));
  intims.forEach(x => push('intimations', x, 'intimação'));
  const divergentes = Object.entries(byDigits)
    .filter(([, arr]) => new Set(arr.map(a => a.raw)).size > 1)
    .map(([n, arr]) => ({ id: n, texto: [...new Set(arr.map(a => a.raw))].join('  ↔  '), sub: arr.length + ' registro(s)' }));
  add('media', 'formato', 'Mesmo processo com formatos diferentes', divergentes,
    'O cruzamento já é feito por dígitos, então não há mais perda de dados — mas padronizar deixa as buscas e a leitura consistentes.', 'padronizar');

  // 2. Execuções duplicadas (mesmo processo cadastrado 2x)
  const execByDigits = {};
  execs.forEach(e => { const n = normProc(e.processNumber); if (n) (execByDigits[n] = execByDigits[n] || []).push(e); });
  add('alta', 'dupexec', 'Processos cadastrados em duplicidade',
    Object.values(execByDigits).filter(a => a.length > 1).map(a => ({ id: a[0].id, texto: a[0].processNumber || 's/nº', sub: a.length + ' cadastros' })),
    'O mesmo processo aparece mais de uma vez. Os vínculos (CDAs, apensos) ficam divididos entre eles.');

  // 3. Pessoas duplicadas por CPF/CNPJ na mesma operação
  const pByDoc = {};
  people.forEach(p => { const doc = String(p.cpfCnpj || '').replace(/\D/g, ''); if (doc) (pByDoc[doc + '|' + p.operationId] = pByDoc[doc + '|' + p.operationId] || []).push(p); });
  add('media', 'duppessoa', 'Pessoas duplicadas (mesmo CPF/CNPJ)',
    Object.values(pByDoc).filter(a => a.length > 1).map(a => ({ id: a[0].id, texto: a[0].name || 's/nome', sub: a.length + ' cadastros · ' + (a[0].cpfCnpj || '') })),
    'Mesmo documento cadastrado mais de uma vez na operação — divide responsabilidades e bens.');

  // 4. Registros apontando para operação inexistente
  const orfaos = [];
  [['debts', debts, 'CDA'], ['executions', execs, 'processo'], ['intimations', intims, 'intimação'], ['hearings', hearings, 'audiência'], ['people', people, 'pessoa'], ['assets', assets, 'bem']]
    .forEach(([col, arr, lbl]) => arr.forEach(x => { if (x.operationId && !opIds.has(x.operationId)) orfaos.push({ id: x.id, texto: lbl + ': ' + (x.processNumber || x.cdaNumber || x.name || x.parties || x.description || x.id), sub: 'operação inexistente' }); }));
  add('alta', 'orfaos', 'Registros de operação excluída', orfaos,
    'Sobraram apontando para uma operação que não existe mais — invisíveis na interface, mas ocupam espaço e distorcem totais.', 'desvincular');

  // 5. Vínculos entre processos apontando para o vazio
  const vinculos = [];
  execs.forEach(e => {
    if (e.parentExecutionId && !execIds.has(e.parentExecutionId)) vinculos.push({ id: e.id, texto: e.processNumber || e.id, sub: 'apensado a processo inexistente' });
    (e.linkedExecutionIds || []).forEach(x => { if (!execIds.has(x)) vinculos.push({ id: e.id, texto: e.processNumber || e.id, sub: 'abrange execução inexistente' }); });
  });
  add('media', 'vinculos', 'Vínculos entre processos quebrados', vinculos,
    'Apensamento ou abrangência de incidente apontando para processo excluído.', 'limpar');

  // 6. Refs mortas na Mesa
  const alive = { intimation: new Set(intims.map(i => i.id)), task: new Set(tasks.map(t => t.id)), hearing: new Set(hearings.map(h => h.id)) };
  add('info', 'mesa', 'Itens da Mesa que não existem mais',
    desk.filter(x => !x || !alive[x.type] || !alive[x.type].has(x.id)).map((x, i) => ({ id: 'desk' + i, texto: (x && x.type) || '?', sub: 'registro excluído' })),
    'Restos na fila de foco. Não aparecem na tela, mas viajam para a nuvem.', 'limpar');

  // 7. CDA sem responsável originário
  const respCda = new Set(((d.links || {}).cdaResponsibilities || []).filter(r => r.role === 'originario').map(r => r.cdaId));
  add('info', 'semresp', 'CDAs sem devedor originário',
    debts.filter(x => x.status !== 'extinta' && !respCda.has(x.id) && !x.personId).map(x => ({ id: x.id, texto: 'CDA ' + (x.cdaNumber || 's/n'), sub: fmtCur(x.value || 0) })),
    'Sem devedor vinculado, a CDA não entra na exposição por pessoa.');

  // 8. Intimação sem operação, mas cujo processo existe numa operação
  const semOp = intims.filter(x => !x.operationId && x.processNumber && !x.responseAction).map(x => {
    const e = execs.find(ex => sameProc(ex.processNumber, x.processNumber));
    return e && e.operationId ? { id: x.id, texto: x.processNumber, sub: '→ ' + ((ops.find(o => o.id === e.operationId) || {}).name || '?'), opId: e.operationId } : null;
  }).filter(Boolean);
  add('media', 'intimsemop', 'Intimações que podem ser vinculadas', semOp,
    'O processo dessas intimações já existe numa operação cadastrada — dá para vincular automaticamente.', 'vincular');

  // 9. CDA cujo processo não está cadastrado
  add('info', 'cdasemproc', 'CDAs com processo não cadastrado',
    debts.filter(x => x.processNumber && x.status !== 'extinta' && !execs.some(e => sameProc(e.processNumber, x.processNumber)))
      .map(x => ({ id: x.id, texto: 'CDA ' + (x.cdaNumber || 's/n'), sub: x.processNumber })),
    'A execução correspondente não existe no cadastro — o valor não é somado ao processo.');

  return out;
};
const loadData = () => {
  try {
    let r = localStorage.getItem(STORAGE_KEY);
    if (!r) return defaultData();
    // Payload comprimido (ver saveData). Se a lib não carregou (offline), retorna vazio —
    // no GAS o app puxa a nuvem na abertura, então nada se perde.
    if (r.slice(0, 5) === 'LZS1|') {
      if (typeof LZString === 'undefined' || !LZString.decompressFromUTF16) return defaultData();
      r = LZString.decompressFromUTF16(r.slice(5)) || '';
      if (!r) return defaultData();
    }
    const parsed = JSON.parse(r);
    return applyMigrations(parsed);
  } catch { return defaultData(); }
};
let _quotaWarned = false;
const LZ_PREFIX = 'LZS1|'; // marca payload comprimido no localStorage (JSON cru começa com '{')
const saveData = (d) => {
  const json = JSON.stringify(d);
  try {
    // Compressão UTF-16 (~5x menor): datasets grandes estouravam a cota de ~5MB do
    // localStorage e o save local falhava SEMPRE — o cache congelava numa versão velha
    // que, recarregada, podia sobrescrever a nuvem. Fallback: JSON cru se a lib faltar.
    const payload = (typeof LZString !== 'undefined' && LZString.compressToUTF16)
      ? LZ_PREFIX + LZString.compressToUTF16(json)
      : json;
    localStorage.setItem(STORAGE_KEY, payload);
    _quotaWarned = false;
  } catch (e) {
    // QuotaExceededError ou similar — cache local cheio. Dados continuam em memória.
    if (!_quotaWarned) {
      _quotaWarned = true;
      alert('⚠ ATENÇÃO: o cache local do navegador está cheio (limite ~5MB), MESMO com compressão.\n\nSuas edições NÃO estão sendo salvas localmente.\n\n1. Sincronize AGORA com a nuvem (botão ⬆ na sidebar) — o save na nuvem não depende do cache.\n2. Considere limpar dados antigos (histórico de importações, operações encerradas).\n\nEste aviso aparecerá uma vez por sessão.');
    }
    console.error('saveData: quota exceeded', e);
  }
};
const fmtCur = (v) => { if (!v && v !== 0) return '—'; return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v); };
const fmtDate = (d) => { if (!d) return '—'; return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR'); };
const daysUntil = (d) => { if (!d) return null; return Math.ceil((new Date(d + 'T00:00:00') - new Date()) / 86400000); };
// ─── Nº de processo: comparar SEMPRE por dígitos ───
// As planilhas de origem divergem no formato (eproc traz "5001234-56.2023.4.04.7001",
// a Procuradoria traz "50012345620234047001"). Comparar string crua fazia o cruzamento
// falhar em silêncio (CDA sem valor, EF "sem CDAs", intimação sem processo).
const normProc = (s) => String(s == null ? '' : s).replace(/\D/g, '');
const sameProc = (a, b) => { const x = normProc(a); return !!x && x === normProc(b); };
// ─── Feriados nacionais + recesso forense (art. 220 CPC) ───
// Calcula a Páscoa (algoritmo de Meeus) para feriados móveis.
const _easterDate = (y) => {
  const a = y % 19, b = Math.floor(y/100), cc = y % 100, dd = Math.floor(b/4), e = b % 4,
        f = Math.floor((b+8)/25), g = Math.floor((b-f+1)/3), h = (19*a+b-dd-g+15) % 30,
        i = Math.floor(cc/4), k = cc % 4, l = (32+2*e+2*i-h-k) % 7, m = Math.floor((a+11*h+22*l)/451),
        month = Math.floor((h+l-7*m+114)/31), day = ((h+l-7*m+114) % 31) + 1;
  return new Date(y, month-1, day);
};
const _holidayCache = {};
const _nationalHolidays = (y) => {
  if (_holidayCache[y]) return _holidayCache[y];
  const pad = (n) => String(n).padStart(2,'0');
  const iso = (dt) => `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}`;
  const easter = _easterDate(y);
  const shift = (base, days) => { const d = new Date(base); d.setDate(d.getDate()+days); return d; };
  const set = new Set([
    `${y}-01-01`, `${y}-04-21`, `${y}-05-01`, `${y}-09-07`, `${y}-10-12`,
    `${y}-11-02`, `${y}-11-15`, `${y}-11-20`, `${y}-12-25`,
    iso(shift(easter,-48)), iso(shift(easter,-47)),  // Carnaval (seg/ter)
    iso(shift(easter,-2)),                            // Sexta-feira Santa
    iso(shift(easter,60)),                            // Corpus Christi
    `${y}-08-11`, `${y}-11-01`, `${y}-12-08`          // feriados forenses (Lei 5.010/66, art. 62)
  ]);
  _holidayCache[y] = set;
  return set;
};
// Recesso forense: 20/dez a 20/jan — prazos suspensos (art. 220 CPC)
const _inForensicRecess = (d) => {
  const m = d.getMonth(), day = d.getDate();
  return (m === 11 && day >= 20) || (m === 0 && day <= 20);
};
const isBusinessDay = (d) => {
  const dow = d.getDay();
  if (dow === 0 || dow === 6) return false;
  if (_inForensicRecess(d)) return false;
  const pad = (n) => String(n).padStart(2,'0');
  return !_nationalHolidays(d.getFullYear()).has(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`);
};
const addBusinessDays = (dateStr, n) => { if (!dateStr) return null; const d = new Date(dateStr + 'T00:00:00'); let added = 0; while (added < n) { d.setDate(d.getDate() + 1); if (isBusinessDay(d)) added++; } return d.toISOString().slice(0, 10); };
const truncate = (s, n) => s && s.length > n ? s.slice(0, n) + '…' : s;

// ─── Validação do dígito verificador CNJ (Res. CNJ 65/2008) ───
// Formato: NNNNNNN-DD.AAAA.J.TR.OOOO. DV = 98 - (NNNNNNNAAAAJTROOOO*100 mod 97).
// Retorna: null (não parece CNJ — não valida), true (DV correto), false (DV INCORRETO).
const validateCNJ = (s) => {
  if (!s) return null;
  const digits = String(s).replace(/\D/g, '');
  if (digits.length !== 20) return null; // só valida formato CNJ completo
  const nnnnnnn = digits.slice(0, 7), dv = digits.slice(7, 9), rest = digits.slice(9); // AAAA J TR OOOO
  // mod 97 sobre string (evita overflow de Number)
  const mod97 = (numStr) => { let r = 0; for (const ch of numStr) r = (r * 10 + (ch.charCodeAt(0) - 48)) % 97; return r; };
  const calc = 98 - mod97(nnnnnnn + rest + '00');
  return String(calc).padStart(2, '0') === dv;
};

// ─── Cópia para área de transferência (fallback p/ iframe GAS sem clipboard API) ───
const copyText = (text) => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).catch(() => _copyFallback(text));
  }
  return Promise.resolve(_copyFallback(text));
};
const _copyFallback = (text) => {
  const ta = document.createElement('textarea');
  ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); } catch (e) {}
  document.body.removeChild(ta);
};

// ─── Qualificação formatada (pronta para colar em petição) ───
const buildPersonQualification = (p, data) => {
  const lines = [];
  const tipo = p.subtype === 'PJ' ? (p.cpfCnpj ? 'pessoa jurídica de direito privado, inscrita no CNPJ sob o nº ' + p.cpfCnpj : 'pessoa jurídica de direito privado') : (p.cpfCnpj ? 'inscrito(a) no CPF sob o nº ' + p.cpfCnpj : '');
  let qual = (p.name || '').toUpperCase();
  if (tipo) qual += ', ' + tipo;
  // Endereço: pessoa não tem campo dedicado — busca em notesList (ex.: notas do import SIDA)
  const allNotes = (p.notesList || (p.notes ? [p.notes] : [])).join(' ');
  const endMatch = allNotes.match(/Endere[çc]o:?\s*([^.;\n]+)/i) || allNotes.match(/Munic[íi]pio:?\s*([^.;\n]+)/i);
  if (endMatch) qual += ', com endereço em ' + endMatch[1].trim();
  lines.push(qual + '.');
  const links = (data.links?.cdaResponsibilities || []).filter(l => l.personId === p.id);
  const cdaIds = new Set(links.map(l => l.cdaId));
  const cdas = (data.debts || []).filter(d => cdaIds.has(d.id));
  if (cdas.length > 0) {
    const total = cdas.reduce((s, d) => s + (d.value || 0), 0);
    lines.push('');
    lines.push(`CDAs vinculadas (${cdas.length} — total ${fmtCur(total)}):`);
    cdas.forEach(d => lines.push(`  • CDA ${d.cdaNumber || '—'}${d.value ? ' — ' + fmtCur(d.value) : ''}${d.processNumber ? ' — Proc. ' + d.processNumber : ''}`));
  }
  const procs = [...new Set(cdas.map(d => d.processNumber).filter(Boolean))];
  if (procs.length > 0) {
    lines.push('');
    lines.push(`Processos: ${procs.join('; ')}`);
  }
  return lines.join('\n');
};
const buildExecQualification = (e, data) => {
  const lines = [];
  lines.push(`Processo nº ${e.processNumber || '—'}`);
  if (e.className) lines.push(`Classe: ${e.className}`);
  if (e.court) lines.push(`Juízo: ${e.court}`);
  const cdas = (data.debts || []).filter(d => sameProc(d.processNumber, e.processNumber));
  if (cdas.length > 0) {
    const total = cdas.reduce((s, d) => s + (d.value || 0), 0);
    lines.push(`CDAs exequendas (${cdas.length} — total ${fmtCur(total)}): ${cdas.map(d => d.cdaNumber).filter(Boolean).join('; ')}`);
  }
  const cdaIds = new Set(cdas.map(d => d.id));
  const personIds = new Set((data.links?.cdaResponsibilities || []).filter(l => cdaIds.has(l.cdaId)).map(l => l.personId));
  const people = (data.people || []).filter(p => personIds.has(p.id));
  if (people.length > 0) {
    lines.push(`Executado(s): ${people.map(p => `${p.name}${p.cpfCnpj ? ' (' + p.cpfCnpj + ')' : ''}`).join('; ')}`);
  }
  return lines.join('\n');
};

// Shared robust date parser — handles SheetJS formats, serial numbers, DD/MM/YYYY, ISO
const parseAnyDate = (v) => {
  if (!v || v === 'nan' || v === 'undefined') return '';
  const s = String(v).trim();
  if (!s || s === '-') return '';
  // ISO: YYYY-MM-DD
  const iso = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  // DD/MM/YYYY (BR)
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`;
  // M/D/YY or M/D/YYYY (US — SheetJS raw:false may produce this)
  const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (mdy) {
    let y = mdy[3]; if (y.length === 2) y = (parseInt(y) > 50 ? '19' : '20') + y;
    return `${y}-${mdy[1].padStart(2,'0')}-${mdy[2].padStart(2,'0')}`;
  }
  // Excel serial number
  const num = parseFloat(s);
  if (!isNaN(num) && num > 30000 && num < 60000) {
    const d = new Date((num - 25569) * 86400000);
    return d.toISOString().slice(0, 10);
  }
  return '';
};

// Auto-calculate prescription date from imported data
// Art. 40 LEF: 1 ano suspensão + 5 anos arquivamento = 6 anos total
// Para CDA ajuizada: conta a partir da última data entre inscrição e ajuizamento (protocolo)
// Para CDA não ajuizada: prescrição originária de 5 anos a partir da inscrição (art. 174 CTN)
const calcAutoPresc = (debt, executions, events = []) => {
  if (debt.prescriptionDate) return debt.prescriptionDate; // data manual prevalece
  const inscDate = debt.inscriptionDate;
  const exec = debt.processNumber ? executions.find(e => sameProc(e.processNumber, debt.processNumber)) : null;
  const protDate = exec?.protocolDate;

  // Need at least one date to calculate
  if (!inscDate && !protDate) return '';

  // Get events affecting this CDA (directly or via batch)
  // Also include events of the PARENT execution if this CDA is linked to an apensa execution
  const directEvents = events.filter(e =>
    e.cdaId === debt.id ||
    (e.batchCdaIds && e.batchCdaIds.includes(debt.id)) ||
    (exec && e.executionId === exec.id && !e.cdaId && (!e.batchCdaIds || e.batchCdaIds.length === 0))
  );
  let inheritedEvents = [];
  if (exec && exec.parentExecutionId) {
    const parent = executions.find(e => e.id === exec.parentExecutionId);
    if (parent) {
      // Inherit events linked to parent execution itself, or to CDAs of the parent
      const parentCdaIds = new Set(); // would need debts here, but we only have events
      inheritedEvents = events.filter(e =>
        (e.executionId === parent.id && !e.cdaId && (!e.batchCdaIds || e.batchCdaIds.length === 0)) ||
        e._inheritedFromParent === parent.id
      );
    }
  }
  const cdaEvents = [...directEvents, ...inheritedEvents].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));

  let baseDate;
  if (exec) {
    // Ajuizada: max(inscrição, protocolo) + 6 anos
    let baseMs;
    if (inscDate && protDate) {
      baseMs = Math.max(new Date(inscDate + 'T00:00:00').getTime(), new Date(protDate + 'T00:00:00').getTime());
    } else {
      baseMs = new Date((protDate || inscDate) + 'T00:00:00').getTime();
    }
    baseDate = new Date(baseMs);
    baseDate.setFullYear(baseDate.getFullYear() + 6);
  } else {
    // Não ajuizada: 5 anos da inscrição
    if (!inscDate) return '';
    baseDate = new Date(inscDate + 'T00:00:00');
    baseDate.setFullYear(baseDate.getFullYear() + 5);
  }

  // Apply events: interruptive resets, suspensive shifts forward.
  // Special handling: constriction events (penhora, arresto, SISBAJUD, CNIB) END the Art. 40 cycle.
  // After a constriction, there's no active prescription unless a new marco is registered.
  const CONSTRICTION_TYPES = new Set(['int_penhora', 'int_arresto', 'int_sisbajud', 'int_cnib', 'int_citacao_devedor']);
  let lastEventWasConstriction = false;

  for (const evt of cdaEvents) {
    if (!evt.date || !evt.type) continue;
    const evtType = PRESC_EVENT_TYPES[evt.type];
    if (!evtType) continue;
    const evtDate = new Date(evt.date + 'T00:00:00');
    const isParcelamento = evt.type === 'susp_parcelamento';

    // Check if this is a marco (restarts the Art. 40 cycle after a constriction)
    if (evtType.category === 'marco') {
      lastEventWasConstriction = false;
      // Marco after constriction: new cycle starts
      const newBase = new Date(evtDate);
      newBase.setFullYear(newBase.getFullYear() + 6); // 1 year suspension + 5 years
      baseDate = newBase;
      continue;
    }

    // Step 1: interruptive effect (also applies to parcelamento)
    if (evtType.category === 'interruptiva' || isParcelamento) {
      if (CONSTRICTION_TYPES.has(evt.type)) {
        // Constriction = Art. 40 cycle ENDS (assets found)
        lastEventWasConstriction = true;
      } else {
        lastEventWasConstriction = false;
      }
      const newBase = new Date(evtDate);
      newBase.setFullYear(newBase.getFullYear() + 5);
      baseDate = newBase;
    }

    // Step 2: suspensive effect (also applies after parcelamento's interruption)
    if (evtType.category === 'suspensiva') {
      lastEventWasConstriction = false;
      const endDate = evt.endDate ? new Date(evt.endDate + 'T00:00:00') : new Date(); // ongoing → up to today
      const suspDays = Math.max(0, Math.floor((endDate - evtDate) / 86400000));
      baseDate = new Date(baseDate.getTime() + suspDays * 86400000);
    }
  }

  // If the last significant event was a constriction, the Art. 40 cycle is over.
  // No prescription is running — return empty (safe).
  if (lastEventWasConstriction) return '';

  return baseDate.toISOString().slice(0, 10);
};

const DEBT_STATUSES = {
  ativa: { label: 'Ativa', badge: 'badge-muted' },
  ativa_ajuizada: { label: 'Ativa Ajuizada', badge: 'badge-muted' },
  ativa_nao_ajuizavel: { label: 'Não Ajuizável', badge: 'badge-yellow' },
  parcelada: { label: 'Parcelada', badge: 'badge-cyan' },
  negociada_sispar: { label: 'Negociada SISPAR', badge: 'badge-muted' },
  suspensa_judicial: { label: 'Suspensa (Judicial)', badge: 'badge-orange' },
  suspensa_admin: { label: 'Suspensa (Admin)', badge: 'badge-orange' },
  garantida: { label: 'Garantida', badge: 'badge-green' },
  extinta: { label: 'Extinta', badge: 'badge-muted-strong' }
};
const EXEC_STATUSES = {
  ativa: { label: 'Ativa', badge: 'badge-muted' },
  suspensa: { label: 'Suspensa', badge: 'badge-yellow' },
  arquivada: { label: 'Arquivada', badge: 'badge-muted-strong' },
  extinta: { label: 'Extinta', badge: 'badge-muted-strong' }
};
const MEASURE_SUBTYPES = { cautelar: 'Cautelar Fiscal', desconsideracao: 'Desc. Pers. Jurídica', arresto: 'Arresto', penhora_online: 'Penhora Online', outro: 'Outro' };
const WATCH_STATUSES = {
  aguardando: { label: '🟡 Aguardando', badge: 'badge-yellow' },
  movimentado: { label: '🔵 Movimentado', badge: 'badge-blue' },
  encerrado: { label: '✅ Encerrado', badge: 'badge-green' }
};
const AUDIENCIA_STATUSES = {
  agendada: { label: '📅 Agendada', badge: 'badge-blue' },
  realizada: { label: '✅ Realizada', badge: 'badge-green' },
  redesignada: { label: '🔄 Redesignada', badge: 'badge-yellow' },
  cancelada: { label: '✖ Cancelada', badge: 'badge-muted' }
};
const OP_CLASSIFICATIONS = {
  alta_relevancia: { label: 'Alta Relevância', color: 'var(--red)', border: 'var(--red)' },
  replicar: { label: 'Replicar', color: 'var(--yellow)', border: 'var(--yellow)' },
  avaliar_replicamento: { label: 'Avaliar Replicamento', color: 'var(--orange)', border: 'rgba(216,136,64,0.45)' },
  nao_replicar: { label: 'Não Replicar', color: 'var(--purple)', border: 'rgba(122,139,163,0.45)' },
  novas: { label: 'Novas', color: 'var(--blue)', border: 'var(--blue)' },
  em_andamento: { label: 'Em Andamento', color: 'var(--green)', border: 'var(--green)' },
  procedente_1grau: { label: 'Procedente em 1º Grau', color: 'var(--green)', border: 'var(--green)' },
  improcedente_1grau: { label: 'Improcedente em 1º Grau', color: 'var(--pgfn)', border: 'var(--pgfn)' },
  recurso_interposto: { label: 'Recurso Interposto', color: 'var(--yellow)', border: 'rgba(212,168,56,0.45)' },
  recurso_provido: { label: 'Recurso Provido', color: 'var(--blue)', border: 'rgba(91,143,217,0.45)' },
  transito_julgado: { label: 'Trânsito em Julgado', color: 'var(--gold)', border: 'var(--gold)' },
  suspenso: { label: 'Suspenso', color: 'rgba(255,255,255,0.55)', border: 'rgba(255,255,255,0.18)' },
  poucos_bens: { label: 'Poucos Bens', color: '#d4a05a', border: '#92631a' },
  muitos_bens: { label: 'Muitos Bens', color: 'var(--green)', border: 'var(--green)' },
  bens_suficientes: { label: 'Bens Suficientes', color: 'var(--green)', border: 'var(--green)' },
  sem_bens: { label: 'Sem Bens', color: '#d4a05a', border: '#92631a' },
  constricao_ativa: { label: 'Constrição Ativa', color: 'var(--cyan)', border: 'var(--cyan)' },
  parcelamento_parcial: { label: 'Parcelamento Parcial', color: 'var(--blue)', border: 'rgba(59,130,246,0.4)' },
  parcelamento_negociacao: { label: 'Parcelamento em Negociação', color: 'var(--yellow)', border: 'rgba(212,168,56,0.4)' },
  parceladas: { label: 'Parceladas', color: 'rgba(255,255,255,0.6)', border: 'rgba(255,255,255,0.2)' }
};
// Leitura retrocompatível das classificações de uma operação.
// Suporta o novo campo `classifications` (array) e o legado `classification` (string única).
// Filtra chaves removidas/desconhecidas (ex.: 'julgado' descontinuado) — não causam crash, apenas somem.
function getOpClassifications(op) {
  if (!op) return [];
  if (Array.isArray(op.classifications)) return op.classifications.filter(k => OP_CLASSIFICATIONS[k]);
  if (op.classification && OP_CLASSIFICATIONS[op.classification]) return [op.classification];
  return [];
}
const ASSET_SUBTYPES = { imovel: 'Imóvel', veiculo: 'Veículo', conta_bancaria: 'Conta Bancária', investimento: 'Investimento', participacao: 'Participação Societária', outro: 'Outro' };
const ASSET_STATUSES = {
  indisponibilidade_ativa: { label: 'Indisponibilidade Ativa', badge: 'badge-green' },
  indisponibilidade_requerida: { label: 'Indisponibilidade Requerida', badge: 'badge-yellow' },
  liberado: { label: 'Liberado', badge: 'badge-muted' },
  controvertido: { label: 'Controvertido', badge: 'badge-red' }
};
const DOC_TYPES = ['Petição Inicial', 'Réplica', 'Embargos', 'Recurso', 'Parecer', 'Decisão', 'Sentença', 'Acórdão', 'Manifestação', 'Outro'];

// Process tag labels (used across Processos and Proc & Presc² tabs)
const tagLabels = { idpj: '🔴 IDPJ', cautelar_fiscal: '🟠 Cautelar Fiscal', central: '◆ Central' };

// Review intervals — cadência de acompanhamento por operação
const REVIEW_INTERVALS = {
  semanal: { days: 7, label: 'Semanal' },
  quinzenal: { days: 14, label: 'Quinzenal' },
  mensal: { days: 30, label: 'Mensal' },
  trimestral: { days: 90, label: 'Trimestral' },
  none: { days: null, label: 'Sem revisão' }
};
function reviewStatus(op) {
  // Retorna { overdue, daysLeft, label, color } para uma operação
  const interval = REVIEW_INTERVALS[op.reviewInterval || 'mensal'];
  if (!interval.days) return { overdue: false, daysLeft: null, label: 'Sem revisão automática', color: 'var(--text-muted)' };
  const last = op.lastReviewedAt ? new Date(op.lastReviewedAt) : null;
  if (!last) return { overdue: true, daysLeft: -999, label: 'Nunca revisada', color: 'var(--red)' };
  const daysSince = Math.floor((Date.now() - last.getTime()) / 86400000);
  const daysLeft = interval.days - daysSince;
  if (daysLeft < 0) return { overdue: true, daysLeft, label: `Revisão atrasada há ${Math.abs(daysLeft)}d`, color: 'var(--red)' };
  if (daysLeft <= 3) return { overdue: false, daysLeft, label: `Revisão em ${daysLeft}d`, color: 'var(--yellow)' };
  return { overdue: false, daysLeft, label: `Revisão em ${daysLeft}d`, color: 'var(--green)' };
}

// Estágio processual para briefing de operação
// Tags de estágio processual para IDPJ/Cautelar (multi-select)
const PROCESS_STAGE_TAGS = {
  liminar_deferida: { label: 'Liminar deferida', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  sem_recurso: { label: 'Sem recurso', color: '#6b7280', bg: 'rgba(107,114,128,0.15)' },
  recurso_interposto: { label: 'Recurso interposto', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  recurso_com_liminar: { label: 'Recurso c/ liminar deferida', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  recurso_liminar_indeferida: { label: 'Recurso c/ liminar indeferida', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  saneamento_provas: { label: 'Saneamento e provas', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  decisao_favoravel: { label: 'Decisão final favorável', color: '#22c55e', bg: 'rgba(34,197,94,0.2)' },
  decisao_desfavoravel: { label: 'Decisão final desfavorável', color: '#dc2626', bg: 'rgba(220,38,38,0.2)' },
  transitado: { label: 'Transitado em julgado', color: '#22c55e', bg: 'rgba(34,197,94,0.25)' },
};
// PROCESS_STAGE_TAGS is the single source of truth for stage definitions (legado — multi-seleção)

// ─── Estágio processual V2 — HISTÓRICO POR FASE (cada fase guarda data, nº do evento e desfecho) ───
const PROCESS_STAGES = {
  ajuizamento: { label: 'Ajuizamento',         outcomes: {} },
  liminar:     { label: 'Liminar',             outcomes: { favoravel: 'favorável', desfavoravel: 'desfavorável' } },
  recurso1:    { label: 'Recurso',             outcomes: { provido: 'provido', nao_provido: 'não provido', pendente: 'pendente de julgamento' }, multiRecurso: true },
  saneamento:  { label: 'Saneamento e provas', outcomes: {} },
  decisao:     { label: 'Decisão final',       outcomes: { favoravel: 'favorável', desfavoravel: 'desfavorável' } },
  recurso2:    { label: 'Recurso',             outcomes: { provido: 'provido', nao_provido: 'não provido', pendente: 'pendente de julgamento' }, multiRecurso: true },
  transito:    { label: 'Trânsito em julgado', outcomes: {} },
};
const PROCESS_STAGE_KEYS = Object.keys(PROCESS_STAGES);
// Fases próprias do processo CENTRAL (EF com redirecionamento discutido nos próprios autos — sem IDPJ/MCF apartado)
const CENTRAL_STAGES = {
  ajuizamento_ef: { label: 'Ajuizamento da EF',          outcomes: {} },
  pedido_redir:   { label: 'Pedido de redirecionamento', outcomes: {} },
  decisao:        { label: 'Decisão',                    outcomes: { favoravel: 'favorável', desfavoravel: 'desfavorável' } },
  recurso:        { label: 'Recurso',                    outcomes: { provido: 'provido', nao_provido: 'não provido', pendente: 'pendente de julgamento' }, multiRecurso: true },
  transito:       { label: 'Trânsito em julgado',        outcomes: {} },
};
const CENTRAL_STAGE_KEYS = Object.keys(CENTRAL_STAGES);
// Cor por desfecho: favorável/provido = verde; desfavorável/não provido = vermelho; registrada sem desfecho = azul
const outcomeColor = (o) => (o === 'favoravel' || o === 'provido') ? 'var(--green)' : (o === 'desfavoravel' || o === 'nao_provido') ? 'var(--red)' : (o === 'pendente') ? 'var(--yellow)' : 'var(--blue)';
const outcomeTint  = (o) => (o === 'favoravel' || o === 'provido') ? 'rgba(64,168,112,0.18)' : (o === 'desfavoravel' || o === 'nao_provido') ? 'rgba(244,63,94,0.18)' : (o === 'pendente') ? 'rgba(212,168,56,0.18)' : 'rgba(91,143,217,0.18)';
// Normaliza recursos de uma fase multi-recurso (retrocompatível com o antigo rec.procs: array de strings)
const getRecursos = (rec) => {
  if (!rec) return [];
  if (Array.isArray(rec.recursos)) return rec.recursos;
  if (Array.isArray(rec.procs)) return rec.procs.map(p => typeof p === 'string' ? { proc: p, date: '', outcome: '' } : p);
  return [];
};
// Cor da fase de recurso derivada dos recursos: pendente/sem desfecho = amarelo/azul; algum não provido = vermelho; todos providos = verde
const recursoColor = (recs) => {
  if (!recs.length) return 'var(--text-muted)';
  if (recs.some(r => r.outcome === 'pendente' || !r.outcome)) return 'var(--yellow)';
  if (recs.some(r => r.outcome === 'nao_provido')) return 'var(--red)';
  return 'var(--green)';
};
const stageRecColor = (rec) => !rec ? 'var(--text-muted)' : outcomeColor(rec.outcome);
// Mapeia tags legadas (PROCESS_STAGE_TAGS / processStages) para (fase, desfecho) do modelo por-fase
const PROCESS_STAGE_LEGACY_MAP = {
  liminar_deferida:           { stage: 'liminar',    outcome: 'favoravel' },
  sem_recurso:                { stage: 'liminar',    outcome: '' },
  recurso_interposto:         { stage: 'recurso1',   outcome: '' },
  recurso_com_liminar:        { stage: 'recurso1',   outcome: 'provido' },
  recurso_liminar_indeferida: { stage: 'recurso1',   outcome: 'nao_provido' },
  saneamento_provas:          { stage: 'saneamento', outcome: '' },
  decisao_favoravel:          { stage: 'decisao',    outcome: 'favoravel' },
  decisao_desfavoravel:       { stage: 'decisao',    outcome: 'desfavoravel' },
  transitado:                 { stage: 'transito',   outcome: '' },
};
// Deriva o mapa de registros por-fase a partir de dados legados (tags / processStages)
const deriveStageRecords = (tags, legacyStage) => {
  const all = (tags && tags.length) ? tags : (legacyStage ? [legacyStage] : []);
  const out = {};
  all.forEach(t => { const m = PROCESS_STAGE_LEGACY_MAP[t]; if (m) out[m.stage] = { date: '', evento: '', outcome: m.outcome, _migrada: true }; });
  return out;
};
// Lê os registros de fase de um processo (modelo V2, com fallback para as tags legadas)
const getStageRecords = (briefing, execId) => {
  const raw = ((briefing || {}).processStageV2 || {})[execId];
  if (raw && typeof raw === 'object' && !('stage' in raw)) return raw;
  return deriveStageRecords(((briefing || {}).processTags || {})[execId], ((briefing || {}).processStages || {})[execId]);
};
// Estágio processual em HTML para a Passagem de Serviço (usa o modelo V2 — antes o
// relatório ainda lia as tags legadas e ignorava tudo que era preenchido na régua).
const renderStageHtmlV2 = (briefing, exec, esc) => {
  const recs = getStageRecords(briefing, exec.id);
  const STG = exec.processTag === 'central' ? CENTRAL_STAGES : PROCESS_STAGES;
  const parts = Object.keys(STG).filter(k => recs[k]).map(k => {
    const rec = recs[k] || {}, sd = STG[k];
    const isMulti = !!sd.multiRecurso;
    const rs = isMulti ? getRecursos(rec) : [];
    const col = isMulti
      ? (rs.some(r => r.outcome === 'pendente' || !r.outcome) ? '#a06020' : rs.some(r => r.outcome === 'nao_provido') ? '#c03040' : '#207848')
      : (rec.outcome === 'favoravel' || rec.outcome === 'provido') ? '#207848' : (rec.outcome === 'desfavoravel' || rec.outcome === 'nao_provido') ? '#c03040' : '#2860b0';
    let det;
    if (isMulti) {
      det = rs.length ? rs.map((r, i) => `${i+1}) ${r.date ? fmtDate(r.date) : 's/ data'}${r.proc ? ' · proc. ' + esc(r.proc) : ''}${r.outcome && sd.outcomes[r.outcome] ? ' (' + sd.outcomes[r.outcome] + ')' : ''}`).join('; ') : '';
    } else {
      det = [rec.outcome && sd.outcomes[rec.outcome] ? sd.outcomes[rec.outcome] : '', rec.date ? fmtDate(rec.date) : '', rec.evento ? 'Ev. ' + esc(rec.evento) : ''].filter(Boolean).join(' · ');
    }
    return `<span class="stage-tag" style="color:${col};background:rgba(0,0,0,0.04);border-color:${col}">${esc(sd.label)}${det ? ' — ' + det : ''}</span>`;
  });
  return parts.length ? parts.join('') : '<span class="muted">não informado</span>';
};

// ─── Blocos de estratégia: tipos de entrada (feed cronológico da aba Anotações) ───
const BRIEFING_ENTRY_TYPES = {
  risco:       { label: 'Risco',            color: 'var(--red)',        bg: 'rgba(229,64,96,0.15)' },
  estrategia:  { label: 'Estratégia',       color: 'var(--green)',      bg: 'rgba(64,168,112,0.15)' },
  decisao:     { label: 'Decisão judicial', color: 'var(--blue)',       bg: 'rgba(91,143,217,0.15)' },
  providencia: { label: 'Providência',      color: 'var(--yellow)',     bg: 'rgba(212,168,56,0.15)' },
  replicacao:  { label: 'Replicação',       color: 'var(--orange)',     bg: 'rgba(216,136,64,0.15)' },
  observacao:  { label: 'Observação',       color: 'var(--text-muted)', bg: 'rgba(122,139,163,0.15)' }
};
const escapeHtmlText = (s) => String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
// Sanitiza HTML do editor rico: whitelist de tags; remove scripts e atributos perigosos.
// Preserva apenas background-color em SPAN (marca-texto).
const sanitizeNoteHtml = (html) => {
  const ALLOWED = new Set(['B','STRONG','I','EM','U','BR','UL','OL','LI','DIV','P','SPAN','S','STRIKE']);
  const tpl = document.createElement('template');
  tpl.innerHTML = String(html || '');
  tpl.content.querySelectorAll('script,style,iframe,object,embed,link,meta').forEach(n => n.remove());
  const findBad = () => { for (const el of tpl.content.querySelectorAll('*')) { if (!ALLOWED.has(el.tagName)) return el; } return null; };
  let bad, guard = 0;
  while ((bad = findBad()) && guard++ < 500) {
    const parent = bad.parentNode;
    while (bad.firstChild) parent.insertBefore(bad.firstChild, bad);
    parent.removeChild(bad);
  }
  tpl.content.querySelectorAll('*').forEach(el => {
    const isSpan = el.tagName === 'SPAN';
    const bg = isSpan && el.style ? el.style.backgroundColor : '';
    [...el.attributes].forEach(a => el.removeAttribute(a.name));
    if (isSpan && bg && bg !== 'transparent') el.setAttribute('style', `background-color:${bg};border-radius:2px;padding:0 2px`);
  });
  return tpl.innerHTML;
};
const htmlToPlainText = (html) => { const d = document.createElement('div'); d.innerHTML = String(html || ''); return (d.textContent || '').trim(); };
// Leitura retrocompatível das entradas de estratégia.
// Se briefing.entries existe (novo modelo), retorna-o; senão converte os 3 campos legados em entradas virtuais.
const getBriefingEntries = (briefing) => {
  const b = briefing || {};
  if (Array.isArray(b.entries)) return b.entries;
  const out = [];
  if (b.risks) out.push({ id: 'legacy_risks', type: 'risco', html: escapeHtmlText(b.risks), pinned: false, eventDate: '', createdAt: '', _legacy: true });
  if (b.strategicNotes) out.push({ id: 'legacy_strategic', type: 'estrategia', html: escapeHtmlText(b.strategicNotes), pinned: false, eventDate: '', createdAt: '', _legacy: true });
  if (b.replicationNotes) out.push({ id: 'legacy_replication', type: 'replicacao', html: escapeHtmlText(b.replicationNotes), pinned: false, eventDate: '', createdAt: '', _legacy: true });
  return out;
};

// ═══════════════════════════════════════════════
// PRESCRIÇÃO INTERCORRENTE — Art. 40 LEF + Temas 566-571 STJ (REsp 1.340.553/RS)
// Súmula 314/STJ · RE 636.562/SC (Tema 390 STF)
// ═══════════════════════════════════════════════
const PRESC_EVENT_TYPES = {
  // Marcos iniciais (Tema 566)
  marco_nao_localizacao: { label: 'Não localização do devedor', category: 'marco', color: 'var(--red)', desc: 'Ciência pela FP da não localização do devedor (art. 40, §1º LEF). Inicia automaticamente 1 ano de suspensão.' },
  marco_sem_bens: { label: 'Ausência de bens penhoráveis', category: 'marco', color: 'var(--red)', desc: 'Ciência pela FP da inexistência de bens penhoráveis. Inicia automaticamente 1 ano de suspensão (Tema 566).' },
  marco_insuficiencia_bens: { label: 'Insuficiência de bens penhoráveis', category: 'marco', color: 'var(--red)', desc: 'Aplicação analógica — insuficiência equiparada à inexistência (STJ).' },
  // Causas interruptivas (Tema 568 + evolução jurisprudencial)
  int_citacao: { label: 'Citação do devedor', category: 'interruptiva', color: 'var(--green)', desc: 'Citação válida interrompe prescrição (art. 174, p.ú., I CTN).' },
  int_penhora: { label: 'Penhora efetiva', category: 'interruptiva', color: 'var(--green)', desc: 'Efetiva constrição patrimonial. Mero peticionamento NÃO basta (Tema 568).' },
  int_arresto: { label: 'Arresto / Bloqueio de bens', category: 'interruptiva', color: 'var(--green)', desc: 'Arresto ou bloqueio com resultado positivo (Tema 568 + AREsp 2.619.243/PE).' },
  int_sisbajud: { label: 'Bloqueio via Sisbajud', category: 'interruptiva', color: 'var(--green)', desc: 'Constrição via Sisbajud com resultado positivo. STJ: qualquer modalidade de constrição exitosa interrompe (2025).' },
  int_cnib: { label: 'Indisponibilidade CNIB/CCS', category: 'interruptiva', color: 'var(--green)', desc: 'Decretação de indisponibilidade com resultado útil.' },
  int_reconhecimento: { label: 'Reconhecimento da dívida', category: 'interruptiva', color: 'var(--green)', desc: 'Ato inequívoco do devedor reconhecendo a dívida (art. 174, p.ú., IV CTN).' },
  int_despacho_citacao: { label: 'Despacho que ordena citação', category: 'interruptiva', color: 'var(--green)', desc: 'Despacho do juiz que ordena citação (art. 174, p.ú., I CTN — LC 118/2005).' },
  int_protesto_judicial: { label: 'Protesto judicial', category: 'interruptiva', color: 'var(--green)', desc: 'Protesto judicial (art. 174, p.ú., II CTN).' },
  int_protesto_extrajudicial: { label: 'Protesto extrajudicial da CDA', category: 'interruptiva', color: 'var(--green)', desc: 'Protesto extrajudicial da Certidão de Dívida Ativa como causa interruptiva da prescrição, nos termos do art. 174, p.ú., CTN, com redação dada pela LC 208/2024. Antes da LC 208/2024, o STJ já admitia a legitimidade do protesto de CDA (Tema 777 / REsp 1.686.659-SP), mas a eficácia interruptiva específica passou a ser expressa pela lei complementar. A data do evento é a data do registro do protesto no cartório.' },
  int_outra: { label: 'Outra causa interruptiva', category: 'interruptiva', color: 'var(--green)', desc: 'Outra causa interruptiva com fundamentação.' },
  // Causas suspensivas
  susp_parcelamento: { label: 'Parcelamento (efeito duplo)', category: 'suspensiva', color: 'var(--blue)', desc: 'Efeito DUPLO: (1) interrompe a prescrição — pedido de parcelamento configura reconhecimento inequívoco do débito (art. 174, p.ú., IV CTN; STJ REsp 1.355.947/SP — Tema 980); (2) suspende a exigibilidade enquanto vigente (art. 151, VI CTN). O prazo prescricional reinicia do zero na data do parcelamento e fica pausado durante a vigência.' },
  int_rescisao_parcelamento: { label: 'Rescisão de parcelamento', category: 'interruptiva', color: 'var(--red)', desc: 'Fim da vigência do parcelamento. A exigibilidade do crédito é restabelecida e o prazo prescricional quinquenal reinicia da data da rescisão (art. 174, p.ú., IV CTN c/c art. 151, VI CTN). Marco crítico para controle de prescrição.' },
  susp_embargos: { label: 'Embargos com efeito suspensivo', category: 'suspensiva', color: 'var(--blue)', desc: 'Embargos à execução recebidos com efeito suspensivo.' },
  susp_decisao_judicial: { label: 'Decisão judicial suspensiva', category: 'suspensiva', color: 'var(--blue)', desc: 'Liminar, tutela antecipada ou decisão judicial que suspende a exigibilidade.' },
  susp_deposito: { label: 'Depósito judicial integral', category: 'suspensiva', color: 'var(--blue)', desc: 'Depósito integral suspende exigibilidade (art. 151, II CTN).' },
  susp_falencia: { label: 'Falência / Recuperação judicial', category: 'suspensiva', color: 'var(--blue)', desc: 'Processo de falência ou recuperação judicial suspende prescrição.' },
  susp_art40: { label: 'Suspensão art. 40 LEF (1 ano)', category: 'suspensiva', color: 'var(--blue)', desc: 'Período de 1 ano de suspensão automática (art. 40, §§1-2 LEF / Tema 566).' },
  susp_outra: { label: 'Outra causa suspensiva', category: 'suspensiva', color: 'var(--blue)', desc: 'Outra causa suspensiva com fundamentação.' },
  // Eventos informativos
  info_peticao_sem_resultado: { label: 'Petição sem resultado útil', category: 'info', color: 'var(--text-muted)', desc: 'Mero peticionamento. NÃO interrompe prescrição (Tema 568). Registro para controle.' },
  info_arquivamento: { label: 'Arquivamento (art. 40, §3º)', category: 'info', color: 'var(--text-muted)', desc: 'Arquivamento provisório após 1 ano de suspensão. Prazo quinquenal em curso.' },
  info_desarquivamento: { label: 'Desarquivamento', category: 'info', color: 'var(--text-muted)', desc: 'Desarquivamento do feito.' },
  info_decisao_prescricao: { label: 'Decisão sobre prescrição', category: 'info', color: 'var(--text-muted)', desc: 'Decisão judicial relacionada à prescrição intercorrente.' },
  info_outro: { label: 'Outro evento', category: 'info', color: 'var(--text-muted)', desc: 'Registro informativo sem efeito no cômputo.' }
};

// Prescription Calculator — implements Art. 40 LEF + Temas 566-571
function calcPrescription(executionId, events) {
  const evts = events
    .filter(e => e.executionId === executionId)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (evts.length === 0) return { status: 'sem_dados', daysLeft: null, timeline: [], detail: 'Sem eventos registrados.' };

  const SUSP_PERIOD = 365; // 1 year
  const PRESC_PERIOD = 5 * 365; // 5 years
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let timeline = [];
  let currentMarco = null; // Date of the triggering event
  let suspDaysConsumed = 0; // days of art.40 suspension consumed
  let prescDaysConsumed = 0; // days of prescriptive period consumed
  let activeSuspensions = []; // stack of active suspensive causes
  let lastCalcDate = null;
  let prescriptionInterrupted = false;
  let phase = 'pre_marco'; // pre_marco | suspensao_art40 | prescricao_correndo | prescrito | interrompido

  for (const evt of evts) {
    const evtDate = new Date(evt.date + 'T00:00:00');
    const evtType = PRESC_EVENT_TYPES[evt.type];
    const cat = evtType?.category || 'info';

    // Advance time from last event
    if (lastCalcDate && (phase === 'suspensao_art40' || phase === 'prescricao_correndo')) {
      const daysBetween = Math.floor((evtDate - lastCalcDate) / 86400000);
      if (activeSuspensions.length === 0) { // not independently suspended
        if (phase === 'suspensao_art40') {
          const remaining = SUSP_PERIOD - suspDaysConsumed;
          const used = Math.min(daysBetween, remaining);
          suspDaysConsumed += used;
          if (suspDaysConsumed >= SUSP_PERIOD) {
            phase = 'prescricao_correndo';
            const overflow = daysBetween - used;
            prescDaysConsumed += overflow;
          }
        } else if (phase === 'prescricao_correndo') {
          prescDaysConsumed += daysBetween;
        }
      }
    }

    // Process event
    if (cat === 'marco') {
      if (!currentMarco) {
        currentMarco = evtDate;
        phase = 'suspensao_art40';
        suspDaysConsumed = 0;
        prescDaysConsumed = 0;
        timeline.push({ ...evt, effect: 'Inicia suspensão de 1 ano (art. 40 LEF)', phase: 'suspensao_art40' });
      } else {
        // New triggering event restarts the cycle
        currentMarco = evtDate;
        phase = 'suspensao_art40';
        suspDaysConsumed = 0;
        prescDaysConsumed = 0;
        timeline.push({ ...evt, effect: 'Novo marco — reinicia suspensão de 1 ano', phase: 'suspensao_art40' });
      }
    } else if (cat === 'interruptiva') {
      prescDaysConsumed = 0;
      prescriptionInterrupted = true;
      phase = currentMarco ? 'interrompido' : 'pre_marco';
      timeline.push({ ...evt, effect: 'INTERROMPE prescrição — prazo quinquenal reinicia do zero. Ciclo Art. 40 encerrado (bens/devedor localizados).', phase });
    } else if (cat === 'suspensiva') {
      if (!evt.endDate) {
        activeSuspensions.push(evt.id);
      }
      timeline.push({ ...evt, effect: `SUSPENDE cômputo da prescrição${evt.endDate ? ` até ${fmtDate(evt.endDate)}` : ' (em vigor)'}`, phase });
    } else {
      timeline.push({ ...evt, effect: evtType?.desc || 'Registro informativo', phase });
    }

    lastCalcDate = evtDate;
  }

  // Advance to today
  if (lastCalcDate && (phase === 'suspensao_art40' || phase === 'prescricao_correndo')) {
    const daysBetween = Math.floor((today - lastCalcDate) / 86400000);
    // Check if any suspensions have ended
    const activeNow = activeSuspensions.filter(sid => {
      const sevt = evts.find(e => e.id === sid);
      return sevt && (!sevt.endDate || new Date(sevt.endDate + 'T00:00:00') > today);
    });
    if (activeNow.length === 0) {
      if (phase === 'suspensao_art40') {
        const remaining = SUSP_PERIOD - suspDaysConsumed;
        const used = Math.min(daysBetween, remaining);
        suspDaysConsumed += used;
        if (suspDaysConsumed >= SUSP_PERIOD) {
          phase = 'prescricao_correndo';
          prescDaysConsumed += daysBetween - used;
        }
      } else if (phase === 'prescricao_correndo') {
        prescDaysConsumed += daysBetween;
      }
    }
  }

  // Determine final status
  let status, daysLeft, detail;
  const activeNow = activeSuspensions.filter(sid => {
    const sevt = evts.find(e => e.id === sid);
    return sevt && (!sevt.endDate || new Date(sevt.endDate + 'T00:00:00') > today);
  });

  if (phase === 'pre_marco' || phase === 'interrompido') {
    status = 'seguro';
    daysLeft = null;
    detail = prescriptionInterrupted
      ? 'Prescrição interrompida (constrição/citação efetiva). Ciclo Art. 40 LEF encerrado — prazo só reinicia se novo marco for registrado (ex: frustração da penhora, não localização de bens).'
      : 'Nenhum marco prescricional ativo. Ciclo Art. 40 LEF não iniciado.';
  } else if (activeNow.length > 0) {
    status = 'suspenso';
    daysLeft = PRESC_PERIOD - prescDaysConsumed + (SUSP_PERIOD - suspDaysConsumed);
    detail = `Prescrição suspensa (causa ativa). Dias consumidos: ${prescDaysConsumed} de ${PRESC_PERIOD}.`;
  } else if (phase === 'suspensao_art40') {
    daysLeft = (SUSP_PERIOD - suspDaysConsumed) + PRESC_PERIOD;
    status = daysLeft <= 365 ? 'alerta' : 'correndo';
    detail = `Fase de suspensão art. 40: ${suspDaysConsumed}/${SUSP_PERIOD} dias. Faltam ${SUSP_PERIOD - suspDaysConsumed}d para iniciar prazo quinquenal.`;
  } else if (phase === 'prescricao_correndo') {
    daysLeft = PRESC_PERIOD - prescDaysConsumed;
    if (daysLeft <= 0) {
      status = 'prescrito';
      detail = `PRESCRIÇÃO INTERCORRENTE CONSUMADA. Prazo expirou há ${Math.abs(daysLeft)} dias.`;
    } else if (daysLeft <= 365) {
      status = 'critico';
      detail = `CRÍTICO: ${daysLeft} dias restantes para prescrição intercorrente.`;
    } else if (daysLeft <= 730) {
      status = 'alerta';
      detail = `Alerta: ${daysLeft} dias restantes (${(daysLeft / 365).toFixed(1)} anos).`;
    } else {
      status = 'correndo';
      detail = `Prazo quinquenal em curso: ${prescDaysConsumed}/${PRESC_PERIOD} dias consumidos. Restam ${daysLeft}d (${(daysLeft / 365).toFixed(1)}a).`;
    }
  } else {
    status = 'sem_dados';
    daysLeft = null;
    detail = 'Estado indeterminado.';
  }

  return { status, daysLeft, timeline, detail, phase, prescDaysConsumed, suspDaysConsumed, prescriptionInterrupted, activeSuspensions: activeNow };
}

// ═══════════════════════════════════════════════
// EPROC INTIMATION PARSER
// ═══════════════════════════════════════════════
const INTIM_STATUSES = {
  pendente_analise: { label: 'Pendente de Análise', badge: 'badge-yellow' },
  aguardando_subsidios: { label: 'Aguardando Subsídios', badge: 'badge-muted' },
  analisado: { label: 'Analisado', badge: 'badge-green' },
  peca_edicao: { label: 'Peça em Edição', badge: 'badge-green-strong' }
};
const TASK_STATUSES = {
  pendente: { label: 'Pendente', badge: 'badge-red' },
  em_andamento: { label: 'Em andamento', badge: 'badge-yellow' },
  concluida: { label: 'Concluída', badge: 'badge-green' },
  cancelada: { label: 'Cancelada', badge: 'badge-muted-strong' }
};
const TASK_PRIORITIES = { urgente: { label: 'Urgente', color: 'var(--red)' }, alta: { label: 'Alta', color: 'var(--orange)' }, media: { label: 'Média', color: 'var(--yellow)' }, baixa: { label: 'Baixa', color: 'var(--text-muted)' } };
// Importância (`priority`) + complexidade (`difficulty`) + marcador Urgente separado (`urgent`).
// Legado: priority==='urgente' vira urgent=true; difficulty complexa/rotina → alta/baixa.
const INTIM_PRIORITIES = {
  alta: { label: 'ALTA IMPORTÂNCIA', order: 0 },
  normal: { label: 'MÉDIA IMPORTÂNCIA', order: 1 },
  baixa: { label: 'BAIXA IMPORTÂNCIA', order: 2 },
  urgente: { label: 'ALTA IMPORTÂNCIA', order: 0 } // legado — preferir flag `urgent`
};
const INTIM_DIFFICULTY = {
  alta: { label: 'ALTA COMPLEXIDADE', order: 0 },
  media: { label: 'MÉDIA COMPLEXIDADE', order: 1 },
  baixa: { label: 'BAIXA COMPLEXIDADE', order: 2 },
  complexa: { label: 'ALTA COMPLEXIDADE', order: 0 }, // legado
  rotina: { label: 'BAIXA COMPLEXIDADE', order: 2 }  // legado
};
const intimIsUrgent = (x) => !!(x && (x.urgent || x.priority === 'urgente' || x.priority === 'urgent'));
const intimImpKey = (x) => {
  const p = x?.priority;
  if (p === 'urgente' || p === 'urgent' || p === 'alta') return 'alta';
  if (p === 'baixa') return 'baixa';
  return 'normal';
};
const intimDifKey = (x) => {
  const d = x?.difficulty || 'media';
  if (d === 'complexa' || d === 'alta') return 'alta';
  if (d === 'rotina' || d === 'baixa') return 'baixa';
  return 'media';
};
const intimImpOrder = (x) => (INTIM_PRIORITIES[intimImpKey(x)]?.order ?? 1);
const intimDifOrder = (x) => (INTIM_DIFFICULTY[intimDifKey(x)]?.order ?? 1);
// Ordem fixa de exibição das jurisdições (cards por estado e agrupamento por Estado).
// TJSC/TJ tratados como a mesma posição; jurisdições fora da lista vão para o fim (alfabética).
const JURIS_ORDER = ['RS', 'PR', 'SC', 'TJSC', 'TJ'];
const jurisRank = (j) => { const i = JURIS_ORDER.indexOf(String(j || '').trim().toUpperCase()); return i === -1 ? 99 : i; };

// ═══════════════════════════════════════════════
// SIDA / DEBCAD PDF PARSERS
// ═══════════════════════════════════════════════
// These parsers extract complementary CDA data from PGFN PDF reports.
// CRITICAL: They NEVER overwrite existing fields — only fill blanks and append events.

async function extractPDFText(file) {
  if (!window.pdfjsLib) throw new Error('PDF.js não carregado. Recarregue a página.');
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const lines = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    // Group items by Y coordinate to reconstruct lines
    const byY = {};
    content.items.forEach(it => {
      const y = Math.round(it.transform[5]);
      if (!byY[y]) byY[y] = [];
      byY[y].push({ x: it.transform[4], text: it.str });
    });
    // Sort lines top-to-bottom (largest Y first), each line left-to-right
    Object.keys(byY).map(Number).sort((a,b) => b-a).forEach(y => {
      const line = byY[y].sort((a,b) => a.x - b.x).map(i => i.text).join(' ').replace(/\s+/g, ' ').trim();
      if (line) lines.push(line);
    });
  }
  return lines;
}

// Helper: parse BR date DD/MM/YYYY → YYYY-MM-DD
function parseBRDate(s) {
  if (!s) return '';
  const m = s.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
}
// Mapeia o texto "Situação" do SIDA/Debcad para o status canônico do app (DEBT_STATUSES).
// Mesma precedência do parser XLS: SISPAR é checado ANTES de AJUIZADA, porque
// "ATIVA AJUIZADA NEGOCIADA NO SISPAR" contém ambos os termos.
// Retorna '' quando nenhum padrão conhecido casa — nesse caso o status NÃO é alterado.
function mapPDFSituationToStatus(sit) {
  const s = String(sit || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (!s) return '';
  if (s.includes('EXTINTA') || s.includes('CANCELADA') || s.includes('LIQUIDADA')) return 'extinta';
  if (s.includes('GARANTIDA')) return 'garantida';
  if (s.includes('SUSPENSA')) return s.includes('JUDICIAL') ? 'suspensa_judicial' : 'suspensa_admin';
  if (s.includes('PARCELAD')) return 'parcelada';
  if (s.includes('NEGOCIAD') && s.includes('SISPAR')) return 'negociada_sispar';
  if (s.includes('NAO AJUIZ')) return 'ativa_nao_ajuizavel';
  if (s.includes('AJUIZADA')) return 'ativa_ajuizada';
  if (s.includes('ATIVA')) return 'ativa';
  return '';
}
// Helper: normalize CDA number (remove spaces, dashes for matching)
function normCDA(s) {
  return (s || '').replace(/[\s\-.]/g, '');
}

async function parseSIDAPDF(file) {
  const lines = await extractPDFText(file);
  const records = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    // Find CDA block start: "Inscrição N / TOTAL"
    const blockMatch = line.match(/^Inscrição\s+(\d+)\s*\/\s*(\d+)$/);
    if (!blockMatch) { i++; continue; }

    const rec = { parcelamentos: [], occurrences: [], coresponsibles: [], devedores: [], protestos: [] };
    // Scan forward until next "Inscrição N / N" or end
    let j = i + 1;
    let inOccurrences = false;
    let inDevedores = false;
    let inProtestos = false;
    let currentProtesto = null;
    let currentDevedor = null;
    while (j < lines.length && !lines[j].match(/^Inscrição\s+\d+\s*\/\s*\d+$/)) {
      const ln = lines[j];
      const lnUpper = ln.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      // Section detection
      if (lnUpper.includes('INFORMACOES SOBRE OS DEVEDORES') || lnUpper.includes('DEVEDORES DA INSCRICAO')) {
        inDevedores = true; inOccurrences = false; inProtestos = false;
        if (currentProtesto) { rec.protestos.push(currentProtesto); currentProtesto = null; }
        j++; continue;
      }
      if (lnUpper.includes('INFORMACOES SOBRE O PARCELAMENTO') || lnUpper === 'PARCELAMENTO' || lnUpper.includes('PARCELAMENTO DA INSCRICAO')) {
        inDevedores = false; inOccurrences = false; inProtestos = false;
        if (currentProtesto) { rec.protestos.push(currentProtesto); currentProtesto = null; }
        // Save last devedor
        if (currentDevedor && currentDevedor.cpfCnpj) { rec.devedores.push(currentDevedor); currentDevedor = null; }
      }
      if (lnUpper === 'PROTESTOS' || (lnUpper.includes('PROTESTOS') && !lnUpper.includes('NAO POSSUI') && !lnUpper.includes('VINCULADOS'))) {
        inProtestos = true; inDevedores = false; inOccurrences = false;
        if (currentDevedor && currentDevedor.cpfCnpj) { rec.devedores.push(currentDevedor); currentDevedor = null; }
        j++; continue;
      }
      if (ln === 'OCORRÊNCIAS' || lnUpper === 'OCORRENCIAS') {
        inOccurrences = true; inDevedores = false; inProtestos = false;
        if (currentProtesto) { rec.protestos.push(currentProtesto); currentProtesto = null; }
        if (currentDevedor && currentDevedor.cpfCnpj) { rec.devedores.push(currentDevedor); currentDevedor = null; }
        j++; continue;
      }

      // ─── PROTESTOS section ───
      if (inProtestos) {
        if (lnUpper.includes('NAO POSSUI PROTESTOS') || lnUpper.includes('INSCRICAO NAO POSSUI')) { j++; continue; }
        if (ln.startsWith('Identificação do Protesto:') || (ln.match(/^Identif/) && ln.includes('Protesto'))) {
          if (currentProtesto) rec.protestos.push(currentProtesto);
          currentProtesto = { identificacao: ln.replace(/^Identif[^:]*:/, '').trim(), eventos: [] };
        } else if (currentProtesto) {
          if (ln.startsWith('Protocolo no Tabelionato:')) currentProtesto.protocolo = ln.replace('Protocolo no Tabelionato:', '').trim();
          else if (ln.startsWith('Data do Protocolo:')) currentProtesto.dataProtocolo = parseBRDate(ln);
          else if (ln.match(/^Tabelionato respons/i)) currentProtesto.tabelionato = ln.replace(/^Tabelionato[^:]*:/i, '').trim();
          else if (ln.startsWith('Situação do Protesto:') || ln.match(/^Situa.*Protesto/i)) currentProtesto.situacao = ln.replace(/^Situa[^:]*:/i, '').trim();
          else if (ln.startsWith('Valor do Protesto:') || ln.match(/^Valor.*Protesto/i)) {
            const vm = ln.match(/R?\$?\s*([\d.,]+)/);
            if (vm) currentProtesto.valor = vm[1].replace(/\./g, '').replace(',', '.');
          }
          else if (lnUpper !== 'EVENTOS' && !lnUpper.startsWith('DATA DE CRIA')) {
            const evMatch = ln.match(/(\d{2}\/\d{2}\/\d{4})\s+(\d{2}\/\d{2}\/\d{4})\s+(.+)/);
            if (evMatch) {
              currentProtesto.eventos.push({ dataCriacao: parseBRDate(evMatch[1]), dataEfetivacao: parseBRDate(evMatch[2]), descricao: evMatch[3].trim() });
            } else {
              const evMatch2 = ln.match(/^(\d{2}\/\d{2}\/\d{4})\s+(.+)/);
              if (evMatch2 && !evMatch2[2].match(/^\d{2}:\d{2}/)) {
                currentProtesto.eventos.push({ dataCriacao: parseBRDate(evMatch2[1]), descricao: evMatch2[2].trim() });
              }
            }
          }
        }
        j++; continue;
      }

      // ─── DEVEDORES section ───
      if (inDevedores) {
        if (ln.startsWith('CPF/CNPJ:')) {
          // Save previous devedor if exists
          if (currentDevedor && currentDevedor.cpfCnpj) rec.devedores.push(currentDevedor);
          currentDevedor = { cpfCnpj: ln.replace('CPF/CNPJ:', '').trim() };
        } else if (currentDevedor) {
          if (ln.startsWith('Nome Completo:')) currentDevedor.name = ln.replace('Nome Completo:', '').trim();
          else if (ln.startsWith('Tipo de Devedor:')) currentDevedor.tipo = ln.replace('Tipo de Devedor:', '').trim();
          else if (ln.startsWith('Endereço:') && !currentDevedor.endereco) currentDevedor.endereco = ln.replace('Endereço:', '').trim();
          else if (ln.startsWith('Município:') && !currentDevedor.municipio) currentDevedor.municipio = ln.replace('Município:', '').trim();
          else if (ln.startsWith('UF:') && !currentDevedor.uf) currentDevedor.uf = ln.replace('UF:', '').trim();
          else if (ln.startsWith('Situação Cadastral:')) currentDevedor.situacaoCadastral = ln.replace('Situação Cadastral:', '').trim();
        }
        // Don't fall through to field extractions below
        j++; continue;
      }

      // Field extractions (scan for label then value)
      if (ln.startsWith('Devedor Principal:')) {
        rec.devedor = ln.replace('Devedor Principal:', '').trim();
      } else if (ln.startsWith('CPF/CNPJ:')) {
        rec.cnpj = ln.replace('CPF/CNPJ:', '').trim().replace(/\D/g, '');
      } else if (ln.startsWith('Inscrição:') && !rec.cdaNumber) {
        rec.cdaNumber = ln.replace('Inscrição:', '').trim();
      } else if (ln.startsWith('Situação:') && !rec.situation) {
        rec.situation = ln.replace('Situação:', '').trim();
      } else if (ln.startsWith('Data de Inscrição:')) {
        rec.inscriptionDate = parseBRDate(ln);
      } else if (ln.startsWith('Data Primeira Cobrança:')) {
        rec.firstChargeDate = parseBRDate(ln);
      } else if (ln.startsWith('Valor Inscrito:')) {
        const m = ln.match(/R\$\s*([\d.]+,\d{2})/);
        if (m) rec.valueInscrito = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
      } else if (ln.startsWith('Nº Único de Processo Judicial:')) {
        rec.processNumber = ln.replace('Nº Único de Processo Judicial:', '').trim();
      } else if (ln.startsWith('Data de Protocolo:')) {
        rec.protocolDate = parseBRDate(ln);
      } else if (ln.startsWith('Data de Distribuição:')) {
        rec.distributionDate = parseBRDate(ln);
      } else if (ln.startsWith('Juízo:')) {
        rec.juizo = ln.replace('Juízo:', '').trim();
      } else if (ln.startsWith('Tributo:') || ln.startsWith('Receita da Dívida:')) {
        rec.tribute = ln.replace(/^(Tributo:|Receita da Dívida:)/, '').trim();
      }

      // Parcelamento detection — block of Adesão / Encerramento / Situação
      if (ln.startsWith('Adesão:')) {
        const parc = { adesao: parseBRDate(ln) };
        // Look ahead for related fields
        for (let k = j+1; k < Math.min(j+8, lines.length); k++) {
          if (lines[k].startsWith('Deferimento:')) parc.deferimento = parseBRDate(lines[k]);
          else if (lines[k].startsWith('Encerramento:')) parc.encerramento = parseBRDate(lines[k]);
          else if (lines[k].startsWith('Situação:')) parc.situacao = lines[k].replace('Situação:', '').trim();
          else if (lines[k].startsWith('Tipo:')) parc.tipo = lines[k].replace('Tipo:', '').trim();
          else if (lines[k].startsWith('Modalidade:')) parc.modalidade = lines[k].replace('Modalidade:', '').trim();
          else if (lines[k].startsWith('Adesão:') || lines[k].startsWith('Inscrição ')) break;
        }
        rec.parcelamentos.push(parc);
      }

      // Occurrences — each line starting with date pattern in OCORRÊNCIAS section
      if (inOccurrences) {
        const dm = ln.match(/^(\d{2}\/\d{2}\/\d{4})\s+(.+)$/);
        if (dm) {
          rec.occurrences.push({ date: parseBRDate(dm[1]), desc: dm[2].trim() });
          // Detect "INCLUSAO DE CO-RESPONSAVEL" — CNPJ is in the line right after the time stamp
          if (/INCLUSAO DE CO-?RESPONSAVEL/i.test(dm[2])) {
            // CPF/CNPJ usually appears 1-2 lines later
            for (let k = j+1; k < Math.min(j+4, lines.length); k++) {
              const cnpjMatch = lines[k].match(/(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{3}\.\d{3}\.\d{3}-\d{2})/);
              if (cnpjMatch) {
                rec.coresponsibles.push({
                  cpfCnpj: cnpjMatch[1].replace(/\D/g, ''),
                  cpfCnpjFormatted: cnpjMatch[1],
                  date: parseBRDate(dm[1])
                });
                break;
              }
            }
          }
        }
      }

      j++;
    }
    // Save last devedor if pending
    if (currentDevedor && currentDevedor.cpfCnpj) rec.devedores.push(currentDevedor);
    // Save last protesto if pending
    if (currentProtesto) rec.protestos.push(currentProtesto);

    // Convert DEVEDORES section corresponsáveis to coresponsibles (complement, not duplicate)
    const existingCpfs = new Set(rec.coresponsibles.map(c => c.cpfCnpj));

    // ─── Detect parcelamento events from OCORRÊNCIAS descriptions ───
    // SIDA occurrences contain parcelamento lifecycle events in free text.
    // These complement (or replace) the structured PARCELAMENTO section.
    const PARC_ADESAO_PATTERNS = [
      /CONSOLIDACAO\s*PARCEL/i,
      /NEGOCIACAO\s*PARC/i,
      /INCLUSAO\s*EM\s*PARC/i,
      /BLOQUEIO\s*NEGOCIACAO/i,
      /ADESAO\s*(?:PARC|A\s*PARCELAMENTO)/i,
      /OPCAO\s*(?:REFIS|PAES)/i,
      /PARCELAMENTO\s*(?:SIMPLIFICADO|ESPECIAL|LEI)/i,
    ];
    const PARC_RESCISAO_PATTERNS = [
      /ENC\.\s*RESCISAO/i,
      /RESCISAO\s*(?:PARCEL|PARC|LEI|DO\s*PARCEL)/i,
      /EXCLUSAO\s*(?:PARCEL|PARC|DO\s*PARCEL|DE\s*CREDITO)/i,
    ];

    const occParcs = [];
    let curOccParc = null;
    // Sort occurrences chronologically
    const sortedOccs = [...rec.occurrences].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    for (const occ of sortedOccs) {
      const desc = occ.desc || '';
      const isAdesao = PARC_ADESAO_PATTERNS.some(p => p.test(desc));
      const isRescisao = PARC_RESCISAO_PATTERNS.some(p => p.test(desc));

      if (isAdesao && !isRescisao) {
        if (curOccParc) {
          curOccParc.encerramento = occ.date;
          curOccParc.situacao = 'Rescindido (implícito)';
          occParcs.push(curOccParc);
        }
        curOccParc = { adesao: occ.date, modalidade: desc, tipo: 'Ocorrência SIDA', situacao: 'Em vigor', obs: desc };
      } else if (isRescisao) {
        if (curOccParc) {
          curOccParc.encerramento = occ.date;
          curOccParc.situacao = desc.includes('ENC.') ? 'Rescindido (encerramento)' : 'Rescindido';
          occParcs.push(curOccParc);
          curOccParc = null;
        } else {
          // Rescisão sem adesão anterior — criar entrada retroativa
          occParcs.push({ adesao: '', encerramento: occ.date, modalidade: desc, tipo: 'Rescisão SIDA', situacao: 'Rescindido', obs: desc });
        }
      }
    }
    if (curOccParc) occParcs.push(curOccParc);

    // Merge: only add occurrence-derived parcelamentos if they don't duplicate structured ones
    if (occParcs.length > 0) {
      const existingDates = new Set(rec.parcelamentos.map(p => p.adesao));
      for (const op of occParcs) {
        if (op.adesao && existingDates.has(op.adesao)) continue; // skip duplicates
        if (op.encerramento && rec.parcelamentos.some(p => p.encerramento === op.encerramento)) continue;
        rec.parcelamentos.push(op);
      }
    }
    rec.devedores.forEach(dev => {
      if (!dev.tipo || dev.tipo.toUpperCase() === 'PRINCIPAL') return; // skip principal
      const cpfDigits = (dev.cpfCnpj || '').replace(/\D/g, '');
      if (cpfDigits && !existingCpfs.has(cpfDigits)) {
        rec.coresponsibles.push({
          cpfCnpj: cpfDigits,
          cpfCnpjFormatted: dev.cpfCnpj,
          name: dev.name || '',
          endereco: dev.endereco || '',
          municipio: dev.municipio || '',
          uf: dev.uf || '',
          situacaoCadastral: dev.situacaoCadastral || '',
          source: 'SIDA-DEVEDORES'
        });
      }
    });

    if (rec.cdaNumber) records.push(rec);
    i = j;
  }
  return records;
}

async function parseDebcadPDF(file) {
  const lines = await extractPDFText(file);
  const records = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const blockMatch = line.match(/^Debcad\s+(\d+)\s*\/\s*(\d+)$/);
    if (!blockMatch) { i++; continue; }

    const rec = { history: [], updates: [] };
    let j = i + 1;
    let section = 'dados'; // 'dados' | 'historico' | 'atualizacoes'
    let historyLines = [];
    let updateLines = [];
    while (j < lines.length && !lines[j].match(/^Debcad\s+\d+\s*\/\s*\d+$/)) {
      const ln = lines[j];

      // Section detection — flexible accent/case matching
      const lnUpper = ln.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (lnUpper === 'HISTORICO' || ln === 'HISTÓRICO') { section = 'historico'; j++; continue; }
      if (lnUpper === 'ATUALIZACOES' || ln === 'ATUALIZAÇÕES') { section = 'atualizacoes'; j++; continue; }
      // Skip table headers
      if (ln.match(/^Código\/Nome|^Data\s+Hora\s+Fun/i)) { j++; continue; }
      // Skip PGFN footer lines and page markers
      if (ln.match(/^P\s*G\s*F\s*N\s*-\s*CONSULTA|^SERPRO|^Pág\.\s*\d/)) { j++; continue; }

      if (section === 'dados') {
        if (ln.startsWith('Devedor Principal:')) rec.devedor = ln.replace('Devedor Principal:', '').trim();
        else if (ln.startsWith('CPF/CNPJ:')) rec.cnpj = ln.replace('CPF/CNPJ:', '').trim().replace(/\D/g, '');
        else if (ln.startsWith('Debcad:') && !rec.cdaNumber) rec.cdaNumber = ln.replace('Debcad:', '').trim();
        else if (ln.startsWith('Situação:') && !rec.situation) rec.situation = ln.replace('Situação:', '').trim();
        else if (ln.startsWith('Data Inscrição:')) rec.inscriptionDate = parseBRDate(ln);
        else if (ln.startsWith('Período da Dívida:')) rec.periodo = ln.replace('Período da Dívida:', '').trim();
        else if (ln.startsWith('Natureza da Dívida:')) rec.natureza = ln.replace('Natureza da Dívida:', '').trim();
        else if (ln.startsWith('Receita:')) rec.receita = ln.replace('Receita:', '').trim();
        else if (ln.startsWith('Valor Principal:')) {
          const m = ln.match(/R\$\s*([\d.]+,\d{2})/);
          if (m) rec.valueInscrito = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
        } else if (ln.startsWith('Valor Total:')) {
          const m = ln.match(/R\$\s*([\d.]+,\d{2})/);
          if (m) rec.valueTotal = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
        } else if (ln.startsWith('Nº Judicial:')) rec.processNumber = ln.replace('Nº Judicial:', '').trim();
        else if (ln.startsWith('Data de Protocolo:')) rec.protocolDate = parseBRDate(ln);
        else if (ln.startsWith('Juízo:')) rec.juizo = ln.replace('Juízo:', '').trim();
        else if (ln.startsWith('Forma de Constituição:')) rec.formaConstituicao = ln.replace('Forma de Constituição:', '').trim();
        else if (ln.startsWith('Documento de Origem:')) rec.docOrigem = ln.replace('Documento de Origem:', '').trim();
      } else if (section === 'historico') {
        historyLines.push(ln);
      } else if (section === 'atualizacoes') {
        updateLines.push(ln);
      }

      j++;
    }

    // ─── Parse HISTÓRICO ───
    // PDF.js extracts table text by Y coordinate, which interleaves wrapped cell content.
    // A row like "797 - PARCELAMENTO RESCINDIDO | 04/10/2021 | ..." may become:
    //   "797 - 04/10/2021 04/10/2021 20:00:11 SERIS_RESCI CONTA 1574681..."
    //   "PARCELAMENTO _C/PAG SISPAR"
    //   "RESCINDIDO"
    // Strategy: split joined text by 3-digit codes, then extract dates from each segment.
    if (historyLines.length > 0) {
      const joined = historyLines.join(' ').replace(/\s+/g, ' ');

      // Split at each 3-digit code boundary: "520 - ... 535 - ... 797 - ..."
      const segments = [];
      const codeSplitRegex = /\b(\d{3})\s*-\s*/g;
      let lastIdx = 0, lastCode = null, csm;
      const codePositions = [];
      while ((csm = codeSplitRegex.exec(joined)) !== null) {
        codePositions.push({ code: csm[1], idx: csm.index, endIdx: csm.index + csm[0].length });
      }
      for (let ci = 0; ci < codePositions.length; ci++) {
        const cp = codePositions[ci];
        const nextIdx = ci + 1 < codePositions.length ? codePositions[ci+1].idx : joined.length;
        const segText = joined.slice(cp.endIdx, nextIdx).trim();
        segments.push({ code: cp.code, text: segText });
      }

      // Extract dates, time, function, observation from each segment
      for (const seg of segments) {
        const dates = [];
        const dateRegex = /(\d{2}\/\d{2}\/\d{4})/g;
        let dm;
        while ((dm = dateRegex.exec(seg.text)) !== null) dates.push(dm[1]);
        if (dates.length === 0) continue; // no date = not a valid phase entry

        const timeMatch = seg.text.match(/(\d{2}:\d{2}:\d{2})/);
        // Function identifier: uppercase word with underscores, at least 4 chars, often after the time
        const funcMatch = seg.text.match(/\b([A-Z][A-Z0-9_]{3,}(?:\/[A-Z0-9_]+)?)\b/);
        // Description: everything that isn't a date, time, or function — collect known phase names
        const descWords = seg.text
          .replace(/\d{2}\/\d{2}\/\d{4}/g, '')
          .replace(/\d{2}:\d{2}:\d{2}/g, '')
          .replace(/\b[A-Z][A-Z0-9_]{3,}(?:\/[A-Z0-9_]+)?\b/g, (m) => {
            // Keep known phase description words, remove function identifiers
            const knownFunctions = ['AACAOJUD','CDACAOJUD','AACAOMIGRADA','AFASE','ADEBINS','ADEB','COBBATWEB','COBBATGEN','COBDEVINC','COBCBCBPA','PDAPCBD','DIVBATJUD','DIVBATATL','DIVCDI','DAPBDP','ACONPAR','ARESPAR','ACANRES','NAOIDENTIFICADO'];
            if (knownFunctions.some(f => m.startsWith(f))) return '';
            if (m.startsWith('SERIS_') || m.startsWith('COB') || m.startsWith('DIV')) return '';
            return m;
          })
          .replace(/\s+/g, ' ').trim();

        // Also look for the description in surrounding history lines that weren't captured
        // (wrapped cell fragments like "PARCELAMENTO" and "RESCINDIDO" on separate lines)
        let fullDesc = descWords;
        // Map known codes to canonical descriptions as fallback
        const codeDescMap = {
          '520': 'INSCRICAO DE CREDITO EM DIVIDA ATIVA',
          '535': 'AJUIZAMENTO / DISTRIBUICAO',
          '731': 'NEGOCIADO NO SISPAR',
          '733': 'EM NEGOCIACAO NO SISPAR',
          '760': 'PRE-PARCELAMENTO',
          '770': 'OPCAO REFIS / EXIGIBILIDADE SUSPENSA',
          '775': 'INCLUSAO EM PARCELAMENTO ESPECIAL LEI 11.941',
          '779': 'INCLUIDO EM PARCELAMENTO SIMPLIFICADO LEI 10.522',
          '792': 'RESCISAO/EXCLUSAO DE PARCELAMENTOS ESPECIAIS',
          '797': 'PARCELAMENTO RESCINDIDO',
          '518': 'PRE-INSCRICAO DE CREDITO'
        };
        if (!fullDesc || fullDesc.length < 3) fullDesc = codeDescMap[seg.code] || `Fase ${seg.code}`;

        // Obs: remaining text after removing dates/times/functions/known descriptions
        const obsText = seg.text
          .replace(/\d{2}\/\d{2}\/\d{4}/g, '')
          .replace(/\d{2}:\d{2}:\d{2}/g, '')
          .replace(/\s+/g, ' ').trim();
        const obs = obsText.length > 5 ? obsText : '';

        rec.history.push({
          code: seg.code,
          desc: fullDesc,
          date: parseBRDate(dates[0]),
          dateInfo: dates.length > 1 ? parseBRDate(dates[1]) : parseBRDate(dates[0]),
          funcao: funcMatch ? funcMatch[1] : '',
          obs: obs
        });
      }

      // Fallback: if no entries were parsed, try simple regex
      if (rec.history.length === 0) {
        const simpleRegex = /(\d{3})\s*-\s*(.+?)\s+(\d{2}\/\d{2}\/\d{4})/g;
        let sm;
        while ((sm = simpleRegex.exec(joined)) !== null) {
          rec.history.push({ code: sm[1], desc: sm[2].trim().replace(/\s+/g, ' '), date: parseBRDate(sm[3]) });
        }
      }
    }

    // ─── Parse ATUALIZAÇÕES ───
    // Each entry: DD/MM/YYYY HH:MM:SS FUNÇÃO [MATRÍCULA] OBSERVAÇÃO
    if (updateLines.length > 0) {
      const joinedUpd = updateLines.join(' ').replace(/\s+/g, ' ');
      const updRegex = /(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2}:\d{2})\s+(\S+)\s+(.*?)(?=\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}|$)/g;
      let um;
      while ((um = updRegex.exec(joinedUpd)) !== null) {
        const obsRaw = um[4].trim();
        // Split matrícula (all digits or CNPJ-like) from observation
        const matMatch = obsRaw.match(/^(\d{5,20})\s+(.*)/);
        rec.updates.push({
          date: parseBRDate(um[1]),
          time: um[2],
          funcao: um[3].trim(),
          matricula: matMatch ? matMatch[1] : '',
          obs: matMatch ? matMatch[2].trim() : obsRaw
        });
      }
    }

    // ─── Merge updates into history as info events (for unified timeline) ───
    // Atualizações entries that don't correspond to an existing history phase
    // are added as informational records with synthetic code '999'
    const histDates = new Set(rec.history.map(h => h.date));
    rec.updates.forEach(u => {
      if (u.obs && !histDates.has(u.date)) {
        rec.history.push({
          code: '999',
          desc: `[Atualização] ${u.funcao}`,
          date: u.date,
          funcao: u.funcao,
          obs: u.obs,
          source: 'atualizacoes'
        });
      }
    });

    // Build parcelamentos from history phases — Debcad phase codes:
    //  733 EM NEGOCIACAO NO SISPAR (adesão SISPAR)
    //  760 PRE-PARCELAMENTO (pedido de parcelamento)
    //  779 INCLUIDO EM PARCELAMENTO SIMPLIFICADO LEI 10.522
    //  770 OPCAO REFIS/EXIGIBILIDADE SUSPENSA
    //  775 Inclusao em Parcelamento Especial Lei 11.941
    //  731 NEGOCIADO NO SISPAR (deferimento/reativação)
    //  797 PARCELAMENTO RESCINDIDO (fim)
    //  792 RESCISAO/EXCLUSAO DE CREDITOS DE PARCELAMENTOS ESPECIAIS
    // Sort by dateInfo (when action actually happened) to handle SISPAR entries
    // where Data Fase is always the account date, not the event date.
    if (rec.history.length > 0) {
      const ADESAO = ['733', '760', '779', '770', '775'];
      const RESCISAO = ['797', '792'];
      const sortedHist = [...rec.history]
        .filter(h => h.code !== '999')
        .sort((a, b) => ((a.dateInfo || a.date) || '').localeCompare((b.dateInfo || b.date) || ''));
      rec.parcelamentos = [];
      let cur = null;
      for (const h of sortedHist) {
        if (ADESAO.includes(h.code)) {
          if (cur && cur.adesao === (h.dateInfo || h.date)) continue;
          if (cur) {
            cur.encerramento = h.dateInfo || h.date;
            cur.situacao = 'Rescindido (implícito)';
            rec.parcelamentos.push(cur);
          }
          cur = { adesao: h.dateInfo || h.date, modalidade: h.desc, tipo: `Fase ${h.code}`, situacao: 'Em vigor', obs: h.obs || '' };
        } else if (h.code === '731') {
          // 731 = NEGOCIADO NO SISPAR: if no open parcelamento, treat as reactivation (new adesão)
          // If open parcelamento, treat as deferimento
          if (!cur) {
            cur = { adesao: h.dateInfo || h.date, modalidade: h.desc, tipo: `Fase 731 (reativação)`, situacao: 'Em vigor', obs: h.obs || '' };
          } else {
            cur.deferimento = h.dateInfo || h.date;
          }
        } else if (RESCISAO.includes(h.code)) {
          if (cur) {
            cur.encerramento = h.dateInfo || h.date;
            cur.situacao = h.obs?.includes('C PAG') ? 'Rescindido c/ pagamento' : h.obs?.includes('S PAG') || h.obs?.includes('S/PAG') ? 'Rescindido s/ pagamento' : 'Rescindido';
            rec.parcelamentos.push(cur);
            cur = null;
          }
        }
      }
      if (cur) rec.parcelamentos.push(cur);
    }

    if (rec.cdaNumber) records.push(rec);
    i = j;
  }
  return records;
}

function parseEprocXLS(workbook) {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false, dateNF: 'yyyy-mm-dd' });
  const results = { intimations: [], errors: [], fileType: '' };

  // Detect file type from first column header
  const firstCol = String(raw[0]?.[0] || workbook.SheetNames[0] || '').toLowerCase();
  if (firstCol.includes('prazo em aberto')) results.fileType = 'prazo_aberto';
  else if (firstCol.includes('pendente')) results.fileType = 'pendente';
  else results.fileType = 'desconhecido';

  // Find header row
  let headerIdx = -1;
  for (let i = 0; i < Math.min(10, raw.length); i++) {
    const row = raw[i].map(c => String(c || '').trim());
    if (row.some(c => c === 'Processo' || c.includes('Processo'))) {
      if (row.some(c => c.includes('Classe') || c.includes('Evento'))) { headerIdx = i; break; }
    }
  }
  if (headerIdx === -1) { results.errors.push('Cabeçalho eproc não encontrado'); return results; }

  const hdr = raw[headerIdx].map(c => String(c || '').trim());
  const col = {};
  hdr.forEach((h, i) => {
    const hl = h.toLowerCase();
    if (h === 'Processo' || hl === 'processo') col.processo = i;
    else if (hl.includes('órgão') || hl.includes('orgao')) col.orgao = i;
    else if (hl === 'partes' || hl === 'doc partes') { if (!col.partes) col.partes = i; }
    else if (hl.includes('doc parte')) col.docParte = i;
    else if (hl === 'classe') col.classe = i;
    else if (hl === 'assunto') col.assunto = i;
    else if (hl.includes('evento') && hl.includes('prazo')) col.eventoPrazo = i;
    else if (hl.includes('data envio') || hl.includes('requisição')) col.dataEnvio = i;
    else if (hl.includes('início prazo') || hl.includes('inicio prazo')) col.inicioPrazo = i;
    else if (hl.includes('final prazo')) col.finalPrazo = i;
  });

  const parseDate = parseAnyDate; // use shared utility

  // Extract party opposing União from partes string
  const extractPartyName = (partesRaw) => {
    const clean = partesRaw.replace(/\r/g, '\n').replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
    // Split by X to get opposing sides
    const sides = clean.split(/\s+X\s+/i);
    
    // Strategy 1: find the side that does NOT contain Fazenda/União
    for (const side of sides) {
      if (side.toUpperCase().includes('FAZENDA NACIONAL') || side.toUpperCase().includes('UNIÃO -')) continue;
      // Extract name after role keyword
      const nameMatch = side.match(/(?:Executado|Requerido|Embargado|Embargante|Autor|Réu|Impetrante|Exequente|Requerente)\s+(.+?)(?:\s*\(|$)/i);
      if (nameMatch) {
        const name = nameMatch[1].trim();
        if (!name.toUpperCase().includes('FAZENDA') && !name.toUpperCase().includes('UNIÃO')) return name;
      }
      // Fallback: just take anything after the role word
      const fallback = side.match(/(?:Executado|Requerido|Embargado|Embargante|Autor|Réu|Exequente|Requerente|Impetrante)\s+(.+)/i);
      if (fallback) {
        const name = fallback[1].replace(/\(.*/, '').trim();
        if (!name.toUpperCase().includes('FAZENDA') && !name.toUpperCase().includes('UNIÃO')) return name;
      }
    }
    
    // Strategy 2: scan all role+name patterns, pick first non-Fazenda
    const allNames = [...clean.matchAll(/(?:Executado|Requerido|Embargado|Embargante|Autor|Réu|Exequente|Requerente|Impetrante)\s+([^\(X]+)/gi)];
    for (const m of allNames) {
      const name = m[1].trim();
      if (!name.toUpperCase().includes('FAZENDA') && !name.toUpperCase().includes('UNIÃO') && name.length > 2) return name;
    }
    
    return '';
  };

  for (let i = headerIdx + 1; i < raw.length; i++) {
    const row = raw[i];
    const processo = String(row[col.processo] || '').trim();
    if (!processo || processo.length < 10) continue;

    const partesRaw = String(row[col.partes] || '');
    const partes = partesRaw.replace(/\r/g, ' ').replace(/\s+/g, ' ').trim();
    const partyName = extractPartyName(partesRaw);
    const orgao = String(row[col.orgao] || '').trim();
    const classe = String(row[col.classe] || '').trim();
    const assunto = String(row[col.assunto] || '').trim();
    const eventoPrazo = String(row[col.eventoPrazo] || '').trim();

    let jurisdiction = '';
    const orgUp = orgao.toUpperCase();
    if (orgUp.startsWith('PR')) jurisdiction = 'PR';
    else if (orgUp.startsWith('RS')) jurisdiction = 'RS';
    else if (orgUp.startsWith('SC')) jurisdiction = 'SC';
    else if (orgUp.includes('TJ')) jurisdiction = 'TJ';
    else jurisdiction = orgao.slice(0, 4);

    results.intimations.push({
      processNumber: processo,
      partyName,
      parties: partes,
      organ: orgao,
      jurisdiction,
      className: classe,
      subject: assunto,
      eventDescription: eventoPrazo,
      dateSent: parseDate(row[col.dataEnvio]),
      dateStart: parseDate(row[col.inicioPrazo]),
      dateDeadline: parseDate(row[col.finalPrazo]),
      status: 'pendente_analise',
      object: '',
      obs1: '',
      obs2: '',
      minutaUrl: '',
      operationId: ''
    });
  }
  return results;
}

const NODE_COLORS = {
  operation: '#00d4aa', personPJ: '#3b82f6', personPF: '#60a5fa',
  debt: '#f59e0b', debtRisk: '#f43f5e', execution: '#a78bfa',
  measure: '#f43f5e', asset: '#22c55e'
};

// ═══════════════════════════════════════════════
// XLS PARSER — PGFN FORMAT
// ═══════════════════════════════════════════════
function parseInscricoesXLS(workbook) {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false, dateNF: 'dd/mm/yyyy' });
  const results = { debtorName: '', debtorCnpj: '', debts: [], errors: [] };

  // Find debtor row
  for (let i = 0; i < Math.min(10, raw.length); i++) {
    const row = raw[i];
    for (const cell of row) {
      const s = String(cell || '');
      const m = s.match(/Devedor:\s*([\d.]+)\s*-\s*(.+)/i);
      if (m) {
        results.debtorCnpj = m[1].replace(/\D/g, '');
        results.debtorName = m[2].trim();
        break;
      }
    }
    if (results.debtorName) break;
  }

  // Find header row
  let headerIdx = -1;
  for (let i = 0; i < Math.min(15, raw.length); i++) {
    const row = raw[i].map(c => String(c || '').trim());
    if (row.some(c => c.includes('Inscrição')) && row.some(c => c.includes('Situação') || c.includes('Fase'))) {
      headerIdx = i; break;
    }
  }
  if (headerIdx === -1) { results.errors.push('Cabeçalho de inscrições não encontrado'); return results; }

  // Map columns by name
  const hdr = raw[headerIdx].map(c => String(c || '').trim());
  const colIdx = {};
  hdr.forEach((h, i) => {
    if (h.includes('Origem')) colIdx.sistema = i;
    else if (h.includes('Data Ins')) colIdx.dataInscricao = i;
    else if (h === 'Inscrição' || (h.includes('Inscrição') && !h.includes('Data'))) colIdx.inscricao = i;
    else if (h.includes('Situação') || h.includes('Fase')) colIdx.situacao = i;
    else if (h.includes('Processo Adm')) colIdx.procAdmin = i;
    else if (h.includes('Processo Judicial')) colIdx.procJudicial = i;
    else if (h.includes('Tipo Devedor')) colIdx.tipoDevedor = i;
    else if (h.includes('Unidade')) colIdx.unidade = i;
    else if (h.includes('Total') || h.includes('Cons')) colIdx.valor = i;
  });

  // Parse data rows
  for (let i = headerIdx + 1; i < raw.length; i++) {
    const row = raw[i];
    const inscricao = String(row[colIdx.inscricao] || '').trim();
    if (!inscricao || inscricao.includes('consolidado') || inscricao.includes('Valor')) continue;
    const situacao = String(row[colIdx.situacao] || '').trim();
    if (!situacao && !inscricao) continue;

    const rawVal = String(row[colIdx.valor] || '0');
    // Handle BR format (5.380,54) and US format (5,380.54)
    let valor = 0;
    if (rawVal.includes(',') && rawVal.includes('.')) {
      // Has both → determine which is decimal: last one wins
      const lastComma = rawVal.lastIndexOf(',');
      const lastDot = rawVal.lastIndexOf('.');
      if (lastComma > lastDot) valor = parseFloat(rawVal.replace(/\./g, '').replace(',', '.')) || 0;
      else valor = parseFloat(rawVal.replace(/,/g, '')) || 0;
    } else if (rawVal.includes(',')) {
      valor = parseFloat(rawVal.replace(',', '.')) || 0;
    } else {
      valor = parseFloat(rawVal) || 0;
    }
    const sistema = String(row[colIdx.sistema] || '').trim();
    const dataInsc = String(row[colIdx.dataInscricao] || '').trim();
    const procJud = String(row[colIdx.procJudicial] || '').replace(/\s/g, '').trim();
    const procAdmin = String(row[colIdx.procAdmin] || '').trim();

    // Parse status
    let status = 'ativa';
    const sitUp = situacao.toUpperCase();
    if (sitUp.includes('EXTINTA') || sitUp.includes('CANCELADA')) status = 'extinta';
    else if (sitUp.includes('GARANTIDA')) status = 'garantida';
    else if (sitUp.includes('SUSPENSA')) status = sitUp.includes('JUDICIAL') ? 'suspensa_judicial' : 'suspensa_admin';
    else if (sitUp.includes('PARCELAD')) status = 'parcelada';
    else if (sitUp.includes('NEGOCIAD') && sitUp.includes('SISPAR')) status = 'negociada_sispar';
    else if (sitUp.includes('NAO AJUIZ') || sitUp.includes('NÃO AJUIZ')) status = 'ativa_nao_ajuizavel';
    else if (sitUp.includes('AJUIZADA')) status = 'ativa_ajuizada';

    // Parse date
    const dateISO = parseAnyDate(dataInsc);

    results.debts.push({
      cdaNumber: inscricao,
      value: valor,
      status,
      rawStatus: situacao,
      system: sistema,
      inscriptionDate: dateISO,
      processAdmin: procAdmin,
      processNumber: procJud && procJud !== '-' && procJud.length > 5 ? procJud : '',
      notes: `Importado: ${situacao}`
    });
  }

  return results;
}

function parseBensXLS(workbook) {
  // Lê planilha de bens indisponibilizados em lote.
  // Estrutura esperada (case-insensitive, ordem flexível):
  //   Tipo | Descrição | Registro/Matrícula | Valor | Status | CPF/CNPJ Titular | Origem | Processo | Notas
  // Aceita variações: "Matrícula", "Matricula", "Reg/Mat", "CPF/CNPJ", "Titular", etc.
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false, dateNF: 'dd/mm/yyyy' });
  const results = { assets: [], errors: [], headerIdx: -1 };

  // Localizar linha de cabeçalho — qualquer linha com "tipo" + ("descric" ou "descrição")
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  let headerIdx = -1;
  for (let i = 0; i < Math.min(15, raw.length); i++) {
    const cells = raw[i].map(norm);
    if (cells.some(c => c === 'tipo') && cells.some(c => c.startsWith('descric'))) {
      headerIdx = i; break;
    }
  }
  if (headerIdx === -1) {
    results.errors.push('Cabeçalho não encontrado. Esperado linha com colunas Tipo, Descrição, etc.');
    return results;
  }
  results.headerIdx = headerIdx;

  // Mapear colunas por nome (tolerante a variações)
  const hdr = raw[headerIdx].map(norm);
  const col = {};
  hdr.forEach((h, i) => {
    if (h === 'tipo') col.tipo = i;
    else if (h.startsWith('descric')) col.descricao = i;
    else if (h.includes('registro') || h.includes('matricula') || h === 'reg/mat') col.registro = i;
    else if (h === 'valor') col.valor = i;
    else if (h === 'status' || h === 'situacao') col.status = i;
    else if (h.includes('cpf') || h.includes('cnpj') || h.includes('titular')) col.titular = i;
    else if (h === 'origem') col.origem = i;
    else if (h.includes('processo') || h.includes('autos')) col.processo = i;
    else if (h.includes('nota') || h.includes('observ') || h.includes('obs')) col.notas = i;
  });

  if (col.tipo === undefined || col.descricao === undefined) {
    results.errors.push('Colunas obrigatórias ausentes: Tipo e Descrição.');
    return results;
  }

  // Mapear o "Tipo" da planilha para os subtipos do app
  const mapSubtype = (tipo) => {
    const t = norm(tipo);
    if (t.includes('imovel') || t.includes('imóvel')) return 'imovel';
    if (t.includes('veicul') || t.includes('automov')) return 'veiculo';
    if (t.includes('ativo financ') || t.includes('financeir') || t.includes('valores') || t.includes('saldo') || t.includes('aplicac')) return 'investimento';
    if (t.includes('conta') || t.includes('banc')) return 'conta_bancaria';
    if (t.includes('invest')) return 'investimento';
    if (t.includes('particip') || t.includes('quota') || t.includes('societ') || t.includes('acao') || t.includes('ações') || t.includes('acoes')) return 'participacao';
    return 'outro';
  };

  // Mapear status livre para os status canônicos do app (ASSET_STATUSES)
  // Cobre variações reais vistas em planilhas SIDA/CNIB/SISBAJUD (incluindo "+N" de coresponsáveis)
  const mapStatus = (s) => {
    const ns = norm(s);
    // Liberados / encerrados (asset não está mais constrito)
    if (ns.includes('liber') || ns.includes('levant') || ns.includes('cancel') || ns.includes('baixa') || ns.includes('desbloq')) return 'liberado';
    // Indisponibilidade efetiva (CNIB lavrado, SISBAJUD bloqueado, arresto, penhora)
    if (ns.includes('bloque') || ns.includes('indispon') || ns.includes('arrest') || ns.includes('penhor') || ns.includes('encerrad')) return 'indisponibilidade_ativa';
    // Pedido feito mas ainda não efetivado
    if (ns.includes('requer') || ns.includes('solicit') || ns.includes('pedid')) return 'indisponibilidade_requerida';
    // Discussão judicial sobre o bem
    if (ns.includes('controv') || ns.includes('contest') || ns.includes('impugn')) return 'controvertido';
    return 'indisponibilidade_ativa'; // default
  };

  // Parse de valor — aceita "R$ 1.234,56", "1234,56", "N/I", "", número JS
  const parseValor = (v) => {
    if (v === null || v === undefined || v === '') return null;
    if (typeof v === 'number') return v;
    const s = String(v).trim();
    if (!s || /^n\/i$|^n\.i\.?$|^nao informado$|^nd$|^-$/i.test(s)) return null;
    const cleaned = s.replace(/r\$\s*/i, '').replace(/\./g, '').replace(',', '.');
    const n = parseFloat(cleaned);
    return isNaN(n) ? null : n;
  };

  // CPF/CNPJ: aceita strings com mais de um documento ("X e/ou Y +N") — pega o primeiro
  const parseDoc = (v) => {
    const m = String(v || '').match(/(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{3}\.\d{3}\.\d{3}-\d{2})/);
    return m ? m[1] : '';
  };

  // Iterar linhas de dados
  for (let i = headerIdx + 1; i < raw.length; i++) {
    const row = raw[i];
    if (!row || row.every(c => !c && c !== 0)) continue; // skip empty
    const tipoRaw = row[col.tipo];
    if (!tipoRaw) continue;
    const desc = String(row[col.descricao] || '').trim();
    if (!desc) continue;
    results.assets.push({
      subtype: mapSubtype(tipoRaw),
      description: desc,
      registry: col.registro !== undefined ? String(row[col.registro] || '').trim() : '',
      value: col.valor !== undefined ? parseValor(row[col.valor]) : null,
      status: col.status !== undefined ? mapStatus(row[col.status]) : 'indisponivel',
      _titularRaw: col.titular !== undefined ? String(row[col.titular] || '').trim() : '',
      _titularDoc: col.titular !== undefined ? parseDoc(row[col.titular]) : '',
      _origem: col.origem !== undefined ? String(row[col.origem] || '').trim() : '',
      _processo: col.processo !== undefined ? String(row[col.processo] || '').trim() : '',
      notes: col.notas !== undefined ? String(row[col.notas] || '').trim() : ''
    });
  }

  return results;
}


function parseProcessosXLS(workbook) {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false, dateNF: 'dd/mm/yyyy' });
  const results = { debtorName: '', debtorCnpj: '', executions: [], errors: [] };

  // Debtor
  for (let i = 0; i < Math.min(10, raw.length); i++) {
    for (const cell of raw[i]) {
      const m = String(cell || '').match(/Devedor:\s*([\d.]+)\s*-\s*(.+)/i);
      if (m) { results.debtorCnpj = m[1].replace(/\D/g, ''); results.debtorName = m[2].trim(); break; }
    }
    if (results.debtorName) break;
  }

  // Header
  let headerIdx = -1;
  for (let i = 0; i < Math.min(15, raw.length); i++) {
    const row = raw[i].map(c => String(c || '').trim());
    if (row.some(c => c.includes('Número do Processo') || c.includes('Processo'))) {
      if (row.some(c => c.includes('Classe') || c.includes('Juízo'))) { headerIdx = i; break; }
    }
  }
  if (headerIdx === -1) { results.errors.push('Cabeçalho de processos não encontrado'); return results; }

  const hdr = raw[headerIdx].map(c => String(c || '').trim());
  const colIdx = {};
  hdr.forEach((h, i) => {
    if (h.includes('Número') || (h.includes('Processo') && !h.includes('Tipo') && !h.includes('Adm'))) colIdx.numero = i;
    else if (h.includes('Classe')) colIdx.classe = i;
    else if (h.includes('Juízo') || h.includes('Juizo')) colIdx.juizo = i;
    else if (h.includes('Polo')) colIdx.polo = i;
    else if (h.includes('Unid')) colIdx.unidade = i;
    else if (h.includes('Tipo Processo')) colIdx.tipo = i;
    else if (h.includes('Protocolo')) colIdx.protocolo = i;
    else if (h.includes('Presc') && h.includes('Inter') && !h.includes('Previsão')) colIdx.prescInter = i;
    else if (h.includes('Previsão') || h.includes('Prescrição Intercorrente')) colIdx.prescPrev = i;
    else if (h.includes('Garantia')) colIdx.garantia = i;
    else if (h.includes('Digra') || h.includes('Acomp')) colIdx.digra = i;
  });

  for (let i = headerIdx + 1; i < raw.length; i++) {
    const row = raw[i];
    const num = String(row[colIdx.numero] || '').replace(/\s/g, '').trim();
    if (!num || num.length < 10) continue;

    const classe = String(row[colIdx.classe] || '').trim();
    const juizo = String(row[colIdx.juizo] || '').trim();
    const protocolo = String(row[colIdx.protocolo] || '').trim();
    const prescInter = String(row[colIdx.prescInter] || '').trim();
    const prescPrev = String(row[colIdx.prescPrev] || '').trim();
    const garantia = String(row[colIdx.garantia] || '').trim();
    const digra = String(row[colIdx.digra != null ? colIdx.digra : 99] || '').trim();

    const prescDateISO = parseAnyDate(prescPrev);
    const protocolDateISO = parseAnyDate(protocolo);

    results.executions.push({
      processNumber: num,
      className: classe,
      court: juizo,
      protocolDate: protocolDateISO,
      prescriptionInterrupted: prescInter.toUpperCase() === 'SIM',
      prescriptionForecast: prescDateISO,
      hasGuarantee: garantia.toUpperCase() === 'SIM',
      digraTracked: digra.toUpperCase() === 'SIM',
      status: 'ativa',
      notes: `Classe: ${classe}`
    });
  }
  return results;
}

// ═══════════════════════════════════════════════
// AI TEXT PARSER
// ═══════════════════════════════════════════════
function parseAIText(text) {
  const results = { people: [], assets: [], errors: [] };
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    // Try to parse person lines: Name - CPF/CNPJ - Role
    const personMatch = line.match(/^(?:[-•*]\s*)?(.+?)\s*[-–|]\s*([\d.\/\-]{11,18})\s*[-–|]\s*(.+)$/);
    if (personMatch) {
      const cpf = personMatch[2].replace(/[.\-\/]/g, '');
      results.people.push({
        name: personMatch[1].trim(),
        cpfCnpj: personMatch[2].trim(),
        subtype: cpf.length > 11 ? 'PJ' : 'PF',
        role: personMatch[3].trim()
      });
      continue;
    }
    // Try person: Name (CPF/CNPJ) - Role
    const personMatch2 = line.match(/^(?:[-•*]\s*)?(.+?)\s*\(([\d.\/\-]{11,18})\)\s*[-–|:]\s*(.+)$/);
    if (personMatch2) {
      const cpf = personMatch2[2].replace(/[.\-\/]/g, '');
      results.people.push({
        name: personMatch2[1].trim(),
        cpfCnpj: personMatch2[2].trim(),
        subtype: cpf.length > 11 ? 'PJ' : 'PF',
        role: personMatch2[3].trim()
      });
      continue;
    }
    // Try asset lines: BEM: Descrição | Tipo | Valor | Titular
    const assetMatch = line.match(/^(?:[-•*]\s*)?(?:bem|imóvel|veículo|conta|investimento|participação)\s*[:|-]\s*(.+)/i);
    if (assetMatch) {
      const parts = assetMatch[1].split(/\s*[|]\s*/);
      results.assets.push({
        description: parts[0] || '',
        subtype: 'outro',
        value: 0,
        status: 'livre',
        notes: parts.slice(1).join(' | ')
      });
      continue;
    }
  }
  if (results.people.length === 0 && results.assets.length === 0) {
    results.errors.push('Nenhum dado reconhecido. Use o formato: Nome - CPF/CNPJ - Papel');
  }
  return results;
}

// ═══════════════════════════════════════════════
// ASSET BULK PARSER — Bens Indisponibilizados em Lote
// ═══════════════════════════════════════════════
function parseAssetsBulk(text, people, operationId) {
  const results = { assets: [], errors: [], count: 0 };
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  const typeMap = {
    'i': 'imovel', 'imovel': 'imovel', 'imóvel': 'imovel', 'imov': 'imovel',
    'v': 'veiculo', 'veiculo': 'veiculo', 'veículo': 'veiculo', 'veic': 'veiculo',
    'c': 'conta_bancaria', 'conta': 'conta_bancaria', 'conta bancária': 'conta_bancaria', 'conta bancaria': 'conta_bancaria',
    '$': 'investimento', 'investimento': 'investimento', 'invest': 'investimento',
    's': 'participacao', 'participação': 'participacao', 'participacao': 'participacao', 'societária': 'participacao', 'societaria': 'participacao',
    'o': 'outro', 'outro': 'outro'
  };
  const statusMap = {
    'ind': 'indisponibilidade_ativa', 'indisponibilizado': 'indisponibilidade_ativa', 'indisponivel': 'indisponibilidade_ativa', 'indisponível': 'indisponibilidade_ativa',
    'bloq': 'indisponibilidade_ativa', 'bloqueado': 'indisponibilidade_ativa', 'ativa': 'indisponibilidade_ativa',
    'pen': 'indisponibilidade_ativa', 'penhorado': 'indisponibilidade_ativa', 'penhora': 'indisponibilidade_ativa',
    'arr': 'indisponibilidade_ativa', 'arrestado': 'indisponibilidade_ativa', 'arresto': 'indisponibilidade_ativa',
    'req': 'indisponibilidade_requerida', 'requerida': 'indisponibilidade_requerida', 'requerido': 'indisponibilidade_requerida',
    'liv': 'liberado', 'livre': 'liberado', 'liberado': 'liberado',
    'ali': 'liberado', 'alienado': 'liberado',
    'con': 'controvertido', 'controvertido': 'controvertido'
  };

  for (const line of lines) {
    // Skip headers and comments
    if (line.toLowerCase().match(/^tipo\s*[-||\t]/) || line.startsWith('#') || line.startsWith('//')) continue;

    // Auto-detect separator: tab, pipe, or dash (in priority order)
    // Dash is tricky — only use it if no tab/pipe found, and if there are at least 2 dashes
    let sep, p;
    if (line.includes('\t')) {
      sep = '\t';
      p = line.split(sep).map(s => s.trim());
    } else if (line.includes('|')) {
      sep = '|';
      p = line.split(sep).map(s => s.trim());
    } else if ((line.match(/ - /g) || []).length >= 1) {
      // Split by " - " (space-dash-space) to avoid splitting hyphens within words
      p = line.split(' - ').map(s => s.trim());
    } else if (line.includes(' – ')) {
      // en-dash
      p = line.split(' – ').map(s => s.trim());
    } else {
      // Single field — treat entire line as description
      p = [line];
    }

    if (p.length < 2) {
      if (p[0]) {
        results.assets.push({ description: p[0], subtype: 'outro', registry: '', value: 0, status: 'indisponibilidade_ativa', holderId: '', holderDoc: '', source: '', processRef: '', notes: '', analyticsRegistered: false, operationId });
        results.count++;
      }
      continue;
    }

    // Try to detect if first field is a type keyword or part of description
    const firstLower = (p[0] || '').toLowerCase().trim();
    let subtype, descStart;
    if (typeMap[firstLower]) {
      subtype = typeMap[firstLower];
      descStart = 1;
    } else {
      // First field is not a recognized type — check if it looks like a type abbreviation
      // or if it's a long description (>20 chars = probably description, not type)
      if (firstLower.length <= 12 && typeMap[firstLower.replace(/\s+/g, '')]) {
        subtype = typeMap[firstLower.replace(/\s+/g, '')];
        descStart = 1;
      } else {
        // Treat as description, auto-detect type from content
        subtype = 'outro';
        descStart = 0;
        const descLower = p[0].toLowerCase();
        if (/im[oó]vel|terreno|lote|apartamento|casa|sala|matr[ií]cula|edif/i.test(descLower)) subtype = 'imovel';
        else if (/ve[ií]culo|carro|autom[oó]vel|moto|caminh[aã]o|placa|renavam/i.test(descLower)) subtype = 'veiculo';
        else if (/conta|saldo|dep[oó]sito|bancári/i.test(descLower)) subtype = 'conta_bancaria';
        else if (/investimento|aplica[çc][ãa]o|fundo|cdb|tesouro/i.test(descLower)) subtype = 'investimento';
        else if (/participa[çc][ãa]o|cota|a[çc][ãa]o|societ/i.test(descLower)) subtype = 'participacao';
      }
    }

    const description = p[descStart] || p[0] || '';
    const registry = p[descStart + 1] || '';
    const rawVal = (p[descStart + 2] || '').replace(/[R$\s.]/g, '').replace(',', '.');
    const value = parseFloat(rawVal) || 0;
    const status = statusMap[(p[descStart + 3] || 'ind').toLowerCase().trim()] || 'indisponibilidade_ativa';
    const holderDoc = (p[descStart + 4] || '').replace(/[.\-\/\s]/g, '');
    const source = p[descStart + 5] || '';
    const processRef = p[descStart + 6] || '';
    const notes = p[descStart + 7] || '';

    let holderId = '';
    if (holderDoc && people) {
      const match = people.find(pp => pp.operationId === operationId && pp.cpfCnpj && pp.cpfCnpj.replace(/\D/g, '') === holderDoc);
      if (match) holderId = match.id;
    }

    results.assets.push({ description: description || `${subtype} — ${registry}`, subtype, registry, value, status, holderId, holderDoc: p[descStart + 4] || '', source, processRef, notes, analyticsRegistered: false, operationId });
    results.count++;
  }

  if (results.count === 0) results.errors.push('Nenhum bem reconhecido.');
  return results;
}

// ═══════════════════════════════════════════════
// GRAPH LAYOUT
// ═══════════════════════════════════════════════
function computeGraph(operation, data) {
  const nodes = [], edges = [];
  if (!operation) return { nodes, edges };
  const opId = operation.id;
  const people = data.people.filter(p => p.operationId === opId);
  const debts = data.debts.filter(d => d.operationId === opId);
  const allExecs = data.executions.filter(e => e.operationId === opId);
  // Graph shows only: IDPJ, MCF, and Execuções Fiscais ativas (omit central, embargos, agravos, extintas)
  const execs = allExecs.filter(e => {
    if (e.status === 'extinta' || e.status === 'arquivada') return false;
    if (e.processTag === 'central') return false;
    // Keep IDPJ, MCF, and normal/untagged (EFs)
    const tag = e.processTag || 'normal';
    if (tag === 'idpj' || tag === 'cautelar_fiscal' || tag === 'normal') return true;
    return false;
  });

  // ─── AXIS 1: PEOPLE (left) ───
  const pjList = people.filter(p => p.subtype === 'PJ');
  const pfList = people.filter(p => p.subtype === 'PF');
  const originaria = pjList.find(p => (p.role || '').toLowerCase().match(/originári|devedora|principal/)) || pjList[0];
  const otherPJ = pjList.filter(p => p !== originaria);
  const peopleCX = -280, peopleCY = 0;

  if (originaria) {
    nodes.push({ id: originaria.id, type: 'person', subtype: 'PJ', label: originaria.name, x: peopleCX, y: peopleCY, r: 34, color: NODE_COLORS.personPJ, data: originaria });
  }
  const pfR = Math.max(110, pfList.length * 24);
  pfList.forEach((p, i) => {
    const a = (2 * Math.PI * i) / Math.max(pfList.length, 1) - Math.PI / 2;
    nodes.push({ id: p.id, type: 'person', subtype: 'PF', label: p.name, x: peopleCX + pfR * Math.cos(a), y: peopleCY + pfR * Math.sin(a), r: 17, color: NODE_COLORS.personPF, data: p });
    if (originaria) edges.push({ from: originaria.id, to: p.id, color: 'rgba(96,165,250,0.15)' });
  });
  const pjR = pfR + 75;
  otherPJ.forEach((p, i) => {
    const a = Math.PI * 0.7 + (i - (otherPJ.length - 1) / 2) * Math.min(1.0, otherPJ.length * 0.35);
    nodes.push({ id: p.id, type: 'person', subtype: 'PJ', label: p.name, x: peopleCX + pjR * Math.cos(a), y: peopleCY + pjR * Math.sin(a), r: 22, color: '#2563eb', data: p });
    if (originaria) edges.push({ from: originaria.id, to: p.id, color: 'rgba(37,99,235,0.15)' });
  });

  // ─── AXIS 2: PROCESSES (right) — Hub-and-spoke layout ───
  const procCX = 300, procCY = 0;
  const idpjProcs = execs.filter(e => e.processTag === 'idpj' || e.processTag === 'cautelar_fiscal');
  const centralProcs = execs.filter(e => e.processTag === 'central');
  const coveredIds = new Set();
  idpjProcs.forEach(e => { if (e.linkedExecutionIds) e.linkedExecutionIds.forEach(id => coveredIds.add(id)); });

  // Top-level EFs (not apensos, not covered by IDPJ, not tagged)
  const efProcs = execs.filter(e => !e.processTag || e.processTag === 'normal');
  const topLevelEFs = efProcs.filter(e => !e.parentExecutionId);
  const coveredEFs = topLevelEFs.filter(e => coveredIds.has(e.id));
  const uncoveredEFs = topLevelEFs.filter(e => !coveredIds.has(e.id));

  // Build apenso map: parentId → [apensos]
  const apensoMap = {};
  efProcs.filter(e => e.parentExecutionId).forEach(ap => {
    if (!apensoMap[ap.parentExecutionId]) apensoMap[ap.parentExecutionId] = [];
    apensoMap[ap.parentExecutionId].push(ap);
  });

  // ─── IDPJ/MCF hub nodes ───
  const hubSpacing = 160;
  const hubStartY = -(idpjProcs.length - 1) * hubSpacing / 2;
  idpjProcs.forEach((ip, mi) => {
    const mx = procCX, my = hubStartY + mi * hubSpacing;
    const col = ip.processTag === 'idpj' ? '#f43f5e' : '#f59e0b';
    const tag = ip.processTag === 'idpj' ? 'IDPJ' : 'MCF';
    // Calculate total CDA value from all linked EFs
    const linkedEFIds = (ip.linkedExecutionIds||[]);
    const linkedEFExecs = allExecs.filter(e => linkedEFIds.includes(e.id));
    const linkedEFProcNums = new Set(linkedEFExecs.map(e => normProc(e.processNumber)).filter(Boolean));
    const hubTotalValue = debts.filter(d => d.processNumber && linkedEFProcNums.has(normProc(d.processNumber))).reduce((s,d) => s + (d.value||0), 0);
    nodes.push({ id: ip.id, type: 'execution', label: tag + '\n' + (ip.processNumber||''), x: mx, y: my, r: 30, color: col, data: ip, isHub: true, totalLinkedValue: hubTotalValue });

    // Spoke: linked EFs around this IDPJ in a semicircle to the right
    const myEFs = coveredEFs.filter(e => (ip.linkedExecutionIds||[]).includes(e.id));
    if (myEFs.length > 0) {
      const spokeR = Math.max(80, myEFs.length * 22);
      const arcSpan = Math.min(Math.PI * 0.8, myEFs.length * 0.35);
      const arcStart = -arcSpan / 2;
      myEFs.forEach((ef, ei) => {
        const a = arcStart + (arcSpan * ei) / Math.max(myEFs.length - 1, 1);
        const ex = mx + spokeR * Math.cos(a);
        const ey = my + spokeR * Math.sin(a);
        nodes.push({ id: ef.id, type: 'execution', label: (ef.processNumber||''), x: ex, y: ey, r: 14, color: 'rgba(148,163,184,0.8)', data: ef });
        edges.push({ from: ip.id, to: ef.id, color: `${col}33`, width: 1.5 });

        // Apensos of this EF — tiny nodes clustered below
        const aps = apensoMap[ef.id] || [];
        aps.forEach((ap, ai) => {
          const apx = ex + (ai - (aps.length-1)/2) * 22;
          const apy = ey + 28;
          nodes.push({ id: ap.id, type: 'execution', label: (ap.processNumber||''), x: apx, y: apy, r: 8, color: 'rgba(148,163,184,0.4)', data: ap, isApenso: true });
          edges.push({ from: ef.id, to: ap.id, color: 'rgba(148,163,184,0.15)', dashed: true });
        });
      });
    }
  });

  // ─── Central processes ───
  if (centralProcs.length > 0) {
    const centralY = hubStartY - 80;
    centralProcs.forEach((cp, ci) => {
      const cx = procCX + (ci - (centralProcs.length-1)/2) * 80;
      nodes.push({ id: cp.id, type: 'execution', label: '◆ ' + (cp.processNumber||''), x: cx, y: centralY, r: 20, color: 'rgba(122,139,163,0.7)', data: cp });
    });
  }

  // ─── Uncovered EFs — Smart display: alert EFs individual, rest collapsed ───
  if (uncoveredEFs.length > 0) {
    const areaX = idpjProcs.length > 0 ? procCX + 220 : procCX;
    const areaY = procCY;

    // Classify: which EFs have alerts (guarantee, prescription ≤180d, open intimations)?
    const allDebts = data.debts || [];
    const allPrescEvts = data.prescriptionEvents || [];
    const allIntims = data.intimations || [];
    const alertEFs = [];
    const quietEFs = [];

    uncoveredEFs.forEach(ef => {
      const hasGuarantee = ef.hasGuarantee;
      // Prescription risk: any CDA linked to this process with ≤180d
      const linkedCDAs = allDebts.filter(d => d.operationId === opId && sameProc(d.processNumber, ef.processNumber) && d.status !== 'extinta' && !d.prescriptionHandled);
      const hasPrescRisk = linkedCDAs.some(d => {
        const pd = d.prescriptionDate || calcAutoPresc(d, execs, allPrescEvts);
        const dd = daysUntil(pd);
        return dd !== null && dd > 0 && dd <= 180;
      });
      // Open intimations
      const hasIntim = allIntims.some(x => x.operationId === opId && sameProc(x.processNumber, ef.processNumber) && !x.responseAction);
      const cdaValue = linkedCDAs.reduce((s,d) => s + (d.value||0), 0);

      if (hasGuarantee || hasPrescRisk || hasIntim) {
        alertEFs.push({ ...ef, _hasGuarantee: hasGuarantee, _hasPrescRisk: hasPrescRisk, _hasIntim: hasIntim, _cdaValue: cdaValue });
      } else {
        quietEFs.push({ ...ef, _cdaValue: cdaValue });
      }
    });

    // Sort alert EFs: presc risk first, then guarantee, then intimations
    alertEFs.sort((a, b) => (b._hasPrescRisk ? 1 : 0) - (a._hasPrescRisk ? 1 : 0) || b._cdaValue - a._cdaValue);

    // Layout alert EFs in a compact semicircle or small arc
    const alertCount = Math.min(alertEFs.length, 15); // cap individual display
    if (alertCount > 0) {
      const alertR = Math.max(100, alertCount * 20);
      const arcSpan = Math.min(Math.PI * 1.2, alertCount * 0.28);
      const arcStart = -arcSpan / 2;
      alertEFs.slice(0, alertCount).forEach((ef, ei) => {
        const a = alertCount === 1 ? 0 : arcStart + (arcSpan * ei) / (alertCount - 1);
        const ex = areaX + alertR * Math.cos(a);
        const ey = areaY + alertR * Math.sin(a);
        // Color based on alert type
        const nodeColor = ef._hasPrescRisk ? 'rgba(244,63,94,0.7)' : ef._hasGuarantee ? 'rgba(34,197,94,0.6)' : 'rgba(59,130,246,0.6)';
        const r = ef._hasPrescRisk ? 18 : 14;
        nodes.push({ id: ef.id, type: 'execution', label: (ef.processNumber||''), x: ex, y: ey, r, color: nodeColor, data: ef, alertType: ef._hasPrescRisk ? 'presc' : ef._hasGuarantee ? 'gar' : 'intim' });

        // Apensos
        const aps = apensoMap[ef.id] || [];
        aps.forEach((ap, ai) => {
          nodes.push({ id: ap.id, type: 'execution', label: (ap.processNumber||''), x: ex + (ai - (aps.length-1)/2) * 18, y: ey + 24, r: 7, color: 'rgba(148,163,184,0.3)', data: ap, isApenso: true });
          edges.push({ from: ef.id, to: ap.id, color: 'rgba(148,163,184,0.12)', dashed: true });
        });
      });
      // Overflow alert EFs beyond cap
      if (alertEFs.length > alertCount) {
        const overflowAlerts = alertEFs.length - alertCount;
        nodes.push({ id: '_alert_overflow', type: 'summary', label: `+${overflowAlerts} EFs\ncom alerta`, x: areaX + alertR + 60, y: areaY, r: 22, color: 'rgba(244,63,94,0.3)', isSummary: true });
      }
    }

    // Quiet EFs → single summary block
    if (quietEFs.length > 0) {
      const quietValue = quietEFs.reduce((s,e) => s + (e._cdaValue || 0), 0);
      const summaryY = areaY + (alertCount > 0 ? Math.max(120, alertCount * 15) : 0);
      nodes.push({
        id: '_quiet_efs',
        type: 'summary',
        label: `${quietEFs.length} EFs sem alerta\n${fmtCur(quietValue)}`,
        x: areaX,
        y: summaryY,
        r: Math.min(40, 18 + quietEFs.length * 0.15),
        color: 'rgba(148,163,184,0.25)',
        isSummary: true,
        data: { count: quietEFs.length, value: quietValue }
      });
    }
  }

  return { nodes, edges };
}

// ═══════════════════════════════════════════════
// INSIGHTS
// ═══════════════════════════════════════════════
function generateInsights(op, data) {
  if (!op) return [];
  const ins = [], opId = op.id;
  const debts = data.debts.filter(d => d.operationId === opId);
  const execs = data.executions.filter(e => e.operationId === opId);
  const measures = data.measures.filter(m => m.operationId === opId);
  const assets = data.assets.filter(a => a.operationId === opId);

  const unexecuted = debts.filter(d => (d.status === 'ativa' || d.status === 'ativa_nao_ajuizavel') && !d.processNumber);
  if (unexecuted.length > 0) ins.push({ type: 'critical', title: `${unexecuted.length} CDA(s) sem execução fiscal`, desc: `${unexecuted.map(d => d.cdaNumber || fmtCur(d.value)).join(', ')}. Avaliar ajuizamento.` });

  debts.forEach(d => {
    const prescDate = d.prescriptionDate || calcAutoPresc(d, execs, data.prescriptionEvents || []);
    const days = daysUntil(prescDate);
    if (days !== null && days > 0 && days <= 180) ins.push({ type: days <= 60 ? 'critical' : 'warning', title: `Prescrição iminente: ${d.cdaNumber || 'CDA'}`, desc: `${days}d para prescrição (${fmtDate(prescDate)})${!d.prescriptionDate ? ' [cálculo automático]' : ''}. ${fmtCur(d.value)}.` });
    if (days !== null && days <= 0) ins.push({ type: 'critical', title: `Possível prescrição: ${d.cdaNumber}`, desc: `Data ${fmtDate(prescDate)} ultrapassada${!d.prescriptionDate ? ' [auto]' : ''}. ${fmtCur(d.value)}.` });
  });

  execs.forEach(e => {
    // Use the full prescription calculator if events exist
    const prescEvts = data.prescriptionEvents || [];
    const execEvts = prescEvts.filter(pe => pe.executionId === e.id);
    if (execEvts.length > 0) {
      const calc = calcPrescription(e.id, prescEvts);
      if (calc.status === 'prescrito') ins.push({ type: 'critical', title: `PRESCRIÇÃO CONSUMADA: ${truncate(e.processNumber,25)}`, desc: calc.detail });
      else if (calc.status === 'critico') ins.push({ type: 'critical', title: `Prescrição intercorrente crítica: ${truncate(e.processNumber,25)}`, desc: calc.detail });
      else if (calc.status === 'alerta') ins.push({ type: 'warning', title: `Alerta prescrição: ${truncate(e.processNumber,25)}`, desc: calc.detail });
    } else {
      // Fallback to imported data
      if (e.prescriptionForecast) {
        const days = daysUntil(e.prescriptionForecast);
        if (days !== null && days > 0 && days <= 365) ins.push({ type: days <= 180 ? 'warning' : 'info', title: `Prescrição intercorrente: ${e.processNumber}`, desc: `Previsão: ${fmtDate(e.prescriptionForecast)} (${days}d). ${e.prescriptionInterrupted ? 'Já interrompida.' : 'NÃO interrompida.'}` });
      }
    }
    if (!e.hasGuarantee && e.status === 'ativa') ins.push({ type: 'warning', title: `Execução sem garantia: ${truncate(e.processNumber,25)}`, desc: `${e.court || ''}. Avaliar constrição.` });

    // Suggest registering prescription events if none exist
    if (execEvts.length === 0) ins.push({ type: 'info', title: `Sem controle de prescrição: ${truncate(e.processNumber,20)}`, desc: 'Registre eventos na aba Prescrição para controle automático dos prazos.' });
  });

  const constrictedAssets = assets.filter(a => ['indisponibilizado','penhorado','arrestado'].includes(a.status));
  const uncoveredDebts = debts.filter(d => d.status !== 'extinta' && d.status !== 'garantida' && !d.processNumber);
  if (constrictedAssets.length > 0 && uncoveredDebts.length > 0) {
    ins.push({ type: 'opportunity', title: 'Replicar medidas', desc: `${constrictedAssets.length} bem(ns) constrito(s) podem cobrir ${uncoveredDebts.length} dívida(s) a descoberto. Avaliar extensão.` });
  }

  const pendingAnalytics = assets.filter(a => !a.analyticsRegistered);
  if (pendingAnalytics.length > 0) ins.push({ type: 'info', title: `${pendingAnalytics.length} bem(ns) sem registro no Analytics`, desc: `Bens: ${pendingAnalytics.map(a => truncate(a.description,30)).join(', ')}` });

  // Intimation alerts
  const intims = (data.intimations || []).filter(x => x.operationId === opId);
  const today = new Date(); today.setHours(0,0,0,0);
  const overdueIntims = intims.filter(x => x.dateDeadline && new Date(x.dateDeadline+'T00:00:00') < today && x.status !== 'analisado');
  if (overdueIntims.length > 0) ins.push({ type: 'critical', title: `${overdueIntims.length} intimação(ões) VENCIDA(S)`, desc: `Processos: ${overdueIntims.map(x => truncate(x.processNumber,22)).join(', ')}` });
  const urgentIntims = intims.filter(x => { const d = daysUntil(x.dateDeadline); return d !== null && d >= 0 && d <= 5 && x.status !== 'analisado'; });
  if (urgentIntims.length > 0) ins.push({ type: 'warning', title: `${urgentIntims.length} intimação(ões) vencendo em ≤5 dias`, desc: `Processos: ${urgentIntims.map(x => `${truncate(x.processNumber,20)} (${daysUntil(x.dateDeadline)}d)`).join(', ')}` });

  const totalDebt = debts.filter(d => d.status !== 'extinta').reduce((s, d) => s + (d.value || 0), 0);
  const guaranteed = debts.filter(d => d.status === 'garantida').reduce((s, d) => s + (d.value || 0), 0);
  if (totalDebt > 0 && guaranteed < totalDebt * 0.3) ins.push({ type: 'warning', title: 'Cobertura de garantia baixa', desc: `${((guaranteed / totalDebt) * 100).toFixed(0)}% garantido. Total: ${fmtCur(totalDebt)}.` });

  if (ins.length === 0) ins.push({ type: 'info', title: 'Sem alertas', desc: 'Adicione dados para gerar insights.' });
  return ins;
}

// ═══════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════
function Modal({ show, onClose, title, children, wide }) {
  if (!show) return null;
  return (<div className="modal-overlay" onClick={onClose}>
    <div className="modal" onClick={e => e.stopPropagation()} style={wide ? {maxWidth:'780px'} : {}}>
      <h3>{title}</h3>{children}
    </div>
  </div>);
}

// Graph SVG
function GraphView({ operation, data, onSelectNode, onOpenExec }) {
  const svgRef = useRef(null);
  const [vb, setVb] = useState({ x: -600, y: -450, w: 1200, h: 900 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [hideExtinct, setHideExtinct] = useState(false);

  const fullLayout = useMemo(() => computeGraph(operation, data), [operation, data]);

  // Build a map: execution nodeId → status (to style nodes and filter)
  const execStatusMap = useMemo(() => {
    const m = {};
    (data.executions || []).filter(e => e.operationId === operation?.id).forEach(e => { m[e.id] = e.status; });
    return m;
  }, [data.executions, operation]);

  const isNodeInactive = (node) => {
    if (node.type !== 'execution') return false;
    const st = execStatusMap[node.id] || node.data?.status;
    return st === 'extinta' || st === 'arquivada';
  };

  // Filter the layout when hideExtinct is on
  const layout = useMemo(() => {
    if (!hideExtinct) return fullLayout;
    const hiddenIds = new Set(fullLayout.nodes.filter(isNodeInactive).map(n => n.id));
    return {
      nodes: fullLayout.nodes.filter(n => !hiddenIds.has(n.id)),
      edges: fullLayout.edges.filter(e => !hiddenIds.has(e.from) && !hiddenIds.has(e.to))
    };
  }, [fullLayout, hideExtinct, execStatusMap]);

  useEffect(() => {
    if (layout.nodes.length <= 1) return;
    let x1 = Infinity, x2 = -Infinity, y1 = Infinity, y2 = -Infinity;
    layout.nodes.forEach(n => { x1 = Math.min(x1, n.x - n.r); x2 = Math.max(x2, n.x + n.r); y1 = Math.min(y1, n.y - n.r); y2 = Math.max(y2, n.y + n.r); });
    const p = 100; setVb({ x: x1 - p, y: y1 - p, w: (x2 - x1) + p * 2, h: (y2 - y1) + p * 2 });
  }, [layout]);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    const s = e.deltaY > 0 ? 1.12 : 0.88;
    setVb(v => { const cx = v.x + v.w / 2, cy = v.y + v.h / 2, nw = v.w * s, nh = v.h * s; return { x: cx - nw / 2, y: cy - nh / 2, w: nw, h: nh }; });
  }, []);
  useEffect(() => { const s = svgRef.current; if (s) s.addEventListener('wheel', onWheel, { passive: false }); return () => { if (s) s.removeEventListener('wheel', onWheel); }; }, [onWheel]);

  const onMD = (e) => { if (e.target.closest('.gnode')) return; setDragging(true); setDragStart({ x: e.clientX, y: e.clientY, vb: { ...vb } }); };
  const onMM = (e) => { if (!dragging || !dragStart) return; const r = svgRef.current.getBoundingClientRect(); const sx = vb.w / r.width, sy = vb.h / r.height; setVb({ ...dragStart.vb, x: dragStart.vb.x - (e.clientX - dragStart.x) * sx, y: dragStart.vb.y - (e.clientY - dragStart.y) * sy }); };
  const onMU = () => { setDragging(false); setDragStart(null); };

  const resetView = () => {
    if (layout.nodes.length <= 1) return;
    let x1=Infinity,x2=-Infinity,y1=Infinity,y2=-Infinity;
    layout.nodes.forEach(n=>{x1=Math.min(x1,n.x-n.r);x2=Math.max(x2,n.x+n.r);y1=Math.min(y1,n.y-n.r);y2=Math.max(y2,n.y+n.r);});
    const p=100; setVb({x:x1-p,y:y1-p,w:(x2-x1)+p*2,h:(y2-y1)+p*2});
  };

  const handleNodeClick = (node) => {
    // Etapa 6: clicking an execution node opens the edit modal directly (full form with all fields)
    if (node.type === 'execution' && onOpenExec) {
      onOpenExec(node.data);
      return;
    }
    onSelectNode(node);
  };

  return (<div className="graph-container">
    <svg ref={svgRef} viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU}>
      <defs>
        <filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      {/* Zone labels */}
      {layout.nodes.length > 1 && <>
        <text x={-280} y={-260} textAnchor="middle" fill="rgba(59,130,246,0.15)" fontSize="12" fontWeight="700" fontFamily="Public Sans">PESSOAS</text>
        <text x={300} y={-260} textAnchor="middle" fill="rgba(148,163,184,0.15)" fontSize="12" fontWeight="700" fontFamily="Public Sans">PROCESSOS</text>
        <line x1={20} y1={-250} x2={20} y2={500} stroke="rgba(255,255,255,0.02)" strokeWidth="1" strokeDasharray="8,8" />
      </>}
      {layout.edges.map((e, i) => {
        const f = layout.nodes.find(n => n.id === e.from), t = layout.nodes.find(n => n.id === e.to);
        if (!f || !t) return null;
        const hl = hovered && (e.from === hovered || e.to === hovered);
        const dimEdge = isNodeInactive(f) || isNodeInactive(t);
        const baseOp = dimEdge ? 0.25 : 1;
        return <line key={i} x1={f.x} y1={f.y} x2={t.x} y2={t.y} stroke={hl ? e.color.replace(/[\d.]+\)$/, '0.7)') : e.color} strokeWidth={hl ? 2 : (e.width || 1)} strokeDasharray={e.dashed || dimEdge ? '4,4' : 'none'} opacity={baseOp} />;
      })}
      {layout.nodes.map(node => {
        const isH = hovered === node.id;
        const isC = hovered && layout.edges.some(e => (e.from === hovered && e.to === node.id) || (e.to === hovered && e.from === node.id));
        const inactive = isNodeInactive(node);
        const baseOp = inactive ? 0.35 : 1;
        const op = hovered ? (isH || isC ? baseOp : 0.25) : baseOp;
        const execSt = execStatusMap[node.id];

        // ─── Summary block (collapsed EFs) ───
        if (node.isSummary) {
          const w = node.r * 4, h = node.r * 2.5;
          const labelLines = (node.label || '').split('\n');
          return (<g key={node.id} className="gnode" style={{cursor:'default',opacity:op,transition:'opacity 0.15s'}}
            onMouseEnter={(e) => { setHovered(node.id); setTooltip({ x: e.clientX + 12, y: e.clientY - 8, node }); }}
            onMouseLeave={() => { setHovered(null); setTooltip(null); }}>
            <rect x={node.x - w/2} y={node.y - h/2} width={w} height={h} rx={8} ry={8}
              fill={node.color} fillOpacity={0.08} stroke={node.color} strokeWidth={1.5} strokeDasharray="6,4" />
            {labelLines.map((line, li) => (
              <text key={li} x={node.x} y={node.y + (li - (labelLines.length-1)/2) * 13} textAnchor="middle" dominantBaseline="central"
                fill={li === 0 ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)'} fontSize={li === 0 ? "10" : "9"} fontWeight={li === 0 ? "600" : "400"} fontFamily="Public Sans">{line}</text>
            ))}
          </g>);
        }

        // ─── Alert indicator ring for EFs with alerts ───
        const alertRing = node.alertType === 'presc' ? 'rgba(244,63,94,0.4)' : node.alertType === 'gar' ? 'rgba(34,197,94,0.3)' : node.alertType === 'intim' ? 'rgba(59,130,246,0.3)' : null;

        return (<g key={node.id} className="gnode" style={{cursor:'pointer',opacity:op,transition:'opacity 0.15s'}}
          onClick={() => handleNodeClick(node)}
          onMouseEnter={(e) => { setHovered(node.id); setTooltip({ x: e.clientX + 12, y: e.clientY - 8, node }); }}
          onMouseLeave={() => { setHovered(null); setTooltip(null); }}>
          {isH && <circle cx={node.x} cy={node.y} r={node.r + 4} fill="none" stroke={node.color} strokeWidth={1.5} opacity={0.4} />}
          {alertRing && <circle cx={node.x} cy={node.y} r={node.r + 3} fill="none" stroke={alertRing} strokeWidth={2} strokeDasharray="4,3" />}
          <circle cx={node.x} cy={node.y} r={node.r} fill={node.color} fillOpacity={inactive ? 0.04 : node.isHub ? 0.18 : node.isApenso ? 0.06 : 0.1} stroke={node.color} strokeWidth={node.isHub ? 2 : node.isApenso ? 0.5 : 1.5} strokeDasharray={inactive ? '3,3' : 'none'} />
          {node.type === 'operation' ?
            <text x={node.x} y={node.y} textAnchor="middle" dominantBaseline="central" fill={node.color} fontSize="9" fontWeight="700" fontFamily="Outfit">{truncate(node.label, 14)}</text> :
            <><text x={node.x} y={node.y - 1} textAnchor="middle" dominantBaseline="central" fill="white" fontSize={node.r >= 26 ? "9" : node.r > 12 ? "7" : "6"} fontWeight="500">
              {node.type === 'person' ? (node.subtype === 'PJ' ? '🏢' : '👤') : node.type === 'debt' ? '📄' : node.type === 'execution' ? (node.isHub ? (node.data?.processTag === 'idpj' ? '🛡' : '⚡') : '⚖') : node.type === 'measure' ? '🛡️' : '💎'}
            </text>
            {node.isHub ? <>
              {(node.label||'').split('\n').map((line, li) => <text key={li} x={node.x} y={node.y + node.r + 10 + li * 10} textAnchor="middle" fill={li===0?'rgba(255,255,255,0.8)':'rgba(255,255,255,0.6)'} fontSize={li===0?"7":"5.5"} fontWeight={li===0?"700":"500"} fontFamily={li===0?"Public Sans":"JetBrains Mono"}>{line}</text>)}
              {node.totalLinkedValue > 0 && <text x={node.x} y={node.y + node.r + 10 + (node.label||'').split('\n').length * 10} textAnchor="middle" fill="rgba(245,158,11,0.85)" fontSize="6" fontWeight="700" fontFamily="JetBrains Mono">{fmtCur(node.totalLinkedValue)}</text>}
            </> :
            <text x={node.x} y={node.y + node.r + (node.isApenso ? 6 : 9)} textAnchor="middle" fill={`rgba(255,255,255,${node.isApenso ? '0.35' : '0.6'})`} fontSize={node.isApenso ? "4.5" : "5.5"} fontFamily="JetBrains Mono">{node.label}</text>}</>}
        </g>);
      })}
    </svg>
    <div className="graph-legend">
      {[['PJ Originária','#3b82f6'],['IDPJ','#f43f5e'],['Cautelar','#f59e0b'],['EF vinculada','rgba(148,163,184,0.8)'],['EF c/ prescrição','rgba(244,63,94,0.7)'],['EF c/ garantia','rgba(34,197,94,0.6)'],['EF c/ intimação','rgba(59,130,246,0.6)']].map(([l,c]) =>
        <div key={l} className="legend-item"><div className="legend-dot" style={{background:c}}></div><span>{l}</span></div>)}
      <div className="legend-item" style={{marginTop:4,paddingTop:4,borderTop:'1px dashed rgba(255,255,255,0.06)',fontSize:9,color:'var(--text-muted)'}}>
        Extintas omitidas. EFs sem alerta colapsadas em bloco resumo.
      </div>
    </div>
    <div className="graph-controls">
      <button onClick={() => setVb(v=>({...v,x:v.x+v.w*0.1,y:v.y+v.h*0.1,w:v.w*0.8,h:v.h*0.8}))}>+</button>
      <button onClick={() => setVb(v=>({...v,x:v.x-v.w*0.125,y:v.y-v.h*0.125,w:v.w*1.25,h:v.h*1.25}))}>−</button>
      <button onClick={resetView}>⊙</button>
    </div>
    {tooltip && <div className="tooltip" style={{left:tooltip.x,top:tooltip.y}}>
      <div style={{fontWeight:600,marginBottom:2}}>{tooltip.node.label}</div>
      <div style={{fontSize:10,color:'var(--text-muted)'}}>
        {tooltip.node.type === 'debt' && `CDA · ${tooltip.node.data?.status?.toUpperCase()} · ${fmtCur(tooltip.node.data?.value)}`}
        {tooltip.node.type === 'execution' && `${tooltip.node.data?.className || 'Execução'} · ${EXEC_STATUSES[tooltip.node.data?.status]?.label || tooltip.node.data?.status || ''} · ${tooltip.node.data?.court || ''}${tooltip.node.alertType === 'presc' ? ' · ⏱ Prescrição próxima' : tooltip.node.alertType === 'gar' ? ' · ✓ Garantida' : tooltip.node.alertType === 'intim' ? ' · 📬 Intimação aberta' : ''}`}
        {tooltip.node.type === 'person' && `${tooltip.node.subtype} · ${tooltip.node.data?.cpfCnpj || ''}`}
        {tooltip.node.type === 'summary' && `${tooltip.node.data?.count || ''} execuções fiscais sem alerta ativo (sem prescrição iminente, sem garantia, sem intimação aberta). Consultar na aba Processos.`}
        {tooltip.node.type === 'measure' && `${MEASURE_SUBTYPES[tooltip.node.data?.subtype] || ''} · ${tooltip.node.data?.status}`}
        {tooltip.node.type === 'asset' && `${ASSET_SUBTYPES[tooltip.node.data?.subtype] || ''} · ${fmtCur(tooltip.node.data?.value)}`}
        {tooltip.node.type === 'execution' && <div style={{marginTop:3,fontSize:9,color:'var(--accent)'}}>Clique para editar</div>}
      </div>
    </div>}
  </div>);
}

// ═══════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════
// ═══════════════════════════════════════════════
// ERROR BOUNDARY — catches errors in any descendant React component
// and shows a visible error card instead of a black screen.
// ═══════════════════════════════════════════════
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null, errorInfo: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary]', error, errorInfo);
  }
  reset = () => { this.setState({ error: null, errorInfo: null }); };
  render() {
    if (this.state.error) {
      const err = this.state.error;
      return (
        <div style={{padding:24,margin:24,background:'rgba(244,63,94,0.08)',border:'2px solid #f43f5e',borderRadius:8,color:'#e8ecf2',maxHeight:'90vh',overflow:'auto'}}>
          <h3 style={{color:'#f43f5e',marginTop:0}}>⚠ Erro de renderização</h3>
          <div style={{fontFamily:'monospace',fontSize:11,background:'#0d1117',padding:12,borderRadius:4,whiteSpace:'pre-wrap',wordBreak:'break-word'}}>
            <div style={{color:'#f43f5e',fontWeight:700,marginBottom:8,fontSize:13}}>{err.name}: {err.message}</div>
            <div style={{color:'rgba(255,255,255,0.55)',fontSize:10,marginBottom:8}}>{err.stack}</div>
            {this.state.errorInfo && this.state.errorInfo.componentStack && (
              <div style={{color:'rgba(255,255,255,0.4)',fontSize:10,marginTop:8,paddingTop:8,borderTop:'1px dashed rgba(255,255,255,0.15)'}}>
                <strong>Component stack:</strong>{this.state.errorInfo.componentStack}
              </div>
            )}
          </div>
          <div style={{marginTop:12,display:'flex',gap:8}}>
            <button onClick={this.reset} style={{padding:'8px 16px',background:'#a78bfa',color:'#0d1117',border:'none',borderRadius:4,fontWeight:700,cursor:'pointer'}}>Tentar novamente</button>
            <button onClick={() => window.location.reload()} style={{padding:'8px 16px',background:'transparent',color:'#e8ecf2',border:'1px solid rgba(255,255,255,0.2)',borderRadius:4,cursor:'pointer'}}>Recarregar página</button>
          </div>
          <div style={{marginTop:12,fontSize:11,color:'rgba(255,255,255,0.5)'}}>Reporte esse erro para correção. Seus dados não foram perdidos — apenas esta tela precisou ser reiniciada.</div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── PERF (item 3): componentes movidos para FORA do App ───
// Definidos dentro do App, eram recriados a cada render — o React os via como
// componentes novos e desmontava/remontava toda a subárvore a cada tecla digitada.
// No escopo do módulo a identidade é estável; React.memo evita re-renders extras.

const ExecutadoLine = React.memo(function ExecutadoLine({ processNumber, getDebtors, onEditPerson }) {
  const debtors = getDebtors(processNumber);
  if (debtors.length === 0) return null;
  return <div style={{fontSize:10,marginTop:2,color:'var(--text-muted)'}}>
    Executado{debtors.length > 1 ? 's' : ''}: {debtors.map((d, i) => <React.Fragment key={i}>
      {i > 0 && <span> · </span>}
      <span style={{color:'var(--text-secondary)',fontWeight:500,cursor:d.id?'pointer':'default'}} onClick={ev => { if (d.id) { ev.stopPropagation(); onEditPerson(d.id); }}}>{truncate(d.name, 30)}</span>
    </React.Fragment>)}
  </div>;
});

const CDAList = React.memo(function CDAList({ cdas, processNumber, onShowAll }) {
  if (cdas.length === 0) return <span style={{fontSize:10,color:'var(--text-muted)'}}>0 CDAs</span>;
  const shown = cdas.slice(0, 3);
  const hasMore = cdas.length > 3;
  return (<span style={{fontSize:10}}>
    {shown.map((d,i) => <span key={d.id} style={{color:'var(--text-secondary)'}}>{i>0?' · ':''}{d.cdaNumber||'CDA'}</span>)}
    {hasMore && <span className="cda-list-toggle" onClick={e => { e.stopPropagation(); onShowAll({ cdas, processNumber }); }}> +{cdas.length-3} ver todas</span>}
    <span style={{color:'var(--text-muted)',marginLeft:6}}>({fmtCur(cdas.reduce((s,d)=>s+(d.value||0),0))})</span>
  </span>);
});

const PersonProfileCard = React.memo(function PersonProfileCard({ s, data, allLinks, people, collapsedGroups, toggleGroup, setModal }) {
  const p = s.person;
  const isExpanded = !collapsedGroups.has('person-'+p.id);
  const isRelacionada = p.operationRole === 'relacionada';
  const notes = p.notesList || (p.notes ? [p.notes] : []);
  return (<div className="entity-card" style={{marginBottom:8,opacity:isRelacionada?0.85:1,borderLeft:`3px solid ${isRelacionada?'var(--text-muted)':'var(--pgfn)'}`}}>
    {/* Header */}
    <div style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}} onClick={() => toggleGroup('person-'+p.id)}>
      <span style={{fontSize:14,color:'var(--accent)'}}>{isExpanded?'▼':'▶'}</span>
      <span className={`badge ${p.subtype==='PJ'?'badge-blue':'badge-muted'}`} style={{fontSize:9}}>{p.subtype}</span>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontWeight:700,fontSize:13}}>{p.name}</div>
        <div style={{fontSize:10,color:'var(--text-muted)'}}><Copyable value={p.cpfCnpj}>{p.cpfCnpj}</Copyable>{p.role?` · ${p.role}`:''}</div>
      </div>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        {s.totalCdas > 0 && <span className="has-tip" style={{fontSize:10,color:'var(--text-muted)'}}>{s.totalCdas} CDA(s)<span className="tip-content">{s.cdasOriginario.length} como originária + {s.totalCdas - s.cdasOriginario.length} como corresponsável</span></span>}
        {s.valTotal > 0 && <span className="has-tip" style={{fontSize:12,fontWeight:700,color:'var(--gold)'}}>{fmtCur(s.valTotal)}<span className="tip-content">Exposição total: {fmtCur(s.valOriginario)} (originário) + {fmtCur(s.valCorresp)} (corresponsabilidade)</span></span>}
        {s.prescRisk > 0 && <span className="badge badge-red has-tip" style={{fontSize:9}}>⏱ {s.prescRisk}<span className="tip-content">CDAs originárias com risco prescricional iminente (≤6 meses), sem tratamento.</span></span>}
        <button className="btn-secondary btn-xs has-tip" onClick={ev => { ev.stopPropagation(); const btn = ev.currentTarget; copyText(buildPersonQualification(p, data)); const orig = btn.firstChild.textContent; btn.firstChild.textContent = '✓'; setTimeout(() => { try { btn.firstChild.textContent = orig; } catch(x){} }, 1500); }}><span>📋</span><span className="tip-content">Copiar qualificação formatada (nome, CPF/CNPJ, CDAs, processos) — pronta para colar em petição.</span></button>
        <button className="btn-secondary btn-xs" onClick={ev => { ev.stopPropagation(); setModal({type:'edit',entityType:'person',initial:p}); }}>Editar</button>
      </div>
    </div>

    {/* Expanded body */}
    {isExpanded && <div style={{marginTop:10,paddingTop:10,borderTop:'1px solid var(--border)'}}>
      {/* Como originária */}
      {s.cdasOriginario.length > 0 && <div style={{marginBottom:10}}>
        <div style={{fontSize:10,color:'var(--green)',textTransform:'uppercase',letterSpacing:0.5,fontWeight:600,marginBottom:4}}>🟢 Como Devedora Originária ({s.cdasOriginario.length} CDA(s) · {fmtCur(s.valOriginario)})</div>
        <div style={{display:'flex',flexDirection:'column',gap:3,paddingLeft:8,borderLeft:'2px solid rgba(64,168,112,0.3)'}}>
          {s.cdasOriginario.map(d => {
            const cdaSt = DEBT_STATUSES[d.status] || {};
            return (<div key={d.id} onClick={ev => { ev.stopPropagation(); setModal({type:'edit',entityType:'debt',initial:d}); }} style={{display:'flex',gap:8,padding:'3px 6px',fontSize:11,cursor:'pointer',borderRadius:3}} className="hover-bg">
              <Copyable value={d.cdaNumber}>{d.cdaNumber || 'CDA'}</Copyable>
              <span style={{flex:1,color:'var(--text-muted)'}}>{d.tribute||''}</span>
              <span className={`badge ${cdaSt.badge||''}`} style={{fontSize:8}}>{cdaSt.label||d.status}</span>
              <span style={{fontWeight:600}}>{fmtCur(d.value)}</span>
            </div>);
          })}
        </div>
      </div>}

      {/* Como corresponsável (agrupado por role) */}
      {Object.keys(s.cdasCorrespByRole).length > 0 && <div style={{marginBottom:10}}>
        {Object.entries(s.cdasCorrespByRole).map(([role, list]) => {
          const ri = RESPONSIBILITY_ROLES[role] || {};
          const subTotal = list.reduce((sum, item) => sum + (item.debt.value||0), 0);
          return (<div key={role} style={{marginBottom:6}}>
            <div style={{fontSize:10,color:ri.color,textTransform:'uppercase',letterSpacing:0.5,fontWeight:600,marginBottom:4}}>{ri.icon} {ri.label} ({list.length} CDA(s) · {fmtCur(subTotal)})</div>
            <div style={{display:'flex',flexDirection:'column',gap:3,paddingLeft:8,borderLeft:`2px solid ${ri.color}40`}}>
              {list.map(({debt: d, link: l}) => {
                const origLink = allLinks.find(x => x.cdaId === d.id && x.role === 'originario');
                const orig = origLink ? people.find(pp => pp.id === origLink.personId) : null;
                const cdaSt = DEBT_STATUSES[d.status] || {};
                return (<div key={l.id} onClick={ev => { ev.stopPropagation(); setModal({type:'edit',entityType:'debt',initial:d}); }} style={{display:'flex',gap:8,padding:'3px 6px',fontSize:11,cursor:'pointer',borderRadius:3}} className="hover-bg">
                  <Copyable value={d.cdaNumber}>{d.cdaNumber || 'CDA'}</Copyable>
                  <span style={{flex:1,color:'var(--text-muted)',fontSize:10}}>orig: {orig?.name || '?'}{l.basis?` · ${l.basis}`:''}</span>
                  <span className={`badge ${cdaSt.badge||''}`} style={{fontSize:8}}>{cdaSt.label||d.status}</span>
                  <span style={{fontWeight:600}}>{fmtCur(d.value)}</span>
                </div>);
              })}
            </div>
          </div>);
        })}
      </div>}

      {/* Patrimônio */}
      {s.myAssets.length > 0 && <div style={{marginBottom:10}}>
        <div style={{fontSize:10,color:'var(--blue)',textTransform:'uppercase',letterSpacing:0.5,fontWeight:600,marginBottom:4}}>💎 Patrimônio Identificado ({s.myAssets.length} bem(ns) · {fmtCur(s.valAssets)})</div>
        <div style={{display:'flex',flexDirection:'column',gap:3,paddingLeft:8,borderLeft:'2px solid rgba(91,143,217,0.3)'}}>
          {s.myAssets.slice(0,5).map(a => (
            <div key={a.id} style={{display:'flex',gap:8,padding:'3px 6px',fontSize:11}}>
              <span style={{flex:1}}>{truncate(a.description||a.type, 50)}</span>
              <span style={{fontWeight:600}}>{fmtCur(a.value)}</span>
            </div>
          ))}
          {s.myAssets.length > 5 && <div style={{fontSize:10,color:'var(--text-muted)',fontStyle:'italic',padding:'3px 6px'}}>+ {s.myAssets.length - 5} bem(ns)</div>}
        </div>
      </div>}

      {/* Notas */}
      {notes.length > 0 && <div style={{fontSize:10,color:'var(--text-muted)',padding:6,background:'var(--bg-elevated)',borderRadius:4}}>
        {notes.map((n,i) => <div key={i}>• {n}</div>)}
      </div>}

      {s.totalCdas === 0 && s.myAssets.length === 0 && <div style={{fontSize:11,color:'var(--text-muted)',fontStyle:'italic',textAlign:'center',padding:8}}>Sem CDAs ou bens vinculados a esta pessoa nesta operação.</div>}
    </div>}
  </div>);
});

function App() {
  const [data, setData] = useState(loadData);
  const [activeOpId, setActiveOpId] = useState(null);
  const [search, setSearch] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => { try { return localStorage.getItem('nexus_sidebar_collapsed') === '1'; } catch { return false; } });
  const [showSettings, setShowSettings] = useState(false);
  const [showDiagnostico, setShowDiagnostico] = useState(false);
  const [expandedActions, setExpandedActions] = useState(new Set()); // intimações com a descrição da atuação aberta
  const toggleAction = (id) => setExpandedActions(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const [modelSel, setModelSel] = useState(null);        // {cat} | {cat, sub} — nó selecionado na árvore
  const [modelQuery, setModelQuery] = useState('');      // busca livre (texto da peça colado)
  const [modelMatters, setModelMatters] = useState([]);  // matérias inferidas do texto colado
  // Temas válidos clássicos: '' (Noite Azulada), theme-ferro.
  // Obsidian removido (substitído pelo Mar Profundo na Demo Experimental).
  const THEMES_OK = ['', 'theme-ferro'];
  // Temas da Demo: Mar Profundo é o padrão experimental; Clara/Ardósia/Grafite opcionais.
  const DEMO_THEMES_OK = ['mar', 'clara', 'ardosia', 'grafite'];
  const [appSettings, setAppSettings] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem('nexus_settings') || '{}');
      let th = s.theme || '';
      if (th === 'theme-obsidian') th = ''; // Obsidian aposentado → Noite Azulada
      const dth = DEMO_THEMES_OK.includes(s.demoTheme) ? s.demoTheme : 'mar';
      // Bootstrap Demo: window.__NEXUS_DEMO__ (Nexus.demo.html) ou ?edition=demo
      let edition = s.uiEdition === 'demo' ? 'demo' : 'classic';
      try {
        if (typeof window !== 'undefined') {
          if (window.__NEXUS_DEMO__ === true) edition = 'demo';
          else if (/[?&]edition=demo\b/.test(window.location.search || '')) edition = 'demo';
        }
      } catch {}
      return { zoom: s.zoom || 100, font: s.font || '', theme: THEMES_OK.includes(th) ? th : '', demoTheme: dth, uiEdition: edition };
    } catch { return { zoom: 100, font: '', theme: '', demoTheme: 'mar', uiEdition: (typeof window !== 'undefined' && window.__NEXUS_DEMO__) ? 'demo' : 'classic' }; }
  });
  const updateSetting = (key, val) => { setAppSettings(prev => { const next = { ...prev, [key]: val }; try { localStorage.setItem('nexus_settings', JSON.stringify(next)); } catch {} return next; }); };
  const isDemo = appSettings.uiEdition === 'demo';
  const demoThemeId = (appSettings.demoTheme && DEMO_THEMES_OK.includes(appSettings.demoTheme)) ? appSettings.demoTheme : 'mar';
  // Clara = tokens base de .edition-demo; demais = .demo-theme-*
  const demoThemeClass = isDemo && demoThemeId !== 'clara' ? `demo-theme-${demoThemeId}` : '';
  const [activeTab, setActiveTab] = useState('notas');
  const [demoZone, setDemoZone] = useState('briefing'); // briefing | acervo | risco | ferramentas
  const [demoTrabalhoOpen, setDemoTrabalhoOpen] = useState(false);
  const [carteiraTreeOpen, setCarteiraTreeOpen] = useState(true); // árvore de ops sob Carteira
  const [agendaWeekStart, setAgendaWeekStart] = useState(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // monday
    return d;
  });
  const [modal, setModal] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [viewMode, setViewMode] = useState(() => {
    try {
      if (typeof window !== 'undefined' && (window.__NEXUS_DEMO__ || /[?&]edition=demo\b/.test(window.location.search || ''))) return 'hoje';
    } catch {}
    return 'painel';
  }); // 'hoje' | 'painel' | 'operation' | ...
  const [importResult, setImportResult] = useState(null);
  const [expandedExec, setExpandedExec] = useState(null);
  const [selectedCDAs, setSelectedCDAs] = useState(new Set());
  const [globalSearch, setGlobalSearch] = useState(false);
  const [gsQuery, setGsQuery] = useState('');
  const [intimFilter, setIntimFilter] = useState('all');
  const [intimSort, setIntimSort] = useState('attention');
  const [respondModal, setRespondModal] = useState(null); // { intim, type }
  const [intimWork, setIntimWork] = useState(false); // overlay p/ trabalhar intimações dentro da operação
  const [intimView, setIntimView] = useState('list');
  const [cloudUrl, setCloudUrl] = useState(() => localStorage.getItem('nexus_cloud_url') || '');
  const [cloudStatus, setCloudStatus] = useState('disconnected'); // disconnected|connected|syncing|error
  // ─── UNDO: snapshot do estado antes de operações destrutivas ───
  const undoRef = useRef(null);                 // { snapshot, label }
  const undoTimerRef = useRef(null);
  const [undoToast, setUndoToast] = useState(null); // string label | null
  const [showChangeLog, setShowChangeLog] = useState(false); // modal de histórico de alterações
  const pushUndo = (label) => {
    undoRef.current = { snapshot: data, label };
    setUndoToast(label);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => { setUndoToast(null); undoRef.current = null; }, 12000);
  };
  const doUndo = () => {
    if (!undoRef.current) return;
    setData(undoRef.current.snapshot);
    undoRef.current = null;
    setUndoToast(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  };
  const [cloudLastSync, setCloudLastSync] = useState(() => localStorage.getItem('nexus_cloud_lastsync') || '');
  const [cloudMsg, setCloudMsg] = useState('');
  const [showCloudConfig, setShowCloudConfig] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => localStorage.getItem('nexus_autosync_enabled') !== 'false'); // on by default
  // Refs used by the auto-sync engine (not triggering re-renders)
  const dirtyRef = useRef(false);         // true when local data changed since last push
  const lastEditRef = useRef(0);          // timestamp of last edit — used for debounce
  const lastPushMtimeRef = useRef(null);  // mtime returned by last successful push (server clock)
  const cloudPushRef = useRef(null);      // populated after cloudPush is declared; breaks circular dep
  const fileInputRef = useRef(null);
  const xlsInputRef = useRef(null);
  const eprocInputRef = useRef(null);
  const pgfnPdfInputRef = useRef(null);

  const hydratedRef = useRef(false);
  // ─── PERFORMANCE: save do localStorage com debounce (800ms) ───
  // Antes, cada setData disparava JSON.stringify do banco inteiro + escrita síncrona
  // no localStorage A CADA tecla — causa do congelamento ao digitar.
  const saveTimerRef = useRef(null);
  const latestDataRef = useRef(null);
  const flushLocalSave = () => {
    if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); saveTimerRef.current = null; }
    if (latestDataRef.current) saveData(latestDataRef.current);
  };
  useEffect(() => {
    latestDataRef.current = data;
    if (!hydratedRef.current) {
      saveData(data);            // primeira hidratação (ou pós-pull da nuvem): save imediato, não marca dirty
      hydratedRef.current = true;
      return;
    }
    dirtyRef.current = true; lastEditRef.current = Date.now();
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => { saveTimerRef.current = null; saveData(latestDataRef.current); }, 800);
  }, [data]);
  // Flush do save pendente ao fechar/ocultar a aba — nada se perde
  useEffect(() => {
    const onHide = () => { if (saveTimerRef.current) flushLocalSave(); };
    const onVis = () => { if (document.visibilityState === 'hidden' && saveTimerRef.current) flushLocalSave(); };
    window.addEventListener('beforeunload', onHide);
    document.addEventListener('visibilitychange', onVis);
    return () => { window.removeEventListener('beforeunload', onHide); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  // Global search shortcut (Ctrl+K)
  useEffect(() => {
    const handler = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setGlobalSearch(true); setGsQuery(''); } if (e.key === 'Escape') { setGlobalSearch(false); setDemoTrabalhoOpen(false); } };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Demo: manter zona alinhada à aba ativa (deep-links do Painel/Busca/etc.)
  useEffect(() => {
    if (appSettings.uiEdition !== 'demo') return;
    const zoneOf = (tab) => {
      if (['pessoas','dividas','execucoes','bens'].includes(tab)) return 'acervo';
      if (['prescricao_v2','timeline','prescricao'].includes(tab)) return 'risco';
      if (['tarefas','importar','docs','grafo','insights'].includes(tab)) return 'ferramentas';
      return 'briefing';
    };
    setDemoZone(zoneOf(activeTab));
  }, [activeTab, appSettings.uiEdition]);

  // Eproc import handler
  // ─── SIDA / DEBCAD PDF IMPORT (complement only — never overwrites) ───
  const handlePGFNPDFImport = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !activeOpId) { if (!activeOpId) alert('Selecione uma operação primeiro.'); return; }
    const logs = [];
    let cdaUpdated = 0, cdaNotFound = 0, eventsCreated = 0, personsCreated = 0, respCreated = 0;

    for (const file of files) {
      try {
        const fname = file.name.toLowerCase();
        const isSIDA = fname.includes('sida');
        const isDebcad = fname.includes('debcad');
        if (!isSIDA && !isDebcad) {
          logs.push(`⚠️ ${file.name}: nome não identificado (esperado 'sida' ou 'debcad' no nome)`);
          continue;
        }

        const records = isSIDA ? await parseSIDAPDF(file) : await parseDebcadPDF(file);
        if (!isSIDA) {
          for (const rec of records) {
            const histCount = (rec.history || []).filter(h => h.code !== '999').length;
            const updCount = (rec.updates || []).length;
            const parcCount = (rec.parcelamentos || []).length;
            logs.push(`📄 Debcad ${rec.cdaNumber}: ${histCount} fase(s) no Histórico, ${updCount} atualização(ões), ${parcCount} parcelamento(s) detectado(s)`);
          }
        } else {
          logs.push(`📄 ${file.name}: ${records.length} inscrição(ões) SIDA extraída(s)${records.reduce((s,r)=>s+(r.protestos||[]).length,0) > 0 ? ` · ${records.reduce((s,r)=>s+(r.protestos||[]).length,0)} protesto(s) estruturado(s)` : ''}`);
        }

        for (const rec of records) {
          if (!rec.cdaNumber) continue;

          // Match by CDA number (normalized) within the active operation
          const recNorm = normCDA(rec.cdaNumber);
          const existing = data.debts.find(d => d.operationId === activeOpId && normCDA(d.cdaNumber) === recNorm);

          if (!existing) {
            cdaNotFound++;
            logs.push(`⚠️ CDA ${rec.cdaNumber} não encontrada (importe primeiro a planilha XLS)`);
            continue;
          }

          // SMART MERGE — accumulate all field changes, single upsert at the end
          const merged = { ...existing };
          let touched = false;
          if (rec.inscriptionDate && !existing.inscriptionDate) { merged.inscriptionDate = rec.inscriptionDate; touched = true; }
          if (rec.processNumber && !existing.processNumber) { merged.processNumber = rec.processNumber; touched = true; }
          if (rec.tribute && !existing.tribute) { merged.tribute = rec.tribute; touched = true; }
          if (rec.natureza && !existing.tribute && !merged.tribute) { merged.tribute = rec.natureza; touched = true; }
          if (rec.receita && !existing.system) { merged.system = rec.receita; touched = true; }
          if (rec.periodo && !existing.periodo) { merged.periodo = rec.periodo; touched = true; }
          if (rec.valueTotal && !existing.value) { merged.value = rec.valueTotal; touched = true; }
          if (rec.valueInscrito && !existing.valueInscrito) { merged.valueInscrito = rec.valueInscrito; touched = true; }
// ─── Situação → status canônico (SIDA e Debcad) ───
          // O campo "Situação:" do PDF reflete o estado ATUAL da inscrição (ex.:
          // "ATIVA AJUIZADA NEGOCIADA NO SISPAR"). Diferente dos demais campos
          // (complement-only), status e rawStatus SÃO atualizados quando divergem —
          // mesmo comportamento do import XLS. A mudança fica registrada no changeLog.
          if (rec.situation) {
            if (rec.situation !== existing.rawStatus) { merged.rawStatus = rec.situation; touched = true; }
            const mappedStatus = mapPDFSituationToStatus(rec.situation);
            if (mappedStatus && mappedStatus !== existing.status) {
              merged.status = mappedStatus;
              touched = true;
              logs.push(`  🔁 Status CDA ${rec.cdaNumber}: ${(DEBT_STATUSES[existing.status]||{}).label||existing.status||'—'} → ${(DEBT_STATUSES[mappedStatus]||{}).label||mappedStatus} ("${truncate(rec.situation, 60)}")`);
            }
          }
          // ─── DEBCAD: enrich CDA notesList with history summary ───
          if (!isSIDA && rec.history && rec.history.length > 0) {
            const existingNotes = merged.notesList || [];
            const alreadyHasDebcad = existingNotes.some(n => n.includes('[Debcad]'));
            if (!alreadyHasDebcad) {
              const keyPhases = rec.history
                .filter(h => h.code !== '999' && h.date)
                .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
                .map(h => `${fmtDate(h.date)} — Fase ${h.code}: ${truncate(h.desc, 50)}${h.obs ? ' (' + truncate(h.obs, 40) + ')' : ''}`)
                .slice(0, 10);
              if (keyPhases.length > 0) {
                const totalPhases = rec.history.filter(h => h.code !== '999').length;
                const note = `[Debcad] Histórico (${totalPhases} fases): ${keyPhases.join(' → ')}${totalPhases > 10 ? ` (+${totalPhases - 10})` : ''}`;
                merged.notesList = [...existingNotes, note];
                touched = true;
              }
            }
          }

          if (touched) {
            merged.updatedAt = new Date().toISOString();
            upsert('debts', merged);
            cdaUpdated++;
          }

          // Also merge protocol date and juízo onto the linked execution
          if (rec.processNumber && rec.protocolDate) {
            const linkedExec = data.executions.find(ex => ex.operationId === activeOpId && sameProc(ex.processNumber, rec.processNumber));
            if (linkedExec) {
              const mergedExec = { ...linkedExec };
              let execTouched = false;
              if (!linkedExec.protocolDate) { mergedExec.protocolDate = rec.protocolDate; execTouched = true; }
              if (rec.juizo && !linkedExec.court) { mergedExec.court = rec.juizo; execTouched = true; }
              if (execTouched) upsert('executions', mergedExec);
            }
          }

          // Generate prescription events from parcelamentos
          if (rec.parcelamentos && rec.parcelamentos.length > 0) {
            const existingEvents = (data.prescriptionEvents || []).filter(pe => pe.cdaId === existing.id || (pe.batchCdaIds && pe.batchCdaIds.includes(existing.id)));
            for (const parc of rec.parcelamentos) {
              // Need at least adesao or encerramento date
              if (!parc.adesao && !parc.encerramento) continue;

              // Case 1: Normal parcelamento with adesão (and possibly rescisão)
              if (parc.adesao) {
                const dup = existingEvents.find(pe => pe.type === 'susp_parcelamento' && pe.date === parc.adesao);
                if (dup) {
                  // If existing event has no endDate but we now have rescisão, update it
                  if (parc.encerramento && !dup.endDate) {
                    upsert('prescriptionEvents', { ...dup, endDate: parc.encerramento, notes: (dup.notes || '') + ` · RESCISÃO em ${fmtDate(parc.encerramento)} (${parc.situacao})`, updatedAt: new Date().toISOString() });
                    logs.push(`  📅 Atualizado parc. CDA ${rec.cdaNumber}: rescisão ${fmtDate(parc.encerramento)} adicionada ao evento existente`);
                  }
                  continue;
                }
                const rescInfo = parc.encerramento ? `RESCISÃO em ${fmtDate(parc.encerramento)} (${parc.situacao})` : 'Em vigor — exigibilidade suspensa';
                const newEvent = {
                  id: uid(),
                  cdaId: existing.id,
                  type: 'susp_parcelamento',
                  date: parc.adesao,
                  endDate: parc.encerramento || '',
                  legalBasis: 'Art. 174, p.ú., IV CTN + Art. 151, VI CTN (extraído do ' + (isSIDA ? 'SIDA' : 'Debcad') + ')',
                  processRef: parc.tipo || '',
                  notes: `${parc.modalidade || 'Parcelamento'}${parc.deferimento ? ` · Deferido: ${fmtDate(parc.deferimento)}` : ''} · ${rescInfo}${parc.obs ? ' · ' + parc.obs : ''}`,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                };
                upsert('prescriptionEvents', newEvent);
                eventsCreated++;
                logs.push(`  📅 Parc. CDA ${rec.cdaNumber}: adesão ${fmtDate(parc.adesao)}${parc.encerramento ? ' → rescisão ' + fmtDate(parc.encerramento) + ' (' + parc.situacao + ')' : ' (em vigor)'}`);
              }
              // Case 2: Rescisão-only (found rescisão in SIDA without matching adesão)
              // Try to update an existing open parcelamento event for this CDA, or create one
              else if (parc.encerramento) {
                const openParc = existingEvents.find(pe => pe.type === 'susp_parcelamento' && !pe.endDate);
                if (openParc) {
                  upsert('prescriptionEvents', { ...openParc, endDate: parc.encerramento, notes: (openParc.notes || '') + ` · RESCISÃO em ${fmtDate(parc.encerramento)} (${parc.situacao}) — ${parc.obs || parc.modalidade}`, updatedAt: new Date().toISOString() });
                  eventsCreated++;
                  logs.push(`  📅 Rescisão CDA ${rec.cdaNumber}: ${fmtDate(parc.encerramento)} (${parc.situacao}) — vinculada a parcelamento aberto existente`);
                } else {
                  // No open parcelamento found — create a standalone rescisão event
                  const newEvent = {
                    id: uid(),
                    cdaId: existing.id,
                    type: 'susp_parcelamento',
                    date: parc.encerramento, // Use rescisão date as event date (best we have)
                    endDate: parc.encerramento,
                    legalBasis: 'Art. 174, p.ú., IV CTN — Rescisão de parcelamento (extraído do SIDA)',
                    processRef: parc.tipo || 'Rescisão SIDA',
                    notes: `${parc.modalidade || 'Rescisão de parcelamento'} · Fim da suspensão de exigibilidade · ${parc.obs || ''}. Nota: data de adesão não localizada — prazo prescricional reinicia desta data.`,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  };
                  upsert('prescriptionEvents', newEvent);
                  eventsCreated++;
                  logs.push(`  📅 Rescisão CDA ${rec.cdaNumber}: ${fmtDate(parc.encerramento)} (${parc.situacao}) — adesão não localizada, prazo reinicia desta data`);
                }
              }
            }

            // ─── Generate SEPARATE rescisão events for timeline visibility ───
            // Each parcelamento with encerramento date gets a distinct int_rescisao_parcelamento event
            for (const parc of rec.parcelamentos) {
              if (!parc.encerramento) continue;
              const dupResc = existingEvents.find(pe => pe.type === 'int_rescisao_parcelamento' && pe.date === parc.encerramento);
              if (dupResc) continue;
              const rescEvent = {
                id: uid(),
                cdaId: existing.id,
                type: 'int_rescisao_parcelamento',
                date: parc.encerramento,
                legalBasis: 'Rescisão de parcelamento — exigibilidade restabelecida. Prazo prescricional reinicia (art. 174, p.ú., IV CTN)',
                processRef: parc.tipo || '',
                notes: `${parc.situacao || 'Rescindido'} · ${parc.modalidade || 'Parcelamento'}${parc.adesao ? ' · Adesão: ' + fmtDate(parc.adesao) : ''}${parc.obs ? ' · ' + truncate(parc.obs, 60) : ''}`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
              upsert('prescriptionEvents', rescEvent);
              eventsCreated++;
              logs.push(`  🔴 Rescisão parc. CDA ${rec.cdaNumber}: ${fmtDate(parc.encerramento)} — evento separado (prazo reinicia)`);
            }
          }

          // Generate event from Debcad ajuizamento (phase 535 = AJUIZAMENTO/DISTRIBUIÇÃO)
          if (rec.history && rec.history.length > 0) {
            const ajuiz = rec.history.find(h => h.code === '535');
            if (ajuiz) {
              const existingEvents = (data.prescriptionEvents || []).filter(pe => pe.cdaId === existing.id);
              const dup = existingEvents.find(pe => pe.type === 'int_despacho_citacao' && pe.date === ajuiz.date);
              if (!dup) {
                upsert('prescriptionEvents', {
                  id: uid(),
                  cdaId: existing.id,
                  type: 'int_despacho_citacao',
                  date: ajuiz.date,
                  legalBasis: 'Art. 174, p.ú., I CTN — LC 118/2005 (extraído de Debcad fase 535)',
                  notes: `Ajuizamento eletrônico — fase ${ajuiz.code}: ${ajuiz.desc}`,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                });
                eventsCreated++;
              }
            }
          }

          // ─── PROTESTO EXTRAJUDICIAL (LC 208/2024) ───
          // Uses STRUCTURED PROTESTOS section (primary) + occurrence/history text (fallback).
          const isProtestoLine = (desc) => {
            const d = (desc || '').toUpperCase();
            if (/REMESSA|ENVIO|ENCAMINH|EXPEDIC/i.test(d)) return false;
            if (/CANCELA|DESISTENCIA|BAIXA\s*DE\s*PROTESTO|SUSTACAO/i.test(d)) return false;
            if (/PROTESTO\s+(LAVRADO|REGISTRADO|EFETIVADO|EFETUADO|CONCLU)/i.test(d)) return true;
            if (/PROTESTADO|INSCRICAO\s+PROTESTADA|TITULO\s+PROTESTADO/i.test(d)) return true;
            if (/^PROTESTO$/i.test(d.trim())) return true;
            return false;
          };
          const protestoSources = [];
          // PRIMARY: Structured PROTESTOS section from SIDA
          if (rec.protestos && rec.protestos.length > 0) {
            for (const prot of rec.protestos) {
              const sit = (prot.situacao || '').toUpperCase();
              if (/CANCELAMENTO|CANCELADO|SUSTADO|ENCERRADO/.test(sit) && !/LAVRADO|REGISTRADO/.test(sit)) continue;
              let effectiveDate = '';
              if (prot.eventos && prot.eventos.length > 0) {
                const lavrado = prot.eventos.find(ev => /lavrado|registrado|efetivado/i.test(ev.descricao || ''));
                if (lavrado) effectiveDate = lavrado.dataEfetivacao || lavrado.dataCriacao || '';
              }
              if (!effectiveDate) effectiveDate = prot.dataProtocolo || '';
              if (effectiveDate) {
                protestoSources.push({
                  date: effectiveDate,
                  desc: `Protesto ${prot.situacao || 'lavrado'} — ${prot.tabelionato || 'tabelionato N/I'}${prot.valor ? ' — R$ ' + parseFloat(prot.valor).toLocaleString('pt-BR', {minimumFractionDigits:2}) : ''}`,
                  origin: 'SIDA seção Protestos',
                  identificacao: prot.identificacao || '',
                  valor: prot.valor || ''
                });
              }
            }
          }
          // FALLBACK: SIDA occurrences
          if (rec.occurrences && rec.occurrences.length > 0) {
            rec.occurrences.forEach(occ => {
              if (occ.date && isProtestoLine(occ.desc)) {
                protestoSources.push({ date: occ.date, desc: occ.desc, origin: 'SIDA ocorrência' });
              }
            });
          }
          // Debcad history
          if (rec.history && rec.history.length > 0) {
            rec.history.forEach(h => {
              if (h.date && isProtestoLine(h.desc)) {
                protestoSources.push({ date: h.date, desc: h.desc, origin: `Debcad fase ${h.code}` });
              }
            });
          }
          if (protestoSources.length > 0) {
            const existingEvents = (data.prescriptionEvents || []).filter(pe => pe.cdaId === existing.id);
            const usedDates = new Set();
            for (const ps of protestoSources) {
              if (usedDates.has(ps.date)) continue;
              usedDates.add(ps.date);
              const dup = existingEvents.find(pe => pe.type === 'int_protesto_extrajudicial' && pe.date === ps.date);
              if (dup) continue;
              upsert('prescriptionEvents', {
                id: uid(),
                cdaId: existing.id,
                type: 'int_protesto_extrajudicial',
                date: ps.date,
                legalBasis: 'Art. 174, p.ú., CTN (com redação da LC 208/2024) — extraído de ' + ps.origin,
                notes: `Protesto extrajudicial detectado automaticamente — ${ps.desc}. ${ps.identificacao ? 'ID: ' + ps.identificacao + '. ' : ''}Verificar se a eficácia interruptiva se aplica (LC 208/2024 publicada em 02/07/2024; protestos anteriores dependem de interpretação caso a caso — Tema 777/STJ como antecedente).`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
              eventsCreated++;
            }
          }

          // Process automatic co-responsible inclusions from SIDA occurrences
          if (rec.coresponsibles && rec.coresponsibles.length > 0) {
            for (const cr of rec.coresponsibles) {
              if (!cr.cpfCnpj) continue;
              // Find or create the person within the active operation
              let crPerson = data.people.find(p => p.operationId === activeOpId && p.cpfCnpj && p.cpfCnpj.replace(/\D/g, '') === cr.cpfCnpj);
              if (!crPerson) {
                // Auto-create as relacionada (não-alvo) — user can promote to alvo later
                const hasName = cr.name && cr.name.length > 2;
                const source = cr.source === 'SIDA-DEVEDORES' ? 'seção Devedores do SIDA' : 'ocorrência SIDA';
                const noteText = cr.source === 'SIDA-DEVEDORES'
                  ? `Corresponsável extraído da seção "Devedores" do SIDA.${cr.situacaoCadastral ? ' Situação cadastral RFB: '+cr.situacaoCadastral+'.' : ''}${cr.municipio ? ' Município: '+cr.municipio+(cr.uf?'/'+cr.uf:'')+'.':''}`
                  : `Pessoa criada automaticamente a partir de ocorrência "INCLUSAO DE CO-RESPONSAVEL" no SIDA em ${fmtDate(cr.date)}. Verificar dados e promover a alvo se aplicável.`;
                crPerson = {
                  id: uid(),
                  operationId: activeOpId,
                  name: hasName ? cr.name : `[Importado SIDA] ${cr.cpfCnpjFormatted}`,
                  cpfCnpj: cr.cpfCnpjFormatted,
                  subtype: cr.cpfCnpj.length > 11 ? 'PJ' : 'PF',
                  operationRole: 'relacionada',
                  role: 'Corresponsável',
                  notesList: [noteText],
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                };
                upsert('people', crPerson);
                personsCreated++;
              }
              // Create responsibility link if not already there
              const existingLink = (data.links?.cdaResponsibilities || []).find(r => r.cdaId === existing.id && r.personId === crPerson.id && r.role === 'coresponsavel_legal');
              if (!existingLink) {
                addResponsibility(existing.id, crPerson.id, 'coresponsavel_legal', `Inclusão SIDA em ${fmtDate(cr.date)}`);
                respCreated++;
              }
            }
          }
        }
      } catch (err) {
        logs.push(`❌ ${file.name}: ${err.message}`);
      }
    }

    logs.push(`\n📊 ${cdaUpdated} CDA(s) complementada(s) · ${eventsCreated} evento(s) prescricional(is) criado(s)${cdaNotFound > 0 ? ` · ${cdaNotFound} CDA(s) não encontrada(s)` : ''}${personsCreated > 0 ? ` · ${personsCreated} corresponsável(eis) criado(s)` : ''}${respCreated > 0 ? ` · ${respCreated} vínculo(s) de corresponsabilidade adicionado(s)` : ''}`);
    // Determine type by file name pattern
    const fileNames = Array.from(e.target.files || []).map(f => f.name);
    const hasSIDA = fileNames.some(n => /sida/i.test(n));
    const hasDebcad = fileNames.some(n => /debcad/i.test(n));
    const importType = hasSIDA && hasDebcad ? 'pdf_sida_debcad' : hasSIDA ? 'pdf_sida' : hasDebcad ? 'pdf_debcad' : 'pdf_pgfn';
    logImport(importType, {
      fileNames,
      summary: `${cdaUpdated} CDA(s) complementada(s), ${eventsCreated} evento(s) prescricional(is)${respCreated > 0 ? `, ${respCreated} vínculo(s) de corresponsabilidade` : ''}`,
      counts: { cdaUpdated, eventsCreated, cdaNotFound, personsCreated, respCreated }
    });
    setImportResult(logs);
    e.target.value = '';
  };

  const handleEprocImport = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const logs = [];
    let newCount = 0, updCount = 0, unlinkedCount = 0;
    const processFile = (file) => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const wb = XLSX.read(ev.target.result, { type: 'binary' });
          const res = parseEprocXLS(wb);
          logs.push(`📬 ${file.name}: ${res.intimations.length} intimação(ões) [${res.fileType}]`);
          res.errors.forEach(err => logs.push(`⚠️ ${err}`));
          res.intimations.forEach(intim => {
            // Smart match: same process + same event description
            // But if the existing intimation is already resolved (analisado/responded) AND
            // the import has a different dateSent, it's a NEW intimation, not an update.
            const candidates = (data.intimations || []).filter(x =>
              sameProc(x.processNumber, intim.processNumber) &&
              x.eventDescription === intim.eventDescription
            );

            let existing = null;
            if (candidates.length > 0) {
              // Priority 1: find one with matching dateSent (exact same intimation)
              if (intim.dateSent) {
                existing = candidates.find(x => x.dateSent === intim.dateSent);
              }
              // Priority 2: find an unresolved one (still being worked on)
              if (!existing) {
                existing = candidates.find(x => x.status !== 'analisado' && !x.responseAction);
              }
              // Priority 3: if all are resolved and dateSent differs → it's a NEW intimation
              if (!existing) {
                const allResolved = candidates.every(x => x.status === 'analisado' || x.responseAction);
                const dateSentDiffers = intim.dateSent && !candidates.some(x => x.dateSent === intim.dateSent);
                if (allResolved && dateSentDiffers) {
                  existing = null; // Force creation of new intimation
                } else if (allResolved && !intim.dateSent) {
                  // No dateSent to compare — match the most recent resolved one (update scenario)
                  existing = candidates.sort((a,b) => (b.updatedAt||'').localeCompare(a.updatedAt||''))[0];
                } else {
                  existing = candidates[0]; // Fallback
                }
              }
            }
            if (existing) {
              // MERGE: update only dates and system fields, preserve user data
              const merged = { ...existing };
              let changed = false;
              let significantChange = false; // Only flag visually for meaningful changes
              if (intim.dateStart && intim.dateStart !== existing.dateStart) { merged.dateStart = intim.dateStart; changed = true; significantChange = true; }
              if (intim.dateDeadline && intim.dateDeadline !== existing.dateDeadline) { merged.dateDeadline = intim.dateDeadline; changed = true; significantChange = true; }
              if (intim.dateSent && !existing.dateSent) { merged.dateSent = intim.dateSent; changed = true; }
              if (intim.partyName && !existing.partyName) { merged.partyName = intim.partyName; changed = true; }
              if (changed) {
                // Only show visual flag for significant changes (dates, status)
                if (significantChange) {
                  merged._importFlag = 'updated';
                  merged._importFlagAt = new Date().toISOString();
                }
                upsert('intimations', merged);
                updCount++;
                logs.push(`🔄 Atualizado: ${intim.processNumber} (${significantChange ? 'datas/prazo alterados' : 'dados complementares'})`);
              } else {
                logs.push(`ℹ️ Sem alteração: ${intim.processNumber}`);
              }
            } else {
              // NOVA: vincula operação SOMENTE com evidência concreta.
              // REGRA: se o processo não consta em nenhum processo/CDA cadastrado,
              // a intimação fica SEM operação ("Nenhuma"). Antes ela herdava a
              // operação aberta na tela — causa das vinculações falsas.
              const matchExec = data.executions.find(ex => ex.operationId && sameProc(ex.processNumber, intim.processNumber));
              const matchDebt = matchExec ? null : data.debts.find(d => d.operationId && sameProc(d.processNumber, intim.processNumber));
              if (matchExec) intim.operationId = matchExec.operationId;
              else if (matchDebt) intim.operationId = matchDebt.operationId;
              // Intimação irmã do MESMO processo com vínculo já definido pelo usuário
              else if (candidates.length > 0 && candidates[0].operationId) intim.operationId = candidates[0].operationId;
              else {
                intim.operationId = '';
                unlinkedCount++;
                logs.push(`◌ Sem vínculo: ${intim.processNumber} não consta em nenhuma operação`);
              }
              upsert('intimations', { ...intim, id: uid(), _importFlag: 'new', _importFlagAt: new Date().toISOString() });
              newCount++;
            }
          });
        } catch (err) { logs.push(`❌ ${err.message}`); }
        resolve();
      };
      reader.readAsBinaryString(file);
    });
    Promise.all(files.map(processFile)).then(() => {
      logs.push(`\n📊 ${newCount} nova(s) · ${updCount} atualizada(s)`);
      if (unlinkedCount > 0) logs.push(`⚠️ ${unlinkedCount} intimação(ões) ficaram SEM operação — o processo não consta em nenhuma operação cadastrada. Vincule manualmente ao editar, se for o caso.`);
      logImport('eproc', {
        fileNames: files.map(f => f.name),
        summary: `${newCount} nova(s), ${updCount} atualizada(s)`,
        counts: { new: newCount, updated: updCount }
      });
      setImportResult(logs);
    });
    e.target.value = '';
  };

  // Global search results
  const gsResults = useMemo(() => {
    if (!gsQuery || gsQuery.length < 2) return [];
    const raw = gsQuery.toLowerCase();
    const q = raw.replace(/[.\-\/]/g, '');
    const results = [];
    // People — name, CPF/CNPJ
    data.people.forEach(p => {
      const match = p.name?.toLowerCase().includes(raw) || p.cpfCnpj?.replace(/\D/g,'').includes(q) || p.cpfCnpj?.toLowerCase().includes(raw);
      if (match) {
        const op = data.operations.find(o => o.id === p.operationId);
        results.push({ type: 'person', icon: p.subtype === 'PJ' ? '🏢' : '👤', name: p.name, meta: `${p.subtype} · ${p.cpfCnpj || ''}${p.role ? ' · '+p.role : ''}`, opName: op?.name, opId: p.operationId, id: p.id, entity: p, entityType: 'person', tab: 'pessoas' });
      }
    });
    // CDAs — number, debcad
    data.debts.forEach(d => {
      const match = d.cdaNumber?.toLowerCase().includes(raw) || d.cdaNumber?.replace(/\D/g,'').includes(q) || d.processNumber?.replace(/[.\-]/g,'').includes(q);
      if (match) {
        const op = data.operations.find(o => o.id === d.operationId);
        results.push({ type: 'debt', icon: '📄', name: `CDA ${d.cdaNumber}`, meta: `${fmtCur(d.value)} · ${DEBT_STATUSES[d.status]?.label || d.status}${d.processNumber ? ' · Proc. '+d.processNumber : ''}`, opName: op?.name, opId: d.operationId, id: d.id, entity: d, entityType: 'debt', tab: 'dividas' });
      }
    });
    // Executions — process number, court, class
    data.executions.forEach(e => {
      const match = e.processNumber?.replace(/[.\-]/g,'').includes(q) || e.processNumber?.includes(gsQuery) || e.court?.toLowerCase().includes(raw) || e.className?.toLowerCase().includes(raw);
      if (match) {
        const op = data.operations.find(o => o.id === e.operationId);
        const tag = e.processTag === 'idpj' ? 'IDPJ · ' : e.processTag === 'cautelar_fiscal' ? 'MCF · ' : '';
        results.push({ type: 'execution', icon: '⚖️', name: e.processNumber, meta: `${tag}${e.className || ''}${e.court ? ' · '+e.court : ''} · ${EXEC_STATUSES[e.status]?.label || e.status}`, opName: op?.name, opId: e.operationId, id: e.id, entity: e, entityType: 'execution', tab: 'execucoes' });
      }
    });
    // Intimations — process number, parties, event
    (data.intimations || []).forEach(intim => {
      const match = intim.processNumber?.replace(/[.\-]/g,'').includes(q) || intim.parties?.toLowerCase().includes(raw) || intim.partyName?.toLowerCase().includes(raw);
      if (match) {
        const op = data.operations.find(o => o.id === intim.operationId);
        results.push({ type: 'intimation', icon: '📬', name: intim.processNumber, meta: `${intim.className || ''} · ${truncate(intim.eventDescription || '', 40)}`, opName: op?.name || 'Sem operação', opId: intim.operationId, id: intim.id, entity: intim, entityType: 'intimation', tab: null });
      }
    });
    // Assets — description, registry
    data.assets.forEach(a => {
      const match = a.description?.toLowerCase().includes(raw) || a.registry?.toLowerCase().includes(raw);
      if (match) {
        const op = data.operations.find(o => o.id === a.operationId);
        results.push({ type: 'asset', icon: '💎', name: truncate(a.description, 40), meta: `${ASSET_SUBTYPES[a.subtype] || a.subtype || ''} · ${(ASSET_STATUSES[a.status] || {}).label || a.status}${a.value ? ' · '+fmtCur(a.value) : ''}`, opName: op?.name, opId: a.operationId, id: a.id, entity: a, entityType: 'asset', tab: 'bens' });
      }
    });
    // Operations — name, description
    data.operations.forEach(op => {
      if (op.name?.toLowerCase().includes(raw) || op.description?.toLowerCase().includes(raw)) {
        results.push({ type: 'operation', icon: '◎', name: op.name, meta: op.description || '', opName: null, opId: op.id, id: op.id, entity: null, entityType: null, tab: null });
      }
    });
    return results.slice(0, 25);
  }, [gsQuery, data]);

  // ─── Cloud Sync Functions (GAS-aware) ───
  const isGAS = typeof google !== 'undefined' && google.script && google.script.run;
  const cloudSaveUrl = (url) => { setCloudUrl(url); localStorage.setItem('nexus_cloud_url', url); };

  // Auto-detect GAS on mount
  useEffect(() => {
    if (isGAS) {
      setCloudStatus('syncing'); setCloudMsg('Conectando ao Google Sheets...');
      google.script.run
        .withSuccessHandler((raw) => {
          try {
            if (raw && raw !== '{}') {
              const parsed = JSON.parse(raw);
              if (parsed.operations && parsed.operations.length > 0) {
                setData(prev => {
                  // Only load from cloud if local is empty
                  if (!prev.operations || prev.operations.length === 0) {
                    return applyMigrations(parsed);
                  }
                  return prev;
                });
              }
            }
            setCloudStatus('connected'); setCloudMsg('Conectado via Apps Script ✓');
          } catch (e) { setCloudStatus('connected'); setCloudMsg('Conectado (planilha vazia)'); }
        })
        .withFailureHandler((err) => {
          setCloudStatus('error'); setCloudMsg('Erro: ' + err.message);
        })
        .loadNexusData();
    }
  }, []);

  const cloudPing = async () => {
    if (isGAS) {
      setCloudStatus('connected'); setCloudMsg('Conectado via Apps Script ✓');
      return;
    }
    setCloudStatus('error'); setCloudMsg('Ambiente não suportado — use o app implantado via Apps Script.');
  };

  const cloudPush = async (opts = {}) => {
    const silent = !!opts.silent;
    if (isGAS) {
      // ─── GUARDA DE CONFLITO: se o arquivo remoto mudou desde o último push
      // desta máquina (outra máquina salvou no meio tempo), NÃO sobrescrever às cegas.
      if (!opts._skipConflictCheck) {
        google.script.run.withSuccessHandler(m => {
          if (m && m.success && m.exists && m.mtime && lastPushMtimeRef.current) {
            const remote = new Date(m.mtime).getTime();
            const known = new Date(lastPushMtimeRef.current).getTime();
            if (remote - known > 60000) { // remoto avançou >1min desde nosso último push
              if (silent) {
                // Auto-sync: nunca sobrescrever silenciosamente — pausa e avisa
                setCloudStatus('error');
                setCloudMsg('⚠ Conflito: a nuvem foi alterada por outra máquina. Auto-sync pausado — use ⬆ (sobrescrever) ou ⬇ (carregar) manualmente.');
                return;
              }
              if (!confirm(`⚠ CONFLITO DE VERSÕES\n\nA nuvem foi alterada em ${new Date(m.mtime).toLocaleString('pt-BR')} — depois do último save desta máquina.\n\nProvavelmente você salvou de OUTRA máquina.\n\n• OK: SOBRESCREVER a nuvem com os dados desta máquina (a versão da outra máquina será perdida — mas há backup diário)\n• Cancelar: nada é salvo (use ⬇ para carregar a versão da nuvem)`)) {
                setCloudStatus('connected'); setCloudMsg('Save cancelado (conflito)');
                return;
              }
            }
          }
          cloudPush({ ...opts, _skipConflictCheck: true });
        }).withFailureHandler(() => {
          // Se o check falhar, segue com o push normal (comportamento anterior)
          cloudPush({ ...opts, _skipConflictCheck: true });
        }).getRemoteMtime();
        return;
      }
      if (!silent) { setCloudStatus('syncing'); setCloudMsg('Salvando no Google Sheets...'); }
      google.script.run
        .withSuccessHandler((result) => {
          if (!result || !result.success) {
            setCloudStatus('error');
            setCloudMsg('Erro: ' + (result && result.error ? result.error : 'resposta inválida do servidor'));
            return;
          }
          const now = new Date().toLocaleString('pt-BR');
          setCloudStatus('connected');
          setCloudMsg((silent ? 'Auto-sync ✓' : 'Salvo ✓') + ` (${(result.size/1024).toFixed(1)}KB)`);
          setCloudLastSync(now); localStorage.setItem('nexus_cloud_lastsync', now);
          if (result.mtime) { lastPushMtimeRef.current = result.mtime; localStorage.setItem('nexus_remote_mtime', result.mtime); }
          dirtyRef.current = false;
        })
        .withFailureHandler((err) => {
          setCloudStatus('error'); setCloudMsg('Erro ao salvar: ' + err.message);
        })
        .saveNexusData(JSON.stringify(data));
      return;
    }
    setCloudStatus('error'); setCloudMsg('Ambiente não suportado.');
  };
  // Expose cloudPush via ref so the auto-sync effect can call the latest version
  // (the effect itself doesn't depend on cloudPush, avoiding re-creation of the interval)
  cloudPushRef.current = cloudPush;

  // ═══════════════════════════════════════════════════════════════════
  // AUTO-SYNC ENGINE
  // Runs when isGAS && autoSyncEnabled. Three behaviors:
  //  1) Interval sync every 5 minutes if dirty and no recent edits (debounce 30s)
  //  2) Best-effort sync on beforeunload (browser closing/refreshing)
  //  3) On mount, check remote mtime; if newer than local, prompt to pull
  // ═══════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isGAS || !autoSyncEnabled) return;
    const SYNC_INTERVAL_MS = 5 * 60 * 1000;      // 5 minutes
    const EDIT_DEBOUNCE_MS = 30 * 1000;          // 30s after last edit

    const tryAutoSync = () => {
      if (!dirtyRef.current) return;                              // nothing changed
      if (Date.now() - lastEditRef.current < EDIT_DEBOUNCE_MS) return; // user still typing
      if (!navigator.onLine) return;                              // offline
      if (cloudPushRef.current) cloudPushRef.current({ silent: true });
    };

    const intervalId = setInterval(tryAutoSync, SYNC_INTERVAL_MS);

    // Best-effort sync on browser close — google.script.run is async and may not
    // complete, but we fire it anyway. Modern browsers ignore preventDefault
    // prompts, so no UI interruption; if the sync survives, great; if not,
    // the user will catch stale data on next machine via the mtime check below.
    const onBeforeUnload = () => {
      if (dirtyRef.current && cloudPushRef.current) {
        try { cloudPushRef.current({ silent: true }); } catch (e) {}
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);

    // On mount: compare remote mtime with local cache timestamp.
    // If remote is newer by >60s, offer to pull (likely sync from the other machine).
    const localMtime = localStorage.getItem('nexus_remote_mtime');
    google.script.run.withSuccessHandler(m => {
      if (!m || !m.success || !m.exists || !m.mtime) return;
      const pullNow = () => {
        google.script.run.withSuccessHandler(raw => {
          try {
            const parsed = JSON.parse(raw);
            if (parsed.operations) {
              setData(applyMigrations(parsed));
              setActiveOpId(null);
              const now = new Date().toLocaleString('pt-BR');
              setCloudStatus('connected'); setCloudMsg('Sincronizado da nuvem ✓');
              setCloudLastSync(now); localStorage.setItem('nexus_cloud_lastsync', now);
              lastPushMtimeRef.current = m.mtime; localStorage.setItem('nexus_remote_mtime', m.mtime);
              dirtyRef.current = false; hydratedRef.current = false;
            }
          } catch (e) { setCloudMsg('Erro ao carregar: ' + e.message); }
        }).loadNexusData();
      };
      if (!localMtime) {
        // Navegador sem registro de sync (origem nova — ex.: redeploy do Apps Script zera o
        // localStorage). NUNCA adotar o mtime remoto às cegas: isso desarmava a guarda de
        // conflito e permitia sobrescrever a nuvem com um panorama desatualizado.
        const hasLocal = ((latestDataRef.current && latestDataRef.current.operations) || []).length > 0;
        if (!hasLocal) { pullNow(); return; } // local vazio: puxa a nuvem direto
        if (confirm(`Este navegador não tem registro de sincronização, mas a nuvem tem dados (${new Date(m.mtime).toLocaleString('pt-BR')}).\n\nCARREGAR a versão da nuvem? (recomendado)\n\n• OK: carrega a nuvem — os dados locais deste navegador serão substituídos\n• Cancelar: mantém os dados locais — nenhum save sobrescreverá a nuvem sem avisar`)) { pullNow(); }
        else { lastPushMtimeRef.current = '1970-01-01T00:00:00.000Z'; } // arma a guarda: próximo push detecta conflito e avisa
        return;
      }
      // Arma a guarda de conflito mesmo antes do primeiro push desta sessão
      if (!lastPushMtimeRef.current) lastPushMtimeRef.current = localMtime;
      const remoteDate = new Date(m.mtime).getTime();
      const localDate = new Date(localMtime).getTime();
      if (remoteDate - localDate > 60000) { // remote is >1min newer
        if (confirm(`Versão mais recente detectada na nuvem (última sync remota ${new Date(m.mtime).toLocaleString('pt-BR')}).\n\nDeseja CARREGAR essa versão?\n\n• SIM: substitui dados locais pela versão mais atual (recomendado se você trabalhou em outra máquina)\n• NÃO: mantém versão local (use se tiver edições não sincronizadas — a guarda de conflito avisará antes de sobrescrever a nuvem)`)) {
          pullNow();
        }
        // Recusou o pull: lastPushMtimeRef permanece no mtime antigo → a guarda de
        // conflito dispara no próximo push em vez de sobrescrever silenciosamente.
      }
    }).getRemoteMtime();

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [isGAS, autoSyncEnabled]);

  const cloudPull = async () => {
    if (isGAS) {
      setCloudStatus('syncing'); setCloudMsg('Carregando do Google Sheets...');
      google.script.run
        .withSuccessHandler((raw) => {
          try {
            const parsed = JSON.parse(raw);
            if (parsed.operations && confirm(`Carregar dados da nuvem? (${parsed.operations.length} operações)\nSubstituirá dados locais.`)) {
              setData(applyMigrations(parsed)); setActiveOpId(null);
              const now = new Date().toLocaleString('pt-BR');
              setCloudStatus('connected'); setCloudMsg('Carregado ✓');
              setCloudLastSync(now); localStorage.setItem('nexus_cloud_lastsync', now);
              // After pull, local state equals remote — clear dirty and fetch fresh mtime
              dirtyRef.current = false;
              hydratedRef.current = false; // next data effect won't re-dirty
              if (isGAS) {
                google.script.run.withSuccessHandler(m => {
                  if (m && m.mtime) { lastPushMtimeRef.current = m.mtime; localStorage.setItem('nexus_remote_mtime', m.mtime); }
                }).getRemoteMtime();
              }
            } else { setCloudStatus('connected'); setCloudMsg('Cancelado'); }
          } catch { setCloudStatus('connected'); setCloudMsg('Planilha vazia'); }
        })
        .withFailureHandler((err) => {
          setCloudStatus('error'); setCloudMsg('Erro: ' + err.message);
        })
        .loadNexusData();
      return;
    }
    setCloudStatus('error'); setCloudMsg('Ambiente não suportado.');
  };

  // Visão Gemini (Workspace): materializa abas Gemini_* na Planilha ativa
  const exportGeminiView = (scope) => {
    if (!isGAS) {
      alert('A Visão Gemini usa a Planilha do Apps Script.\n\nAbra o NEXUS pela implantação GAS, sincronize os dados e tente de novo.\n\nOffline: use Exportar JSON / dossiê manual.');
      return;
    }
    const sc = scope || 'carteira';
    if (sc === 'operacao' && !activeOpId) {
      alert('Abra uma operação na Carteira antes de exportar o escopo “Operação atual”.');
      return;
    }
    const labels = { carteira: 'carteira ativa', hoje: 'fila de hoje', operacao: 'operação atual' };
    if (!confirm(`Atualizar Visão Gemini (${labels[sc] || sc})?\n\nIsso recria/atualiza as abas Gemini_Meta, Gemini_Ops, Gemini_Intimacoes, Gemini_Prescricao, Gemini_Tarefas e Gemini_Briefing nesta Planilha.\n\nRecomendado: sincronizar (⬆ Sync) antes.`)) return;
    setCloudStatus('syncing');
    setCloudMsg('Gerando Visão Gemini…');
    setShowSettings(false);
    google.script.run
      .withSuccessHandler((res) => {
        if (!res || !res.success) {
          setCloudStatus('error');
          setCloudMsg('Gemini: ' + ((res && res.error) || 'falha'));
          alert('Falha ao gerar Visão Gemini:\n' + ((res && res.error) || 'erro desconhecido'));
          return;
        }
        setCloudStatus('connected');
        setCloudMsg('Visão Gemini atualizada ✓');
        const c = res.counts || {};
        const msg = `Visão Gemini atualizada (${labels[sc] || sc}).\n\n` +
          `Ops: ${c.ops || 0} · Intimações: ${c.intimacoes || 0} · Prescrição: ${c.prescricoes || 0} · Tarefas: ${c.tarefas || 0}\n\n` +
          `Abra o Gemini no painel lateral da Planilha e pergunte sobre as abas Gemini_*.`;
        if (res.spreadsheetUrl && confirm(msg + '\n\nAbrir a Planilha agora?')) {
          try { window.open(res.spreadsheetUrl, '_blank'); } catch (e) {}
        } else {
          alert(msg);
        }
      })
      .withFailureHandler((err) => {
        setCloudStatus('error');
        setCloudMsg('Gemini: ' + (err && err.message ? err.message : err));
        alert('Erro ao chamar exportGeminiView:\n' + (err && err.message ? err.message : err));
      })
      .exportGeminiView({
        scope: sc,
        operationId: sc === 'operacao' ? activeOpId : '',
        jsonString: JSON.stringify(data),
      });
  };

  const activeOp = data.operations.find(o => o.id === activeOpId);
  const filteredOps = data.operations.filter(o => o.name.toLowerCase().includes(search.toLowerCase()) || (o.description || '').toLowerCase().includes(search.toLowerCase())).sort((a,b) => (a.name||'').localeCompare(b.name||'', 'pt-BR'));

  // CRUD
  // Campos cuja mudança vale registro no histórico de alterações (auditoria leve)
  const AUDIT_FIELDS = {
    debts: ['status', 'prescriptionHandled', 'prescriptionDate', 'value'],
    executions: ['status', 'processTag', 'hasGuarantee', 'prescriptionInterrupted'],
    intimations: ['status', 'responseAction', 'dateDeadline'],
    operations: ['status', 'classifications'],
    assets: ['status'],
    tasks: ['status', 'dueDate'],
    measures: ['status']
  };
  const _entityRef = (col, e) => {
    if (col === 'debts') return `CDA ${e.cdaNumber || e.id}`;
    if (col === 'executions') return `Proc. ${e.processNumber || e.id}`;
    if (col === 'intimations') return `Intimação ${e.processNumber || e.id}`;
    if (col === 'operations') return `Operação ${e.name || e.id}`;
    if (col === 'assets') return `Bem ${truncate(e.description || e.id, 40)}`;
    if (col === 'tasks') return `Tarefa ${truncate(e.title || e.id, 40)}`;
    if (col === 'measures') return `Medida ${truncate(e.description || e.subtype || e.id, 40)}`;
    return e.id;
  };
  const upsert = (col, entity) => {
    setData(prev => {
      const list = prev[col];
      const idx = list.findIndex(e => e.id === entity.id);
      const now = new Date().toISOString();
      // ─── CHANGE LOG: diffa campos auditáveis em edições (não em criações) ───
      let logEntries = [];
      if (idx >= 0 && AUDIT_FIELDS[col]) {
        const before = list[idx];
        AUDIT_FIELDS[col].forEach(f => {
          if (!(f in entity)) return; // campo não tocado neste save
          const a = before[f], b = entity[f];
          const norm = (v) => Array.isArray(v) ? v.join(',') : (v === undefined || v === null ? '' : String(v));
          if (norm(a) !== norm(b)) {
            logEntries.push({ id: uid(), date: now, col, entityId: entity.id, ref: _entityRef(col, { ...before, ...entity }), operationId: entity.operationId || before.operationId || '', field: f, from: norm(a) || '(vazio)', to: norm(b) || '(vazio)' });
          }
        });
      }
      const updated = idx >= 0 ? list.map(e => e.id === entity.id ? { ...e, ...entity, updatedAt: now } : e) : [...list, { ...entity, createdAt: now, updatedAt: now }];
      let newPrev = { ...prev, [col]: updated };
      if (logEntries.length > 0) {
        newPrev.changeLog = [...logEntries, ...(prev.changeLog || [])].slice(0, 500); // cap 500
      }
      // Auto-maintain originario responsibility link when debt is saved with personId
      if (col === 'debts' && entity.personId) {
        const cdaId = entity.id;
        const existingOrig = (newPrev.links.cdaResponsibilities || []).find(r => r.cdaId === cdaId && r.role === 'originario');
        if (!existingOrig) {
          newPrev = {...newPrev, links: {...newPrev.links, cdaResponsibilities: [...newPrev.links.cdaResponsibilities, {
            id: uid(), cdaId, personId: entity.personId, role: 'originario',
            basis: 'Devedor originário', addedAt: now
          }]}};
        } else if (existingOrig.personId !== entity.personId) {
          // Originário mudou — atualiza
          newPrev = {...newPrev, links: {...newPrev.links, cdaResponsibilities: newPrev.links.cdaResponsibilities.map(r =>
            r.id === existingOrig.id ? {...r, personId: entity.personId} : r
          )}};
        }
      }
      return newPrev;
    });
  };
  // Log an import run — type is one of: xls, eproc, pdf_sida, pdf_debcad, ai, assets
  const logImport = (type, detail) => {
    const entry = {
      id: uid(),
      type,
      timestamp: new Date().toISOString(),
      operationId: activeOpId || null,
      seen: false,
      ...detail
    };
    setData(prev => ({...prev, importLogs: [...(prev.importLogs || []), entry].slice(-50)})); // cap: evita inchar o cache local
  };

  // Add corresponsabilidade link
  const addResponsibility = (cdaId, personId, role, basis = '') => {
    setData(prev => {
      const existing = (prev.links.cdaResponsibilities || []).filter(r => r.cdaId === cdaId && r.personId === personId);
      // Avoid exact duplicate (same role)
      if (existing.some(r => r.role === role)) return prev;
      // Prevent any other role if person is already originário (originário é exclusivo)
      if (existing.some(r => r.role === 'originario')) {
        alert('Esta pessoa já é o devedor originário desta CDA. Não é possível adicioná-la também como corresponsável.');
        return prev;
      }
      // If trying to add as originário but person already has another role, alert
      if (role === 'originario' && existing.length > 0) {
        if (!confirm('Esta pessoa já tem outro papel nesta CDA. Promovê-la a originária irá remover os papéis anteriores. Continuar?')) return prev;
        return {...prev, links: {...prev.links, cdaResponsibilities: [
          ...(prev.links.cdaResponsibilities || []).filter(r => !(r.cdaId === cdaId && r.personId === personId)),
          { id: uid(), cdaId, personId, role, basis, addedAt: new Date().toISOString() }
        ]}};
      }
      return {...prev, links: {...prev.links, cdaResponsibilities: [...(prev.links.cdaResponsibilities || []), {
        id: uid(), cdaId, personId, role, basis, addedAt: new Date().toISOString()
      }]}};
    });
  };
  const removeResponsibility = (linkId) => {
    setData(prev => ({...prev, links: {...prev.links, cdaResponsibilities: (prev.links.cdaResponsibilities || []).filter(r => r.id !== linkId)}}));
  };
  // ─── EXCLUSÃO EM CASCATA + UNDO ───
  // Calcula tudo que será removido junto com a entidade, para evitar registros órfãos
  // (especialmente prescriptionEvents órfãos, que distorcem o cálculo de prescrição).
  const computeCascade = (d, col, id) => {
    const out = { debts: new Set(), executions: new Set(), measures: new Set(), assets: new Set(), people: new Set(), intimations: new Set(), tasks: new Set(), stickyNotes: new Set(), prescriptionEvents: new Set(), documents: new Set(), importLogs: new Set(), hearings: new Set(), watchlist: new Set() };
    if (col === 'operations') {
      ['debts','executions','measures','assets','people','intimations','tasks','stickyNotes','documents','importLogs','hearings','watchlist'].forEach(k => (d[k]||[]).forEach(x => { if (x.operationId === id) out[k].add(x.id); }));
      (d.prescriptionEvents||[]).forEach(ev => {
        if ((ev.cdaId && out.debts.has(ev.cdaId)) || (ev.executionId && out.executions.has(ev.executionId))) out.prescriptionEvents.add(ev.id);
      });
    } else if (col === 'executions') {
      out.executions.add(id);
      (d.prescriptionEvents||[]).forEach(ev => { if (ev.executionId === id && !ev.cdaId) out.prescriptionEvents.add(ev.id); });
    } else if (col === 'debts') {
      out.debts.add(id);
      (d.prescriptionEvents||[]).forEach(ev => { if (ev.cdaId === id) out.prescriptionEvents.add(ev.id); });
    } else if (col === 'people') {
      out.people.add(id);
    } else if (out[col]) { out[col].add(id); }
    return out;
  };
  const applyCascade = (prev, col, id, cas) => {
    const next = { ...prev };
    Object.keys(cas).forEach(k => { if (cas[k].size > 0 && next[k]) next[k] = next[k].filter(x => !cas[k].has(x.id)); });
    if (!cas[col] || !cas[col].has(id)) next[col] = (next[col]||[]).filter(x => x.id !== id);
    // Limpa links órfãos
    const lk = next.links || {};
    next.links = {
      ...lk,
      cdaResponsibilities: (lk.cdaResponsibilities||[]).filter(r => !cas.debts.has(r.cdaId) && !cas.people.has(r.personId)),
      measurePeople: (lk.measurePeople||[]).filter(l => !cas.measures.has(l.measureId) && !cas.people.has(l.personId)),
      measureAssets: (lk.measureAssets||[]).filter(l => !cas.measures.has(l.measureId) && !cas.assets.has(l.assetId))
    };
    // Limpa referências soltas: parentExecutionId / linkedExecutionIds / holderId / personId
    if (cas.executions.size > 0) {
      next.executions = next.executions.map(e => {
        let ch = e;
        if (ch.parentExecutionId && cas.executions.has(ch.parentExecutionId)) ch = { ...ch, parentExecutionId: null };
        if (Array.isArray(ch.linkedExecutionIds) && ch.linkedExecutionIds.some(x => cas.executions.has(x))) ch = { ...ch, linkedExecutionIds: ch.linkedExecutionIds.filter(x => !cas.executions.has(x)) };
        return ch;
      });
    }
    if (cas.people.size > 0) {
      next.assets = next.assets.map(a => a.holderId && cas.people.has(a.holderId) ? { ...a, holderId: '' } : a);
      next.debts = next.debts.map(dd => dd.personId && cas.people.has(dd.personId) ? { ...dd, personId: null } : dd);
    }
    // Mesa de trabalho: descarta refs de itens excluídos (senão o array acumula lixo e vai para a nuvem)
    const deskKill = { intimation: cas.intimations, task: cas.tasks, hearing: cas.hearings };
    if (Object.values(deskKill).some(s => s && s.size > 0)) {
      next.desk = (next.desk || []).filter(x => !(deskKill[x.type] && deskKill[x.type].has(x.id)));
    }
    return next;
  };
  const cascadeSummary = (cas, col) => {
    const labels = { debts:'CDA(s)', executions:'processo(s)', measures:'medida(s)', assets:'bem(ns)', people:'pessoa(s)', intimations:'intimação(ões)', tasks:'tarefa(s)', stickyNotes:'anotação(ões)', prescriptionEvents:'evento(s) de prescrição', documents:'documento(s)', importLogs:'log(s) de importação', hearings:'audiência(s)', watchlist:'item(ns) de acompanhamento' };
    const parts = Object.keys(cas).filter(k => k !== col && cas[k].size > 0).map(k => `• ${cas[k].size} ${labels[k]}`);
    return parts.length ? `\n\nSerão excluídos JUNTO (em cascata):\n${parts.join('\n')}` : '';
  };
  const remove = (col, id) => {
    const cas = computeCascade(data, col, id);
    if (!confirm(`Confirma exclusão?${cascadeSummary(cas, col)}`)) return;
    pushUndo(`Exclusão de registro (${col})`);
    setData(prev => applyCascade(prev, col, id, cas));
    setModal(null); setSelectedNode(null);
  };

  const saveMeasure = (m) => {
    const { linkedPeopleIds = [], linkedAssetIds = [], ...md } = m;
    upsert('measures', md);
    setData(prev => ({
      ...prev,
      links: {
        measurePeople: [...prev.links.measurePeople.filter(l => l.measureId !== md.id), ...linkedPeopleIds.map(pid => ({ measureId: md.id, personId: pid }))],
        measureAssets: [...prev.links.measureAssets.filter(l => l.measureId !== md.id), ...linkedAssetIds.map(aid => ({ measureId: md.id, assetId: aid }))]
      }
    }));
  };

  // Mark intimação as responded — creates Doc entry if peticionamento, then archives intimação
  const handleRespondIntim = (intim, action) => {
    // action: { type: 'peticionamento'|'ciencia'|'outra', description, peticionType?, peticionUrl?, docUrl? }
    const now = new Date().toISOString();
    const respondedIntim = {
      ...intim,
      status: 'analisado',
      responseAction: { ...action, respondedAt: now },
      updatedAt: now
    };
    // Clear import flag — intimation has been treated
    respondedIntim._importFlag = null;
    respondedIntim._importFlagAt = null;

    // ─── Resolve operationId: explicit > auto-detect by processNumber ───
    let resolvedOpId = intim.operationId || '';
    if (!resolvedOpId && intim.processNumber) {
      const procClean = intim.processNumber.replace(/\D/g, '');
      // Try matching via executions (most reliable — same processNumber)
      const matchExec = data.executions.find(e => e.processNumber && e.processNumber.replace(/\D/g, '') === procClean);
      if (matchExec) resolvedOpId = matchExec.operationId;
      // Fallback: try matching via CDAs
      if (!resolvedOpId) {
        const matchDebt = data.debts.find(d => d.processNumber && d.processNumber.replace(/\D/g, '') === procClean);
        if (matchDebt) resolvedOpId = matchDebt.operationId;
      }
    }
    // If we resolved an operationId that the intimation didn't have, update it
    if (resolvedOpId && !intim.operationId) {
      respondedIntim.operationId = resolvedOpId;
    }
    upsert('intimations', respondedIntim);

    // ─── Create document entry in operation's Docs for ANY action with a URL ───
    const actionUrl = action.type === 'peticionamento' ? action.peticionUrl : action.docUrl;
    if (actionUrl && actionUrl.trim() && resolvedOpId) {
      const typeLabels = { peticionamento: action.peticionType || 'Manifestação', ciencia: 'Ciência', outra: 'Outra medida' };
      const docTypeLabel = typeLabels[action.type] || action.type;
      const titleParts = [docTypeLabel];
      if (intim.processNumber) titleParts.push('— ' + intim.processNumber);
      const docTitle = titleParts.join(' ');
      const descParts = [];
      if (action.type === 'peticionamento') descParts.push('Peticionamento em resposta a intimação');
      else if (action.type === 'ciencia') descParts.push('Ciência registrada');
      else descParts.push('Atuação registrada');
      if (intim.eventDescription) descParts.push('(' + intim.eventDescription + ')');
      if (intim.dateDeadline) descParts.push('Prazo final: ' + fmtDate(intim.dateDeadline));
      if (action.description) descParts.push(action.description);
      const autoDetectedNote = (!intim.operationId && resolvedOpId) ? ' [operação detectada automaticamente pelo nº do processo]' : '';
      upsert('documents', {
        id: uid(),
        operationId: resolvedOpId,
        title: docTitle,
        type: docTypeLabel,
        url: actionUrl.trim(),
        processNumber: intim.processNumber || '',
        sourceIntimationId: intim.id,
        sourceActionType: action.type,
        description: descParts.join('. ') + '.' + autoDetectedNote,
        actionDate: new Date().toISOString().slice(0,10),
        createdAt: now,
        updatedAt: now
      });
    }
    // Concluída com atuação → sai da Mesa de trabalho (se estiver lá). Vale para o card e para a Mesa.
    removeFromDesk('intimation', intim.id);
    setRespondModal(null);
  };

  const handleSave = (type, entity) => {
    const colMap = { operation: 'operations', person: 'people', debt: 'debts', execution: 'executions', asset: 'assets', document: 'documents', prescriptionEvent: 'prescriptionEvents', intimation: 'intimations', task: 'tasks', stickyNote: 'stickyNotes', watch: 'watchlist', hearing: 'hearings' };
    const wantsWatch = entity._openWatch;
    const cleanEntity = { ...entity };
    delete cleanEntity._openWatch;
    // ─── ETAPA 5: Propagação de status de processo → CDAs vinculadas ───
    // Quando um processo é marcado como extinto ou arquivado, as CDAs vinculadas
    // recebem aviso visual automático (via systemAlerts), e é oferecido ao usuário
    // propagar o status diretamente para as CDAs.
    let pendingCdaPropagation = null;
    if (type === 'execution') {
      const prevExec = data.executions.find(e => e.id === cleanEntity.id);
      const prevStatus = prevExec?.status;
      const newStatus = cleanEntity.status;
      const becameInactive = (newStatus === 'extinta' || newStatus === 'arquivada') && prevStatus !== newStatus;
      const becameActive = newStatus === 'ativa' && (prevStatus === 'extinta' || prevStatus === 'arquivada');
      if (becameInactive || becameActive) {
        const linkedCdas = data.debts.filter(d => d.processNumber && sameProc(d.processNumber, cleanEntity.processNumber));
        if (linkedCdas.length > 0) {
          pendingCdaPropagation = { exec: cleanEntity, prevStatus, newStatus, linkedCdas, becameInactive, becameActive };
        }
      }
    }

    if (type === 'measure') saveMeasure(cleanEntity);
    else upsert(colMap[type], cleanEntity);

    // Execute propagation after upsert
    if (pendingCdaPropagation) {
      const { exec, newStatus, linkedCdas, becameInactive, becameActive } = pendingCdaPropagation;
      const today = new Date().toISOString().slice(0,10);
      const now = new Date().toISOString();
      const statusLabel = EXEC_STATUSES[newStatus]?.label || newStatus;
      // Always register a systemAlert on each linked CDA (automatic, cannot be dismissed individually)
      setData(prev => ({
        ...prev,
        debts: prev.debts.map(d => {
          if (!linkedCdas.some(l => l.id === d.id)) return d;
          const alerts = (d.systemAlerts || []).filter(a => a.type !== 'process_status');
          if (becameInactive) {
            alerts.push({
              type: 'process_status',
              processStatus: newStatus,
              processNumber: exec.processNumber,
              date: today,
              label: `⚠ Processo ${statusLabel.toLowerCase()} em ${fmtDate(today)}`,
              createdAt: now
            });
          }
          return { ...d, systemAlerts: alerts, updatedAt: now };
        })
      }));
      // Offer to propagate the status to the CDAs themselves
      if (becameInactive) {
        setTimeout(() => {
          const msg = `O processo ${exec.processNumber || ''} foi marcado como ${statusLabel.toLowerCase()}.\n\n${linkedCdas.length} CDA(s) estão vinculadas a este processo. Um aviso automático foi adicionado a cada uma delas.\n\nDeseja também marcar essas ${linkedCdas.length} CDA(s) como ${newStatus === 'extinta' ? 'extintas' : 'arquivadas'}?`;
          if (confirm(msg)) {
            setData(prev => ({
              ...prev,
              debts: prev.debts.map(d => linkedCdas.some(l => l.id === d.id)
                ? { ...d, status: newStatus === 'extinta' ? 'extinta' : d.status, prescriptionHandled: newStatus === 'extinta' ? true : d.prescriptionHandled, prescriptionHandledType: newStatus === 'extinta' && !d.prescriptionHandledType ? 'extinta' : d.prescriptionHandledType, prescriptionHandledAt: newStatus === 'extinta' && !d.prescriptionHandledAt ? today : d.prescriptionHandledAt, updatedAt: now }
                : d
              )
            }));
          }
        }, 100);
      }
    }

    // Auto-update CDA status from prescription event type
    if (type === 'prescriptionEvent') {
      const evtType = PRESC_EVENT_TYPES[cleanEntity.type];
      if (evtType) {
        const targetIds = cleanEntity.batchCdaIds && cleanEntity.batchCdaIds.length > 0
          ? cleanEntity.batchCdaIds
          : cleanEntity.cdaId ? [cleanEntity.cdaId] : [];
        if (targetIds.length > 0) {
          // Map event type → CDA status
          const statusMap = {
            susp_parcelamento: 'parcelada',
            susp_embargos: 'suspensa_judicial',
            susp_decisao_judicial: 'suspensa_judicial',
            susp_deposito: 'suspensa_judicial',
            susp_falencia: 'suspensa_judicial',
            susp_admin: 'suspensa_admin',
            int_penhora: 'garantida',
            int_arresto: 'garantida',
            int_sisbajud: 'garantida',
            int_cnib: 'garantida',
          };
          const newStatus = statusMap[cleanEntity.type];
          if (newStatus) {
            setData(prev => ({
              ...prev,
              debts: prev.debts.map(d => targetIds.includes(d.id) ? { ...d, status: newStatus, updatedAt: new Date().toISOString() } : d)
            }));
          }
        }
      }

      // Propagate event to apensos when source is a principal execution and propagation isn't disabled
      if (cleanEntity.executionId && !cleanEntity._noApensoPropagation && !cleanEntity._inheritedFromParent) {
        const principal = data.executions.find(e => e.id === cleanEntity.executionId);
        if (principal && !principal.parentExecutionId) {
          const apensos = data.executions.filter(e => e.parentExecutionId === principal.id);
          if (apensos.length > 0) {
            const now = new Date().toISOString();
            const newEvents = apensos.map(ap => ({
              ...cleanEntity,
              id: uid(),
              executionId: ap.id,
              cdaId: '', // event applies to whole exec, not specific cda
              batchCdaIds: [],
              _inheritedFromParent: principal.id,
              notes: (cleanEntity.notes || '') + ` [propagado do apenso principal ${principal.processNumber||''}]`,
              createdAt: now,
              updatedAt: now
            }));
            setData(prev => ({...prev, prescriptionEvents: [...(prev.prescriptionEvents||[]), ...newEvents]}));
          }
        }
      }

      // Propagate event from IDPJ/Cautelar to linked EFs
      if (cleanEntity.executionId && cleanEntity._propagateToLinkedEFs !== false && !cleanEntity._inheritedFromIDPJ) {
        const idpjExec = data.executions.find(e => e.id === cleanEntity.executionId && (e.processTag === 'idpj' || e.processTag === 'cautelar_fiscal'));
        if (idpjExec && idpjExec.linkedExecutionIds && idpjExec.linkedExecutionIds.length > 0) {
          const linkedEFs = idpjExec.linkedExecutionIds.map(id => data.executions.find(e => e.id === id)).filter(Boolean);
          if (linkedEFs.length > 0) {
            const now = new Date().toISOString();
            const tagLabel = idpjExec.processTag === 'idpj' ? 'IDPJ' : 'Cautelar Fiscal';
            const newEvents = linkedEFs.map(ef => ({
              ...cleanEntity,
              id: uid(),
              executionId: ef.id,
              cdaId: '',
              batchCdaIds: [],
              _inheritedFromIDPJ: idpjExec.id,
              _propagateToLinkedEFs: false, // prevent recursive propagation
              _noApensoPropagation: true, // don't double-propagate to apensos of the EF (user can do that separately)
              notes: (cleanEntity.notes || '') + ` [propagado do ${tagLabel} ${idpjExec.processNumber||''}]`,
              createdAt: now,
              updatedAt: now
            }));
            setData(prev => ({...prev, prescriptionEvents: [...(prev.prescriptionEvents||[]), ...newEvents]}));
          }
        }
      }
    }

    if (wantsWatch && type === 'execution') {
      setTimeout(() => setModal({type:'create',entityType:'watch',initial:{
        processNumber: cleanEntity.processNumber,
        parties: cleanEntity.className || '',
        operationId: cleanEntity.operationId,
        reason: `Origem: ${cleanEntity.className||'execução fiscal'} (${cleanEntity.court||''})`,
        createdAt: new Date().toISOString()
      }}), 50);
    } else {
      setModal(null);
    }
  };
  const handleDelete = (type, id) => {
    const colMap = { operation: 'operations', person: 'people', debt: 'debts', execution: 'executions', measure: 'measures', asset: 'assets', document: 'documents', prescriptionEvent: 'prescriptionEvents', intimation: 'intimations', task: 'tasks', stickyNote: 'stickyNotes', watch: 'watchlist', hearing: 'hearings' };
    remove(colMap[type], id);
  };

  // XLS Import
  const handleXLSImport = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !activeOpId) return;
    const logs = [];
    let importCount = 0;

    // ─── Snapshot pré-import para diff ───
    const preSnap = {
      debts: data.debts.filter(d => d.operationId === activeOpId).map(d => ({ id: d.id, cdaNumber: d.cdaNumber, status: d.status, value: d.value, processNumber: d.processNumber })),
      executions: data.executions.filter(ex => ex.operationId === activeOpId).map(ex => ({ id: ex.id, processNumber: ex.processNumber, status: ex.status })),
      assets: data.assets.filter(a => a.operationId === activeOpId).map(a => ({ id: a.id, description: a.description, registry: a.registry, status: a.status, value: a.value })),
      people: data.people.filter(p => p.operationId === activeOpId).map(p => ({ id: p.id, name: p.name, cpfCnpj: p.cpfCnpj }))
    };

    const processFile = (file) => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const wb = XLSX.read(ev.target.result, { type: 'binary' });
          const fname = file.name.toLowerCase();

          // Detectar planilha de Bens Indisponibilizados — por nome OU por estrutura
          const isBensFile = (() => {
            if (/bens?[ _-]?indisp|bens?[ _-]?bloq|cnib|indispon/.test(fname)) return true;
            // fallback: peek no primeiro sheet
            try {
              const sh = wb.Sheets[wb.SheetNames[0]];
              const peek = XLSX.utils.sheet_to_json(sh, { header: 1, defval: '', raw: false });
              const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
              for (let i = 0; i < Math.min(15, peek.length); i++) {
                const cells = peek[i].map(norm);
                if (cells.includes('tipo') && cells.some(c => c.startsWith('descric')) && cells.some(c => c.includes('registro') || c.includes('matricula'))) return true;
              }
            } catch (e) {}
            return false;
          })();

          if (isBensFile) {
            const res = parseBensXLS(wb);
            logs.push(`💎 ${file.name}: ${res.assets.length} bem(ns) encontrado(s)`);
            res.errors.forEach(er => logs.push(`⚠️ ${er}`));

            res.assets.forEach(a => {
              // Resolver vínculo a pessoa (holderId) pelo CPF/CNPJ titular
              let linkedHolderId = '';
              if (a._titularDoc) {
                const docDigits = a._titularDoc.replace(/\D/g, '');
                const person = data.people.find(p => p.operationId === activeOpId && p.cpfCnpj && p.cpfCnpj.replace(/\D/g, '') === docDigits);
                if (person) linkedHolderId = person.id;
              }
              // Notas — apenas o que sobrar (titular/processo/origem têm campos próprios)
              const noteParts = [];
              if (a._titularRaw && !linkedHolderId) noteParts.push(`Titular informado (não cadastrado): ${a._titularRaw}`);
              if (a.notes) noteParts.push(a.notes);
              const finalNotes = noteParts.join(' · ');
              // Dedup: bem com mesma descrição + registro já existe? → smart merge (nunca sobrescreve CNPJ corrigido)
              const existsAsset = data.assets.find(x => x.operationId === activeOpId
                && (x.description||'').trim() === a.description.trim()
                && (x.registry||'').trim() === (a.registry||'').trim());
              if (existsAsset) {
                // Smart merge: atualiza valor/status se mudou, mas PRESERVA holderId e holderDoc corrigidos
                const updated = { ...existsAsset };
                let assetTouched = false;
                if (a.value && a.value !== existsAsset.value) { updated.value = a.value; assetTouched = true; }
                if (a.status && a.status !== existsAsset.status) { updated.status = a.status; assetTouched = true; }
                if (a._origem && !existsAsset.source) { updated.source = a._origem; assetTouched = true; }
                if (a._processo && !existsAsset.processRef) { updated.processRef = a._processo; assetTouched = true; }
                // NUNCA sobrescreve holderId se já preenchido — o user pode ter corrigido
                if (linkedHolderId && !existsAsset.holderId) { updated.holderId = linkedHolderId; assetTouched = true; }
                if (assetTouched) {
                  updated.updatedAt = new Date().toISOString();
                  upsert('assets', updated);
                  logs.push(`ℹ️ Bem atualizado (merge): ${a.description}${a.registry?` [${a.registry}]`:''}`);
                } else {
                  logs.push(`ℹ️ Bem já existe (sem mudanças): ${a.description}${a.registry?` [${a.registry}]`:''}`);
                }
                return;
              }
              const newAsset = {
                id: uid(),
                operationId: activeOpId,
                subtype: a.subtype,
                description: a.description,
                registry: a.registry || '',
                value: a.value,
                status: a.status,
                source: a._origem || '',
                processRef: a._processo || '',
                holderId: linkedHolderId,
                notes: finalNotes,
                analyticsRegistered: false
              };
              upsert('assets', newAsset);
              importCount++;
              logs.push(`✅ Bem importado: ${a.description}${a.registry?` [${a.registry}]`:''}${linkedHolderId ? ' (vinculado a titular)' : a._titularDoc ? ' ⚠ titular não cadastrado' : ''}`);
            });
            logs.push(`✅ ${res.assets.length} bem(ns) processado(s)`);
          } else if (fname.includes('inscricoes') || fname.includes('inscricao')) {
            const res = parseInscricoesXLS(wb);
            logs.push(`📄 ${file.name}: ${res.debts.length} inscrições encontradas`);
            res.errors.forEach(e => logs.push(`⚠️ ${e}`));

            // Auto-create PJ if not exists
            if (res.debtorName && res.debtorCnpj) {
              const exists = data.people.find(p => p.operationId === activeOpId && p.cpfCnpj && p.cpfCnpj.replace(/\D/g, '') === res.debtorCnpj.replace(/\D/g, ''));
              let personId;
              if (!exists) {
                personId = uid();
                upsert('people', { id: personId, operationId: activeOpId, name: res.debtorName, cpfCnpj: res.debtorCnpj, subtype: 'PJ', role: 'Devedora originária' });
                logs.push(`✅ PJ criada: ${res.debtorName} (${res.debtorCnpj})`);
                importCount++;
              } else {
                personId = exists.id;
                logs.push(`ℹ️ PJ já existe: ${exists.name}`);
              }

              // Import debts — smart merge
              res.debts.forEach(d => {
                const existingDebt = data.debts.find(dd => dd.operationId === activeOpId && dd.cdaNumber === d.cdaNumber);
                if (!existingDebt) {
                  upsert('debts', { ...d, id: uid(), operationId: activeOpId, personId });
                  importCount++;
                } else {
                  // Merge: update system fields, preserve user data
                  const merged = { ...existingDebt };
                  let changed = false;
                  if (d.value && d.value !== existingDebt.value) { merged.value = d.value; changed = true; }
                  if (d.status && d.status !== existingDebt.status) { merged.status = d.status; merged.rawStatus = d.rawStatus; changed = true; }
                  if (d.processNumber && d.processNumber !== existingDebt.processNumber) { merged.processNumber = d.processNumber; changed = true; }
                  if (d.inscriptionDate && !existingDebt.inscriptionDate) { merged.inscriptionDate = d.inscriptionDate; changed = true; }
                  if (changed) {
                    upsert('debts', merged);
                    logs.push(`🔄 CDA atualizada: ${d.cdaNumber}`);
                  } else {
                    logs.push(`ℹ️ CDA sem alteração: ${d.cdaNumber}`);
                  }
                }
              });
              logs.push(`✅ ${res.debts.length} CDAs processadas`);
            }
          } else if (fname.includes('processos') || fname.includes('judicial')) {
            const res = parseProcessosXLS(wb);
            logs.push(`⚖️ ${file.name}: ${res.executions.length} processos encontrados`);
            res.errors.forEach(e => logs.push(`⚠️ ${e}`));

            res.executions.forEach(ex => {
              const exists = data.executions.find(e => e.operationId === activeOpId && sameProc(e.processNumber, ex.processNumber));
              if (!exists) {
                upsert('executions', { ...ex, id: uid(), operationId: activeOpId });
                importCount++;
              } else {
                // Update with new data
                upsert('executions', { ...exists, ...ex, id: exists.id });
                logs.push(`ℹ️ Execução atualizada: ${ex.processNumber}`);
              }
            });
            logs.push(`✅ ${res.executions.length} execuções processadas`);
          } else {
            logs.push(`⚠️ ${file.name}: não foi possível identificar o tipo (use nomes com 'inscricoes' ou 'processos')`);
          }
        } catch (err) {
          logs.push(`❌ Erro em ${file.name}: ${err.message}`);
        }
        resolve();
      };
      reader.readAsBinaryString(file);
    });

    Promise.all(files.map(processFile)).then(() => {
      logs.push(`\n📊 Total importado: ${importCount} registros`);
      // Delay para o setData propagar — então computa diff comparando com snapshot pré-import
      setTimeout(() => {
        setData(curr => {
          const postDebts = curr.debts.filter(d => d.operationId === activeOpId);
          const postExecs = curr.executions.filter(ex => ex.operationId === activeOpId);
          const postAssets = curr.assets.filter(a => a.operationId === activeOpId);
          const postPeople = curr.people.filter(p => p.operationId === activeOpId);
          const preDebtIds = new Set(preSnap.debts.map(d => d.id));
          const preExecIds = new Set(preSnap.executions.map(e => e.id));
          const preAssetIds = new Set(preSnap.assets.map(a => a.id));
          const prePeopleIds = new Set(preSnap.people.map(p => p.id));
          const diff = {
            newDebts: postDebts.filter(d => !preDebtIds.has(d.id)).map(d => ({ id: d.id, cdaNumber: d.cdaNumber, value: d.value })),
            newExecs: postExecs.filter(ex => !preExecIds.has(ex.id)).map(ex => ({ id: ex.id, processNumber: ex.processNumber, className: ex.className })),
            newAssets: postAssets.filter(a => !preAssetIds.has(a.id)).map(a => ({ id: a.id, description: a.description, value: a.value })),
            newPeople: postPeople.filter(p => !prePeopleIds.has(p.id)).map(p => ({ id: p.id, name: p.name, cpfCnpj: p.cpfCnpj })),
            changedDebts: postDebts.filter(d => { const pre = preSnap.debts.find(x => x.id === d.id); return pre && (pre.status !== d.status || pre.value !== d.value); }).map(d => { const pre = preSnap.debts.find(x => x.id === d.id); return { id: d.id, cdaNumber: d.cdaNumber, from: pre.status, to: d.status, valueChanged: pre.value !== d.value }; }),
            changedAssets: postAssets.filter(a => { const pre = preSnap.assets.find(x => x.id === a.id); return pre && pre.status !== a.status; }).map(a => { const pre = preSnap.assets.find(x => x.id === a.id); return { id: a.id, description: a.description, from: pre.status, to: a.status }; })
          };
          const entry = {
            id: uid(),
            type: 'xls',
            timestamp: new Date().toISOString(),
            operationId: activeOpId,
            fileNames: files.map(f => f.name),
            summary: `${importCount} registro(s) importado(s)`,
            counts: { total: importCount },
            diff,
            seen: false
          };
          return {...curr, importLogs: [...(curr.importLogs || []), entry]};
        });
      }, 50);
      setImportResult(logs);
    });
    e.target.value = '';
  };

  // AI Text Import
  const [aiText, setAiText] = useState('');
  const [assetText, setAssetText] = useState('');
  const [importMode, setImportMode] = useState('planilhas'); // planilhas | pdfs | texto — seletor do card unificado de importação
  const [cdaSort, setCdaSort] = useState('status');
  const [cdaPersonFilter, setCdaPersonFilter] = useState('all');
  const [execPersonFilter, setExecPersonFilter] = useState('all');
  const [execSort, setExecSort] = useState('por_devedor');
  const [tlFilter, setTlFilter] = useState('all');
  const [carteiraSort, setCarteiraSort] = useState('valor_desc');
  const [dismissedSuggestions, setDismissedSuggestions] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('nexus_dismissed_suggestions') || '[]')); }
    catch { return new Set(); }
  });
  const dismissSuggestion = (sid) => {
    const next = new Set(dismissedSuggestions); next.add(sid);
    setDismissedSuggestions(next);
    try { localStorage.setItem('nexus_dismissed_suggestions', JSON.stringify([...next])); } catch {}
  };
  const undismissAll = () => {
    setDismissedSuggestions(new Set());
    try { localStorage.removeItem('nexus_dismissed_suggestions'); } catch {}
  };
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());
  const briefingSplitRef = React.useRef(null);
  const briefingDragRef = React.useRef({ active: false, startX: 0, startW: 0 });
  const [briefingRightW, setBriefingRightW] = useState(() => { try { const v = parseFloat(localStorage.getItem('nexus_split_pct')); return v > 15 && v < 65 ? v : 33; } catch { return 33; } });
  const onSplitDragStart = (e) => { e.preventDefault(); const cont = briefingSplitRef.current; if (!cont) return; const rightEl = cont.querySelector('.briefing-split-right'); if (!rightEl) return; briefingDragRef.current = { active: true, startX: e.clientX, startW: rightEl.offsetWidth, contW: cont.offsetWidth }; document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; const handle = e.currentTarget; handle.classList.add('dragging'); const onMove = (ev) => { const d = briefingDragRef.current; if (!d.active) return; const delta = d.startX - ev.clientX; const newW = Math.max(180, Math.min(d.contW * 0.6, d.startW + delta)); const pct = (newW / d.contW) * 100; setBriefingRightW(pct); }; const onUp = () => { briefingDragRef.current.active = false; document.body.style.cursor = ''; document.body.style.userSelect = ''; handle.classList.remove('dragging'); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); try { const cont2 = briefingSplitRef.current; if (cont2) { const rEl = cont2.querySelector('.briefing-split-right'); if (rEl) localStorage.setItem('nexus_split_pct', String((rEl.offsetWidth / cont2.offsetWidth) * 100)); } } catch {} }; document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp); };
  const [selectedDebts, setSelectedDebts] = useState(new Set());
  const [selectedExecs, setSelectedExecs] = useState(new Set());
  const [selectedAssets, setSelectedAssets] = useState(new Set());
  const [assetSort, setAssetSort] = useState('status');
  const [cdaPopup, setCdaPopup] = useState(null);
  // ─── PERF: fatias por operação com cache (invalidado quando 'data' muda) ───
  // Trocar de aba reutiliza listas já filtradas em vez de refiltrar todas as coleções.
  const opSlicesCache = useMemo(() => new Map(), [data]);
  const getOpSlices = (oid) => {
    let s = opSlicesCache.get(oid);
    if (!s) {
      s = {
        people: data.people.filter(p => p.operationId === oid),
        debts: data.debts.filter(d => d.operationId === oid),
        executions: data.executions.filter(e => e.operationId === oid),
        assets: data.assets.filter(a => a.operationId === oid),
        measures: (data.measures || []).filter(m => m.operationId === oid),
      };
      opSlicesCache.set(oid, s);
    }
    return s;
  };
  // Transição não-bloqueante ao trocar de aba/operação (React 18)
  const [isTabSwitching, startTabSwitch] = React.useTransition();
  const toggleGroup = (gk) => setCollapsedGroups(prev => { const n = new Set(prev); if (n.has(gk)) n.delete(gk); else n.add(gk); return n; });
  // Colapso dos cards do Painel (prescrição, agenda) — preferência de UI lembrada entre sessões
  const [painelCollapsed, setPainelCollapsed] = useState(() => { try { return new Set(JSON.parse(localStorage.getItem('nexus_painel_collapsed') || '[]')); } catch { return new Set(); } });
  const togglePainel = (k) => setPainelCollapsed(prev => { const n = new Set(prev); if (n.has(k)) n.delete(k); else n.add(k); try { localStorage.setItem('nexus_painel_collapsed', JSON.stringify([...n])); } catch {} return n; });
  // ─── MESA DE TRABALHO — fila de foco (array ordenado de refs {type,id}); reordenável por arraste ───
  const deskDragRef = useRef(null);
  const isOnDesk = (type, id) => (data.desk || []).some(d => d.type === type && d.id === id);
  const removeFromDesk = (type, id) => setData(prev => ({ ...prev, desk: (prev.desk || []).filter(d => !(d.type === type && d.id === id)) }));
  const deskItemDays = (d) => {
    const coll = d.type === 'intimation' ? data.intimations : d.type === 'task' ? data.tasks : data.hearings;
    const x = (coll || []).find(i => i.id === d.id);
    if (!x) return 99999;
    const dt = d.type === 'intimation' ? x.dateDeadline : d.type === 'task' ? x.dueDate : x.date;
    const dd = daysUntil(dt);
    return dd === null ? 99999 : dd;
  };
  const addToDesk = (type, id, days) => setData(prev => {
    const desk = prev.desk || [];
    if (desk.some(d => d.type === type && d.id === id)) return prev; // já está
    const dd = (days === null || days === undefined) ? 99999 : days;
    const arr = [...desk];
    let idx = arr.findIndex(d => deskItemDays(d) > dd); // insere na posição por urgência
    if (idx === -1) idx = arr.length;
    arr.splice(idx, 0, { type, id });
    return { ...prev, desk: arr };
  });
  const reorderDesk = (from, to) => setData(prev => {
    const arr = [...(prev.desk || [])];
    if (from == null || to == null || from === to || from < 0 || from >= arr.length) return prev;
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    return { ...prev, desk: arr };
  });
  const toggleDesk = (type, id, days) => { if (isOnDesk(type, id)) removeFromDesk(type, id); else addToDesk(type, id, days); };
  const toggleDebt = (id) => setSelectedDebts(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleExec = (id) => setSelectedExecs(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleAsset = (id) => setSelectedAssets(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  // ─── Item 13: Auto-linkify process numbers & CPF/CNPJ in text ───
  // Detects patterns in note text and renders them as clickable links that open the matching entity
  const linkify = (text) => {
    if (!text || typeof text !== 'string') return text;
    // Regex for: process number, CNPJ, CPF
    const pattern = /(\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4})|(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})|(\d{3}\.\d{3}\.\d{3}-\d{2})/g;
    const parts = [];
    let lastIdx = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      if (match.index > lastIdx) parts.push({ type: 'text', value: text.slice(lastIdx, match.index) });
      if (match[1]) parts.push({ type: 'proc', value: match[1] });
      else if (match[2]) parts.push({ type: 'cnpj', value: match[2] });
      else if (match[3]) parts.push({ type: 'cpf', value: match[3] });
      lastIdx = pattern.lastIndex;
    }
    if (lastIdx < text.length) parts.push({ type: 'text', value: text.slice(lastIdx) });
    if (parts.length <= 1 && parts[0]?.type === 'text') return text; // no matches, return plain
    return parts.map((p, i) => {
      if (p.type === 'text') return <React.Fragment key={i}>{p.value}</React.Fragment>;
      const style = { color: 'var(--accent)', textDecoration: 'underline', textDecorationColor: 'rgba(209,154,102,0.3)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 'inherit' };
      if (p.type === 'proc') {
        const exec = data.executions.find(e => sameProc(e.processNumber, p.value));
        if (!exec) return <span key={i} style={{...style, textDecoration:'none', cursor:'default', color:'inherit'}}>{p.value}</span>;
        return <span key={i} style={style} onClick={ev => { ev.stopPropagation(); setModal({type:'edit',entityType:'execution',initial:exec}); }} title={`Abrir processo ${p.value}`}>{p.value}</span>;
      }
      // CPF or CNPJ
      const docDigits = p.value.replace(/\D/g, '');
      const person = data.people.find(pp => pp.cpfCnpj && pp.cpfCnpj.replace(/\D/g, '') === docDigits);
      if (!person) return <span key={i} style={{...style, textDecoration:'none', cursor:'default', color:'inherit'}}>{p.value}</span>;
      return <span key={i} style={style} onClick={ev => { ev.stopPropagation(); setModal({type:'edit',entityType:'person',initial:person}); }} title={`Abrir pessoa: ${person.name}`}>{p.value}</span>;
    });
  };

  const bulkDelete = (col, ids) => {
    // Agrega cascatas de todos os itens selecionados
    const agg = { debts: new Set(), executions: new Set(), measures: new Set(), assets: new Set(), people: new Set(), intimations: new Set(), tasks: new Set(), stickyNotes: new Set(), prescriptionEvents: new Set(), documents: new Set(), importLogs: new Set() };
    ids.forEach(id => { const cas = computeCascade(data, col, id); Object.keys(cas).forEach(k => cas[k].forEach(x => agg[k].add(x))); });
    if (!confirm(`Excluir ${ids.size} registro(s)?${cascadeSummary(agg, col)}`)) return;
    pushUndo(`Exclusão em lote (${ids.size} registros)`);
    setData(prev => {
      let next = prev;
      ids.forEach(id => { next = applyCascade(next, col, id, computeCascade(next, col, id)); });
      return next;
    });
    if (col==='debts') setSelectedDebts(new Set()); if (col==='executions') setSelectedExecs(new Set()); if (col==='assets') setSelectedAssets(new Set());
  };
  const bulkUpdateAssets = (field, value) => {
    setData(prev => ({...prev, assets: prev.assets.map(a => selectedAssets.has(a.id) ? {...a, [field]: value, updatedAt: new Date().toISOString()} : a)}));
    setSelectedAssets(new Set());
  };
  const handleAIImport = () => {
    if (!aiText.trim() || !activeOpId) return;
    const res = parseAIText(aiText);
    const logs = [];
    let count = 0;
    res.people.forEach(p => {
      const exists = data.people.find(pp => pp.operationId === activeOpId && pp.cpfCnpj && pp.cpfCnpj.replace(/\D/g, '') === p.cpfCnpj.replace(/\D/g, ''));
      if (!exists) {
        upsert('people', { ...p, id: uid(), operationId: activeOpId });
        logs.push(`✅ Pessoa: ${p.name} (${p.cpfCnpj}) — ${p.role}`);
        count++;
      } else {
        logs.push(`ℹ️ Já existe: ${exists.name}`);
      }
    });
    res.assets.forEach(a => {
      upsert('assets', { ...a, id: uid(), operationId: activeOpId });
      logs.push(`✅ Bem: ${a.description}`);
      count++;
    });
    res.errors.forEach(e => logs.push(`⚠️ ${e}`));
    logs.push(`\n📊 ${count} registros importados`);
    logImport('ai', {
      fileNames: [],
      summary: `${res.people.length} pessoa(s), ${res.assets.length} bem(ns) via IA`,
      counts: { people: res.people.length, assets: res.assets.length, total: count }
    });
    setImportResult(logs);
    setAiText('');
  };

  // Asset bulk import handler
  const handleAssetBulkImport = () => {
    if (!assetText.trim() || !activeOpId) return;
    const res = parseAssetsBulk(assetText, data.people, activeOpId);
    const logs = [];
    let count = 0;
    res.assets.forEach(a => {
      // Check duplicate by registry + description
      const exists = (data.assets || []).find(x => x.operationId === activeOpId && x.registry && x.registry === a.registry && a.registry !== '');
      if (exists) {
        logs.push(`ℹ️ Já existe (registro ${a.registry}): ${exists.description}`);
      } else {
        upsert('assets', { ...a, id: uid() });
        const holderName = a.holderId ? data.people.find(p => p.id === a.holderId)?.name : a.holderDoc;
        logs.push(`✅ ${ASSET_SUBTYPES[a.subtype] || a.subtype}: ${a.description}${a.registry ? ` [${a.registry}]` : ''}${holderName ? ` — ${holderName}` : ''}${a.source ? ` (${a.source})` : ''}`);
        count++;
      }
    });
    res.errors.forEach(e => logs.push(`⚠️ ${e}`));
    logs.push(`\n📊 ${count} bem(ns) importado(s)`);
    logImport('assets', {
      fileNames: [],
      summary: `${count} bem(ns) importado(s) em lote`,
      counts: { assets: count }
    });
    setImportResult(logs);
    setAssetText('');
  };

  // ─── RELATÓRIO DE PASSAGEM DE SERVIÇO ───
  // Gera um HTML standalone (imprimível) com o estado completo da operação:
  // briefing, processos ativos, prazos abertos, bens constritos, pessoas.
  const generateHandoverReport = (op) => {
    const esc = (s) => String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const opId = op.id;
    const briefing = op.briefing || {};
    const opDebts = getOpSlices(opId).debts;
    const opExecs = getOpSlices(opId).executions;
    const opAssets = getOpSlices(opId).assets;
    const opPeople = getOpSlices(opId).people;
    const opTasks = (data.tasks || []).filter(t => t.operationId === opId && t.status !== 'concluida' && t.status !== 'cancelada');
    const opIntims = (data.intimations || []).filter(x => x.operationId === opId && !x.responseAction && x.status !== 'analisado');
    const activeDebts = opDebts.filter(d => d.status !== 'extinta');
    const totalVal = activeDebts.reduce((s,d) => s + (d.value||0), 0);
    const constricted = opAssets.filter(a => a.status === 'indisponibilidade_ativa');
    const constrVal = constricted.reduce((s,a) => s + (a.value||0), 0);
    const idpjs = opExecs.filter(e => e.processTag === 'idpj' || e.processTag === 'cautelar_fiscal');
    const activeExecs = opExecs.filter(e => e.status !== 'extinta' && e.status !== 'arquivada');
    const prescRisk = activeDebts.map(d => { const pd = d.prescriptionDate || calcAutoPresc(d, opExecs, data.prescriptionEvents || []); return { d, pd, days: daysUntil(pd) }; }).filter(x => x.days !== null && x.days <= 180 && !x.d.prescriptionHandled).sort((a,b) => a.days - b.days);
    const alvos = opPeople.filter(p => (p.operationRole || 'alvo') === 'alvo');
    const row = (cells) => `<tr>${cells.map(x => `<td>${x}</td>`).join('')}</tr>`;
    const section = (title, body) => `<h2>${title}</h2>${body}`;
    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Passagem de Serviço — ${esc(op.name)}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1a1a2e; max-width: 900px; margin: 24px auto; padding: 0 16px; }
  h1 { font-size: 19px; border-bottom: 3px solid #9b2848; padding-bottom: 6px; }
  h2 { font-size: 14px; color: #9b2848; margin-top: 22px; border-bottom: 1px solid #ddd; padding-bottom: 3px; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th, td { border: 1px solid #ccc; padding: 4px 7px; text-align: left; font-size: 11px; vertical-align: top; }
  th { background: #f0ecf2; font-weight: 700; }
  .kpis { display: flex; gap: 14px; flex-wrap: wrap; margin: 12px 0; }
  .kpi { border: 1px solid #ddd; border-radius: 6px; padding: 8px 14px; min-width: 130px; }
  .kpi b { display: block; font-size: 15px; }
  .alert { color: #b3122e; font-weight: 700; }
  .muted { color: #777; }
  .mono { font-family: 'Consolas', monospace; font-size: 10.5px; }
  .free { white-space: pre-wrap; background: #fafafa; border: 1px solid #eee; border-radius: 5px; padding: 8px 10px; }
  .entry { border: 1px solid #e2e2e8; border-left: 3px solid #9b2848; border-radius: 5px; padding: 7px 10px; margin-bottom: 6px; }
  .entry-hd { display: flex; gap: 8px; align-items: center; margin-bottom: 3px; }
  .entry-type { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: #9b2848; }
  .entry-pin { font-size: 9px; color: #987020; font-weight: 700; }
  .entry-dt { font-size: 9.5px; color: #777; font-family: 'Consolas', monospace; margin-left: auto; }
  .entry-body { font-size: 11px; line-height: 1.55; }
  .entry-body ul, .entry-body ol { margin: 2px 0 2px 18px; }
  .idpj-block { border: 1px solid #d8cdd4; border-left: 4px solid #9b2848; border-radius: 6px; padding: 10px 12px; margin-bottom: 12px; background: #fbf7f9; }
  .idpj-head { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 4px; }
  .idpj-tag { font-size: 9px; font-weight: 700; padding: 2px 8px; border-radius: 3px; background: #9b2848; color: #fff; letter-spacing: 0.4px; }
  .idpj-tag.mcf { background: #a06020; }
  .idpj-proc { font-family: 'Consolas', monospace; font-size: 12px; font-weight: 700; }
  .idpj-st { font-size: 9.5px; padding: 1px 7px; border-radius: 3px; background: #ececf0; color: #444; font-weight: 600; }
  .idpj-meta { font-size: 10.5px; color: #555; margin-bottom: 4px; }
  .idpj-stage, .idpj-val { font-size: 11px; margin-bottom: 5px; }
  .idpj-val b { color: #9b2848; font-size: 13px; }
  .stage-tag { display: inline-block; font-size: 9px; font-weight: 700; padding: 1px 7px; border-radius: 3px; margin: 0 4px 2px 0; border: 1px solid; }
  .subtable { width: 100%; border-collapse: collapse; margin-top: 4px; }
  .subtable th, .subtable td { border: 1px solid #ddd; padding: 3px 6px; font-size: 10px; text-align: left; vertical-align: top; }
  .subtable th { background: #f4eef1; font-weight: 700; }
  .idpj-notes { font-size: 10px; color: #333; margin-top: 6px; background: #fff; border: 1px solid #eee; border-radius: 4px; padding: 6px 8px; }
  .idpj-notes ul { margin: 2px 0 0 16px; padding: 0; }
  .proc-notes { background: #fbf9f5; font-size: 10px; color: #333; padding: 5px 10px 5px 22px; border-left: 3px solid #c9a84a; }
  .proc-notes ul { margin: 2px 0 0 16px; padding: 0; }
  .proc-notes strong { color: #8b6d20; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.3px; }
  @media print { body { margin: 8px; } h2 { page-break-after: avoid; } tr { page-break-inside: avoid; } }
</style></head><body>
<h1>Relatório de Passagem de Serviço — ${esc(op.name)}</h1>
<p class="muted">Gerado em ${new Date().toLocaleString('pt-BR')} · NEXUS — Painel de Operações Fiscais · ${esc(op.description || '')}</p>
<div class="kpis">
  <div class="kpi"><b>${fmtCur(totalVal)}</b>Crédito ativo (${activeDebts.length} CDAs)</div>
  <div class="kpi"><b>${activeExecs.length}</b>Processos ativos (${idpjs.length} IDPJ/MCF)</div>
  <div class="kpi"><b>${fmtCur(constrVal)}</b>Bens constritos (${constricted.length})</div>
  <div class="kpi"><b class="${opIntims.length>0?'alert':''}">${opIntims.length}</b>Intimações abertas</div>
  <div class="kpi"><b class="${opTasks.length>0?'alert':''}">${opTasks.length}</b>Tarefas pendentes</div>
  <div class="kpi"><b class="${prescRisk.length>0?'alert':''}">${prescRisk.length}</b>CDAs c/ risco prescricional</div>
</div>
${(() => { const ents = getBriefingEntries(briefing); if (!ents.length) return ''; const sk = (en) => en.eventDate || (en.createdAt || '').slice(0,10); const sorted = [...ents].sort((a,b) => { const p = (!!b.pinned) - (!!a.pinned); if (p) return p; return sk(b).localeCompare(sk(a)); }); return section(`Estratégia e notas (${sorted.length})`, sorted.map(en => { const t = BRIEFING_ENTRY_TYPES[en.type] || BRIEFING_ENTRY_TYPES.observacao; const dt = en.eventDate ? fmtDate(en.eventDate) : (en.createdAt ? fmtDate(en.createdAt.slice(0,10)) : ''); return `<div class="entry"><div class="entry-hd"><span class="entry-type">${esc(t.label)}</span>${en.pinned ? '<span class="entry-pin">📌 fixada</span>' : ''}${dt ? `<span class="entry-dt">${dt}</span>` : ''}</div><div class="entry-body">${en.html || ''}</div></div>`; }).join('')); })()}
${opIntims.length > 0 ? section(`Intimações abertas (${opIntims.length})`, `<table><tr><th>Processo</th><th>Prazo final</th><th>Status</th><th>Evento</th></tr>${opIntims.map(x => row([`<span class="mono">${esc(x.processNumber||'—')}</span>`, x.dateDeadline ? `<span class="${(daysUntil(x.dateDeadline)??99) <= 5 ? 'alert' : ''}">${fmtDate(x.dateDeadline)} (${daysUntil(x.dateDeadline)}d)</span>` : '<span class="muted">sem prazo</span>', esc(INTIM_STATUSES[x.status]?.label || x.status || ''), esc(truncate(x.eventDescription || x.parties || '', 80))])).join('')}</table>`) : ''}
${opTasks.length > 0 ? section(`Tarefas pendentes (${opTasks.length})`, `<table><tr><th>Tarefa</th><th>Vencimento</th><th>Prioridade</th></tr>${opTasks.map(t => row([esc(t.title||''), t.dueDate ? `${fmtDate(t.dueDate)} (${daysUntil(t.dueDate)}d)` : '<span class="muted">—</span>', esc(t.priority||'normal')])).join('')}</table>`) : ''}
${prescRisk.length > 0 ? section(`Risco prescricional ≤180 dias (${prescRisk.length} CDAs)`, `<table><tr><th>Prazo</th><th>CDA</th><th>Processo</th><th>Valor</th></tr>${prescRisk.map(x => row([`<span class="alert">${x.days}d (${fmtDate(x.pd)})</span>`, `<span class="mono">${esc(x.d.cdaNumber||'S/N')}</span>`, `<span class="mono">${esc(x.d.processNumber||'—')}</span>`, fmtCur(x.d.value)])).join('')}</table>`) : ''}
${idpjs.length > 0 ? section(`IDPJ / Cautelares Fiscais (${idpjs.length})`, idpjs.map(ep => { const isIdpj = ep.processTag === 'idpj'; const st = EXEC_STATUSES[ep.status] || {}; const linkedEFIds = ep.linkedExecutionIds || []; const linkedEFExecs = opExecs.filter(e => linkedEFIds.includes(e.id)); const linkedEFProcNums = new Set(linkedEFExecs.map(e => normProc(e.processNumber)).filter(Boolean)); const hubCdas = opDebts.filter(d => d.processNumber && linkedEFProcNums.has(normProc(d.processNumber))); const hubTotalValue = hubCdas.reduce((s,d) => s + (d.value||0), 0); const directCdas = opDebts.filter(d => sameProc(d.processNumber, ep.processNumber)); const directVal = directCdas.reduce((s,d)=>s+(d.value||0),0); const stageHtml = renderStageHtmlV2(briefing, ep, esc); const efTable = linkedEFExecs.length > 0 ? `<table class="subtable"><tr><th>EF abrangida</th><th>Status</th><th>Juízo</th><th>CDAs</th><th>Valor</th></tr>${linkedEFExecs.map(ef => { const efCdas = opDebts.filter(d => sameProc(d.processNumber, ef.processNumber)); const efVal = efCdas.reduce((s,d)=>s+(d.value||0),0); const efSt = EXEC_STATUSES[ef.status] || {}; return `<tr><td class="mono">${esc(ef.processNumber||'—')}</td><td>${esc(efSt.label||ef.status||'')}</td><td>${esc(ef.court||'')}</td><td>${efCdas.length}</td><td>${fmtCur(efVal)}</td></tr>`; }).join('')}</table>` : '<div class="muted" style="font-size:10px;margin-top:4px">Nenhuma execução fiscal vinculada a este incidente.</div>'; const relRecursos = opExecs.filter(r => r.parentExecutionId === ep.id && r.status !== 'extinta'); const recursosTable = relRecursos.length > 0 ? `<table class="subtable"><tr><th>Recurso/incidente vinculado</th><th>Classe</th><th>Status</th><th>Juízo</th></tr>${relRecursos.map(r => { const rSt = EXEC_STATUSES[r.status] || {}; return `<tr><td class="mono">${esc(r.processNumber||'—')}</td><td>${esc(r.className||'')}</td><td>${esc(rSt.label||r.status||'')}</td><td>${esc(r.court||'')}</td></tr>`; }).join('')}</table>` : ''; const notes = ep.notesList || (ep.notes ? [ep.notes] : []); const notesHtml = notes.length > 0 ? `<div class="idpj-notes"><strong>Notas:</strong><ul>${notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul></div>` : ''; return `<div class="idpj-block">` + `<div class="idpj-head"><span class="idpj-tag ${isIdpj?'':'mcf'}">${isIdpj?'IDPJ':'Cautelar Fiscal'}</span><span class="idpj-proc">${esc(ep.processNumber||'—')}</span><span class="idpj-st">${esc(st.label||ep.status||'')}</span>${ep.hasGuarantee?'<span class="idpj-st" style="background:#dff0e6;color:#207848">Garantida</span>':''}</div>` + `<div class="idpj-meta">${esc(ep.court||'Juízo não informado')}${ep.className?' · '+esc(ep.className):''}</div>` + `<div class="idpj-stage"><strong>Estágio processual:</strong> ${stageHtml}</div>` + `<div class="idpj-val"><strong>Valor da causa (EFs abrangidas):</strong> <b>${fmtCur(hubTotalValue)}</b> <span class="muted">(${linkedEFExecs.length} EF${linkedEFExecs.length===1?'':'s'} · ${hubCdas.length} CDAs)</span>${directVal>0?` · CDAs diretas no incidente: <b>${fmtCur(directVal)}</b>`:''}</div>` + efTable + recursosTable + notesHtml + `</div>`; }).join('')) : ''}
${(() => { const byId = Object.fromEntries(opExecs.map(e => [e.id, e])); const idpjByLinkedEF = {}; opExecs.filter(e => e.processTag === 'idpj' || e.processTag === 'cautelar_fiscal').forEach(ip => { (ip.linkedExecutionIds || []).forEach(efId => { if (!idpjByLinkedEF[efId]) idpjByLinkedEF[efId] = ip; }); }); const kindOf = (e) => { const cn = (e.className||'').toLowerCase(); if (e.processTag === 'idpj') return 'idpj'; if (e.processTag === 'cautelar_fiscal') return 'mcf'; if (e.processTag === 'central') return 'central'; if (/embargo/.test(cn)) return 'embargo'; if (/agravo|apela[çc][ãa]o|recurso|reclama[çc][ãa]o constitucional|mandado de seguran[çc]a/.test(cn)) return 'recurso'; return 'ef'; }; const reportExecs = opExecs.filter(e => { if (e.status === 'extinta') return false; const k = kindOf(e); if (k === 'idpj' || k === 'mcf') return false; if (k === 'ef' || k === 'central') return true; const p = byId[e.parentExecutionId]; return !!(p && (kindOf(p) === 'ef' || kindOf(p) === 'central')); }); if (reportExecs.length === 0) return ''; const relOf = (e) => { const parts = []; const k = kindOf(e); if (k === 'central') parts.push('◆ Central'); if (e.parentExecutionId && byId[e.parentExecutionId]) { const p = byId[e.parentExecutionId]; const rel = k === 'embargo' ? 'Embargos de' : k === 'recurso' ? 'Recurso de' : 'Apenso a'; parts.push(`${rel} <span class="mono">${esc(p.processNumber||'—')}</span>`); } if (idpjByLinkedEF[e.id]) { const ip = idpjByLinkedEF[e.id]; const lbl = ip.processTag === 'idpj' ? 'IDPJ' : 'Cautelar'; parts.push(`Abrangida por ${lbl} <span class="mono">${esc(ip.processNumber||'—')}</span>`); } return parts.length ? parts.join('<br>') : '<span class="muted">—</span>'; }; const stOrder = { ativa: 0, suspensa: 1, arquivada: 2 }; const kindOrder = { ef: 0, central: 0, embargo: 1, recurso: 1 }; const sortedExecs = [...reportExecs].sort((a,b) => { const ka = kindOrder[kindOf(a)] ?? 2, kb = kindOrder[kindOf(b)] ?? 2; if (ka !== kb) return ka - kb; return (stOrder[a.status] ?? 3) - (stOrder[b.status] ?? 3); }); const rowsHtml = sortedExecs.map(e => { const efCdas = opDebts.filter(d => sameProc(d.processNumber, e.processNumber)); const efVal = efCdas.reduce((s,d) => s + (d.value||0), 0); const stLabel = EXEC_STATUSES[e.status]?.label || e.status || ''; const stColor = e.status === 'arquivada' || e.status === 'extinta' ? '#999' : e.status === 'suspensa' ? '#a06020' : '#207848'; const dim = (e.status === 'arquivada') ? ' style="opacity:0.6"' : ''; const eNotes = e.notesList || (e.notes ? [e.notes] : []); const mainRow = `<tr${dim}><td class="mono">${esc(e.processNumber||'—')}</td><td>${esc(e.className||'')}</td><td>${esc(e.court||'')}</td><td style="color:${stColor};font-weight:600">${esc(stLabel)}</td><td style="font-size:10px">${relOf(e)}</td><td>${efCdas.length}</td><td>${fmtCur(efVal)}</td></tr>`; const notesRow = eNotes.length > 0 ? `<tr${dim}><td colspan="7" class="proc-notes"><strong>📝 Notas:</strong><ul>${eNotes.map(n => `<li>${esc(n)}</li>`).join('')}</ul></td></tr>` : ''; return mainRow + notesRow; }).join(''); return section(`Processos — execuções fiscais e recursos vinculados (${reportExecs.length})`, `<table><tr><th>Processo</th><th>Classe</th><th>Juízo</th><th>Status</th><th>Relacionamento</th><th>CDAs</th><th>Valor</th></tr>${rowsHtml}</table>`); })()}
${constricted.length > 0 ? section(`Bens com indisponibilidade ativa (${constricted.length} — ${fmtCur(constrVal)})`, `<table><tr><th>Descrição</th><th>Tipo</th><th>Registro/Matrícula</th><th>Titular</th><th>Status</th><th>Analytics</th><th>Origem</th><th>Processo</th><th>Valor</th><th>Notas</th></tr>${constricted.map(a => { const holder = a.holderId ? data.people.find(p => p.id === a.holderId) : null; const holderTxt = holder ? (holder.name + (holder.cpfCnpj ? ' ('+holder.cpfCnpj+')' : '')) : (a.holderDoc || '—'); const aSt = ASSET_STATUSES[a.status]?.label || a.status || '—'; const aNotes = a.notesList || (a.notes ? [a.notes] : []); const notesTxt = aNotes.length > 0 ? aNotes.map(n => esc(n)).join('<br>') : '<span class="muted">—</span>'; return row([esc(truncate(a.description||'', 70)), esc(ASSET_SUBTYPES[a.subtype]||a.subtype||''), `<span class="mono">${esc(a.registry||'—')}</span>`, esc(truncate(holderTxt, 45)), esc(aSt), a.analyticsRegistered ? '✅' : '❌', esc(a.source||'—'), `<span class="mono">${esc(a.processRef||'—')}</span>`, fmtCur(a.value), `<span style="font-size:10px">${notesTxt}</span>`]); }).join('')}</table>`) : ''}
${alvos.length > 0 ? section(`Alvos da operação (${alvos.length})`, `<table><tr><th>Nome</th><th>CPF/CNPJ</th><th>Tipo</th></tr>${alvos.map(p => row([esc(p.name||''), `<span class="mono">${esc(p.cpfCnpj||'—')}</span>`, esc(p.subtype||'')])).join('')}</table>`) : ''}
<p class="muted" style="margin-top:24px">— Fim do relatório. Para imprimir: Ctrl+P. Documento gerado automaticamente pelo NEXUS.</p>
</body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    const safeName = (op.name || 'operacao').replace(/[^a-z0-9_\-]+/gi, '_').slice(0, 40);
    a.download = `passagem_servico_${safeName}_${new Date().toISOString().slice(0, 10)}.html`; a.click();
  };

  // Backup / Restore
  const handleBackup = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `nexus_v2_backup_${new Date().toISOString().slice(0, 10)}.json`; a.click();
  };
  const handleRestore = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imp = JSON.parse(ev.target.result);
        if (imp.operations && confirm('Substituir todos os dados?')) { setData(applyMigrations(imp)); setActiveOpId(null); }
      } catch { alert('Arquivo inválido.'); }
    };
    reader.readAsText(file); e.target.value = '';
  };

  // Stats
  const opStats = useMemo(() => {
    if (!activeOp) return null;
    const debts = data.debts.filter(d => d.operationId === activeOp.id);
    const execs = data.executions.filter(e => e.operationId === activeOp.id);
    const measures = data.measures.filter(m => m.operationId === activeOp.id);
    const assets = data.assets.filter(a => a.operationId === activeOp.id);
    const people = data.people.filter(p => p.operationId === activeOp.id);
    const total = debts.filter(d => d.status !== 'extinta').reduce((s, d) => s + (d.value || 0), 0);
    const guar = debts.filter(d => d.status === 'garantida').reduce((s, d) => s + (d.value || 0), 0);
    const unexec = debts.filter(d => (d.status === 'ativa' || d.status === 'ativa_nao_ajuizavel') && !d.processNumber).length;
    const prescA = debts.filter(d => { const pd = d.prescriptionDate || calcAutoPresc(d, execs, data.prescriptionEvents || []); const dd = daysUntil(pd); return dd !== null && dd <= 180 && !d.prescriptionHandled; }).length;
    const prescExec = execs.filter(e => {
      const evts = (data.prescriptionEvents || []).filter(pe => pe.executionId === e.id);
      if (evts.length > 0) {
        const calc = calcPrescription(e.id, data.prescriptionEvents || []);
        return calc.status === 'critico' || calc.status === 'alerta' || calc.status === 'prescrito';
      }
      const dd = daysUntil(e.prescriptionForecast); return dd !== null && dd <= 365;
    }).length;
    const opIntims = (data.intimations || []).filter(x => x.operationId === activeOp.id);
    const openIntims = opIntims.filter(x => (x.status === 'pendente_analise' || x.status === 'aguardando_subsidios' || x.status === 'peca_edicao') && !x.responseAction).length;
    const overdueIntims = opIntims.filter(x => x.dateDeadline && new Date(x.dateDeadline+'T00:00:00') < new Date() && x.status !== 'analisado' && !x.responseAction).length;
    const openTasks = (data.tasks || []).filter(t => t.operationId === activeOp.id && t.status !== 'concluida' && t.status !== 'cancelada').length;
    const overdueTasks = (data.tasks || []).filter(t => t.operationId === activeOp.id && t.status !== 'concluida' && t.status !== 'cancelada' && t.dueDate && new Date(t.dueDate+'T00:00:00') < new Date()).length;
    // Indisponibilidades — bens com status ativo
    const constrictedAssets = assets.filter(a => a.status === 'indisponibilidade_ativa' || a.status === 'indisponibilidade_requerida');
    const constrictedWithValue = constrictedAssets.filter(a => a.value && a.value > 0);
    const constrictedTotal = constrictedWithValue.reduce((s, a) => s + a.value, 0);
    // indispLabel: valor formatado, "Sem avaliação" ou "Sem bens"
    const indispLabel = constrictedAssets.length === 0 ? 'Sem bens' : constrictedWithValue.length === 0 ? 'Sem avaliação' : fmtCur(constrictedTotal);
    const indispHasValue = constrictedWithValue.length > 0;
    return { total, guar, unexec, prescA, prescExec, debts: debts.length, execs: execs.length, measures: measures.length, assets: assets.length, people: people.length, openIntims, overdueIntims, openTasks, overdueTasks, indispLabel, indispHasValue, indispCount: constrictedAssets.length };
  }, [activeOp, data]);

  const insights = useMemo(() => generateInsights(activeOp, data), [activeOp, data]);

  // ─── Sugestões proativas globais (computadas uma vez, filtradas por operação na aba Insights) ───
  const allSuggestions = useMemo(() => {
    const suggestions = [];
    const ops = data.operations.filter(o => o.status !== 'encerrada');
    const allDebts = data.debts || [];
    const allExecs = data.executions || [];
    const allAssets = data.assets || [];
    const allIntims = data.intimations || [];
    const allTasks = data.tasks || [];
    const allPrescEvts = data.prescriptionEvents || [];

    ops.forEach(op => {
      const opDebts = allDebts.filter(d => d.operationId === op.id);
      const opExecs = allExecs.filter(e => e.operationId === op.id);
      const opAssets = allAssets.filter(a => a.operationId === op.id);

      // CDAs sem execução
      const unexec = opDebts.filter(d => (d.status === 'ativa' || !d.status) && !d.processNumber);
      if (unexec.length > 0) {
        const val = unexec.reduce((s,d) => s + (d.value||0), 0);
        suggestions.push({ id: `cda_unexec:${op.id}`, priority: unexec.length >= 5 ? 'high' : 'medium', icon: '⚖️', opId: op.id, title: `${unexec.length} CDA(s) sem execução`, detail: `Total: ${fmtCur(val)}. Avaliar ajuizamento.`, actionLabel: 'Ver CDAs', action: () => { setActiveOpId(op.id); setViewMode('operation'); setActiveTab('dividas'); } });
      }
      // Bens sem Analytics
      const pending = opAssets.filter(a => !a.analyticsRegistered && a.status === 'indisponibilidade_ativa');
      if (pending.length > 0) {
        suggestions.push({ id: `analytics:${op.id}`, priority: 'low', icon: '💎', opId: op.id, title: `${pending.length} bem(ns) sem registro no Analytics`, detail: 'Registrar para compor base estratégica PGFN.', actionLabel: 'Ver bens', action: () => { setActiveOpId(op.id); setViewMode('operation'); setActiveTab('bens'); } });
      }
      // IDPJs estagnados
      opExecs.filter(e => (e.processTag === 'idpj' || e.processTag === 'cautelar_fiscal')).forEach(idpj => {
        const lastTouch = idpj.updatedAt || idpj.createdAt;
        if (!lastTouch) return;
        const daysSince = Math.floor((Date.now() - new Date(lastTouch).getTime()) / 86400000);
        if (daysSince > 90) {
          suggestions.push({ id: `idpj_stale:${idpj.id}`, priority: daysSince > 180 ? 'high' : 'medium', icon: '🛡️', opId: op.id, title: `${idpj.processTag === 'idpj' ? 'IDPJ' : 'Cautelar'} sem movimentação há ${daysSince}d`, detail: `${truncate(idpj.processNumber || 'S/N', 30)}. Avaliar cobrança de andamento.`, actionLabel: 'Ver processo', action: () => { setActiveOpId(op.id); setViewMode('operation'); setActiveTab('execucoes'); setTimeout(() => setModal({type:'edit',entityType:'execution',initial:idpj}), 100); } });
        }
      });
      // Revisão atrasada
      const rs = reviewStatus(op);
      if (rs.overdue && rs.daysLeft > -999) {
        suggestions.push({ id: `review_overdue:${op.id}`, priority: Math.abs(rs.daysLeft) > 30 ? 'medium' : 'low', icon: '📅', opId: op.id, title: rs.label, detail: `Intervalo: ${REVIEW_INTERVALS[op.reviewInterval||'mensal'].label}.`, actionLabel: 'Abrir operação', action: () => { setActiveOpId(op.id); setViewMode('operation'); } });
      } else if (rs.overdue && rs.daysLeft === -999) {
        suggestions.push({ id: `review_never:${op.id}`, priority: 'low', icon: '📅', opId: op.id, title: 'Nunca revisada', detail: 'Realizar primeira revisão.', actionLabel: 'Abrir operação', action: () => { setActiveOpId(op.id); setViewMode('operation'); } });
      }
      // Garantia baixa
      const activeD = opDebts.filter(d => d.status !== 'extinta');
      const total = activeD.reduce((s,d) => s + (d.value||0), 0);
      const guar = opDebts.filter(d => d.status === 'garantida').reduce((s,d) => s + (d.value||0), 0);
      if (total > 1000000 && total > 0 && (guar / total) < 0.3) {
        suggestions.push({ id: `low_coverage:${op.id}`, priority: 'medium', icon: '🔓', opId: op.id, title: `Cobertura baixa: ${((guar/total)*100).toFixed(0)}%`, detail: `${fmtCur(total)} em crédito, apenas ${fmtCur(guar)} garantido.`, actionLabel: 'Ver bens', action: () => { setActiveOpId(op.id); setViewMode('operation'); setActiveTab('bens'); } });
      }
      // CDAs em risco crítico de prescrição (≤60 dias)
      const critical = activeD.filter(d => { const pd = d.prescriptionDate || calcAutoPresc(d, opExecs, allPrescEvts); const dd = daysUntil(pd); return dd !== null && dd > 0 && dd <= 60 && !d.prescriptionHandled; });
      if (critical.length > 0) {
        const cVal = critical.reduce((s,d) => s + (d.value||0), 0);
        suggestions.push({ id: `presc_crit:${op.id}`, priority: 'high', icon: '⏱', opId: op.id, title: `${critical.length} CDA(s) prescrevendo em ≤60d`, detail: `Risco: ${fmtCur(cVal)}. Agir imediatamente.`, actionLabel: 'Ver prescrição', action: () => { setActiveOpId(op.id); setViewMode('operation'); setActiveTab('prescricao_v2'); } });
      }
    });
    // Intimações vencidas
    const today = new Date(); today.setHours(0,0,0,0);
    (data.intimations || []).filter(x => x.dateDeadline && new Date(x.dateDeadline+'T00:00:00') < today && x.status !== 'analisado' && !x.responseAction).forEach(intim => {
      suggestions.push({ id: `intim_overdue:${intim.id}`, priority: 'high', icon: '🚨', opId: intim.operationId, title: `Intimação VENCIDA há ${Math.abs(daysUntil(intim.dateDeadline))}d`, detail: truncate(intim.processNumber || '', 30), actionLabel: 'Ver', action: () => { setViewMode('intimacoes'); setTimeout(() => setModal({type:'edit',entityType:'intimation',initial:intim}), 100); } });
    });
    // Audiências próximas/vencidas
    (data.hearings || []).filter(h => h.status !== 'realizada' && h.status !== 'cancelada' && h.date).forEach(h => {
      const dd = daysUntil(h.date);
      if (dd === null) return;
      const lbl = h.parties || h.processNumber || 'Audiência';
      if (dd < 0) suggestions.push({ id: `hearing_past:${h.id}`, priority: 'medium', icon: '⚖️', opId: h.operationId, title: `Audiência passada há ${Math.abs(dd)}d: ${truncate(lbl, 26)}`, detail: `${fmtDate(h.date)}${h.time?' '+h.time:''}. Atualizar status.`, actionLabel: 'Ver', action: () => { setViewMode('audiencias'); setTimeout(() => setModal({type:'edit',entityType:'hearing',initial:h}), 100); } });
      else if (dd <= Number(h.remindDays || 7)) suggestions.push({ id: `hearing_soon:${h.id}`, priority: dd <= 2 ? 'high' : 'medium', icon: '⚖️', opId: h.operationId, title: `Audiência em ${dd}d: ${truncate(lbl, 26)}`, detail: `${fmtDate(h.date)}${h.time?' '+h.time:''}.`, actionLabel: 'Ver', action: () => { setViewMode('audiencias'); setTimeout(() => setModal({type:'edit',entityType:'hearing',initial:h}), 100); } });
    });
    // Tarefas próximas/vencidas
    (data.tasks || []).filter(t => t.status !== 'concluida' && t.status !== 'cancelada' && t.dueDate).forEach(t => {
      const dd = daysUntil(t.dueDate);
      if (dd === null) return;
      if (dd < 0) suggestions.push({ id: `task_overdue:${t.id}`, priority: 'high', icon: '⚠️', opId: t.operationId, title: `Tarefa VENCIDA há ${Math.abs(dd)}d: ${truncate(t.title, 30)}`, detail: fmtDate(t.dueDate), actionLabel: 'Ver', action: () => { if (t.operationId) { setActiveOpId(t.operationId); setViewMode('operation'); setActiveTab('tarefas'); } setTimeout(() => setModal({type:'edit',entityType:'task',initial:t}), 100); } });
      else if (dd <= 10) suggestions.push({ id: `task_due_soon:${t.id}`, priority: dd <= 3 ? 'high' : 'medium', icon: '✓', opId: t.operationId, title: `Tarefa em ${dd}d: ${truncate(t.title, 30)}`, detail: fmtDate(t.dueDate), actionLabel: 'Ver', action: () => { if (t.operationId) { setActiveOpId(t.operationId); setViewMode('operation'); setActiveTab('tarefas'); } setTimeout(() => setModal({type:'edit',entityType:'task',initial:t}), 100); } });
    });
    // Pessoas em múltiplas operações
    const personDocMap = {};
    (data.people || []).forEach(p => { if (!p.cpfCnpj) return; const doc = p.cpfCnpj.replace(/\D/g, ''); if (!doc) return; if (!personDocMap[doc]) personDocMap[doc] = []; personDocMap[doc].push(p); });
    Object.entries(personDocMap).forEach(([doc, people]) => {
      const opsSet = new Set(people.map(p => p.operationId));
      if (opsSet.size >= 2) {
        const name = people[0].name;
        const opNames = [...opsSet].map(id => data.operations.find(o => o.id === id)?.name).filter(Boolean);
        [...opsSet].forEach(opId => {
          suggestions.push({ id: `person_cross:${doc}:${opId}`, priority: opsSet.size >= 3 ? 'high' : 'medium', icon: '🔗', opId, title: `${name} aparece em ${opsSet.size} operações`, detail: opNames.join(' · '), actionLabel: null });
        });
      }
    });
    return suggestions;
  }, [data]);

  const getMeasureInitial = (m) => {
    if (!m) return {};
    return { ...m, linkedPeopleIds: (data.links.measurePeople || []).filter(l => l.measureId === m.id).map(l => l.personId), linkedAssetIds: (data.links.measureAssets || []).filter(l => l.measureId === m.id).map(l => l.assetId) };
  };

  // ─── Tab content rendering ───
  const renderTab = () => {
    if (!activeOp) return null;
    const opId = activeOp.id;

    if (activeTab === 'notas') {
      const notes = (data.stickyNotes || []).filter(n => n.operationId === opId).sort((a,b) => (b.updatedAt||'').localeCompare(a.updatedAt||''));

      // ═══ BRIEFING: Resumo Operacional ═══
      const briefing = activeOp.briefing || {};
      const updateBriefing = (field, value) => {
        upsert('operations', { ...activeOp, briefing: { ...briefing, [field]: value } });
      };
      const opDebts = getOpSlices(opId).debts;
      const opExecs = getOpSlices(opId).executions;
      const opAssets = getOpSlices(opId).assets;
      const opTasks = (data.tasks || []).filter(t => t.operationId === opId && t.status !== 'concluida' && t.status !== 'cancelada');
      const opIntims = (data.intimations || []).filter(x => x.operationId === opId && !x.responseAction);

      const activeDebts = opDebts.filter(d => d.status !== 'extinta');
      const totalVal = activeDebts.reduce((s,d) => s + (d.value||0), 0);
      const guarVal = opDebts.filter(d => d.status === 'garantida').reduce((s,d) => s + (d.value||0), 0);
      const constrictedAssets = opAssets.filter(a => a.status === 'indisponibilidade_ativa');
      const idpjs = opExecs.filter(e => e.processTag === 'idpj' || e.processTag === 'cautelar_fiscal');
      const mainEFs = opExecs
        .filter(e => (!e.processTag || e.processTag === 'normal') && !e.parentExecutionId && e.status !== 'extinta' && e.status !== 'arquivada')
        .map(ef => ({ ...ef, _cdaValue: opDebts.filter(d => sameProc(d.processNumber, ef.processNumber)).reduce((s,d) => s + (d.value||0), 0) }))
        .sort((a, b) => b._cdaValue - a._cdaValue);
      const prescRisk = activeDebts.filter(d => {
        const pd = d.prescriptionDate || calcAutoPresc(d, opExecs, data.prescriptionEvents || []);
        const dd = daysUntil(pd);
        return dd !== null && dd <= 180 && !d.prescriptionHandled;
      });

      return (<div className="entity-area">
        {/* ═══ IMPORT DIFF (full width, before split) ═══ */}
        {(() => {
          const opLogs = (data.importLogs || []).filter(l => l.operationId === opId && l.diff && !l.seen).sort((a,b) => (b.timestamp||'').localeCompare(a.timestamp||''));
          if (opLogs.length === 0) return null;
          const lastLog = opLogs[0];
          const d = lastLog.diff;
          const totalChanges = (d.newDebts?.length||0) + (d.newExecs?.length||0) + (d.newAssets?.length||0) + (d.newPeople?.length||0) + (d.changedDebts?.length||0) + (d.changedAssets?.length||0);
          if (totalChanges === 0) return null;
          return (<div style={{marginBottom:16,background:'rgba(14,23,38,0.95)',border:'1px solid rgba(91,143,217,0.2)',borderLeft:'4px solid var(--blue)',borderRadius:'var(--radius-lg)',overflow:'hidden'}}>
            <div style={{padding:'12px 16px',borderBottom:'1px solid rgba(91,143,217,0.15)',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:'var(--blue)'}}>📥 Novidades do último import</div>
                <div style={{fontSize:10,color:'var(--text-muted)',marginTop:2}}>{new Date(lastLog.timestamp).toLocaleString('pt-BR')} · {(lastLog.fileNames||[]).join(', ')}</div>
              </div>
              <button className="btn-secondary btn-xs" style={{fontSize:10}} onClick={() => {
                setData(prev => ({...prev, importLogs: (prev.importLogs||[]).map(l => l.id === lastLog.id ? {...l, seen: true} : l)}));
              }}>✓ Marcar como visto</button>
            </div>
            <div style={{padding:'12px 16px',display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:12}}>
              {d.newDebts?.length > 0 && <div>
                <div style={{fontSize:9,fontWeight:700,color:'var(--green)',textTransform:'uppercase',letterSpacing:0.5,marginBottom:4}}>+ {d.newDebts.length} CDA(s) nova(s)</div>
                {d.newDebts.slice(0,5).map(x => <div key={x.id} style={{fontSize:10,color:'var(--text-secondary)',lineHeight:1.5}}>{x.cdaNumber || 'CDA'} — {fmtCur(x.value||0)}</div>)}
                {d.newDebts.length > 5 && <div style={{fontSize:9,color:'var(--text-muted)'}}>+{d.newDebts.length-5}</div>}
              </div>}
              {d.newExecs?.length > 0 && <div>
                <div style={{fontSize:9,fontWeight:700,color:'var(--green)',textTransform:'uppercase',letterSpacing:0.5,marginBottom:4}}>+ {d.newExecs.length} processo(s) novo(s)</div>
                {d.newExecs.slice(0,5).map(x => <div key={x.id} style={{fontSize:10,color:'var(--text-secondary)',lineHeight:1.5,fontFamily:'var(--font-mono)'}}>{truncate(x.processNumber||'S/N', 22)}</div>)}
                {d.newExecs.length > 5 && <div style={{fontSize:9,color:'var(--text-muted)'}}>+{d.newExecs.length-5}</div>}
              </div>}
              {d.newAssets?.length > 0 && <div>
                <div style={{fontSize:9,fontWeight:700,color:'var(--green)',textTransform:'uppercase',letterSpacing:0.5,marginBottom:4}}>+ {d.newAssets.length} bem(ns) novo(s)</div>
                {d.newAssets.slice(0,5).map(x => <div key={x.id} style={{fontSize:10,color:'var(--text-secondary)',lineHeight:1.5}}>{truncate(x.description||'Bem', 30)} {x.value ? `· ${fmtCur(x.value)}` : ''}</div>)}
                {d.newAssets.length > 5 && <div style={{fontSize:9,color:'var(--text-muted)'}}>+{d.newAssets.length-5}</div>}
              </div>}
              {d.newPeople?.length > 0 && <div>
                <div style={{fontSize:9,fontWeight:700,color:'var(--green)',textTransform:'uppercase',letterSpacing:0.5,marginBottom:4}}>+ {d.newPeople.length} pessoa(s) nova(s)</div>
                {d.newPeople.slice(0,5).map(x => <div key={x.id} style={{fontSize:10,color:'var(--text-secondary)',lineHeight:1.5}}>{truncate(x.name, 28)}</div>)}
                {d.newPeople.length > 5 && <div style={{fontSize:9,color:'var(--text-muted)'}}>+{d.newPeople.length-5}</div>}
              </div>}
              {d.changedDebts?.length > 0 && <div>
                <div style={{fontSize:9,fontWeight:700,color:'var(--yellow)',textTransform:'uppercase',letterSpacing:0.5,marginBottom:4}}>~ {d.changedDebts.length} CDA(s) alterada(s)</div>
                {d.changedDebts.slice(0,5).map(x => <div key={x.id} style={{fontSize:10,color:'var(--text-secondary)',lineHeight:1.5}}>{x.cdaNumber || 'CDA'}: <span style={{color:'var(--text-muted)'}}>{(DEBT_STATUSES[x.from]||{}).label || x.from}</span> → <span style={{color:'var(--text-primary)',fontWeight:600}}>{(DEBT_STATUSES[x.to]||{}).label || x.to}</span></div>)}
                {d.changedDebts.length > 5 && <div style={{fontSize:9,color:'var(--text-muted)'}}>+{d.changedDebts.length-5}</div>}
              </div>}
              {d.changedAssets?.length > 0 && <div>
                <div style={{fontSize:9,fontWeight:700,color:'var(--yellow)',textTransform:'uppercase',letterSpacing:0.5,marginBottom:4}}>~ {d.changedAssets.length} bem(ns) alterado(s)</div>
                {d.changedAssets.slice(0,5).map(x => <div key={x.id} style={{fontSize:10,color:'var(--text-secondary)',lineHeight:1.5}}>{truncate(x.description, 25)}: <span style={{color:'var(--text-muted)'}}>{(ASSET_STATUSES[x.from]||{}).label || x.from}</span> → <span style={{color:'var(--text-primary)',fontWeight:600}}>{(ASSET_STATUSES[x.to]||{}).label || x.to}</span></div>)}
                {d.changedAssets.length > 5 && <div style={{fontSize:9,color:'var(--text-muted)'}}>+{d.changedAssets.length-5}</div>}
              </div>}
            </div>
          </div>);
        })()}

        {/* ═══ SPLIT LAYOUT: Briefing (left) + Anotações (right) ═══ */}
        <div className="briefing-split" ref={briefingSplitRef}>
          <div className="briefing-split-left">

            {/* ─── ACCORDION: Estratégia e notas (open by default) ─── */}
            <div className="b-acc">
              <div className="b-acc-hdr" onClick={() => toggleGroup('bacc-est')}>
                <div className="b-acc-left">
                  <span className={`b-acc-icon ${!collapsedGroups.has('bacc-est')?'open':''}`}>▸</span>
                  <span className="b-acc-title">Estratégia e notas</span>
                </div>
              </div>
              {!collapsedGroups.has('bacc-est') && <div className="b-acc-body">
                {/* Links + Nova entrada + filtro na MESMA linha (links via leftTools do painel) */}
                <BriefingStrategyPanel op={activeOp} upsert={upsert} leftTools={(() => {
                    const links = briefing.externalLinks || [];
                    const migrated = [...links];
                    if (briefing.notebookLmUrl && !links.some(l => l.url === briefing.notebookLmUrl)) migrated.push({ label: 'NotebookLM', url: briefing.notebookLmUrl, icon: '📓' });
                    if (briefing.docUrl && !links.some(l => l.url === briefing.docUrl)) migrated.push({ label: 'Resumos e anotações', url: briefing.docUrl, icon: '📄' });
                    const setLinks = (newLinks) => updateBriefing('externalLinks', newLinks);
                    const removeLink = (idx) => { const next = [...migrated]; next.splice(idx, 1); setLinks(next); };
                    const autoLabel = (url) => {
                      if (/notebooklm/i.test(url)) return { label: 'NotebookLM', icon: '📓' };
                      if (/docs\.google\.com\/document/i.test(url)) return { label: 'Google Doc', icon: '📄' };
                      if (/docs\.google\.com\/spreadsheet/i.test(url)) return { label: 'Google Sheets', icon: '📊' };
                      if (/docs\.google\.com\/presentation/i.test(url)) return { label: 'Google Slides', icon: '📽' };
                      if (/drive\.google\.com/i.test(url)) return { label: 'Google Drive', icon: '📁' };
                      if (/eproc|pje|projudi/i.test(url)) return { label: 'eProc', icon: '⚖️' };
                      if (/gov\.br/i.test(url)) return { label: 'Gov.br', icon: '🏛' };
                      try { return { label: new URL(url).hostname.replace('www.','').split('.')[0], icon: '🔗' }; } catch { return { label: 'Link', icon: '🔗' }; }
                    };
                    const addLink = (url) => {
                      if (!url) return;
                      const auto = autoLabel(url);
                      const label = prompt('Nome do link:', auto.label);
                      if (label === null) return;
                      setLinks([...migrated, { label: label || auto.label, url, icon: auto.icon }]);
                    };
                    const addKey = 'linkadd-'+opId; const addOpen = collapsedGroups.has(addKey);
                    return (<div style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:6}}>
                      <span style={{fontSize:12,color:'var(--text-muted)'}} title="Links externos">🔗</span>
                      {migrated.map((lnk, idx) => (
                        <span key={idx} style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:10,padding:'2px 8px',background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:999}}>
                          <a href={lnk.url} target="_blank" rel="noopener noreferrer" style={{color:'var(--blue)',textDecoration:'none',fontWeight:600}} onClick={e => e.stopPropagation()}>{lnk.icon || '🔗'} {lnk.label}</a>
                          <span style={{cursor:'pointer',fontSize:10,color:'var(--text-muted)',opacity:0.5}} onClick={() => removeLink(idx)}>✕</span>
                        </span>
                      ))}
                      {addOpen
                        ? <input autoFocus placeholder="colar URL e Enter" onKeyDown={e => { if (e.key === 'Enter' && e.target.value.trim()) { addLink(e.target.value.trim()); e.target.value = ''; } else if (e.key === 'Escape') { toggleGroup(addKey); } }} onBlur={() => toggleGroup(addKey)} style={{width:160,fontSize:10,padding:'3px 8px',background:'var(--bg-deep)',color:'var(--text-primary)',border:'1px dashed var(--border)',borderRadius:999,boxSizing:'border-box'}} />
                        : <button type="button" onClick={() => toggleGroup(addKey)} title="Adicionar link" style={{fontSize:12,lineHeight:1,padding:'1px 9px',border:'1px dashed var(--border)',borderRadius:999,background:'transparent',color:'var(--text-muted)',cursor:'pointer'}}>+</button>}
                    </div>);
                })()} />
              </div>}
            </div>

            {/* ─── ACCORDION: Processos (mapa unificado — incidentes + centrais + EFs, com régua de estágio) ─── */}
            {(idpjs.length > 0 || mainEFs.length > 0 || opExecs.some(e => e.processTag === 'central')) && (() => {
              const coveredMap = {};
              idpjs.forEach(ip => { (ip.linkedExecutionIds || []).forEach(efId => { coveredMap[efId] = ip; }); });
              const coveredEFs = mainEFs.filter(ef => coveredMap[ef.id]);
              // Rol "Sem incidente": só processos da classe Execução Fiscal (exclui MCF/IDPJ duplicados, embargos, recursos e outras classes)
              const isEFClass = (e) => /^\s*execu[cç][aã]o\s+fiscal/i.test(e.className || '');
              const uncoveredEFs = mainEFs.filter(ef => !coveredMap[ef.id] && isEFClass(ef));
              const coveredTotal = coveredEFs.reduce((s,ef) => s + (ef._cdaValue||0), 0);
              const uncoveredTotal = uncoveredEFs.reduce((s,ef) => s + (ef._cdaValue||0), 0);
              const grand = coveredTotal + uncoveredTotal;
              const pct = grand > 0 ? Math.round(coveredTotal / grand * 100) : 0;
              const efsByIncident = {};
              coveredEFs.forEach(ef => { const id = coveredMap[ef.id].id; (efsByIncident[id] = efsByIncident[id] || []).push(ef); });

              // Processos CENTRAIS (EF marcada como central) — geram card próprio com régua e EFs apensas
              const centrais = opExecs.filter(e => e.processTag === 'central' && e.status !== 'extinta' && e.status !== 'arquivada');
              const apensosByCentral = {};
              centrais.forEach(c => {
                apensosByCentral[c.id] = opExecs
                  .filter(e => e.parentExecutionId === c.id)
                  .map(ef => ({ ...ef, _cdaValue: opDebts.filter(d => sameProc(d.processNumber, ef.processNumber)).reduce((s,d) => s + (d.value||0), 0) }));
              });

              const getRecords = (id) => getStageRecords(briefing, id); // helper compartilhado com a Passagem de Serviço
              const setRec = (id, sk, patch) => {
                const recs = getRecords(id); const cur = recs[sk] || {};
                updateBriefing('processStageV2', { ...(briefing.processStageV2||{}), [id]: { ...recs, [sk]: { ...cur, ...patch } } });
              };
              const delRec = (id, sk) => {
                const recs = { ...getRecords(id) }; delete recs[sk];
                updateBriefing('processStageV2', { ...(briefing.processStageV2||{}), [id]: recs });
              };
              const efRow = (ef, nested) => {
                const est = EXEC_STATUSES[ef.status] || {};
                return (<div key={ef.id} className="briefing-proc-item" style={nested?{marginLeft:14,borderLeft:'2px solid var(--border)',borderRadius:0}:{}} onClick={() => setModal({type:'edit',entityType:'execution',initial:ef})}>
                  {nested && <span style={{color:'var(--text-muted)',fontSize:10,flexShrink:0}}>↳</span>}
                  <span style={{fontFamily:'var(--font-mono)',fontSize:10,flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',cursor:'copy'}} title="Clique para copiar" onClick={ev => { ev.stopPropagation(); navigator.clipboard.writeText(ef.processNumber).then(() => { ev.target.style.color='var(--green)'; setTimeout(()=>ev.target.style.color='',1200); }); }}>{ef.processNumber}</span>
                  {ef._cdaValue > 0 && <span style={{fontSize:9,color:'var(--text-muted)',fontFamily:'var(--font-mono)'}}>{fmtCur(ef._cdaValue)}</span>}
                  <span className={`badge ${est.badge||''}`} style={{fontSize:8}}>{est.label}</span>
                  {ef.hasGuarantee && <span className="badge badge-muted" style={{fontSize:8,color:'rgba(34,197,94,0.6)'}}>GAR</span>}
                </div>);
              };
              // Badge por tipo de processo-mãe (IDPJ/MCF/Central) e rótulo dos filhos (EF abrangida / apensa)
              const badgeFor = (tag) => tag === 'idpj' ? { label: 'IDPJ', color: 'var(--red)', bg: 'rgba(244,63,94,0.2)', unit: 'EF' }
                : tag === 'cautelar_fiscal' ? { label: 'MCF', color: 'var(--yellow)', bg: 'rgba(245,158,11,0.2)', unit: 'EF' }
                : { label: '◆ Central', color: 'var(--purple)', bg: 'rgba(122,139,163,0.2)', unit: 'apensa' };
              // Cards do mapa: incidentes (IDPJ/MCF) + centrais — cada um com seu conjunto de fases e seus filhos
              const cards = [
                ...idpjs.map(ip => ({ ip, STAGES: PROCESS_STAGES, STAGE_KEYS: PROCESS_STAGE_KEYS, apensos: efsByIncident[ip.id] || [] })),
                ...centrais.map(c => ({ ip: c, STAGES: CENTRAL_STAGES, STAGE_KEYS: CENTRAL_STAGE_KEYS, apensos: apensosByCentral[c.id] || [] })),
              ];

              return (<div className="b-acc">
                <div className="b-acc-hdr" onClick={() => toggleGroup('bacc-proc')}>
                  <div className="b-acc-left">
                    <span className={`b-acc-icon ${collapsedGroups.has('bacc-proc')?'open':''}`}>▸</span>
                    <span className="b-acc-title">Processos</span>
                    <span className="b-acc-count">{idpjs.length + centrais.length + coveredEFs.length + uncoveredEFs.length}</span>
                  </div>
                  {grand > 0 && <div className="b-acc-right"><span style={{fontSize:10,fontFamily:'var(--font-mono)',color:'var(--text-muted)'}}>{pct}% coberto</span></div>}
                </div>
                {collapsedGroups.has('bacc-proc') && <div className="b-acc-body">
                  {grand > 0 && <div style={{marginBottom:10}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:'var(--text-muted)',marginBottom:3}}>
                      <span>Cobertura por incidentes</span>
                      <span style={{fontFamily:'var(--font-mono)'}}>{fmtCur(coveredTotal)} / {fmtCur(grand)} · {pct}%</span>
                    </div>
                    <div style={{height:6,borderRadius:999,background:'var(--bg-elevated)',overflow:'hidden'}}><div style={{width:pct+'%',height:'100%',background:'var(--green)'}} /></div>
                  </div>}

                  {cards.map(({ ip, STAGES, STAGE_KEYS, apensos }) => {
                    const est = EXEC_STATUSES[ip.status] || {};
                    const recs = getRecords(ip.id);
                    const bm = badgeFor(ip.processTag);
                    const myEFs = apensos;
                    const covVal = myEFs.reduce((s,ef) => s + (ef._cdaValue||0), 0);
                    return (<div key={ip.id} style={{marginBottom:10,padding:'8px 10px',background:'transparent',border:'1px solid var(--border-light, var(--border))',borderRadius:6,opacity:ip.status==='extinta'?0.5:1}}>
                      <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                        <span style={{fontSize:9,padding:'1px 6px',borderRadius:3,fontWeight:700,background:bm.bg,color:bm.color}}>{bm.label}</span>
                        <span style={{fontFamily:'var(--font-mono)',fontSize:10,cursor:'copy'}} title="Clique para copiar" onClick={ev => { ev.stopPropagation(); navigator.clipboard.writeText(ip.processNumber).then(() => { ev.target.style.color='var(--green)'; setTimeout(()=>ev.target.style.color='',1200); }); }}>{ip.processNumber}</span>
                        <span className={`badge ${est.badge||''}`} style={{fontSize:8,cursor:'pointer'}} onClick={() => setModal({type:'edit',entityType:'execution',initial:ip})}>{est.label}</span>
                        <span style={{fontSize:9,color:'var(--text-muted)',marginLeft:'auto'}}>{myEFs.length} {bm.unit}{myEFs.length!==1?'s':''}{covVal>0?' · '+fmtCur(covVal):''}</span>
                      </div>

                      {/* Régua de fases — clique numa fase para abrir o popup; data/evento aparecem sob o nome */}
                      <div style={{display:'flex',alignItems:'flex-start',margin:'12px 2px 4px'}}>
                        {STAGE_KEYS.map((k,i,arr) => {
                          const sd = STAGES[k];
                          const rec = recs[k];
                          const recursos = sd.multiRecurso ? getRecursos(rec) : null;
                          const has = sd.multiRecurso ? recursos.length > 0 : !!rec;
                          const c = sd.multiRecurso ? recursoColor(recursos) : stageRecColor(rec);
                          const popKey = 'stagepop-'+ip.id+'-'+k;
                          const info = sd.multiRecurso
                            ? (recursos.length ? recursos.length + (recursos.length===1?' recurso':' recursos') : '')
                            : (has && (rec.date || rec.evento) ? `${rec.date?fmtDate(rec.date):''}${rec.date&&rec.evento?' · ':''}${rec.evento?'Ev. '+rec.evento:''}` : '');
                          return (<React.Fragment key={k}>
                            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,flex:1,cursor:'pointer'}} onClick={() => toggleGroup(popKey)} title={has?sd.label+' — clique para editar':'Registrar '+sd.label}>
                              <div style={{width:13,height:13,borderRadius:'50%',flexShrink:0,background:has?c:'transparent',border:`2px solid ${has?c:'var(--border-light, var(--border))'}`}} />
                              <span style={{fontSize:8,textAlign:'center',lineHeight:1.15,color:has?c:'var(--text-muted)',fontWeight:has?700:400}}>{sd.label}</span>
                              {info && <span style={{fontSize:7,textAlign:'center',lineHeight:1.1,color:'var(--text-muted)',fontFamily:'var(--font-mono)'}}>{info}</span>}
                            </div>
                            {i < arr.length-1 && <div style={{height:2,flex:1,marginTop:6,background:has ? 'var(--text-muted)' : 'var(--border)'}} />}
                            {collapsedGroups.has(popKey) && <StagePopup key={popKey} sd={sd} rec={rec}
                              onCommit={(patch) => setRec(ip.id, k, patch)}
                              onDelete={() => { delRec(ip.id, k); toggleGroup(popKey); }}
                              onAddNote={(text) => { upsert('executions', { ...ip, notesList: [...(ip.notesList||[]), text] }); alert('Registrado como nota no card.'); }}
                              onClose={() => toggleGroup(popKey)} />}
                          </React.Fragment>);
                        })}
                      </div>

                      {myEFs.length > 0 && <div style={{marginTop:8,display:'flex',flexDirection:'column',gap:4}}>
                        {myEFs.slice(0,8).map(ef => efRow(ef, true))}
                        {myEFs.length > 8 && <div style={{fontSize:9,color:'var(--text-muted)',marginLeft:14}}>+{myEFs.length-8} {bm.unit}(s)</div>}
                      </div>}

                      {/* Notas do processo (complementares — requerimentos pendentes, observações). Grava no notesList da execução; separado do feed da operação. */}
                      {(() => {
                        const rawNotes = ip.notesList || (ip.notes ? [ip.notes] : []);
                        const cardNotes = rawNotes.map((n, idx) => ({ n, idx })).filter(({ n }) => !/^[\s·]*classe:\s/i.test(n || ''));
                        const setNotes = (arr) => upsert('executions', { ...ip, notesList: arr });
                        const addKey = 'cardnote-' + ip.id; const addOpen = collapsedGroups.has(addKey);
                        return (<div style={{marginTop:8,paddingTop:8,borderTop:'1px solid var(--border)'}}>
                          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:cardNotes.length?5:0}}>
                            <span style={{fontSize:9,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:0.5}}>📝 Notas</span>
                            {!addOpen && <button type="button" onClick={() => toggleGroup(addKey)} title="Adicionar nota ao processo" style={{fontSize:12,lineHeight:1,padding:'0 8px',border:'1px dashed var(--border)',borderRadius:999,background:'transparent',color:'var(--text-muted)',cursor:'pointer'}}>+</button>}
                          </div>
                          {cardNotes.length > 0 && <div style={{display:'flex',flexDirection:'column',gap:3,marginBottom:addOpen?6:0}}>
                            {cardNotes.map(({ n, idx }) => (
                              <div key={idx} style={{display:'flex',alignItems:'flex-start',gap:6,fontSize:11,color:'var(--text-secondary)',lineHeight:1.45}}>
                                <span style={{color:'var(--text-muted)',flexShrink:0}}>•</span>
                                <span style={{flex:1,minWidth:0,wordBreak:'break-word'}}>{linkify(n)}</span>
                                <span style={{cursor:'pointer',color:'var(--text-muted)',opacity:0.5,flexShrink:0,fontSize:10}} title="Remover nota" onClick={() => setNotes(rawNotes.filter((_, j) => j !== idx))}>✕</span>
                              </div>
                            ))}
                          </div>}
                          {addOpen && <input autoFocus placeholder="nova nota + Enter" onKeyDown={e => { if (e.key === 'Enter' && e.target.value.trim()) { setNotes([...rawNotes, e.target.value.trim()]); e.target.value = ''; } else if (e.key === 'Escape') { toggleGroup(addKey); } }} onBlur={() => toggleGroup(addKey)} style={{width:'100%',fontSize:11,padding:'4px 8px',background:'var(--bg-input)',color:'var(--text-primary)',border:'1px solid var(--border)',borderRadius:4,boxSizing:'border-box'}} />}
                        </div>);
                      })()}
                    </div>);
                  })}

                  {uncoveredEFs.length > 0 && <div style={{marginTop:cards.length>0?6:0}}>
                    <div style={{fontSize:9,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:0.5,padding:'4px 2px'}}>Sem incidente · {uncoveredEFs.length} EF{uncoveredEFs.length!==1?'s':''}{uncoveredTotal>0?' · '+fmtCur(uncoveredTotal):''}</div>
                    <div style={{display:'flex',flexDirection:'column',gap:4}}>
                      {uncoveredEFs.slice(0,8).map(ef => efRow(ef, false))}
                      {uncoveredEFs.length > 8 && <div style={{fontSize:9,color:'var(--text-muted)'}}>+{uncoveredEFs.length-8} EF(s)</div>}
                    </div>
                  </div>}
                </div>}
              </div>);
            })()}

            {/* EFs abrangidas / não abrangidas agora vivem dentro do acordeão "Processos" acima */}

            {/* ─── ACCORDION: Checklists (collapsed by default) ─── */}
            {(() => {
              const chk = briefing.checklists || {};
              const toggle = (key) => updateBriefing('checklists', { ...chk, [key]: !chk[key] });
              const idpjItems = [['idpj_efs','EFs da inicial abrangidas'],['idpj_requeridos','Requeridos incluídos'],['idpj_preclusao','Sem termo "preclusão"'],['idpj_formulario','Formulário de indisponib.'],['idpj_saj','Corresponsáveis no SAJ']];
              const vistaItems = [['vista_triar','Triar a operação'],['vista_formulario','Formulário de indisponib.'],['vista_bens','Bens do IDPJ indisponib.'],['vista_analisar','Analisar com calma']];
              const totalDone = [...idpjItems, ...vistaItems].filter(([k]) => chk[k]).length;
              const totalAll = idpjItems.length + vistaItems.length;
              const idpjDone = idpjItems.every(([k]) => chk[k]);
              const vistaDone = vistaItems.every(([k]) => chk[k]);
              const renderList = (items, done, label, borderColor) => (
                <div style={{padding:'6px 8px',background:'rgba(255,255,255,0.02)',borderRadius:4,borderLeft:`2px solid ${done?'var(--green)':borderColor}`}}>
                  <div style={{fontSize:8,fontWeight:700,textTransform:'uppercase',letterSpacing:0.4,color:done?'var(--green)':'var(--text-muted)',marginBottom:3,display:'flex',justifyContent:'space-between'}}>
                    <span>{label}</span>
                    <span style={{fontWeight:400,opacity:0.6}}>{items.filter(([k])=>chk[k]).length}/{items.length}</span>
                  </div>
                  {items.map(([k,l]) => (
                    <div key={k} style={{display:'flex',alignItems:'center',gap:4,padding:'1px 0',fontSize:10,color:chk[k]?'var(--text-muted)':'var(--text-secondary)',textDecoration:chk[k]?'line-through':'none',cursor:'pointer',lineHeight:1.5,opacity:chk[k]?0.5:1}} onClick={() => toggle(k)}>
                      <span style={{fontSize:9,width:12,textAlign:'center',flexShrink:0,color:chk[k]?'var(--green)':'var(--border)'}}>{chk[k]?'✓':'○'}</span>
                      <span>{l}</span>
                    </div>
                  ))}
                </div>
              );
              return (<div className="b-acc">
                <div className="b-acc-hdr" onClick={() => toggleGroup('bacc-chk')}>
                  <div className="b-acc-left">
                    <span className={`b-acc-icon ${collapsedGroups.has('bacc-chk')?'open':''}`}>▸</span>
                    <span className="b-acc-title">Checklists</span>
                    <span className="b-acc-count" style={totalDone===totalAll?{background:'rgba(34,197,94,0.15)',color:'var(--green)'}:{}}>{totalDone}/{totalAll}</span>
                  </div>
                </div>
                {collapsedGroups.has('bacc-chk') && <div className="b-acc-body">
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                    {renderList(idpjItems, idpjDone, 'Decisão Final do IDPJ', 'var(--red)')}
                    {renderList(vistaItems, vistaDone, '1a. Vista da Operação', 'var(--yellow)')}
                  </div>
                </div>}
              </div>);
            })()}

            {/* ─── ACCORDION: Tarefas (collapsed by default) ─── */}
            {opTasks.length > 0 && <div className="b-acc">
              <div className="b-acc-hdr" onClick={() => toggleGroup('bacc-tsk')}>
                <div className="b-acc-left">
                  <span className={`b-acc-icon ${collapsedGroups.has('bacc-tsk')?'open':''}`}>▸</span>
                  <span className="b-acc-title">Tarefas</span>
                  <span className="b-acc-count" style={{background:'rgba(245,158,11,0.15)',color:'var(--yellow)'}}>{opTasks.length}</span>
                </div>
              </div>
              {collapsedGroups.has('bacc-tsk') && <div className="b-acc-body">
                {opTasks.slice(0, 6).map(t => (
                  <div key={t.id} className="briefing-proc-item" onClick={() => setModal({type:'edit',entityType:'task',initial:t})}>
                    {t.dueDate && daysUntil(t.dueDate) !== null && daysUntil(t.dueDate) < 0 && <span style={{color:'var(--red)',marginRight:3}}>●</span>}
                    <span style={{flex:1,fontSize:10,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</span>
                    {t.dueDate && <span style={{fontSize:9,color:'var(--text-muted)'}}>{fmtDate(t.dueDate)}</span>}
                  </div>
                ))}
                {opTasks.length > 6 && <div style={{fontSize:9,color:'var(--text-muted)'}}>+{opTasks.length - 6}</div>}
              </div>}
            </div>}

          </div>

          {/* ═══ DRAG HANDLE ═══ */}
          <div className="briefing-split-handle" onMouseDown={onSplitDragStart} title="Arraste para redimensionar" />

          {/* ═══ RIGHT PANEL: Anotações ═══ */}
          <div className="briefing-split-right" style={{width: briefingRightW + '%', flexShrink: 0}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10,gap:8}}>
              <span style={{fontSize:13,fontWeight:700,color:'var(--text-primary)'}}>📌 Lembretes</span>
              <button type="button" className="btn-secondary btn-xs" style={{flexShrink:0}} onClick={() => setModal({type:'create',entityType:'stickyNote',initial:{operationId:opId,color:'yellow'}})}>+ Lembrete</button>
            </div>
            {notes.length === 0 ? <div style={{padding:20,textAlign:'center',color:'var(--text-muted)',fontSize:11,background:'rgba(255,255,255,0.02)',borderRadius:'var(--radius-lg)',border:'1px dashed var(--border)'}}>Nenhum lembrete.<br/>Anote lembretes e notas soltas.</div> :
            <div className="notes-grid">{notes.map(n => (
              <div key={n.id} className={`sticky-note color-${n.color || 'yellow'}`} onClick={() => setModal({type:'edit',entityType:'stickyNote',initial:n})}>
                <button className="sn-delete" onClick={e => { e.stopPropagation(); if(confirm('Excluir lembrete?')) { setData(prev => ({...prev, stickyNotes: prev.stickyNotes.filter(x=>x.id!==n.id)})); } }}>✕</button>
                {n.title && <div className="sn-title">{n.title}</div>}
                <div className="sn-body">{linkify(n.content || '')}</div>
                <div className="sn-date">{n.updatedAt ? new Date(n.updatedAt).toLocaleDateString('pt-BR') : ''}</div>
              </div>
            ))}</div>}
          </div>
        </div>
      </div>);
    }

        if (activeTab === 'grafo') {
      const hasData = getOpSlices(opId).people.length > 0;
      return (<div style={{flex:1,position:'relative',overflow:'hidden'}}>
        {!hasData ? <div className="welcome-screen"><div style={{fontSize:40,opacity:0.3}}>◎</div><p>Importe dados ou adicione manualmente para visualizar o grafo.</p></div>
          : <GraphView operation={activeOp} data={data} onSelectNode={setSelectedNode} onOpenExec={(execData) => setModal({type:'edit',entityType:'execution',initial:execData})} />}
        {selectedNode && selectedNode.type !== 'operation' && (
          <div className="detail-panel">
            <button className="detail-close" onClick={() => setSelectedNode(null)}>✕</button>
            <h4>{selectedNode.label}</h4>
            <div className="dp-type" style={{color: selectedNode.color}}>
              {selectedNode.type === 'person' ? (selectedNode.subtype === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física') : selectedNode.type === 'debt' ? 'CDA' : selectedNode.type === 'execution' ? 'Execução Fiscal' : selectedNode.type === 'measure' ? 'Medida Judicial' : 'Bem'}
            </div>
            {selectedNode.data && Object.entries(selectedNode.data).map(([k, v]) => {
              if (['id', 'operationId', 'createdAt', 'updatedAt', 'linkedPeopleIds', 'linkedAssetIds'].includes(k) || v === '' || v === null || v === undefined) return null;
              const labels = { name: 'Nome', cpfCnpj: 'CPF/CNPJ', subtype: 'Tipo', role: 'Papel', notes: 'Notas', cdaNumber: 'Nº CDA', value: 'Valor', status: 'Status', prescriptionDate: 'Prescrição', prescriptionForecast: 'Prev. Presc. Intercorrente', prescriptionInterrupted: 'Presc. Interrompida', tribute: 'Tributo', processNumber: 'Nº Processo', processAdmin: 'Proc. Admin', court: 'Vara/Juízo', description: 'Descrição', registry: 'Registro', className: 'Classe', hasGuarantee: 'Garantia', protocolDate: 'Protocolo', inscriptionDate: 'Dt. Inscrição', rawStatus: 'Situação Original', system: 'Sistema', analyticsRegistered: 'Analytics' };
              let display = v;
              if (k === 'value') display = fmtCur(v);
              if (k === 'prescriptionDate' || k === 'prescriptionForecast' || k === 'protocolDate' || k === 'inscriptionDate') display = fmtDate(v);
              if (k === 'personId') { const pp = data.people.find(p => p.id === v); display = pp?.name || v; }
              if (k === 'hasGuarantee' || k === 'prescriptionInterrupted' || k === 'analyticsRegistered') display = v ? 'SIM' : 'NÃO';
              if (k === 'subtype' && selectedNode.type === 'measure') display = MEASURE_SUBTYPES[v] || v;
              if (k === 'subtype' && selectedNode.type === 'asset') display = ASSET_SUBTYPES[v] || v;
              if (typeof display === 'boolean') display = display ? 'Sim' : 'Não';
              return <div key={k} className="dp-field"><div className="dp-label">{labels[k] || k}</div><div className="dp-value">{String(display)}</div></div>;
            })}
            <div style={{marginTop:10}}>
              <button className="btn-secondary btn-sm" onClick={() => {
                const init = selectedNode.type === 'measure' ? getMeasureInitial(selectedNode.data) : selectedNode.data;
                setModal({ type: 'edit', entityType: selectedNode.type, initial: init });
              }}>Editar</button>
            </div>
          </div>
        )}
      </div>);
    }

    if (activeTab === 'tarefas') {
      const opTasks = (data.tasks || []).filter(t => t.operationId === (activeOp?.id || ''));
      const open = opTasks.filter(t => t.status !== 'concluida' && t.status !== 'cancelada');
      const done = opTasks.filter(t => t.status === 'concluida');
      const toggleTask = (t) => { upsert('tasks', { ...t, status: t.status === 'concluida' ? 'pendente' : 'concluida' }); };
      return (<div className="entity-area">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,gap:10,flexWrap:'wrap'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
            <span style={{color:'var(--text-muted)',fontSize:11}}>{open.length} aberta(s) · {done.length} concluída(s)</span>
            <span style={{fontSize:10,color:'var(--text-muted)',fontStyle:'italic'}}>🔒 Todas as tarefas desta operação. Marque como 🌐 Global no formulário para aparecer também na aba Tarefas geral.</span>
          </div>
          <button className="btn-primary btn-sm" onClick={() => setModal({type:'create',entityType:'task',initial:{operationId:activeOp?.id||'',taskVisibility:'operation'}})}>+ Tarefa</button>
        </div>
        {open.length === 0 && done.length === 0 ? <div className="empty-state"><div className="empty-icon">✓</div><p>Nenhuma tarefa para esta operação.</p><p style={{fontSize:11}}>Adicione atuações proativas que não dependem de intimação.</p></div> : null}
        {[...open].sort((a,b) => {
          const po = {urgente:0,alta:1,media:2,baixa:3};
          if ((po[a.priority]||1) !== (po[b.priority]||1)) return (po[a.priority]||1) - (po[b.priority]||1);
          if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
          return 0;
        }).map(t => {
          const prio = TASK_PRIORITIES[t.priority] || TASK_PRIORITIES.media;
          const days = daysUntil(t.dueDate);
          const notes = t.notesList || (t.notes ? [t.notes] : []);
          return (<div key={t.id} className="task-card" style={{display:'grid',gridTemplateColumns:'auto 1fr 1.4fr 1fr auto',gap:12,alignItems:'start',padding:'12px 14px'}} onClick={() => setModal({type:'edit',entityType:'task',initial:t})}>
            <div className="task-check" onClick={e => { e.stopPropagation(); toggleTask(t); }}></div>
            <div style={{minWidth:0}}>
              <div className="task-title" style={{fontSize:13,fontWeight:700,lineHeight:1.3,marginBottom:4}}>{t.title}</div>
              <div className="task-meta" style={{fontSize:11}}>
                <span className="task-prio-dot" style={{background:prio.color}}></span>
                <span style={{color:prio.color,fontWeight:600}}>{prio.label}</span>
                {t.dueDate && <span style={{color: days !== null && days <= 3 ? 'var(--red)' : 'var(--text-secondary)',fontWeight:600}}>{fmtDate(t.dueDate)} {days !== null ? `(${days}d)` : ''}</span>}
                {t.taskVisibility === 'global' && <span className="has-tip" style={{fontSize:9,padding:'1px 6px',borderRadius:3,background:'rgba(59,130,246,0.15)',color:'var(--blue)',fontWeight:700}}>🌐 global<span className="tip-content">Esta tarefa aparece também na aba Tarefas geral do menu superior.</span></span>}
              </div>
            </div>
            {t.description ? <div className="task-desc-wrap">
              <div style={{fontSize:9,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:0.3,fontWeight:600,marginBottom:2}}>Descrição</div>
              <div className="task-desc-multi">{t.description}</div>
              <div className="task-desc-tooltip">{t.description}</div>
            </div> : <div style={{fontSize:10,color:'var(--text-muted)',fontStyle:'italic'}}>Sem descrição</div>}
            <div style={{fontSize:10}}>
              {notes.length > 0 && <div className="note-stack" style={{maxHeight:60,overflowY:'auto'}}>
                <div style={{fontSize:9,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:0.3,fontWeight:600,marginBottom:2}}>Notas ({notes.length})</div>
                {notes.slice(0,3).map((n,i) => <div key={i} className="note-item note-item-full">{linkify(n)}</div>)}
                {notes.length > 3 && <div style={{fontSize:9,color:'var(--text-muted)',marginTop:1}}>+{notes.length-3} nota(s)</div>}
              </div>}
              {t.docUrl && <a href={t.docUrl} target="_blank" rel="noopener noreferrer" className="intim-doc-link" style={{marginTop:4}} onClick={e=>e.stopPropagation()}>📝 Documento</a>}
            </div>
            <span className={`badge ${TASK_STATUSES[t.status]?.badge||''}`} style={{fontSize:10,fontWeight:700}}>{TASK_STATUSES[t.status]?.label||t.status}</span>
          </div>);
        })}
        {done.length > 0 && (<>
          <div style={{margin:'16px 0 8px',fontSize:11,color:'var(--text-muted)'}}>Concluídas ({done.length})</div>
          {done.slice(0,10).map(t => (
            <div key={t.id} className="task-card done" onClick={() => setModal({type:'edit',entityType:'task',initial:t})}>
              <div className="task-check checked" onClick={e => { e.stopPropagation(); toggleTask(t); }}>✓</div>
              <div className="task-body"><div className="task-title" style={{textDecoration:'line-through'}}>{t.title}</div></div>
            </div>
          ))}
        </>)}
      </div>);
    }

    if (activeTab === 'importar') {
      // Build per-type summary of last import for this operation
      const allLogs = (data.importLogs || []).filter(l => !l.operationId || l.operationId === opId);
      const IMPORT_TYPE_LABELS = {
        xls: { label: 'XLS Procuradoria', icon: '' },
        ai: { label: 'Texto IA', icon: '' },
        eproc: { label: 'Intimações eproc', icon: '' },
        pdf_sida: { label: 'PDF SIDA', icon: '' },
        pdf_debcad: { label: 'PDF Debcad', icon: '' },
        pdf_sida_debcad: { label: 'PDF SIDA + Debcad', icon: '' },
        pdf_pgfn: { label: 'PDF PGFN', icon: '' },
        assets: { label: 'Bens em Lote', icon: '' }
      };
      // Last import per type
      const lastByType = {};
      allLogs.forEach(l => {
        if (!lastByType[l.type] || l.timestamp > lastByType[l.type].timestamp) lastByType[l.type] = l;
      });
      // Sort: most recent first
      const lastEntries = Object.values(lastByType).sort((a,b) => b.timestamp.localeCompare(a.timestamp));
      const relTime = (iso) => {
        const diff = Date.now() - new Date(iso).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'há poucos segundos';
        if (mins < 60) return `há ${mins} min`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `há ${hrs}h`;
        const days = Math.floor(hrs / 24);
        if (days === 1) return 'há 1 dia';
        if (days < 30) return `há ${days} dias`;
        const months = Math.floor(days / 30);
        if (months < 12) return `há ${months} ${months===1?'mês':'meses'}`;
        return `há ${Math.floor(months/12)} ano(s)`;
      };
      const stalenessColor = (iso) => {
        const days = (Date.now() - new Date(iso).getTime()) / (1000*60*60*24);
        if (days < 7) return 'var(--green)';
        if (days < 30) return 'var(--yellow)';
        return 'var(--red)';
      };
      const clearLogs = () => {
        if (!confirm('Apagar todo o histórico de importações desta operação? Os dados importados (CDAs, processos, intimações, etc.) NÃO serão afetados — apenas o log de quando foram importados.')) return;
        setData(prev => ({...prev, importLogs: (prev.importLogs || []).filter(l => l.operationId && l.operationId !== opId)}));
      };

      return (<div className="entity-area">
        {/* Import log summary */}
        {lastEntries.length > 0 && <div className="import-section" style={{background:'var(--bg-elevated)',borderLeft:'3px solid var(--accent)'}}>
          <h4 style={{display:'flex',alignItems:'center',gap:8,justifyContent:'space-between'}}>
            <span>Última atualização por fonte <HelpIcon tip="Registra quando foi a última importação de cada tipo para esta operação. Cores: verde = menos de 7 dias, amarelo = menos de 30 dias, vermelho = mais de 30 dias sem atualizar." /></span>
            <button className="btn-secondary btn-xs" onClick={clearLogs} title="Limpar histórico de importações desta operação">Limpar histórico</button>
          </h4>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))',gap:8,marginTop:10}}>
            {lastEntries.map(l => {
              const meta = IMPORT_TYPE_LABELS[l.type] || { label: l.type, icon: '📦' };
              const color = stalenessColor(l.timestamp);
              return (<div key={l.id} style={{padding:'10px 12px',background:'var(--bg-card)',borderRadius:'var(--radius)',borderLeft:`3px solid ${color}`}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                  <div style={{fontSize:11,fontWeight:600,color:'var(--text-secondary)'}}>{meta.icon} {meta.label}</div>
                  <div style={{fontSize:9,color,fontWeight:600}}>{relTime(l.timestamp)}</div>
                </div>
                <div style={{fontSize:10,color:'var(--text-muted)'}}>{new Date(l.timestamp).toLocaleString('pt-BR', {day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
                <div style={{fontSize:10,color:'var(--text-secondary)',marginTop:4,fontStyle:'italic'}}>{l.summary}</div>
                {l.fileNames && l.fileNames.length > 0 && <div style={{fontSize:9,color:'var(--text-muted)',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={l.fileNames.join('\n')}>{l.fileNames.length} arquivo(s): {l.fileNames[0]}{l.fileNames.length > 1 ? ` (+${l.fileNames.length-1})` : ''}</div>}
              </div>);
            })}
          </div>
          {allLogs.length > lastEntries.length && <div style={{fontSize:10,color:'var(--text-muted)',marginTop:8,textAlign:'right'}}>{allLogs.length} importação(ões) registrada(s) no total (mostrando a mais recente de cada tipo)</div>}
        </div>}

        {/* ─── Card unificado de importação (Planilhas · PDFs · Texto) ─── */}
        <div className="import-section">
          <div style={{display:'flex',gap:4,marginBottom:12,flexWrap:'wrap'}}>
            <button className={`settings-opt ${importMode==='planilhas'?'active':''}`} onClick={() => setImportMode('planilhas')}>📂 Planilhas (.xls)</button>
            <button className={`settings-opt ${importMode==='pdfs'?'active':''}`} onClick={() => setImportMode('pdfs')}>📑 PDFs (SIDA/Debcad)</button>
            <button className={`settings-opt ${importMode==='texto'?'active':''}`} onClick={() => setImportMode('texto')}>📝 Texto</button>
          </div>

          {importMode === 'planilhas' && <>
          <div className="desc">Arraste ou selecione planilhas da Procuradoria (Inscrições / Processos) ou intimações do eproc. O sistema identifica o tipo automaticamente.</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div>
              <div style={{fontSize:10,fontWeight:600,color:'var(--text-secondary)',marginBottom:6}}>XLS da Procuradoria</div>
              <div className="drop-zone" onClick={() => xlsInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('dragover'); }}
                onDragLeave={e => e.currentTarget.classList.remove('dragover')}
                onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('dragover'); handleXLSImport({ target: { files: e.dataTransfer.files } }); }}>
                <div className="dz-icon">📂</div>
                <div className="dz-text">RelatorioAbaInscricoes*.xls<br/>RelatorioAbaProcessosJudiciais*.xls</div>
              </div>
              <input ref={xlsInputRef} type="file" accept=".xls,.xlsx" multiple style={{display:'none'}} onChange={handleXLSImport} />
            </div>
            <div>
              <div style={{fontSize:10,fontWeight:600,color:'var(--text-secondary)',marginBottom:6}}>Intimações eproc (TRF4)</div>
              <div className="drop-zone" onClick={() => eprocInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('dragover'); }}
                onDragLeave={e => e.currentTarget.classList.remove('dragover')}
                onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('dragover'); handleEprocImport({ target: { files: e.dataTransfer.files } }); }}>
                <div className="dz-icon">📬</div>
                <div className="dz-text">citacaoIntimacao*.xls</div>
              </div>
            </div>
          </div>
          </>}

          {importMode === 'pdfs' && <>
          <div className="desc">
            Enriquece CDAs já cadastradas com datas de inscrição, eventos prescricionais (parcelamentos, ajuizamentos) e protestos. Importe a planilha primeiro — o match é por nº da CDA.
          </div>
          <div className="drop-zone" onClick={() => pgfnPdfInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('dragover'); }}
            onDragLeave={e => e.currentTarget.classList.remove('dragover')}
            onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('dragover'); handlePGFNPDFImport({ target: { files: e.dataTransfer.files } }); }}>
            <div className="dz-icon">📑</div>
            <div className="dz-text">SIDA-Relatorio*.pdf · RelatorioCompleto-debcad*.pdf</div>
            <div className="dz-text" style={{marginTop:4,fontSize:10,color:'var(--text-muted)'}}>Nome do arquivo deve conter "sida" ou "debcad"</div>
          </div>
          <input ref={pgfnPdfInputRef} type="file" accept=".pdf" multiple style={{display:'none'}} onChange={handlePGFNPDFImport} />
          </>}

          {importMode === 'texto' && <>
          <div className="desc">Cole dados de pessoas (IA da Procuradoria) ou bens indisponibilizados. Selecione o tipo abaixo.</div>
          <div style={{display:'flex',gap:4,marginBottom:10}}>
            <button className={`settings-opt ${!collapsedGroups.has('import-assets-mode')?'active':''}`} onClick={() => { if (collapsedGroups.has('import-assets-mode')) toggleGroup('import-assets-mode'); }}>Pessoas</button>
            <button className={`settings-opt ${collapsedGroups.has('import-assets-mode')?'active':''}`} onClick={() => { if (!collapsedGroups.has('import-assets-mode')) toggleGroup('import-assets-mode'); }}>Bens em lote</button>
          </div>
          {!collapsedGroups.has('import-assets-mode') ? (<>
            <div style={{fontSize:10,color:'var(--text-muted)',marginBottom:6}}>
              Formato: <code style={{color:'var(--accent)'}}>Nome - CPF/CNPJ - Papel</code> · Para bens: <code style={{color:'var(--accent)'}}>Bem: Descrição | Tipo | Obs</code>
            </div>
            <textarea value={aiText} onChange={e => setAiText(e.target.value)} rows={6}
              placeholder={"João da Silva - 123.456.789-00 - Sócio administrador\nEmpresa XYZ Ltda - 12.345.678/0001-00 - Fachada\nBem: Imóvel Matrícula 54321 CRI Curitiba | Imóvel | Em nome de Maria"} />
            <div style={{marginTop:8,display:'flex',gap:8}}>
              <button className="btn-primary btn-sm" onClick={handleAIImport} disabled={!aiText.trim()}>Processar e Importar</button>
              <button className="btn-secondary btn-sm" onClick={() => setAiText('')}>Limpar</button>
            </div>
          </>) : (<>
            <div style={{fontSize:10,color:'var(--text-muted)',marginBottom:6}}>
              Formato por linha, separado por <code style={{color:'var(--accent)'}}> - </code> (traço), <code style={{color:'var(--accent)'}}> | </code> ou TAB:
              <code style={{color:'var(--accent)',fontSize:10,display:'block',marginTop:4}}>Tipo - Descrição - Registro - Valor - Status - CPF/CNPJ - Origem - Processo - Notas</code>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,margin:'6px 0',fontSize:10,color:'var(--text-muted)',lineHeight:1.7}}>
              <div><strong style={{color:'var(--text-secondary)'}}>Tipos:</strong> I=Imóvel · V=Veículo · C=Conta · $=Investimento · S=Participação · O=Outro</div>
              <div><strong style={{color:'var(--text-secondary)'}}>Status:</strong> IND=Indisponibilizado · PEN=Penhorado · ARR=Arrestado · BLOQ=Bloqueado · LIV=Livre</div>
            </div>
            <textarea value={assetText} onChange={e => setAssetText(e.target.value)} rows={6} style={{fontSize:11}}
              placeholder={`Imóvel Matrícula 54.321 - CRI Curitiba - 54321 - 450.000,00 - IND - 123.456.789-00 - CNIB\nToyota Hilux 2022 ABC-1234 - ABC1234 - 180.000,00 - ARR - 12.345.678/0001-00 - Renajud`} />
            <div style={{marginTop:8,display:'flex',gap:8}}>
              <button className="btn-primary btn-sm" onClick={handleAssetBulkImport} disabled={!assetText.trim() || !activeOpId}>Importar Bens</button>
              <button className="btn-secondary btn-sm" onClick={() => setAssetText('')}>Limpar</button>
              {!activeOpId && <span style={{fontSize:10,color:'var(--yellow)'}}>Selecione uma operação primeiro</span>}
            </div>
          </>)}
          </>}
        </div>

        {/* Import Results */}
        {importResult && (
          <div className="import-section">
            <h4>Resultado da importação</h4>
            <div className="import-result">
              {importResult.map((log, i) => (
                <div key={i} className={log.startsWith('✅') ? 'ir-ok' : log.startsWith('⚠️') || log.startsWith('ℹ️') ? 'ir-warn' : log.startsWith('❌') ? 'ir-err' : ''}>{log}</div>
              ))}
            </div>
            <button className="btn-secondary btn-xs" style={{marginTop:8}} onClick={() => setImportResult(null)}>Fechar</button>
          </div>
        )}
      </div>);
    }

    if (activeTab === 'pessoas') {
      const items = getOpSlices(opId).people;
      const opDebts = getOpSlices(opId).debts;
      const opAssets = getOpSlices(opId).assets;
      const allLinks = data.links?.cdaResponsibilities || [];
      const opExecsForPresc = getOpSlices(opId).executions;

      // Compute exposure stats per person
      const peopleStats = items.map(p => {
        const myLinks = allLinks.filter(l => l.personId === p.id && opDebts.some(d => d.id === l.cdaId));
        // Dedupe by cdaId — same CDA may have multiple roles for same person; pick "originario" if present, else first
        const linksByCda = {};
        myLinks.forEach(l => {
          const existing = linksByCda[l.cdaId];
          if (!existing || (l.role === 'originario' && existing.role !== 'originario')) {
            linksByCda[l.cdaId] = l;
          }
        });
        const dedupedLinks = Object.values(linksByCda);
        const cdasOriginario = dedupedLinks.filter(l => l.role === 'originario').map(l => opDebts.find(d => d.id === l.cdaId)).filter(Boolean);
        const cdasCorresp = dedupedLinks.filter(l => l.role !== 'originario');
        const cdasCorrespByRole = {};
        cdasCorresp.forEach(l => {
          if (!cdasCorrespByRole[l.role]) cdasCorrespByRole[l.role] = [];
          const d = opDebts.find(dd => dd.id === l.cdaId);
          if (d) cdasCorrespByRole[l.role].push({ debt: d, link: l });
        });
        const valOriginario = cdasOriginario.reduce((s,d)=>s+(d.value||0),0);
        const valCorresp = cdasCorresp.reduce((s,l) => { const d = opDebts.find(dd => dd.id === l.cdaId); return s + (d?.value||0); }, 0);
        const myAssets = opAssets.filter(a => a.titularCpfCnpj === p.cpfCnpj);
        const valAssets = myAssets.reduce((s,a)=>s+(a.value||0),0);
        const prescRisk = cdasOriginario.filter(d => { const pd = d.prescriptionDate || calcAutoPresc(d, opExecsForPresc, data.prescriptionEvents || []); const dd = daysUntil(pd); return dd !== null && dd <= 180 && !d.prescriptionHandled; }).length;
        return { person: p, cdasOriginario, cdasCorrespByRole, valOriginario, valCorresp, valTotal: valOriginario + valCorresp, myAssets, valAssets, prescRisk, totalCdas: cdasOriginario.length + cdasCorresp.length };
      });

      // Split alvo vs relacionada
      const alvos = peopleStats.filter(s => (s.person.operationRole || 'alvo') === 'alvo');
      const relacionadas = peopleStats.filter(s => s.person.operationRole === 'relacionada');

      // Compute deduplicated grand total — each CDA counted once even if associated with multiple people
      const cdasInOp = new Set(opDebts.filter(d => d.status !== 'extinta').map(d => d.id));
      const grandTotalUnique = opDebts.filter(d => cdasInOp.has(d.id)).reduce((s,d) => s+(d.value||0), 0);
      const sumOfExposures = peopleStats.reduce((s,p) => s + p.valTotal, 0);

      return (<div className="entity-area">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,flexWrap:'wrap',gap:8}}>
          <div style={{fontSize:11,color:'var(--text-muted)'}}>
            {alvos.length} alvo(s) · {relacionadas.length} relacionada(s) · {items.filter(p=>p.subtype==='PJ').length} PJ · {items.filter(p=>p.subtype==='PF').length} PF
          </div>
          <button className="btn-primary btn-sm" onClick={() => setModal({type:'create',entityType:'person',initial:{}})}>+ Pessoa</button>
        </div>

        {/* Total único da operação */}
        {opDebts.length > 0 && <div style={{padding:'14px 18px',background:'var(--bg-elevated)',borderLeft:'4px solid var(--gold)',borderRadius:'var(--radius)',marginBottom:14,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:14}}>
          <div>
            <div style={{fontSize:11,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:0.8,fontWeight:700,marginBottom:2}}>Crédito Total da Operação <HelpIcon tip="Soma única de todas as CDAs ativas da operação. Cada CDA é contada UMA vez, mesmo quando há múltiplos responsáveis (ex: devedor originário + corresponsável por IDPJ + sucessor de fato). Os valores exibidos em cada perfil de pessoa abaixo são EXPOSIÇÕES individuais — somá-los duplicaria CDAs com responsabilidade compartilhada." /></div>
            <div style={{fontSize:24,fontWeight:800,color:'var(--gold)',fontFamily:'var(--font-display)',lineHeight:1.1}}>{fmtCur(grandTotalUnique)}</div>
            <div style={{fontSize:11,color:'var(--text-secondary)',marginTop:4}}><strong style={{color:'var(--text-primary)'}}>{cdasInOp.size} CDA(s) ativa(s)</strong> · totalização única, sem duplicação por responsável</div>
          </div>
          {sumOfExposures > grandTotalUnique * 1.01 && <div style={{fontSize:10,color:'var(--text-secondary)',textAlign:'right',maxWidth:360,lineHeight:1.5,background:'rgba(245,158,11,0.06)',padding:'8px 12px',borderRadius:4,borderLeft:'2px solid var(--yellow)'}}>
            <strong style={{color:'var(--yellow)'}}>ⓘ Exposições individuais somam {fmtCur(sumOfExposures)}</strong> — {((sumOfExposures/grandTotalUnique - 1) * 100).toFixed(0)}% das CDAs têm responsabilidade compartilhada. Para análise patrimonial individual vale a exposição; para o crédito da operação vale o total único.
          </div>}
        </div>}

        {items.length === 0 ? <div className="empty-state"><div className="empty-icon">👤</div><p>Nenhuma pessoa</p></div> : <>
          {/* ALVOS */}
          {alvos.length > 0 && <div style={{marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:700,color:'var(--pgfn-light)',textTransform:'uppercase',letterSpacing:1,marginBottom:8,display:'flex',alignItems:'center',gap:6}}>🎯 Alvos Diretos da Operação ({alvos.length})
              <HelpIcon tip="Pessoas contra as quais a operação é dirigida diretamente. São objeto de pedidos de IDPJ, indisponibilidades, cautelar fiscal." />
            </div>
            {alvos.map(s => <PersonProfileCard key={s.person.id} s={s} data={data} allLinks={allLinks} people={items} collapsedGroups={collapsedGroups} toggleGroup={toggleGroup} setModal={setModal} />)}
          </div>}

          {/* RELACIONADAS */}
          {relacionadas.length > 0 && <div>
            <div style={{fontSize:11,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:1,marginBottom:8,display:'flex',alignItems:'center',gap:6,paddingTop:12,borderTop:'1px dashed var(--border)'}}>📎 Pessoas Relacionadas (subsídio analítico) ({relacionadas.length})
              <HelpIcon tip="Pessoas cadastradas para fins de análise — sucessoras colaterais, sócios não-redirecionados, terceiros relevantes — mas que NÃO são alvo direto da operação. Aparecem com destaque visual reduzido." />
            </div>
            {relacionadas.map(s => <PersonProfileCard key={s.person.id} s={s} data={data} allLinks={allLinks} people={items} collapsedGroups={collapsedGroups} toggleGroup={toggleGroup} setModal={setModal} />)}
          </div>}
        </>}
      </div>);
    }

    if (activeTab === 'dividas') {
      const allItems = getOpSlices(opId).debts;
      const allLinks = data.links?.cdaResponsibilities || [];
      // Apply person filter — show CDAs where the selected person has ANY responsibility role
      const items = cdaPersonFilter === 'all' ? allItems :
        allItems.filter(d => allLinks.some(l => l.cdaId === d.id && l.personId === cdaPersonFilter));
      const opExecs = getOpSlices(opId).executions;
      let sorted = [...items];
      if (cdaSort === 'status') sorted.sort((a,b) => (a.status||'').localeCompare(b.status||''));
      else if (cdaSort === 'value_desc') sorted.sort((a,b) => (b.value||0) - (a.value||0));
      else if (cdaSort === 'value_asc') sorted.sort((a,b) => (a.value||0) - (b.value||0));
      else if (cdaSort === 'prescription') sorted.sort((a,b) => { const pa = calcAutoPresc(a,opExecs, data.prescriptionEvents || [])||'9999'; const pb = calcAutoPresc(b,opExecs, data.prescriptionEvents || [])||'9999'; return pa.localeCompare(pb); });
      else if (cdaSort === 'devedor') sorted.sort((a,b) => { const na = data.people.find(p=>p.id===a.personId)?.name||'zzz'; const nb = data.people.find(p=>p.id===b.personId)?.name||'zzz'; return na.localeCompare(nb); });
      else if (cdaSort === 'tribute') sorted.sort((a,b) => (a.tribute||'zzz').localeCompare(b.tribute||'zzz'));
      else if (cdaSort === 'ajuizada') sorted.sort((a,b) => (a.processNumber?0:1) - (b.processNumber?0:1));

      // ═══ POR PROCESSO grouping: umbrella = IDPJ/Cautelar (covering execs) or root EF (apenso chain) ═══
      // Computes the umbrella structure; rendered in its own branch below.
      const umbrellaStructure = (() => {
        if (cdaSort !== 'por_processo') return null;
        const execsById = Object.fromEntries(opExecs.map(e => [e.id, e]));
        const execsByProcNum = {};
        opExecs.forEach(e => { if (e.processNumber) execsByProcNum[e.processNumber] = e; });
        // Map: execId → IDPJ/Cautelar that covers it
        const execToIdpj = {};
        opExecs.filter(e => e.processTag === 'idpj' || e.processTag === 'cautelar_fiscal').forEach(idpj => {
          (idpj.linkedExecutionIds || []).forEach(execId => {
            if (!execToIdpj[execId]) execToIdpj[execId] = idpj;
          });
        });
        // Walk parentExecutionId chain to find root (only following true EF apensos — stop at embargos/recursos)
        const rootOf = (execId) => {
          let cur = execsById[execId];
          const seen = new Set();
          while (cur && cur.parentExecutionId && !seen.has(cur.id)) {
            seen.add(cur.id);
            const parent = execsById[cur.parentExecutionId];
            if (!parent) break;
            // Only walk up if the parent relationship is a real apenso (same branch of EFs)
            cur = parent;
          }
          return cur;
        };
        const umbrellaMap = {};
        const unajuizadas = [];
        sorted.forEach(d => {
          if (!d.processNumber) { unajuizadas.push(d); return; }
          const directExec = execsByProcNum[d.processNumber];
          if (!directExec) { unajuizadas.push(d); return; }
          const rootExec = rootOf(directExec.id);
          // Umbrella priority: IDPJ covering direct > IDPJ covering root > root EF itself
          let umbrella = execToIdpj[directExec.id] || execToIdpj[rootExec.id] || rootExec;
          const uk = umbrella.id;
          if (!umbrellaMap[uk]) umbrellaMap[uk] = { umbrella, subGroups: {}, allCdas: [] };
          umbrellaMap[uk].allCdas.push(d);
          const subKey = directExec.id;
          if (!umbrellaMap[uk].subGroups[subKey]) umbrellaMap[uk].subGroups[subKey] = { subExec: directExec, cdas: [] };
          umbrellaMap[uk].subGroups[subKey].cdas.push(d);
        });
        // Sort umbrellas: IDPJ/Cautelar first, then regular EFs
        const umbrellaArr = Object.values(umbrellaMap);
        umbrellaArr.sort((a,b) => {
          const ta = a.umbrella.processTag === 'idpj' ? 0 : a.umbrella.processTag === 'cautelar_fiscal' ? 1 : a.umbrella.processTag === 'central' ? 2 : 3;
          const tb = b.umbrella.processTag === 'idpj' ? 0 : b.umbrella.processTag === 'cautelar_fiscal' ? 1 : b.umbrella.processTag === 'central' ? 2 : 3;
          if (ta !== tb) return ta - tb;
          return (b.allCdas.reduce((s,d)=>s+(d.value||0),0)) - (a.allCdas.reduce((s,d)=>s+(d.value||0),0));
        });
        return { umbrellas: umbrellaArr, unajuizadas };
      })();

      const needsGroup = ['status','devedor','tribute','ajuizada'].includes(cdaSort);
      const totalActive = items.filter(d=>d.status!=='extinta').reduce((s,d)=>s+(d.value||0),0);
      // Build groups
      const groups = [];
      if (needsGroup) {
        const groupMap = {};
        sorted.forEach(d => {
          const person = data.people.find(p=>p.id===d.personId);
          const st = DEBT_STATUSES[d.status] || {};
          let gk;
          if (cdaSort === 'status') gk = st.label || d.status || 'Sem status';
          else if (cdaSort === 'devedor') gk = person?.name || 'Sem devedor';
          else if (cdaSort === 'tribute') gk = d.tribute || 'Sem tributo';
          else if (cdaSort === 'ajuizada') gk = d.processNumber ? 'Ajuizadas' : 'Não ajuizadas';
          if (!groupMap[gk]) groupMap[gk] = [];
          groupMap[gk].push(d);
        });
        Object.entries(groupMap).forEach(([k, v]) => groups.push({ label: k, items: v }));
      } else {
        groups.push({ label: null, items: sorted });
      }

      return (<div className="entity-area">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,flexWrap:'wrap',gap:8}}>
          <span style={{color:'var(--text-muted)',fontSize:11}}>{items.length} CDA(s){cdaPersonFilter !== 'all' && ` (filtrada de ${allItems.length})`} · Total ativo: {fmtCur(totalActive)}</span>
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            <select value={cdaSort} onChange={e=>{setCdaSort(e.target.value);setCollapsedGroups(new Set());}} style={{width:'auto',fontSize:10,padding:'4px 8px'}}>
              <option value="por_processo">Por Processo (IDPJ / apenso)</option>
              <option value="status">Agrupar por Status</option>
              <option value="devedor">Agrupar por Devedor</option>
              <option value="tribute">Agrupar por Tributo</option>
              <option value="ajuizada">Ajuizadas / Não ajuizadas</option>
              <option value="prescription">Prescrição (mais próxima)</option>
              <option value="value_desc">Valor (maior)</option>
              <option value="value_asc">Valor (menor)</option>
            </select>
            <button className="btn-primary btn-sm" onClick={() => setModal({type:'create',entityType:'debt',initial:{}})}>+ CDA</button>
          </div>
        </div>

        <PersonSubtabs data={data} opId={opId} currentFilter={cdaPersonFilter} onChange={setCdaPersonFilter} mode="cda" />

        {/* Bulk action bar */}
        {selectedDebts.size > 0 && (<div className="bulk-bar">
          <span>{selectedDebts.size} selecionada(s)</span>
          <button className="btn-danger btn-sm" onClick={() => bulkDelete('debts', selectedDebts)}>Excluir selecionadas</button>
          <button className="btn-secondary btn-xs" onClick={() => setSelectedDebts(new Set())}>Limpar</button>
        </div>)}

        {(() => {
          // Reusable CDA card renderer
          const renderCDACard = (d) => {
            const autoPresc = calcAutoPresc(d, opExecs, data.prescriptionEvents || []);
            const prescDate = d.prescriptionDate || autoPresc;
            const days = daysUntil(prescDate);
            const st = DEBT_STATUSES[d.status] || {};
            const isAjuizada = !!d.processNumber;
            const isHandled = !!d.prescriptionHandled;
            const isAguardando = isHandled && d.prescriptionHandledType === 'aguardando_reconhecimento';
            const sysAlerts = d.systemAlerts || [];
            const procStatusAlert = sysAlerts.find(a => a.type === 'process_status');
            return (<div key={d.id} className="entity-card-selectable">
              <input type="checkbox" checked={selectedDebts.has(d.id)} onChange={() => toggleDebt(d.id)} />
              <div className="entity-card" style={{flex:1,borderLeft:procStatusAlert?`3px solid var(--${procStatusAlert.processStatus==='extinta'?'text-muted':'blue'})`:undefined,opacity:d.status==='extinta'?0.45:1}} onClick={() => setModal({type:'cdaDetail',entityType:'debt',initial:d})}>
                <div className="ec-header"><div><div className="ec-title">
                  {isAguardando && <span className="has-tip" style={{color:'var(--yellow)',marginRight:4,fontSize:13}}>⏳<span className="tip-content">Prescrita — aguardando reconhecimento judicial.</span></span>}
                  {isHandled && !isAguardando && <span className="has-tip" style={{color:'var(--green)',marginRight:4}}>✓<span className="tip-content">Prescrição tratada.</span></span>}
                  <Copyable value={d.cdaNumber}>{d.cdaNumber || 'CDA'}</Copyable></div><div className="ec-sub">{d.system?`${d.system}`:''}{d.system && d.tribute?' · ':''}{d.tribute||''}</div></div>
                  <div style={{display:'flex',gap:4,alignItems:'center'}}>
                    <span className={`badge ${st.badge||''}`}>{st.label||d.status}</span>
                    {isAjuizada ? <span className="badge badge-green has-tip" style={{fontSize:8}}>AJ<span className="tip-content">CDA ajuizada — vinculada a uma execução fiscal.</span></span> : <span className="badge badge-red has-tip" style={{fontSize:8}}>NÃO AJ<span className="tip-content">CDA ainda não ajuizada — apenas inscrita em dívida ativa.</span></span>}
                    {procStatusAlert && <span className="has-tip" style={{fontSize:9,padding:'2px 6px',borderRadius:3,fontWeight:700,background:procStatusAlert.processStatus==='extinta'?'rgba(122,139,163,0.2)':'rgba(59,130,246,0.2)',color:procStatusAlert.processStatus==='extinta'?'var(--purple)':'var(--blue)'}}>⚠ Proc. {procStatusAlert.processStatus==='extinta'?'extinto':'arquivado'}<span className="tip-content">{procStatusAlert.label}<br/>Verificar se a CDA também deve ser marcada como extinta/baixada.</span></span>}
                  </div></div>
                <div className="ec-rows">
                <div className="ec-row"><span className="label">Responsáveis:</span><ResponsibilityChips cdaId={d.id} data={data} onClickPerson={(p) => setModal({type:'edit',entityType:'person',initial:p})} /></div>
                <div className="ec-row"><span className="label">Valor:</span><span style={{fontWeight:600}}>{fmtCur(d.value)}</span></div>
                {d.processNumber && <div className="ec-row"><span className="label">Proc. Judicial:</span><Copyable value={d.processNumber} style={{fontSize:10,fontFamily:'var(--font-mono)'}}>{d.processNumber}</Copyable></div>}
                {d.inscriptionDate && <div className="ec-row"><span className="label">Inscrição:</span><span>{fmtDate(d.inscriptionDate)}</span></div>}
                <div className="ec-row"><span className="label">Prescrição{!d.prescriptionDate&&autoPresc?' (auto)':''}:</span>
                  {isAguardando ? <span style={{color:'var(--yellow)',fontWeight:700}}>⏳ Aguardando reconhecimento{d.prescriptionHandledAt?` · ${fmtDate(d.prescriptionHandledAt)}`:''}</span>
                   : <span style={{color:days!==null&&days<=365?days<=180?'var(--red)':'var(--yellow)':'inherit',fontWeight:days!==null&&days<=365?600:400}}>
                    {prescDate?fmtDate(prescDate):'—'} {days!==null&&days<=365?` (${days}d)`:''}
                  </span>}</div>
                </div>
                {/* Notas da CDA */}
                {(() => {
                  const cdaNotes = d.notesList || (d.notes ? [d.notes] : []);
                  if (cdaNotes.length === 0) return null;
                  return <div style={{marginTop:6}}>
                    <div className="note-stack" style={{maxHeight:80,overflowY:'auto'}}>
                      {cdaNotes.slice(0, 3).map((n,i) => <div key={i} className="note-item note-item-full">{linkify(n)}</div>)}
                    </div>
                    {cdaNotes.length > 3 && <div style={{fontSize:9,color:'var(--text-muted)',marginTop:2}}>+{cdaNotes.length - 3} nota(s)</div>}
                  </div>;
                })()}
                {procStatusAlert && <div style={{marginTop:8,padding:'6px 10px',background:procStatusAlert.processStatus==='extinta'?'rgba(122,139,163,0.08)':'rgba(59,130,246,0.08)',borderRadius:4,borderLeft:`2px solid var(--${procStatusAlert.processStatus==='extinta'?'purple':'blue'})`,fontSize:10,color:'var(--text-secondary)'}}>
                  {procStatusAlert.label} — processo {procStatusAlert.processNumber}. Verifique pendência de baixa.
                </div>}
              </div>
            </div>);
          };

          if (items.length === 0) return <div className="empty-state"><div className="empty-icon">📄</div><p>Nenhuma CDA</p></div>;

          // ═══ POR PROCESSO special render branch ═══
          if (cdaSort === 'por_processo' && umbrellaStructure) {
            const { umbrellas, unajuizadas } = umbrellaStructure;
            const umbrellaTypeLabel = (u) => {
              if (u.processTag === 'idpj') return { icon: '🛡️', label: 'IDPJ', color: 'var(--pgfn-light)', bg: 'rgba(155,40,72,0.08)' };
              if (u.processTag === 'cautelar_fiscal') return { icon: '🟠', label: 'Cautelar Fiscal', color: 'var(--yellow)', bg: 'rgba(245,158,11,0.08)' };
              if (u.processTag === 'central') return { icon: '◆', label: 'Central', color: 'var(--purple)', bg: 'rgba(122,139,163,0.08)' };
              return { icon: '⚖️', label: 'Execução Fiscal', color: 'var(--accent)', bg: 'var(--bg-elevated)' };
            };
            return (<div className="entity-list">
              {umbrellas.map(u => {
                const meta = umbrellaTypeLabel(u.umbrella);
                const total = u.allCdas.reduce((s,d)=>s+(d.value||0),0);
                const totalCdas = u.allCdas.length;
                const subGroupArr = Object.values(u.subGroups);
                const isMulti = subGroupArr.length > 1;
                const uCollapseKey = 'pp-u-'+u.umbrella.id;
                const isCollapsed = collapsedGroups.has(uCollapseKey);
                return (<div key={u.umbrella.id} style={{marginBottom:16,border:`1px solid ${meta.color}30`,borderRadius:'var(--radius-lg)',overflow:'hidden'}}>
                  {/* Umbrella header */}
                  <div onClick={() => toggleGroup(uCollapseKey)} style={{padding:'10px 14px',background:meta.bg,display:'flex',alignItems:'center',gap:10,cursor:'pointer',borderLeft:`4px solid ${meta.color}`}}>
                    <span style={{fontSize:10,color:meta.color,fontWeight:700,transition:'transform 0.15s',transform:isCollapsed?'rotate(0deg)':'rotate(90deg)'}}>▶</span>
                    <span style={{fontSize:10,padding:'2px 7px',borderRadius:3,fontWeight:700,background:`${meta.color}25`,color:meta.color,textTransform:'uppercase',letterSpacing:0.3}}>{meta.icon} {meta.label}</span>
                    <span style={{fontFamily:'var(--font-mono)',fontSize:12,fontWeight:700,color:'var(--text-primary)'}}>{u.umbrella.processNumber || 'Sem nº'}</span>
                    <span style={{fontSize:10,color:'var(--text-muted)',flex:1}}>{u.umbrella.court || ''}{u.umbrella.className?` · ${truncate(u.umbrella.className,40)}`:''}</span>
                    <span style={{fontSize:11,color:'var(--text-secondary)',fontWeight:600}}>{totalCdas} CDA(s)</span>
                    <span style={{fontSize:13,color:'var(--gold)',fontWeight:700}}>{fmtCur(total)}</span>
                    <button className="btn-secondary btn-xs" style={{fontSize:9,padding:'2px 7px'}} onClick={ev => { ev.stopPropagation(); setModal({type:'edit',entityType:'execution',initial:u.umbrella}); }}>✎ Proc</button>
                  </div>
                  {/* Subgroups (EFs within the umbrella) */}
                  {!isCollapsed && <div style={{padding:'6px 10px 10px'}}>
                    {subGroupArr.map(sg => {
                      const isSameAsUmbrella = sg.subExec.id === u.umbrella.id;
                      const subTotal = sg.cdas.reduce((s,d)=>s+(d.value||0),0);
                      return (<div key={sg.subExec.id} style={{marginTop:isMulti?8:4}}>
                        {isMulti && <div style={{display:'flex',alignItems:'center',gap:8,padding:'4px 8px',background:'rgba(255,255,255,0.015)',borderLeft:`2px solid ${meta.color}50`,marginBottom:4,borderRadius:2}}>
                          <span style={{fontSize:9,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:0.3,fontWeight:600}}>{isSameAsUmbrella ? '↓ Principal' : '↳ Vinculado'}</span>
                          <span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--text-secondary)',fontWeight:600}}>{sg.subExec.processNumber}</span>
                          <span style={{fontSize:9,color:'var(--text-muted)',flex:1}}>{sg.subExec.court||''}</span>
                          <span style={{fontSize:10,color:'var(--text-muted)'}}>{sg.cdas.length} CDA(s) · {fmtCur(subTotal)}</span>
                        </div>}
                        {sg.cdas.map(renderCDACard)}
                      </div>);
                    })}
                  </div>}
                </div>);
              })}
              {unajuizadas.length > 0 && (() => {
                const naCollapseKey = 'pp-na';
                const isCol = collapsedGroups.has(naCollapseKey);
                const naTotal = unajuizadas.reduce((s,d)=>s+(d.value||0),0);
                return (<div style={{marginBottom:16,border:'1px solid rgba(244,63,94,0.25)',borderRadius:'var(--radius-lg)',overflow:'hidden'}}>
                  <div onClick={() => toggleGroup(naCollapseKey)} style={{padding:'10px 14px',background:'rgba(244,63,94,0.08)',display:'flex',alignItems:'center',gap:10,cursor:'pointer',borderLeft:'4px solid var(--red)'}}>
                    <span style={{fontSize:10,color:'var(--red)',fontWeight:700,transform:isCol?'rotate(0deg)':'rotate(90deg)'}}>▶</span>
                    <span style={{fontSize:10,padding:'2px 7px',borderRadius:3,fontWeight:700,background:'rgba(244,63,94,0.2)',color:'var(--red)',textTransform:'uppercase',letterSpacing:0.3}}>⚠ Não Ajuizadas</span>
                    <span style={{fontSize:11,color:'var(--text-secondary)',flex:1}}>CDAs inscritas mas sem execução fiscal — risco elevado de prescrição</span>
                    <span style={{fontSize:11,color:'var(--text-secondary)',fontWeight:600}}>{unajuizadas.length} CDA(s)</span>
                    <span style={{fontSize:13,color:'var(--gold)',fontWeight:700}}>{fmtCur(naTotal)}</span>
                  </div>
                  {!isCol && <div style={{padding:'6px 10px 10px'}}>{unajuizadas.map(renderCDACard)}</div>}
                </div>);
              })()}
            </div>);
          }

          // ═══ Default grouping render (existing flow) ═══
          return (<div className="entity-list">{groups.map((g, gi) => {
            const isCollapsed = collapsedGroups.has('cda-'+g.label);
            const groupTotal = g.items.reduce((s,d)=>s+(d.value||0),0);
            return (<React.Fragment key={gi}>
              {g.label && <div className="group-header" onClick={() => toggleGroup('cda-'+g.label)}>
                <span className={`gh-toggle ${isCollapsed?'':'open'}`}>▶</span>
                <span className="gh-label">{g.label}</span>
                <span className="gh-count">({g.items.length})</span>
                <span className="gh-total">{fmtCur(groupTotal)}</span>
                <input type="checkbox" style={{marginLeft:8,cursor:'pointer'}} onClick={e => e.stopPropagation()}
                  checked={g.items.every(d=>selectedDebts.has(d.id))}
                  onChange={() => { const ids = g.items.map(d=>d.id); setSelectedDebts(prev => { const n = new Set(prev); const allIn = ids.every(id=>n.has(id)); ids.forEach(id => allIn ? n.delete(id) : n.add(id)); return n; }); }} />
              </div>}
              {!isCollapsed && g.items.map(renderCDACard)}
            </React.Fragment>);
          })}</div>);
        })()}
      </div>);
    }

    if (activeTab === 'execucoes') {
      const allExecItems = getOpSlices(opId).executions;
      const opDebts = getOpSlices(opId).debts;
      const opMeasures = getOpSlices(opId).measures;
      const opAssets = getOpSlices(opId).assets;
      const allRespLinks = data.links?.cdaResponsibilities || [];

      // Apply person filter — show executions whose process number matches a CDA in which the selected person has any responsibility
      const items = execPersonFilter === 'all' ? allExecItems : (() => {
        const personCdaIds = new Set(allRespLinks.filter(l => l.personId === execPersonFilter).map(l => l.cdaId));
        const personCdas = opDebts.filter(d => personCdaIds.has(d.id));
        const procNums = new Set(personCdas.map(d => d.processNumber).filter(Boolean));
        // Also include apensos of these executions, and the principal if filtered exec is an apenso
        const direct = allExecItems.filter(e => procNums.has(e.processNumber));
        const directIds = new Set(direct.map(e => e.id));
        // Include parents of apensos
        direct.forEach(e => { if (e.parentExecutionId) directIds.add(e.parentExecutionId); });
        // Include apensos of principals
        allExecItems.forEach(e => { if (e.parentExecutionId && directIds.has(e.parentExecutionId)) directIds.add(e.id); });
        return allExecItems.filter(e => directIds.has(e.id));
      })();

      // IDPJ and Cautelares — from processTag on executions
      const idpjProcesses = items.filter(e => e.processTag === 'idpj' || e.processTag === 'cautelar_fiscal');
      const centralProcesses = items.filter(e => e.processTag === 'central');
      const idpjLinkedExecIds = new Set();
      idpjProcesses.forEach(e => {
        if (e.linkedExecutionIds) e.linkedExecutionIds.forEach(id => idpjLinkedExecIds.add(id));
      });

      // Alert helper: detects pending intimação and open task linked to a given process
      const opIntimations = (data.intimations || []).filter(x => x.operationId === opId);
      const opTasks = (data.tasks || []).filter(t => t.operationId === opId);
      const execAlerts = (exec) => {
        if (!exec?.processNumber) return { intims: [], tasks: [], overdueIntim: false, overdueTask: false };
        const today = new Date();
        const intims = opIntimations.filter(x => sameProc(x.processNumber, exec.processNumber) && (x.status === 'pendente_analise' || x.status === 'aguardando_subsidios' || x.status === 'peca_edicao') && !x.responseAction);
        const tasks = opTasks.filter(t => sameProc(t.processNumber, exec.processNumber) && t.status !== 'concluida' && t.status !== 'cancelada');
        const overdueIntim = intims.some(x => x.dateDeadline && new Date(x.dateDeadline+'T00:00:00') < today);
        const overdueTask = tasks.some(t => t.dueDate && new Date(t.dueDate+'T00:00:00') < today);
        return { intims, tasks, overdueIntim, overdueTask };
      };

      // Reusable alert badges renderer — shows intim (blue) and task (yellow) indicators on process cards
      const renderAlertBadges = (exec, compact = false) => {
        const a = execAlerts(exec);
        if (a.intims.length === 0 && a.tasks.length === 0) return null;
        return (<React.Fragment>
          {a.intims.length > 0 && <span className="has-tip" style={{fontSize:9,padding:'1px 6px',borderRadius:3,fontWeight:700,background:a.overdueIntim?'rgba(244,63,94,0.2)':'rgba(59,130,246,0.2)',color:a.overdueIntim?'var(--red)':'var(--blue)',display:'inline-flex',alignItems:'center',gap:3,animation:'pulse 2s infinite'}}>📬 {a.intims.length}<span className="tip-content">{a.intims.length} intimação(ões) {a.overdueIntim ? 'VENCIDA(S) — prioridade máxima' : 'em aberto'} vinculada(s) a este processo. {!compact && 'Ver aba Intimações.'}</span></span>}
          {a.tasks.length > 0 && <span className="has-tip" style={{fontSize:9,padding:'1px 6px',borderRadius:3,fontWeight:700,background:a.overdueTask?'rgba(244,63,94,0.2)':'rgba(245,158,11,0.2)',color:a.overdueTask?'var(--red)':'var(--yellow)',display:'inline-flex',alignItems:'center',gap:3,animation:'pulse 2s infinite'}}>✓ {a.tasks.length}<span className="tip-content">{a.tasks.length} tarefa(s) {a.overdueTask ? 'VENCIDA(S) — prioridade máxima' : 'em aberto'} vinculada(s) a este processo. {!compact && 'Ver aba Tarefas.'}</span></span>}
        </React.Fragment>);
      };

      // Generate task from a process — pre-fills the task form with process context
      const genTaskFromExec = (exec, ev) => {
        ev.stopPropagation();
        setModal({type:'create',entityType:'task',initial:{
          operationId: opId,
          title: `Atuação no processo ${exec.processNumber || ''}`,
          description: `Processo: ${exec.processNumber || ''}\nClasse: ${exec.className || ''}\nVara: ${exec.court || ''}`,
          processNumber: exec.processNumber || '',
          priority: 'media',
          status: 'pendente',
          taskVisibility: 'operation'
        }});
      };

      // Classify each exec into bucket: 'idpj_cautelar' | 'central' | 'embargos' | 'recursos' | 'ef' | 'outros'
      const classifyExec = (e) => {
        if (e.processTag === 'idpj' || e.processTag === 'cautelar_fiscal') return 'idpj_cautelar';
        if (e.processTag === 'central') return 'central';
        const cn = (e.className || '').toLowerCase();
        if (/embargo/.test(cn)) return 'embargos';
        if (/agravo|apela[çc][ãa]o|recurso(?!.*execu)|reclama[çc][ãa]o constitucional|mandado de seguran[çc]a/.test(cn)) return 'recursos';
        if (/execu[çc][ãa]o fiscal/.test(cn)) return 'ef';
        return 'outros';
      };

      const efExecs = items.filter(e => classifyExec(e) === 'ef');
      const embargosExecs = items.filter(e => classifyExec(e) === 'embargos');
      const recursosExecs = items.filter(e => classifyExec(e) === 'recursos');
      const outrosExecs = items.filter(e => classifyExec(e) === 'outros');

      // Sort executions — main list is EFs only; others go to dedicated sections below
      // Also exclude apensos of central processes — they're rendered under their central principal
      const centralApensoIds = items.filter(e => e.parentExecutionId && centralProcesses.some(c => c.id === e.parentExecutionId)).map(e => e.id);
      let sorted = efExecs.filter(e => !centralApensoIds.includes(e.id));
      if (execSort === 'class') sorted.sort((a,b) => (a.className||'').localeCompare(b.className||''));
      else if (execSort === 'court') sorted.sort((a,b) => (a.court||'').localeCompare(b.court||''));
      else if (execSort === 'guarantee') sorted.sort((a,b) => (a.hasGuarantee?0:1) - (b.hasGuarantee?0:1));
      else if (execSort === 'status') sorted.sort((a,b) => (a.status||'').localeCompare(b.status||''));
      else if (execSort === 'prescription') sorted.sort((a,b) => (a.prescriptionForecast||'9999').localeCompare(b.prescriptionForecast||'9999'));
      else if (execSort === 'cdas_desc') sorted.sort((a,b) => { const va = opDebts.filter(d=>d.processNumber===a.processNumber).reduce((s,d)=>s+(d.value||0),0); const vb = opDebts.filter(d=>d.processNumber===b.processNumber).reduce((s,d)=>s+(d.value||0),0); return vb-va; });
      else if (execSort === 'protocol') sorted.sort((a,b) => (b.protocolDate||'').localeCompare(a.protocolDate||''));
      else if (execSort === 'idpj') sorted.sort((a,b) => { const aTag = (a.processTag==='idpj'||a.processTag==='cautelar_fiscal')?0:idpjLinkedExecIds.has(a.id)?1:2; const bTag = (b.processTag==='idpj'||b.processTag==='cautelar_fiscal')?0:idpjLinkedExecIds.has(b.id)?1:2; return aTag-bTag; });

      const needsGroup = ['class','court','status','guarantee','idpj','por_devedor'].includes(execSort);
      const groups = [];
      if (needsGroup) {
        const gm = {};
        sorted.forEach(e => {
          const st = EXEC_STATUSES[e.status] || {};
          let gk;
          if (execSort === 'class') gk = e.className || 'Sem classe';
          else if (execSort === 'court') gk = e.court || 'Sem vara';
          else if (execSort === 'status') gk = st.label || e.status || 'Sem status';
          else if (execSort === 'guarantee') gk = e.hasGuarantee ? 'Com Garantia' : 'Sem Garantia';
          else if (execSort === 'idpj') gk = (e.processTag==='idpj'||e.processTag==='cautelar_fiscal')?'IDPJ / Cautelares':idpjLinkedExecIds.has(e.id)?'Vinculadas a IDPJ/Cautelar':'Processos comuns';
          else if (execSort === 'por_devedor') {
            // Use the originário of any CDA linked to this exec; fallback to "Sem devedor"
            const linkedCdas = opDebts.filter(d => sameProc(d.processNumber, e.processNumber));
            const origLinks = linkedCdas.flatMap(d => allRespLinks.filter(l => l.cdaId === d.id && l.role === 'originario'));
            const origIds = [...new Set(origLinks.map(l => l.personId))];
            // Determine devedor name
            let devedorName;
            if (origIds.length === 0) devedorName = 'Sem devedor identificado';
            else if (origIds.length === 1) {
              const p = data.people.find(pp => pp.id === origIds[0]);
              devedorName = p?.name || 'Devedor';
            } else {
              const names = origIds.map(id => data.people.find(pp => pp.id === id)?.name || '?').slice(0,2).join(' + ');
              devedorName = `${names}${origIds.length > 2 ? ' + outros' : ''}`;
            }
            // Determine if this exec is linked to any IDPJ or Cautelar Fiscal
            const isIdpjItself = e.processTag === 'idpj' || e.processTag === 'cautelar_fiscal';
            const isLinkedToIdpj = idpjLinkedExecIds.has(e.id);
            // Group key: separate IDPJ-linked vs unlinked EFs per devedor
            // Prefix with a sort marker to keep IDPJ-linked groups right above unlinked ones
            if (isIdpjItself) {
              gk = `0::🛡️ Incidentes/Cautelares — ${devedorName}`;
            } else if (isLinkedToIdpj) {
              gk = `1::⚖️🔗 Execuções Fiscais vinculadas ao Incidente/Cautelar — ${devedorName}`;
            } else {
              gk = `2::⚖️ Execuções Fiscais — ${devedorName}`;
            }
          }
          if (!gm[gk]) gm[gk] = [];
          gm[gk].push(e);
        });
        // Sort by the N:: prefix (0 = IDPJ, 1 = EF vinculada, 2 = EF não vinculada), then by label alpha
        const sortedEntries = Object.entries(gm).sort(([a],[b]) => a.localeCompare(b));
        sortedEntries.forEach(([k, v]) => {
          // Strip the "N::" prefix used only for sorting — display the clean label
          const displayLabel = k.replace(/^\d+::/, '');
          groups.push({ label: displayLabel, items: v });
        });
      } else {
        groups.push({ label: null, items: sorted });
      }

      // CDA inline display helper
      // Helper: find debtors for a process via CDA responsibilities and CDA devedor field
      const getDebtorsForProcess = (processNumber) => {
        if (!processNumber) return [];
        const linkedCDAs = opDebts.filter(d => sameProc(d.processNumber, processNumber));
        const seen = new Set();
        const debtors = [];
        // From CDA responsibilities
        linkedCDAs.forEach(d => {
          (data.links?.cdaResponsibilities || []).filter(r => r.cdaId === d.id).forEach(r => {
            const p = data.people.find(pp => pp.id === r.personId);
            if (p && !seen.has(p.name)) { seen.add(p.name); debtors.push({ name: p.name, id: p.id, role: r.role }); }
          });
          // Fallback: devedor field from CDA
          if (d.devedor && !seen.has(d.devedor)) { seen.add(d.devedor); debtors.push({ name: d.devedor, role: 'originario' }); }
        });
        // If nothing found, try operation-level alvo people
        if (debtors.length === 0) {
          data.people.filter(p => p.operationId === opId && p.operationRole === 'alvo').forEach(p => {
            if (!seen.has(p.name)) { seen.add(p.name); debtors.push({ name: p.name, id: p.id, role: 'alvo' }); }
          });
        }
        return debtors;
      };
      const openEditPersonById = (pid) => setModal({type:'edit',entityType:'person',initial:data.people.find(p=>p.id===pid)});

      
      return (<div className="entity-area">
        {/* ═══ IDPJ / CAUTELARES SECTION ═══ */}
        {idpjProcesses.length > 0 && (
          <div className="idpj-section">
            <div className="idpj-section-title">🛡️ Incidentes de Desconsideração / Cautelares Fiscais ({idpjProcesses.length})</div>
            {idpjProcesses.map(ep => {
              const linkedExecs = items.filter(e => (ep.linkedExecutionIds||[]).includes(e.id));
              const linkedCDAs = opDebts.filter(d => sameProc(d.processNumber, ep.processNumber));
              const linkedEFProcNums = new Set(linkedExecs.map(e => normProc(e.processNumber)).filter(Boolean));
              const allLinkedCDAs = opDebts.filter(d => d.processNumber && linkedEFProcNums.has(normProc(d.processNumber)));
              const totalLinkedCDAValue = allLinkedCDAs.reduce((s,d) => s + (d.value||0), 0);
              const notes = ep.notesList || (ep.notes ? [ep.notes] : []);
              const st = EXEC_STATUSES[ep.status] || {};
              return (<div key={ep.id} style={{marginBottom:12}}>
              <div className="idpj-card" style={ep.status==='extinta'?{opacity:0.4}:{}} onClick={() => setModal({type:'edit',entityType:'execution',initial:ep})}>
                <div className="idpj-left">
                  <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:2,flexWrap:'wrap'}}>
                    <span style={{fontSize:9,padding:'1px 6px',borderRadius:3,fontWeight:600,background:ep.processTag==='idpj'?'rgba(244,63,94,0.2)':'rgba(245,158,11,0.2)',color:ep.processTag==='idpj'?'var(--red)':'var(--yellow)'}}>{tagLabels[ep.processTag]}</span>
                    <span className={`badge ${st.badge||''}`} style={{fontSize:8}}>{st.label||ep.status}</span>
                    {renderAlertBadges(ep, true)}
                  </div>
                  <div style={{fontFamily:'var(--font-mono)',fontSize:11,color:'var(--text-secondary)',marginBottom:2}}><Copyable value={ep.processNumber}>{ep.processNumber}</Copyable></div>
                  <div style={{fontSize:10,color:'var(--text-muted)'}}>{ep.court} {ep.className ? `· ${ep.className}` : ''}</div>
                  <ExecutadoLine processNumber={ep.processNumber} getDebtors={getDebtorsForProcess} onEditPerson={openEditPersonById} />
                </div>
                <div className="idpj-execs">
                  <div style={{fontSize:9,color:'var(--text-muted)',textTransform:'uppercase',marginBottom:3}}>Execuções abrangidas</div>
                  <div className="idpj-linked-execs">
                    {linkedExecs.length === 0 ? <span style={{fontSize:10,color:'var(--text-muted)',fontStyle:'italic'}}>Nenhuma vinculada</span> :
                    linkedExecs.map(e => <span key={e.id} className="idpj-linked-exec">{truncate(e.processNumber,25)}</span>)}
                  </div>
                  {linkedCDAs.length > 0 && <div style={{marginTop:4,fontSize:10}}><span style={{color:'var(--text-muted)'}}>CDAs:</span> <CDAList cdas={linkedCDAs} processNumber={ep.processNumber} onShowAll={setCdaPopup} /></div>}
                  {totalLinkedCDAValue > 0 && <div style={{marginTop:6,padding:'4px 8px',background:'rgba(245,158,11,0.08)',borderRadius:4,borderLeft:'2px solid var(--gold)'}}>
                    <span style={{fontSize:9,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:0.3}}>Valor total das EFs abrangidas</span><br/>
                    <strong style={{color:'var(--gold)',fontSize:13}}>{fmtCur(totalLinkedCDAValue)}</strong>
                    <span style={{fontSize:9,color:'var(--text-muted)',marginLeft:6}}>({allLinkedCDAs.length} CDAs · {linkedExecs.length} EFs)</span>
                  </div>}
                </div>
                <div className="idpj-center">
                  <div style={{display:'flex',gap:14,marginBottom:4}}>
                    <div><span style={{fontSize:9,color:'var(--text-muted)',textTransform:'uppercase'}}>Garantia</span><br/>
                      <span style={{fontSize:11,fontWeight:600,color:ep.hasGuarantee?'var(--green)':'var(--red)'}}>{ep.hasGuarantee ? 'Sim' : 'Não'}</span></div>
                    <div><span style={{fontSize:9,color:'var(--text-muted)',textTransform:'uppercase'}}>Analytics</span><br/>
                      <span>{ep.analyticsRegistered ? '✅' : '❌'}</span></div>
                  </div>
                  {notes.length > 0 && <div className="note-stack" style={{maxHeight:200,overflowY:'auto',marginTop:4}}>
                    {notes.map((n,i) => <div key={i} className="note-item note-item-full">{linkify(n)}</div>)}
                  </div>}
                </div>
                <div className="idpj-right">
                  <span className={`badge ${st.badge||''}`}>{st.label||ep.status}</span>
                  {ep.hasGuarantee && <span className="badge badge-green has-tip" style={{fontSize:8}}>GAR<span className="tip-content">Garantia idônea oferecida no incidente.</span></span>}
                  <button className="btn-secondary btn-xs has-tip" style={{fontSize:9,padding:'2px 8px',marginTop:4,fontWeight:600}} onClick={ev => genTaskFromExec(ep, ev)}>📋 Gerar Tarefa<span className="tip-content">Cria uma nova tarefa já preenchida com os dados deste processo.</span></button>
                </div>
              </div>
              {/* Recursos vinculados (agravos, embargos, etc) */}
              {(() => {
                const recursos = allExecItems.filter(r => r.parentExecutionId === ep.id);
                if (recursos.length === 0) return null;
                return (<div style={{marginLeft:24,borderLeft:'3px solid rgba(122,139,163,0.2)',paddingLeft:10,display:'flex',flexDirection:'column',gap:4,marginTop:4}}>
                  {recursos.map(r => {
                    const rSt = EXEC_STATUSES[r.status] || {};
                    return (<div key={r.id} style={{display:'flex',alignItems:'center',gap:8,padding:'4px 8px',background:'rgba(255,255,255,0.02)',borderRadius:4,fontSize:10,cursor:'pointer',opacity:r.status==='extinta'?0.4:1}} onClick={() => setModal({type:'edit',entityType:'execution',initial:r})}>
                      <span style={{color:'var(--text-muted)',fontSize:9}}>↳</span>
                      <span style={{fontFamily:'var(--font-mono)',fontSize:10}}>{r.processNumber}</span>
                      <span style={{color:'var(--text-muted)',fontSize:9,flex:1}}>{r.className || ''}</span>
                      <span className={`badge ${rSt.badge||''}`} style={{fontSize:8}}>{rSt.label}</span>
                    </div>);
                  })}
                </div>);
              })()}
              </div>);
            })}
          </div>
        )}

        {/* ═══ PROCESSOS CENTRAIS SECTION ═══ */}
        {centralProcesses.length > 0 && (
          <div className="idpj-section" style={{background:'rgba(122,139,163,0.06)',borderColor:'rgba(122,139,163,0.2)'}}>
            <div className="idpj-section-title" style={{color:'var(--purple)'}}>◆ Processos Centrais da Operação ({centralProcesses.length})</div>
            {centralProcesses.map(ep => {
              const linkedCDAs = opDebts.filter(d => sameProc(d.processNumber, ep.processNumber));
              const totalCDA = linkedCDAs.reduce((s,d)=>s+(d.value||0),0);
              const notes = ep.notesList || (ep.notes ? [ep.notes] : []);
              const st = EXEC_STATUSES[ep.status] || {};
              const prescDays = daysUntil(ep.prescriptionForecast);
              const myApensos = items.filter(x => x.parentExecutionId === ep.id);
              return (<div key={ep.id} style={{marginBottom:12}}>
                <div className="idpj-card" style={{borderLeftColor:'var(--purple)',borderColor:'rgba(122,139,163,0.3)',marginBottom:myApensos.length>0?6:0}} onClick={() => setModal({type:'edit',entityType:'execution',initial:ep})}>
                  <div className="idpj-left">
                    <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:2,flexWrap:'wrap'}}>
                      <span style={{fontSize:9,padding:'1px 6px',borderRadius:3,fontWeight:600,background:'rgba(122,139,163,0.2)',color:'var(--purple)'}}>{tagLabels.central || 'Central'}</span>
                      <span className={`badge ${st.badge||''}`} style={{fontSize:8}}>{st.label||ep.status}</span>
                      {ep.hasGuarantee && <span className="badge badge-green has-tip" style={{fontSize:8}}>GAR<span className="tip-content">Garantia idônea.</span></span>}
                      {ep.prescriptionInterrupted && <span className="badge badge-cyan has-tip" style={{fontSize:8}}>PI<span className="tip-content">Prescrição interrompida.</span></span>}
                      {myApensos.length > 0 && <span className="has-tip" style={{fontSize:9,color:'var(--accent)',fontWeight:600}}>📎{myApensos.length}<span className="tip-content">{myApensos.length} processo(s) apensado(s) ao central.</span></span>}
                      {renderAlertBadges(ep, true)}
                    </div>
                    <div style={{fontFamily:'var(--font-mono)',fontSize:11,fontWeight:600,marginBottom:2}}><Copyable value={ep.processNumber}>{ep.processNumber}</Copyable></div>
                    <div style={{fontSize:10,color:'var(--text-muted)'}}>{ep.court || ''}{ep.className ? ` · ${ep.className}` : ''}</div>
                    <div style={{display:'flex',gap:12,marginTop:4,fontSize:10,flexWrap:'wrap'}}>
                      {ep.protocolDate && <span style={{color:'var(--text-muted)'}}>Protocolo: <strong style={{color:'var(--text-secondary)'}}>{fmtDate(ep.protocolDate)}</strong></span>}
                      {ep.prescriptionForecast && <span style={{color:'var(--text-muted)'}}>Prev. Presc.: <strong style={{color:prescDays!==null&&prescDays<=365?prescDays<=180?'var(--red)':'var(--yellow)':'var(--text-secondary)'}}>{fmtDate(ep.prescriptionForecast)}{prescDays!==null&&prescDays<=365?` (${prescDays}d)`:''}</strong></span>}
                    </div>
                  </div>
                  <div className="idpj-execs">
                    <div style={{fontSize:9,color:'var(--text-muted)',textTransform:'uppercase',marginBottom:3}}>CDAs vinculadas</div>
                    {linkedCDAs.length === 0 ? <span style={{fontSize:10,color:'var(--text-muted)',fontStyle:'italic'}}>Nenhuma CDA</span> :
                    <CDAList cdas={linkedCDAs} processNumber={ep.processNumber} onShowAll={setCdaPopup} />}
                    <div style={{marginTop:6,fontSize:11}}><span style={{color:'var(--text-muted)',fontSize:9}}>Valor da causa: </span><strong style={{color:'var(--gold)'}}>{fmtCur(totalCDA)}</strong></div>
                  </div>
                  <div className="idpj-center">
                    {notes.length > 0 && <div className="note-stack" style={{maxHeight:200,overflowY:'auto'}}>
                      {notes.map((n,i) => <div key={i} className="note-item note-item-full">{linkify(n)}</div>)}
                    </div>}
                    {notes.length === 0 && <div style={{fontSize:10,color:'var(--text-muted)',fontStyle:'italic'}}>Sem notas</div>}
                  </div>
                  <div className="idpj-right">
                    <button className="btn-secondary btn-xs" onClick={e => { e.stopPropagation(); setModal({type:'edit',entityType:'execution',initial:ep}); }}>✎ Editar</button>
                    <button className="btn-secondary btn-xs has-tip" style={{fontSize:9,padding:'2px 8px',marginTop:4,fontWeight:600}} onClick={ev => genTaskFromExec(ep, ev)}>📋 Gerar Tarefa<span className="tip-content">Cria uma nova tarefa já preenchida com os dados deste processo central.</span></button>
                  </div>
                </div>

                {/* Apensos indentados sob o central */}
                {myApensos.length > 0 && <div style={{marginLeft:24,borderLeft:'3px solid rgba(122,139,163,0.4)',paddingLeft:10,display:'flex',flexDirection:'column',gap:6}}>
                  {myApensos.map(ap => {
                    const apCdas = opDebts.filter(d => sameProc(d.processNumber, ap.processNumber));
                    const apTotal = apCdas.reduce((s,d)=>s+(d.value||0),0);
                    const apSt = EXEC_STATUSES[ap.status] || {};
                    const apNotes = ap.notesList || (ap.notes ? [ap.notes] : []);
                    const apPrescDays = daysUntil(ap.prescriptionForecast);
                    return (<div key={ap.id} className="idpj-card" style={{background:'var(--bg-elevated)',borderLeftColor:'var(--purple)',borderColor:'rgba(122,139,163,0.2)',opacity:0.95}} onClick={e => { e.stopPropagation(); setModal({type:'edit',entityType:'execution',initial:ap}); }}>
                      <div className="idpj-left">
                        <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:2}}>
                          <span style={{color:'var(--purple)',fontSize:9,fontWeight:600}}>↳ apenso</span>
                          <span className={`badge ${apSt.badge||''}`} style={{fontSize:8}}>{apSt.label||ap.status}</span>
                          {ap.hasGuarantee && <span className="badge badge-green" style={{fontSize:8}}>GAR</span>}
                          {ap.prescriptionInterrupted && <span className="badge badge-cyan" style={{fontSize:8}}>PI</span>}
                        </div>
                        <div style={{fontFamily:'var(--font-mono)',fontSize:11,fontWeight:600,marginBottom:2}}><Copyable value={ap.processNumber}>{ap.processNumber}</Copyable></div>
                        <div style={{fontSize:10,color:'var(--text-muted)'}}>{ap.court || ''}{ap.className ? ` · ${ap.className}` : ''}</div>
                        <ExecutadoLine processNumber={ap.processNumber} getDebtors={getDebtorsForProcess} onEditPerson={openEditPersonById} />
                        <div style={{display:'flex',gap:12,marginTop:4,fontSize:10,flexWrap:'wrap'}}>
                          {ap.protocolDate && <span style={{color:'var(--text-muted)'}}>Protocolo: <strong style={{color:'var(--text-secondary)'}}>{fmtDate(ap.protocolDate)}</strong></span>}
                          {ap.prescriptionForecast && <span style={{color:'var(--text-muted)'}}>Prev. Presc.: <strong style={{color:apPrescDays!==null&&apPrescDays<=365?apPrescDays<=180?'var(--red)':'var(--yellow)':'var(--text-secondary)'}}>{fmtDate(ap.prescriptionForecast)}{apPrescDays!==null&&apPrescDays<=365?` (${apPrescDays}d)`:''}</strong></span>}
                        </div>
                      </div>
                      <div className="idpj-execs">
                        <div style={{fontSize:9,color:'var(--text-muted)',textTransform:'uppercase',marginBottom:3}}>CDAs vinculadas</div>
                        {apCdas.length === 0 ? <span style={{fontSize:10,color:'var(--text-muted)',fontStyle:'italic'}}>Nenhuma CDA</span> :
                        <CDAList cdas={apCdas} processNumber={ap.processNumber} onShowAll={setCdaPopup} />}
                        <div style={{marginTop:6,fontSize:11}}><span style={{color:'var(--text-muted)',fontSize:9}}>Valor da causa: </span><strong style={{color:'var(--gold)'}}>{fmtCur(apTotal)}</strong></div>
                      </div>
                      <div className="idpj-center">
                        {apNotes.length > 0 && <div style={{fontSize:10,color:'var(--text-muted)'}}>{truncate(apNotes[0], 80)}{apNotes.length>1?` (+${apNotes.length-1})`:''}</div>}
                        {apNotes.length === 0 && <div style={{fontSize:10,color:'var(--text-muted)',fontStyle:'italic'}}>Sem notas</div>}
                      </div>
                      <div className="idpj-right">
                        <button className="btn-secondary btn-xs" onClick={e => { e.stopPropagation(); setModal({type:'edit',entityType:'execution',initial:ap}); }}>✎ Editar</button>
                      </div>
                    </div>);
                  })}
                </div>}
              </div>);
            })}
          </div>
        )}

        {/* ═══ EXECUTIONS LIST ═══ */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,flexWrap:'wrap',gap:8}}>
          <span style={{color:'var(--text-muted)',fontSize:11}}>{items.length} processo(s){execPersonFilter !== 'all' && ` (filtrado de ${allExecItems.length})`}</span>
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            <select value={execSort} onChange={e=>{setExecSort(e.target.value);setCollapsedGroups(new Set());}} style={{width:'auto',fontSize:10,padding:'4px 8px'}}>
              <option value="por_devedor">Por Devedor (Empresa)</option>
              <option value="class">Agrupar por Classe</option>
              <option value="court">Agrupar por Vara</option>
              <option value="status">Agrupar por Status</option>
              <option value="guarantee">Com/Sem Garantia</option>
              <option value="idpj">Vinculados/Não vinculados a IDPJ</option>
              <option value="prescription">Prescrição (mais próxima)</option>
              <option value="cdas_desc">Valor CDAs (maior)</option>
              <option value="protocol">Data Protocolo (recente)</option>
            </select>
            <button className="btn-primary btn-sm" onClick={() => setModal({type:'create',entityType:'execution',initial:{}})}>+ Processo</button>
          </div>
        </div>

        <PersonSubtabs data={data} opId={opId} currentFilter={execPersonFilter} onChange={setExecPersonFilter} mode="exec" />

        {selectedExecs.size > 0 && (<div className="bulk-bar">
          <span>{selectedExecs.size} selecionada(s)</span>
          <button className="btn-danger btn-sm" onClick={() => bulkDelete('executions', selectedExecs)}>Excluir selecionadas</button>
          <button className="btn-secondary btn-xs" onClick={() => setSelectedExecs(new Set())}>Limpar</button>
        </div>)}

        {items.length === 0 ? <div className="empty-state"><div className="empty-icon">⚖️</div><p>Nenhum processo</p></div> :
        <div className="entity-list">{(() => {
          // Separate priority groups (IDPJ/MCF/EF) from others, and push Embargos to the very end
          const priorityClasses = ['execução fiscal','execucao fiscal','cautelar fiscal','incidente de desconsideração','incidente de desconsideracao'];
          const isPriority = (g) => {
            const lbl = (g.label||'').toLowerCase();
            return lbl.includes('idpj') || lbl.includes('cautelar') || lbl.includes('execuções fiscais') || lbl.includes('execução fiscal') || lbl.includes('vinculad') || priorityClasses.some(pc => lbl.includes(pc));
          };
          const isEmbargos = (g) => {
            const lbl = (g.label||'').toLowerCase();
            return lbl.includes('embargo');
          };
          const priorityGroups = groups.filter(g => !g.label || isPriority(g));
          const embargosGroups = groups.filter(g => g.label && isEmbargos(g));
          const otherGroups = groups.filter(g => g.label && !isPriority(g) && !isEmbargos(g));
          const allOrdered = [...priorityGroups, ...otherGroups, ...embargosGroups];

          return allOrdered.map((g, gi) => {
            const isOther = g.label && !isPriority(g);
            const defaultCollapsed = isOther && !collapsedGroups.has('exec-'+g.label+'-opened');
            const isCollapsed = defaultCollapsed || collapsedGroups.has('exec-'+g.label);
            const groupCDATotal = g.items.reduce((s,e) => s + opDebts.filter(d=>d.processNumber===e.processNumber).reduce((ss,d)=>ss+(d.value||0),0), 0);
            return (<React.Fragment key={gi}>
              {g.label && <div className="group-header" onClick={() => {
                if (defaultCollapsed) { toggleGroup('exec-'+g.label+'-opened'); }
                else { toggleGroup('exec-'+g.label); }
              }}>
                <span className={`gh-toggle ${isCollapsed?'':'open'}`}>▶</span>
                <span className="gh-label">{g.label}</span>
                <span className="gh-count">({g.items.length})</span>
                <span className="gh-total">{fmtCur(groupCDATotal)}</span>
                <input type="checkbox" style={{marginLeft:8,cursor:'pointer'}} onClick={ev => ev.stopPropagation()}
                  checked={g.items.every(e=>selectedExecs.has(e.id))}
                  onChange={() => { const ids = g.items.map(e=>e.id); setSelectedExecs(prev => { const n = new Set(prev); const allIn = ids.every(id=>n.has(id)); ids.forEach(id => allIn ? n.delete(id) : n.add(id)); return n; }); }} />
              </div>}
              {!isCollapsed && (() => {
                // Reusable full card renderer for executions
                const ExecCard = ({ e, isApenso = false }) => {
                  const linkedCDAs = opDebts.filter(d => sameProc(d.processNumber, e.processNumber));
                  const totalCDA = linkedCDAs.reduce((s,d)=>s+(d.value||0),0);
                  const st = EXEC_STATUSES[e.status] || {};
                  const prescDays = daysUntil(e.prescriptionForecast);
                  const isLinkedToIDPJ = idpjLinkedExecIds.has(e.id);
                  const isTagged = e.processTag && e.processTag !== 'normal';
                  const notes = e.notesList || (e.notes ? [e.notes] : []);
                  const myApensos = items.filter(x => {
                    if (x.parentExecutionId !== e.id) return false;
                    const xcn = (x.className || '').toLowerCase();
                    if (/embargo/.test(xcn)) return false;
                    if (/agravo|apela[çc][ãa]o|recurso(?!.*execu)|reclama[çc][ãa]o constitucional|mandado de seguran[çc]a/.test(xcn)) return false;
                    return true;
                  });
                  const apensosCollapseKey = 'apensos-'+e.id;
                  const apensosCollapsed = collapsedGroups.has(apensosCollapseKey);
                  return (<div className="entity-card-selectable" style={{display:'flex',flexDirection:'column',alignItems:'stretch',width:'100%'}}>
                    <div style={{display:'flex',alignItems:'flex-start',gap:6,width:'100%'}}>
                      <input type="checkbox" checked={selectedExecs.has(e.id)} onChange={() => toggleExec(e.id)} style={{marginTop:14}} />
                      <div className={`idpj-card ${isLinkedToIDPJ ? 'linked-idpj' : ''}`} style={{flex:1,minWidth:0,background:e.isRelevant?'rgba(200,160,74,0.04)':(isApenso?'var(--bg-elevated)':'var(--bg-card)'),borderLeftColor:e.isRelevant?'var(--gold)':(isApenso?'var(--accent)':isLinkedToIDPJ?'var(--pgfn)':'var(--border)'),borderLeftWidth:e.isRelevant||isApenso||isLinkedToIDPJ?3:1,opacity:e.status==='extinta'||e.status==='arquivada'?0.45:1}} onClick={() => setModal({type:'edit',entityType:'execution',initial:e})}>
                        {/* COL 1: Nº processo + badges + vara/classe */}
                        <div className="idpj-left">
                          <div style={{display:'flex',gap:5,alignItems:'center',marginBottom:3,flexWrap:'wrap'}}>
                            <span onClick={ev => { ev.stopPropagation(); upsert('executions', { ...e, isRelevant: !e.isRelevant }); }} style={{cursor:'pointer',fontSize:12,lineHeight:1,opacity:e.isRelevant?1:0.3,transition:'opacity 0.15s'}} title={e.isRelevant?'Remover destaque':'Marcar como relevante'}>{e.isRelevant?'★':'☆'}</span>
                            <span onClick={ev => { ev.stopPropagation(); const el = ev.currentTarget; copyText(buildExecQualification(e, data)); el.textContent = '✓'; setTimeout(() => { try { el.textContent = '📋'; } catch(x){} }, 1500); }} style={{cursor:'pointer',fontSize:11,lineHeight:1,opacity:0.4,transition:'opacity 0.15s'}} title="Copiar resumo do processo (nº, classe, juízo, CDAs, executados) para colar em petição">📋</span>
                            {isApenso && <span style={{fontSize:9,color:'var(--accent)',fontWeight:700}}>↳ apenso</span>}
                            {myApensos.length > 0 && <span className="has-tip" style={{fontSize:9,color:'var(--accent)',fontWeight:700,cursor:'pointer'}} onClick={ev => { ev.stopPropagation(); toggleGroup(apensosCollapseKey); }}>📎{myApensos.length}<span className="tip-content">Processo PRINCIPAL com {myApensos.length} apenso(s). Clique para colapsar/expandir.</span></span>}
                            {isTagged && <span style={{fontSize:9,padding:'1px 6px',borderRadius:3,fontWeight:700,background:e.processTag==='idpj'?'rgba(244,63,94,0.2)':e.processTag==='cautelar_fiscal'?'rgba(245,158,11,0.2)':'rgba(122,139,163,0.2)',color:e.processTag==='idpj'?'var(--red)':e.processTag==='cautelar_fiscal'?'var(--yellow)':'var(--purple)'}}>{tagLabels[e.processTag]||e.processTag}</span>}
                            {isLinkedToIDPJ && !isTagged && <span className="badge badge-red has-tip" style={{fontSize:9}}>↗ IDPJ<span className="tip-content">Execução abrangida por incidente.</span></span>}
                            {renderAlertBadges(e)}
                          </div>
                          <div style={{fontFamily:'var(--font-mono)',fontSize:12,fontWeight:700,marginBottom:3}}>
                            {e.processNumber ? <Copyable value={e.processNumber}>{e.processNumber}</Copyable> : 'Sem nº'}
                          </div>
                          <div style={{fontSize:10,color:'var(--text-muted)',lineHeight:1.4}}>{e.court || ''}{e.className?` · ${e.className}`:''}</div>
                          <ExecutadoLine processNumber={e.processNumber} getDebtors={getDebtorsForProcess} onEditPerson={openEditPersonById} />
                          <div style={{display:'flex',gap:12,marginTop:4,fontSize:10,flexWrap:'wrap'}}>
                            {e.protocolDate && <span style={{color:'var(--text-muted)'}}>Protocolo: <strong style={{color:'var(--text-secondary)'}}>{fmtDate(e.protocolDate)}</strong></span>}
                            {e.prescriptionForecast && <span style={{color:'var(--text-muted)'}}>Prev. Presc.: <strong style={{color:prescDays!==null&&prescDays<=365?prescDays<=180?'var(--red)':'var(--yellow)':'var(--text-secondary)'}}>{fmtDate(e.prescriptionForecast)}{prescDays!==null&&prescDays<=365?` (${prescDays}d)`:''}</strong></span>}
                          </div>
                        </div>
                        {/* COL 2: CDAs vinculadas + valor */}
                        <div className="idpj-execs">
                          <div style={{fontSize:9,color:'var(--text-muted)',textTransform:'uppercase',marginBottom:3,fontWeight:600,letterSpacing:0.3}}>CDAs vinculadas ({linkedCDAs.length})</div>
                          {linkedCDAs.length === 0 ? <span style={{fontSize:10,color:'var(--text-muted)',fontStyle:'italic'}}>Nenhuma CDA</span> :
                          <div style={{fontSize:11}}><CDAList cdas={linkedCDAs} processNumber={e.processNumber} onShowAll={setCdaPopup} /></div>}
                          <div style={{marginTop:6,fontSize:11}}>
                            <span style={{fontSize:9,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:0.3}}>Valor da causa</span><br/>
                            <strong style={{color:'var(--gold)',fontSize:13}}>{fmtCur(totalCDA)}</strong>
                          </div>
                        </div>
                        {/* COL 3: Notas */}
                        <div className="idpj-center">
                          {(() => {
                            const filteredNotes = notes.filter(n => {
                              const nl = (n || '').toLowerCase();
                              if (/^[\s·]*classe:\s/i.test(n)) return false;
                              if (/^[\s·]*execu[çc][ãa]o fiscal\s*\(?sida\)?$/i.test(nl.trim())) return false;
                              return true;
                            });
                            return filteredNotes.length > 0 ? <div className="note-stack" style={{maxHeight:220,overflowY:'auto'}}>
                              {filteredNotes.map((n,i) => <div key={i} className="note-item note-item-full">{linkify(n)}</div>)}
                            </div> : <div style={{fontSize:10,color:'var(--text-muted)',fontStyle:'italic'}}>Sem notas</div>;
                          })()}
                        </div>
                        {/* COL 4: Badges + ações */}
                        <div className="idpj-right">
                          <span className={`badge ${st.badge||''}`} style={{fontSize:10,fontWeight:700}}>{st.label||e.status}</span>
                          {e.hasGuarantee && <span className="badge badge-green has-tip" style={{fontSize:9}}>GAR<span className="tip-content">Garantia idônea.</span></span>}
                          {e.prescriptionInterrupted && <span className="badge badge-cyan has-tip" style={{fontSize:9}}>PI<span className="tip-content">Prescrição interrompida.</span></span>}
                          <button className="btn-secondary btn-xs has-tip" style={{fontSize:9,padding:'2px 8px',marginTop:4,fontWeight:600}} onClick={ev => genTaskFromExec(e, ev)}>📋 Gerar Tarefa<span className="tip-content">Cria uma nova tarefa já preenchida com os dados deste processo. Útil para planejar próxima atuação proativa.</span></button>
                        </div>
                      </div>
                    </div>
                    {myApensos.length > 0 && !apensosCollapsed && <div style={{marginLeft:24,marginTop:6,borderLeft:'3px solid var(--accent-dim)',paddingLeft:10,display:'flex',flexDirection:'column',gap:6}}>
                      {myApensos.map(ap => <React.Fragment key={ap.id}>{ExecCard({ e: ap, isApenso: true })}</React.Fragment>)}
                    </div>}
                  </div>);
                };

                const topLevelExecs = g.items.filter(e => !e.parentExecutionId || !items.some(p => p.id === e.parentExecutionId));
                return (<div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:4}}>
                  {topLevelExecs.map(e => <React.Fragment key={e.id}>{ExecCard({ e, isApenso: false })}</React.Fragment>)}
                </div>);
              })()}
            </React.Fragment>);
          });
        })()}</div>}

        {/* ═══ EMBARGOS / RECURSOS / OUTROS SECTIONS ═══ */}
        {(() => {
          // Build a reusable renderer for these auxiliary sections.
          // Cards are rendered via the same ExecCard closure-scoped above? No — we need a standalone renderer
          // since ExecCard was defined inside a group callback. We'll render inline.
          const renderAuxCard = (e, isApenso = false, sectionColor = 'var(--border)') => {
            const linkedCDAs = opDebts.filter(d => sameProc(d.processNumber, e.processNumber));
            const totalCDA = linkedCDAs.reduce((s,d)=>s+(d.value||0),0);
            const st = EXEC_STATUSES[e.status] || {};
            const prescDays = daysUntil(e.prescriptionForecast);
            const isTagged = e.processTag && e.processTag !== 'normal';
            const notes = e.notesList || (e.notes ? [e.notes] : []);
            // Find parent EF if this is apenso to one (to show linkage)
            const parentEF = e.parentExecutionId ? items.find(x => x.id === e.parentExecutionId) : null;
            return (<div key={e.id} className="entity-card-selectable" style={{display:'flex',flexDirection:'column',alignItems:'stretch',width:'100%',marginBottom:8}}>
              <div style={{display:'flex',alignItems:'flex-start',gap:6,width:'100%'}}>
                <input type="checkbox" checked={selectedExecs.has(e.id)} onChange={() => toggleExec(e.id)} style={{marginTop:14}} />
                <div className="idpj-card" style={{flex:1,minWidth:0,background:isApenso?'var(--bg-elevated)':'var(--bg-card)',borderLeftColor:sectionColor,borderLeftWidth:3}} onClick={() => setModal({type:'edit',entityType:'execution',initial:e})}>
                  <div className="idpj-left">
                    <div style={{display:'flex',gap:5,alignItems:'center',marginBottom:3,flexWrap:'wrap'}}>
                      {isApenso && <span style={{fontSize:9,color:'var(--accent)',fontWeight:700}}>↳ apenso</span>}
                      {parentEF && <span className="has-tip" style={{fontSize:9,color:'var(--accent)',fontWeight:700}}>🔗 vinculado<span className="tip-content">Vinculado à EF {parentEF.processNumber}</span></span>}
                      {renderAlertBadges(e)}
                    </div>
                    <div style={{fontFamily:'var(--font-mono)',fontSize:12,fontWeight:700,marginBottom:3}}>
                      {e.processNumber ? <Copyable value={e.processNumber}>{e.processNumber}</Copyable> : 'Sem nº'}
                    </div>
                    <div style={{fontSize:10,color:'var(--text-muted)',lineHeight:1.4}}>{e.court || ''}{e.className?` · ${e.className}`:''}</div>
                    <ExecutadoLine processNumber={e.processNumber} getDebtors={getDebtorsForProcess} onEditPerson={openEditPersonById} />
                    {parentEF && <div style={{fontSize:9,color:'var(--accent)',marginTop:3,fontFamily:'var(--font-mono)'}}>↳ EF principal: {parentEF.processNumber}</div>}
                  </div>
                  <div className="idpj-execs">
                    {linkedCDAs.length > 0 ? <>
                      <div style={{fontSize:9,color:'var(--text-muted)',textTransform:'uppercase',marginBottom:3,fontWeight:600,letterSpacing:0.3}}>CDAs vinculadas ({linkedCDAs.length})</div>
                      <div style={{fontSize:11}}><CDAList cdas={linkedCDAs} processNumber={e.processNumber} onShowAll={setCdaPopup} /></div>
                      <div style={{marginTop:6,fontSize:11}}>
                        <span style={{fontSize:9,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:0.3}}>Valor da causa</span><br/>
                        <strong style={{color:'var(--gold)',fontSize:13}}>{fmtCur(totalCDA)}</strong>
                      </div>
                    </> : <div style={{fontSize:10,color:'var(--text-muted)',fontStyle:'italic'}}>Sem CDAs vinculadas diretamente</div>}
                  </div>
                  <div className="idpj-center">
                    <div style={{display:'flex',gap:14,marginBottom:6,flexWrap:'wrap'}}>
                      {e.protocolDate && <div><span style={{fontSize:9,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:0.3}}>Protocolo</span><br/>
                        <span style={{fontSize:11,fontWeight:600}}>{fmtDate(e.protocolDate)}</span></div>}
                      {e.prescriptionForecast && <div><span style={{fontSize:9,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:0.3}}>Prev. Presc.</span><br/>
                        <span style={{fontSize:11,fontWeight:700,color:prescDays!==null&&prescDays<=365?prescDays<=180?'var(--red)':'var(--yellow)':'var(--text-primary)'}}>{fmtDate(e.prescriptionForecast)}{prescDays!==null&&prescDays<=365?` (${prescDays}d)`:''}</span></div>}
                    </div>
                    {notes.length > 0 && <div className="note-stack" style={{maxHeight:220,overflowY:'auto'}}>
                      {notes.map((n,i) => <div key={i} className="note-item note-item-full">{linkify(n)}</div>)}
                    </div>}
                  </div>
                  <div className="idpj-right">
                    <span className={`badge ${st.badge||''}`} style={{fontSize:10,fontWeight:700}}>{st.label||e.status}</span>
                    {e.hasGuarantee && <span className="badge badge-green has-tip" style={{fontSize:9}}>GAR<span className="tip-content">Garantia idônea.</span></span>}
                    {e.prescriptionInterrupted && <span className="badge badge-cyan has-tip" style={{fontSize:9}}>PI<span className="tip-content">Prescrição interrompida.</span></span>}
                    <button className="btn-secondary btn-xs has-tip" style={{fontSize:9,padding:'2px 8px',marginTop:4,fontWeight:600}} onClick={ev => genTaskFromExec(e, ev)}>📋 Gerar Tarefa<span className="tip-content">Cria uma nova tarefa já preenchida com os dados deste processo.</span></button>
                  </div>
                </div>
              </div>
            </div>);
          };

          // Embargos, Recursos and Outros ALWAYS appear in their dedicated sections.
          // When they have a parentExecutionId pointing to an EF/IDPJ/MCF, a "🔗 vinculado" badge
          // is shown in the card (see renderAuxCard), but they do NOT appear indented under the parent.
          const embargosTop = embargosExecs;
          const recursosTop = recursosExecs;
          const outrosTop = outrosExecs;

          return (<>
            {embargosTop.length > 0 && <div style={{marginTop:20}}>
              <div style={{fontSize:12,fontWeight:700,color:'var(--yellow)',marginBottom:10,textTransform:'uppercase',letterSpacing:0.5,paddingBottom:6,borderBottom:'1px solid rgba(245,158,11,0.25)'}}>📎 Embargos à Execução ({embargosTop.length})</div>
              {embargosTop.map(e => renderAuxCard(e, false, 'var(--yellow)'))}
            </div>}
            {recursosTop.length > 0 && <div style={{marginTop:20}}>
              <div style={{fontSize:12,fontWeight:700,color:'var(--blue)',marginBottom:10,textTransform:'uppercase',letterSpacing:0.5,paddingBottom:6,borderBottom:'1px solid rgba(59,130,246,0.25)'}}>⚖️ Recursos ({recursosTop.length}) <span style={{fontSize:10,fontWeight:400,color:'var(--text-muted)',textTransform:'none',letterSpacing:0}}>— Agravos, apelações, mandados de segurança, etc.</span></div>
              {recursosTop.map(e => renderAuxCard(e, false, 'var(--blue)'))}
            </div>}
            {outrosTop.length > 0 && <div style={{marginTop:20}}>
              <div style={{fontSize:12,fontWeight:700,color:'var(--text-muted)',marginBottom:10,textTransform:'uppercase',letterSpacing:0.5,paddingBottom:6,borderBottom:'1px solid var(--border)'}}>📋 Outros Processos ({outrosTop.length})</div>
              {outrosTop.map(e => renderAuxCard(e, false, 'var(--text-muted)'))}
            </div>}
          </>);
        })()}

        {/* CDA Popup */}
        {cdaPopup && (<div className="cda-popup-overlay" onClick={() => setCdaPopup(null)}>
          <div className="cda-popup" onClick={e => e.stopPropagation()}>
            <h4>CDAs vinculadas — {cdaPopup.processNumber}</h4>
            {cdaPopup.cdas.map(d => (
              <div key={d.id} className="cda-popup-row">
                <span style={{fontWeight:600}}>{d.cdaNumber||'CDA'}</span>
                <span>{d.tribute||''}</span>
                <span style={{fontWeight:600}}>{fmtCur(d.value)}</span>
                <span className={`badge ${(DEBT_STATUSES[d.status]||{}).badge||''}`} style={{fontSize:9}}>{(DEBT_STATUSES[d.status]||{}).label||d.status}</span>
              </div>
            ))}
            <div style={{marginTop:8,fontSize:11,color:'var(--text-muted)'}}>Total: {fmtCur(cdaPopup.cdas.reduce((s,d)=>s+(d.value||0),0))}</div>
            <div className="cda-popup-copy">
              <button className="btn-secondary btn-sm" onClick={() => {
                const txt = cdaPopup.cdas.map(d => `${d.cdaNumber||'CDA'} — ${fmtCur(d.value)} — ${(DEBT_STATUSES[d.status]||{}).label||d.status}`).join('\n');
                navigator.clipboard.writeText(txt);
              }}>📋 Copiar lista</button>
              <button className="btn-secondary btn-sm" style={{marginLeft:8}} onClick={() => setCdaPopup(null)}>Fechar</button>
            </div>
          </div>
        </div>)}
      </div>);
    }

    if (activeTab === 'prescricao') {
      const execs = getOpSlices(opId).executions;
      const allDebts = getOpSlices(opId).debts;
      const prescEvents = data.prescriptionEvents || [];

      // Group CDAs: by execution, then unlinked
      const cdaGroups = [];
      execs.forEach(exec => {
        const cdas = allDebts.filter(d => d.processNumber && sameProc(d.processNumber, exec.processNumber));
        if (cdas.length > 0) cdaGroups.push({ type: 'exec', exec, cdas });
      });
      const unlinkedCDAs = allDebts.filter(d => !d.processNumber || !execs.some(e => sameProc(e.processNumber, d.processNumber)));
      if (unlinkedCDAs.length > 0) cdaGroups.push({ type: 'unlinked', exec: null, cdas: unlinkedCDAs });

      const toggleCDA = (id) => setSelectedCDAs(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
      const selectGroup = (cdas) => setSelectedCDAs(prev => { const n = new Set(prev); const allIn = cdas.every(d => n.has(d.id)); cdas.forEach(d => allIn ? n.delete(d.id) : n.add(d.id)); return n; });

      const addBatchEvent = () => {
        if (selectedCDAs.size === 0) return;
        setModal({type:'create', entityType:'prescriptionEvent', initial:{ batchCdaIds: [...selectedCDAs] }});
      };

      return (<div className="entity-area">
        <div className="presc-legal-ref">
          <strong>Prescrição por CDA</strong> — Ajuizadas: data mais recente (inscrição ou protocolo) + 6 anos (1a suspensão + 5a arquivamento, Art. 40 LEF). Não ajuizadas: inscrição + 5 anos (Art. 174 CTN). Eventos interruptivos reiniciam a contagem; eventos suspensivos pausam.
        </div>

        {selectedCDAs.size > 0 && (
          <div style={{display:'flex',gap:8,alignItems:'center',padding:'8px 12px',background:'var(--accent-dim)',borderRadius:'var(--radius)',marginBottom:12,flexWrap:'wrap'}}>
            <span style={{fontSize:12,fontWeight:600,color:'var(--accent)'}}>{selectedCDAs.size} CDA(s) selecionada(s)</span>
            <button className="btn-primary btn-sm" onClick={addBatchEvent}>+ Evento em Lote</button>
            <button className="btn-secondary btn-sm" onClick={() => {
              if (!confirm(`Marcar ${selectedCDAs.size} CDA(s) como prescrição tratada?`)) return;
              const ids = [...selectedCDAs];
              const now = new Date().toISOString();
              const today = now.slice(0,10);
              setData(prev => ({...prev, debts: prev.debts.map(d => ids.includes(d.id) ? {...d, prescriptionHandled: true, prescriptionHandledAt: d.prescriptionHandledAt || today, prescriptionHandledType: d.prescriptionHandledType || 'declarada', updatedAt: now} : d)}));
              setSelectedCDAs(new Set());
            }}>✓ Marcar como tratadas</button>
            <button className="btn-secondary btn-sm" onClick={() => {
              if (!confirm(`Reabrir ${selectedCDAs.size} CDA(s) (remover marcação de tratada)?`)) return;
              const ids = [...selectedCDAs];
              const now = new Date().toISOString();
              setData(prev => ({...prev, debts: prev.debts.map(d => ids.includes(d.id) ? {...d, prescriptionHandled: false, updatedAt: now} : d)}));
              setSelectedCDAs(new Set());
            }}>↻ Reabrir alertas</button>
            <button className="btn-secondary btn-xs" onClick={() => setSelectedCDAs(new Set())} style={{marginLeft:'auto'}}>Limpar seleção</button>
          </div>
        )}

        {allDebts.length === 0 ? <div className="empty-state"><div className="empty-icon">⏱</div><p>Importe CDAs para controlar prescrição.</p></div> :
        <div className="entity-list">{(() => {
          // Build map: principalId → [apenso groups]
          const apensoMap = {};
          cdaGroups.forEach(g => {
            if (g.type === 'exec' && g.exec.parentExecutionId) {
              if (!apensoMap[g.exec.parentExecutionId]) apensoMap[g.exec.parentExecutionId] = [];
              apensoMap[g.exec.parentExecutionId].push(g);
            }
          });
          // Filter top-level: principals + non-apensos + unlinked. Apensos render under their principal.
          const topLevel = cdaGroups.filter(g => g.type !== 'exec' || !g.exec.parentExecutionId);

          // Reusable card renderer — same single-line layout for principal AND apensos
          const PrescCard = ({ group, isApenso = false }) => {
            const isExec = group.type === 'exec';
            const groupAllSelected = group.cdas.every(d => selectedCDAs.has(d.id));
            const groupEvents = prescEvents.filter(pe =>
              (isExec && pe.executionId === group.exec.id) ||
              group.cdas.some(d => pe.cdaId === d.id || (pe.batchCdaIds && pe.batchCdaIds.includes(d.id)))
            ).sort((a,b) => (b.date||'').localeCompare(a.date||''));
            // For apensos, also show inherited events from principal
            const inheritedFromParent = isExec && group.exec.parentExecutionId
              ? prescEvents.filter(pe => pe.executionId === group.exec.parentExecutionId && !pe.cdaId && (!pe.batchCdaIds || pe.batchCdaIds.length === 0))
              : [];
            const allDisplayedEvents = [...groupEvents, ...inheritedFromParent.filter(ie => !groupEvents.some(ge => ge._inheritedFromParent === group.exec.parentExecutionId && ge.date === ie.date && ge.type === ie.type))];
            const apensos = isExec ? cdaGroups.filter(x => x.type === 'exec' && x.exec.parentExecutionId === group.exec.id) : [];

            return (<div className="entity-card" style={{display:'grid',gridTemplateColumns:'1.2fr 1.3fr 0.8fr',gap:14,alignItems:'start',marginBottom:8,background:isApenso?'var(--bg-elevated)':'var(--bg-card)'}}>
              {/* COL 1: Process header + CDAs list */}
              <div style={{minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
                  <input type="checkbox" checked={groupAllSelected} onChange={() => selectGroup(group.cdas)} style={{width:16,cursor:'pointer'}} />
                  {isExec ? <div style={{minWidth:0,flex:1}}>
                    <div style={{fontFamily:'var(--font-mono)',fontSize:12,fontWeight:600}}>
                      {isApenso && <span style={{color:'var(--accent)',marginRight:4,fontSize:10}}>↳ apenso</span>}
                      {apensos.length > 0 && <span style={{color:'var(--accent)',marginRight:4}} title={`${apensos.length} apenso(s)`}>📎{apensos.length}</span>}
                      <Copyable value={group.exec.processNumber}>{group.exec.processNumber}</Copyable>
                    </div>
                    <div style={{fontSize:10,color:'var(--text-muted)'}}>{group.exec.court} {group.exec.className?'· '+group.exec.className:''}</div>
                  </div> : <span style={{color:'var(--red)',fontWeight:600,fontSize:12}}>⚠ CDAs Não Ajuizadas</span>}
                </div>
                <div style={{maxHeight:200,overflowY:'auto'}}>
                  {group.cdas.map(d => {
                    const autoPresc = calcAutoPresc(d, execs, data.prescriptionEvents || []);
                    const prescDate = d.prescriptionDate || autoPresc;
                    const days = daysUntil(prescDate);
                    const isSelected = selectedCDAs.has(d.id);
                    const isHandled = !!d.prescriptionHandled;
                    const st = isHandled ? 'tratada' : days === null ? 'sem_dados' : days <= 0 ? 'prescrito' : days <= 180 ? 'critico' : days <= 365 ? 'alerta' : 'correndo';
                    const cdaSt = DEBT_STATUSES[d.status] || {};
                    const toggleHandled = () => {
                      setData(prev => ({...prev, debts: prev.debts.map(x => x.id === d.id ? {...x, prescriptionHandled: !x.prescriptionHandled, prescriptionHandledAt: !x.prescriptionHandled ? new Date().toISOString().slice(0,10) : x.prescriptionHandledAt, updatedAt: new Date().toISOString()} : x)}));
                    };
                    return (<div key={d.id} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 6px',borderBottom:'1px dotted var(--border)',background:isHandled?'rgba(64,168,112,0.06)':isSelected?'var(--accent-dim)':'transparent',borderRadius:3,opacity:isHandled?0.85:1}}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleCDA(d.id)} style={{width:14,cursor:'pointer',flexShrink:0}} />
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',justifyContent:'space-between',gap:4,alignItems:'center'}}>
                          <span style={{fontWeight:600,fontSize:11}}>
                            {isHandled && <span className="has-tip" style={{color:'var(--green)',marginRight:4}}>✓<span className="tip-content">Prescrição já tratada — declarada/baixada no processo ou após análise.</span></span>}
                            <Copyable value={d.cdaNumber}>{d.cdaNumber || 'CDA'}</Copyable>
                          </span>
                          <span style={{fontSize:10,color:'var(--text-muted)'}}>{fmtCur(d.value)}</span>
                        </div>
                        <div style={{display:'flex',gap:6,fontSize:10,color:'var(--text-muted)',marginTop:1,alignItems:'center'}}>
                          <span className={`badge ${cdaSt.badge||''}`} style={{fontSize:8,padding:'1px 5px'}}>{cdaSt.label||d.status}</span>
                          {isHandled ? <span className="has-tip" style={{color:'var(--green)',fontWeight:600}}>✓ Tratada{d.prescriptionHandledAt?` · ${fmtDate(d.prescriptionHandledAt)}`:''}<span className="tip-content">CDA marcada como tratada. Use ↻ para reabrir.</span></span> :
                          <span className="has-tip" style={{color: st==='critico'||st==='prescrito'?'var(--red)':st==='alerta'?'var(--yellow)':'var(--text-secondary)'}}>
                            {prescDate?fmtDate(prescDate):'—'} {days!==null?`(${days}d)`:''}
                            <span className="tip-content">{st==='prescrito'?'PRESCRIÇÃO INTERCORRENTE CONSUMADA — verificar.':st==='critico'?'CRÍTICO — menos de 6 meses para prescrição.':st==='alerta'?'Alerta — menos de 1 ano para prescrição.':'Prazo correndo normalmente.'}</span>
                          </span>}
                        </div>
                      </div>
                      <button className="btn-xs btn-secondary has-tip" onClick={toggleHandled} style={{flexShrink:0}}>{isHandled?'↻':'✓'}<span className="tip-content">{isHandled?'Reabrir alerta.':'Marcar como tratada.'}</span></button>
                    </div>);
                  })}
                </div>
              </div>

              {/* COL 2: Events timeline */}
              <div style={{minWidth:0,borderLeft:'1px solid var(--border)',paddingLeft:12}}>
                <div style={{fontSize:10,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:0.5,marginBottom:6,fontWeight:600}}>Eventos Prescricionais ({allDisplayedEvents.length})</div>
                {allDisplayedEvents.length === 0 ? <div style={{fontSize:11,color:'var(--text-muted)',fontStyle:'italic'}}>Nenhum evento registrado</div> :
                <div style={{maxHeight:200,overflowY:'auto'}}>
                  {allDisplayedEvents.map(evt => {
                    const evtType = PRESC_EVENT_TYPES[evt.type] || {};
                    const cat = evtType.category;
                    const catColor = cat==='interruptiva'?'var(--green)':cat==='suspensiva'?'var(--blue)':cat==='marco'?'var(--red)':'var(--text-muted)';
                    const catIcon = cat==='interruptiva'?'🟢':cat==='suspensiva'?'🔵':cat==='marco'?'⏱':'ℹ';
                    const isInherited = evt._inheritedFromParent || (isApenso && evt.executionId === group.exec.parentExecutionId);
                    const isFromIDPJ = !!evt._inheritedFromIDPJ;
                    const evtBg = isFromIDPJ ? 'rgba(155,40,72,0.08)' : isInherited ? 'rgba(91,143,217,0.06)' : 'var(--bg-elevated)';
                    const evtPrefix = isFromIDPJ ? '🛡️ ' : isInherited ? '⤷ ' : '';
                    return (<div key={evt.id} style={{padding:'6px 8px',marginBottom:4,background:evtBg,borderRadius:4,borderLeft:`2px solid ${isFromIDPJ?'var(--pgfn)':catColor}`,cursor:'pointer'}}
                      onClick={() => setModal({type:'edit',entityType:'prescriptionEvent',initial:evt})}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:6}}>
                        <span style={{fontSize:11,fontWeight:600,color:isFromIDPJ?'var(--pgfn-light)':catColor}}>{evtPrefix}{catIcon} {evtType.label || evt.type}</span>
                        <span style={{fontSize:10,color:'var(--text-muted)'}}>{fmtDate(evt.date)}</span>
                      </div>
                      {isFromIDPJ && <div style={{fontSize:9,color:'var(--pgfn-light)',marginTop:1}}>Proveniente do {data.executions.find(e=>e.id===evt._inheritedFromIDPJ)?.processTag==='idpj'?'IDPJ':'Cautelar'} {truncate((data.executions.find(e=>e.id===evt._inheritedFromIDPJ)||{}).processNumber||'',30)}</div>}
                      {evt.endDate && <div style={{fontSize:9,color:'var(--text-muted)'}}>até {fmtDate(evt.endDate)}</div>}
                      {evt.legalBasis && <div style={{fontSize:9,color:'var(--text-secondary)',marginTop:1}}>{truncate(evt.legalBasis,40)}</div>}
                      {evt.notes && <div style={{fontSize:9,color:'var(--text-muted)',marginTop:1,fontStyle:'italic'}}>{truncate(evt.notes,50)}</div>}
                    </div>);
                  })}
                </div>}
              </div>

              {/* COL 3: Action buttons */}
              <div style={{display:'flex',flexDirection:'column',gap:6,alignItems:'stretch'}}>
                <button className="btn-primary btn-sm" onClick={() => {
                  const cdaIds = group.cdas.map(d => d.id);
                  setModal({type:'create',entityType:'prescriptionEvent',initial:{batchCdaIds:cdaIds, executionId: isExec ? group.exec.id : ''}});
                }}>+ Evento</button>
                <button className="btn-secondary btn-xs" onClick={() => selectGroup(group.cdas)}>{groupAllSelected?'Desmarcar':'Marcar todas'}</button>
                <div style={{fontSize:9,color:'var(--text-muted)',textAlign:'center',marginTop:4}}>{group.cdas.length} CDA(s)<br/>{fmtCur(group.cdas.reduce((s,d)=>s+(d.value||0),0))}</div>
              </div>
            </div>);
          };

          return topLevel.map((group, gi) => {
            const myApensos = group.type === 'exec' ? (apensoMap[group.exec.id] || []) : [];
            return (<React.Fragment key={gi}>
              {PrescCard({ group, isApenso: false })}
              {myApensos.length > 0 && <div style={{marginLeft:24,borderLeft:'3px solid var(--accent-dim)',paddingLeft:10,marginTop:-4,marginBottom:8}}>
                {myApensos.map((ag, ai) => <React.Fragment key={`ap-${ai}`}>{PrescCard({ group: ag, isApenso: true })}</React.Fragment>)}
              </div>}
            </React.Fragment>);
          });
        })()}</div>}
      </div>);
    }

    if (activeTab === 'prescricao_v2') {
      // ═══════════════════════════════════════════════════════════════════
      // EXPERIMENTAL UNIFIED TAB: Processos & Prescrição
      // Base layout: 3-column prescription card (approved by user)
      // ENHANCED: incorporates process data (badges, IDPJ, central, status, GAR, PI)
      //           + edit button → modal with sub-tabs (process data | prescription control)
      //           + generate task button → opens task modal pre-filled from process
      // ═══════════════════════════════════════════════════════════════════
      const execs = getOpSlices(opId).executions;
      const allDebts = getOpSlices(opId).debts;
      const prescEvents = data.prescriptionEvents || [];

      // Build group list — same as prescription tab
      const cdaGroups = [];
      execs.forEach(exec => {
        const cdas = allDebts.filter(d => d.processNumber && sameProc(d.processNumber, exec.processNumber));
        if (cdas.length > 0) cdaGroups.push({ type: 'exec', exec, cdas });
      });
      // Also include processes without CDAs (so the tab is the source of truth for processes too)
      execs.forEach(exec => {
        if (!cdaGroups.some(g => g.type === 'exec' && g.exec.id === exec.id)) {
          cdaGroups.push({ type: 'exec', exec, cdas: [] });
        }
      });
      const unlinkedCDAs = allDebts.filter(d => !d.processNumber || !execs.some(e => sameProc(e.processNumber, d.processNumber)));
      if (unlinkedCDAs.length > 0) cdaGroups.push({ type: 'unlinked', exec: null, cdas: unlinkedCDAs });

      // Identify IDPJ / Central / linked to IDPJ (same logic as Processos tab)
      const idpjProcesses2 = execs.filter(e => e.processTag === 'idpj' || e.processTag === 'cautelar_fiscal');
      const centralProcesses2 = execs.filter(e => e.processTag === 'central');
      const idpjLinkedExecIds2 = new Set();
      idpjProcesses2.forEach(e => {
        if (e.linkedExecutionIds) e.linkedExecutionIds.forEach(id => idpjLinkedExecIds2.add(id));
      });

      const toggleCDA2 = (id) => setSelectedCDAs(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
      const selectGroup2 = (cdas) => setSelectedCDAs(prev => { const n = new Set(prev); const allIn = cdas.every(d => n.has(d.id)); cdas.forEach(d => allIn ? n.delete(d.id) : n.add(d.id)); return n; });

      const addBatchEvent2 = () => {
        if (selectedCDAs.size === 0) return;
        setModal({type:'create', entityType:'prescriptionEvent', initial:{ batchCdaIds: [...selectedCDAs] }});
      };

      // Build apenso map
      const apensoMap2 = {};
      cdaGroups.forEach(g => {
        if (g.type === 'exec' && g.exec.parentExecutionId) {
          if (!apensoMap2[g.exec.parentExecutionId]) apensoMap2[g.exec.parentExecutionId] = [];
          apensoMap2[g.exec.parentExecutionId].push(g);
        }
      });

      // Helper: determina se um processo deve aparecer no Controle da Prescrição.
      // Regra principal: qualquer processo com CDAs vinculadas PRECISA de monitoramento prescricional.
      // Regra secundária: EFs sem CDAs (importação incompleta) entram por heurística de className.
      // Excluídos: apenas embargos/agravos/recursos SEM CDAs (processos acessórios).
      const isExecucaoFiscalRegular = (e) => {
        if (!e) return false;
        if (e.processTag === 'idpj' || e.processTag === 'cautelar_fiscal') return false; // tratados em idpjGroups
        // Se tem CDAs vinculadas → SEMPRE monitorar prescrição, independente de tag ou className
        const hasCDAs = allDebts.some(d => d.processNumber && sameProc(d.processNumber, e.processNumber));
        if (hasCDAs) return true;
        // Sem CDAs: "central" sem CDAs não precisa de controle de prescrição
        if (e.processTag === 'central') return false;
        const cn = (e.className || '').toLowerCase();
        // Embargos/recursos sem CDAs são acessórios — não entram
        if (/embargo/.test(cn)) return false;
        if (/agravo|apela[çc][ãa]o|recurso(?!.*execu)|reclama[çc][ãa]o constitucional|mandado de seguran[çc]a/.test(cn)) return false;
        // EFs sem CDAs (possível importação incompleta) — incluir para não perder
        if (/execu[çc][ãa]o fiscal/.test(cn)) return true;
        if (!cn || cn === 'execucao' || cn === 'execução') return true;
        return false;
      };

      // Separate priority groups — IDPJ/Cautelar e EFs regulares
      const idpjGroups = cdaGroups.filter(g => g.type === 'exec' && (g.exec.processTag === 'idpj' || g.exec.processTag === 'cautelar_fiscal'));
      // Processos "central" COM CDAs agora aparecem (hasCDAs=true bypasses tag filter)
      const regularTopLevel = cdaGroups.filter(g => {
        if (g.type !== 'exec') return true; // CDAs não ajuizadas continuam aparecendo
        if (g.exec.processTag === 'idpj' || g.exec.processTag === 'cautelar_fiscal') return false;
        // Apenso de algo é renderizado sob o principal — só top-level aqui
        if (g.exec.parentExecutionId) return false;
        // Apenas EFs regulares (filtra centrais, embargos, recursos, outros)
        return isExecucaoFiscalRegular(g.exec);
      });

      // Lista vazia agora — embargos/recursos/centrais/outros não aparecem mais
      const regularEmbargos = [];
      // Split regulars: EFs linked to any IDPJ/Cautelar come first; the rest are truly standalone
      const regularLinkedToIdpj = regularTopLevel.filter(g => g.type === 'exec' && idpjLinkedExecIds2.has(g.exec.id));
      const regularStandalone = regularTopLevel.filter(g => !(g.type === 'exec' && idpjLinkedExecIds2.has(g.exec.id)));

      // ─── THE CARD RENDERER ───
      const ProcPrescCard = ({ group, isApenso = false, cardVariant = 'normal' }) => {
        const isExec = group.type === 'exec';
        const e = isExec ? group.exec : null;
        const st = isExec ? (EXEC_STATUSES[e.status] || {}) : {};
        const prescForecastDays = isExec ? daysUntil(e.prescriptionForecast) : null;
        const groupAllSelected = group.cdas.length > 0 && group.cdas.every(d => selectedCDAs.has(d.id));

        // Events — combine execution-level and CDA-level and inherited from parent
        const groupEvents = prescEvents.filter(pe =>
          (isExec && pe.executionId === e.id) ||
          group.cdas.some(d => pe.cdaId === d.id || (pe.batchCdaIds && pe.batchCdaIds.includes(d.id)))
        ).sort((a,b) => (b.date||'').localeCompare(a.date||''));
        const inheritedFromParent = isExec && e.parentExecutionId
          ? prescEvents.filter(pe => pe.executionId === e.parentExecutionId && !pe.cdaId && (!pe.batchCdaIds || pe.batchCdaIds.length === 0))
          : [];
        const allDisplayedEvents = [...groupEvents, ...inheritedFromParent.filter(ie => !groupEvents.some(ge => ge.date === ie.date && ge.type === ie.type))];

        const myApensosGroups = isExec ? cdaGroups.filter(x => x.type === 'exec' && x.exec.parentExecutionId === e.id) : [];
        const isTagged = isExec && e.processTag && e.processTag !== 'normal';
        const isLinkedToIDPJ2 = isExec && idpjLinkedExecIds2.has(e.id);
        const notes = isExec ? (e.notesList || (e.notes ? [e.notes] : [])) : [];
        const totalCDAValue = group.cdas.reduce((s,d)=>s+(d.value||0),0);
        // For IDPJ/MCF: calculate total value of CDAs from ALL linked EFs
        const isIdpjOrMcf = isExec && (e.processTag === 'idpj' || e.processTag === 'cautelar_fiscal');
        const totalLinkedEFValue = isIdpjOrMcf ? (() => {
          const linkedEFExecs = execs.filter(ex => (e.linkedExecutionIds||[]).includes(ex.id));
          const linkedProcNums = new Set(linkedEFExecs.map(ex => ex.processNumber).filter(Boolean));
          return allDebts.filter(d => d.processNumber && linkedProcNums.has(d.processNumber)).reduce((s,d) => s + (d.value||0), 0);
        })() : 0;

        // Alert badges: open intimations and tasks for this process
        const procAlerts = isExec ? (() => {
          const today = new Date();
          const intims = (data.intimations||[]).filter(x => x.operationId === opId && sameProc(x.processNumber, e.processNumber) && (x.status === 'pendente_analise' || x.status === 'aguardando_subsidios' || x.status === 'peca_edicao') && !x.responseAction);
          const tasks = (data.tasks||[]).filter(t => t.operationId === opId && sameProc(t.processNumber, e.processNumber) && t.status !== 'concluida' && t.status !== 'cancelada');
          return { intims, tasks, overdueIntim: intims.some(x => x.dateDeadline && new Date(x.dateDeadline+'T00:00:00') < today), overdueTask: tasks.some(t => t.dueDate && new Date(t.dueDate+'T00:00:00') < today) };
        })() : { intims: [], tasks: [] };

        // Relevance flag
        const isRelevant = isExec && e.isRelevant;
        const toggleRelevant = (ev) => {
          ev.stopPropagation();
          upsert('executions', { ...e, isRelevant: !e.isRelevant });
        };

        // Border color based on variant
        const borderLeftColor = cardVariant === 'idpj' ? 'var(--pgfn)'
          : cardVariant === 'central' ? 'var(--purple)'
          : isApenso ? 'var(--accent)'
          : isLinkedToIDPJ2 ? 'var(--pgfn)'
          : 'var(--border)';
        const borderLeftWidth = cardVariant !== 'normal' || isApenso || isLinkedToIDPJ2 ? 3 : 1;
        const bgColor = cardVariant === 'idpj' ? 'rgba(155,40,72,0.04)'
          : cardVariant === 'central' ? 'rgba(122,139,163,0.04)'
          : isApenso ? 'var(--bg-elevated)'
          : 'var(--bg-card)';

        // Opacity based on execution status
        const statusOpacity = isExec ? (e.status === 'extinta' ? 0.3 : e.status === 'arquivada' ? 0.45 : e.status === 'suspensa' ? 0.7 : 1) : 1;

        // Find the main debtor (devedor) for this execution
        const execDebtor = isExec ? (() => {
          // Try via CDA responsibilities
          const firstCda = group.cdas[0];
          if (firstCda) {
            const resp = (data.links?.cdaResponsibilities || []).find(r => r.cdaId === firstCda.id && r.role === 'originario');
            if (resp) { const p = data.people.find(pp => pp.id === resp.personId); if (p) return p; }
            // Try devedor field from CDA itself
            if (firstCda.devedor) return { name: firstCda.devedor, cpfCnpj: firstCda.cnpj };
          }
          // Try matching people by operationRole
          const alvos = data.people.filter(p => p.operationId === opId && p.operationRole === 'alvo');
          if (alvos.length === 1) return alvos[0];
          return null;
        })() : null;

        return (<div className="entity-card" style={{display:'grid',gridTemplateColumns:'1.2fr 1fr 0.9fr 0.7fr',gap:12,alignItems:'start',marginBottom:8,background:isRelevant?'rgba(200,160,74,0.04)':bgColor,borderLeft:`${borderLeftWidth}px solid ${isRelevant?'var(--gold)':borderLeftColor}`,width:'100%',opacity:statusOpacity,transition:'opacity 0.2s'}}>
          {/* ═══ COL 1: Processo + CDAs ═══ */}
          <div style={{minWidth:0}}>
            {/* Process header row */}
            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6,flexWrap:'wrap'}}>
              {isExec && group.cdas.length > 0 && <input type="checkbox" checked={groupAllSelected} onChange={() => selectGroup2(group.cdas)} style={{width:16,cursor:'pointer',flexShrink:0}} title="Selecionar todas as CDAs do processo" />}
              {isExec ? <div style={{minWidth:0,flex:1}}>
                <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:2,alignItems:'center'}}>
                  {isExec && <span onClick={toggleRelevant} style={{cursor:'pointer',fontSize:12,lineHeight:1,opacity:isRelevant?1:0.3,transition:'opacity 0.15s'}} title={isRelevant?'Remover destaque':'Marcar como relevante'}>{isRelevant?'★':'☆'}</span>}
                  {isApenso && <span style={{fontSize:9,color:'var(--accent)',fontWeight:700}}>↳ apenso</span>}
                  {myApensosGroups.length > 0 && <span className="has-tip" style={{fontSize:9,color:'var(--accent)',fontWeight:700}}>📎{myApensosGroups.length}<span className="tip-content">{myApensosGroups.length} processo(s) apensado(s).</span></span>}
                  {isTagged && <span style={{fontSize:9,padding:'1px 6px',borderRadius:3,fontWeight:700,background:e.processTag==='idpj'?'rgba(244,63,94,0.2)':e.processTag==='cautelar_fiscal'?'rgba(245,158,11,0.2)':'rgba(122,139,163,0.2)',color:e.processTag==='idpj'?'var(--red)':e.processTag==='cautelar_fiscal'?'var(--yellow)':'var(--purple)'}}>{tagLabels[e.processTag]||e.processTag}</span>}
                  {isLinkedToIDPJ2 && !isTagged && <span className="badge badge-red has-tip" style={{fontSize:9}}>↗ IDPJ<span className="tip-content">Abrangida por incidente.</span></span>}
                  <span className={`badge ${st.badge||''}`} style={{fontSize:9,fontWeight:700}}>{st.label||e.status}</span>
                  {e.hasGuarantee && <span className="badge badge-green has-tip" style={{fontSize:9}}>GAR<span className="tip-content">Garantia idônea.</span></span>}
                  {e.prescriptionInterrupted && <span className="badge badge-cyan has-tip" style={{fontSize:9}}>PI<span className="tip-content">Prescrição interrompida.</span></span>}
                  {procAlerts.intims.length > 0 && <span className="has-tip" style={{fontSize:9,padding:'1px 6px',borderRadius:3,fontWeight:700,background:procAlerts.overdueIntim?'rgba(244,63,94,0.2)':'rgba(59,130,246,0.2)',color:procAlerts.overdueIntim?'var(--red)':'var(--blue)',display:'inline-flex',alignItems:'center',gap:3}}>📬 {procAlerts.intims.length}<span className="tip-content">{procAlerts.intims.length} intimação(ões) {procAlerts.overdueIntim ? 'VENCIDA(S)' : 'em aberto'}.</span></span>}
                  {procAlerts.tasks.length > 0 && <span className="has-tip" style={{fontSize:9,padding:'1px 6px',borderRadius:3,fontWeight:700,background:procAlerts.overdueTask?'rgba(244,63,94,0.2)':'rgba(245,158,11,0.2)',color:procAlerts.overdueTask?'var(--red)':'var(--yellow)',display:'inline-flex',alignItems:'center',gap:3}}>✓ {procAlerts.tasks.length}<span className="tip-content">{procAlerts.tasks.length} tarefa(s) {procAlerts.overdueTask ? 'VENCIDA(S)' : 'em aberto'}.</span></span>}
                </div>
                <div style={{fontFamily:'var(--font-mono)',fontSize:12,fontWeight:700}}>
                  <Copyable value={e.processNumber}>{e.processNumber}</Copyable>
                </div>
                <div style={{fontSize:10,color:'var(--text-muted)',lineHeight:1.4,marginTop:2}}>{e.court || ''}{e.className?` · ${e.className}`:''}</div>
                {/* Executado (devedor) */}
                {execDebtor && <div style={{fontSize:10,marginTop:2}}>
                  <span style={{color:'var(--text-muted)'}}>Executado: </span>
                  <span style={{color:'var(--text-secondary)',fontWeight:500,cursor:execDebtor.id?'pointer':'default'}} onClick={e2 => { if (execDebtor.id) { e2.stopPropagation(); setModal({type:'edit',entityType:'person',initial:execDebtor}); }}}>{truncate(execDebtor.name, 35)}</span>
                  {execDebtor.cpfCnpj && <span style={{fontSize:9,color:'var(--text-muted)',fontFamily:'var(--font-mono)',marginLeft:4}}>{execDebtor.cpfCnpj}</span>}
                </div>}
                {/* Protocol + Prescription dates */}
                <div style={{display:'flex',gap:12,marginTop:4,fontSize:10,flexWrap:'wrap'}}>
                  {e.protocolDate && <span style={{color:'var(--text-muted)'}}>Protocolo: <strong style={{color:'var(--text-secondary)'}}>{fmtDate(e.protocolDate)}</strong></span>}
                  {e.prescriptionForecast && <span style={{color:'var(--text-muted)'}}>Prev. Presc.: <strong style={{color:prescForecastDays!==null&&prescForecastDays<=365?prescForecastDays<=180?'var(--red)':'var(--yellow)':'var(--text-secondary)'}}>{fmtDate(e.prescriptionForecast)}{prescForecastDays!==null&&prescForecastDays<=365?` (${prescForecastDays}d)`:''}</strong></span>}
                </div>
              </div> : <span style={{color:'var(--red)',fontWeight:700,fontSize:12}}>⚠ CDAs Não Ajuizadas</span>}
            </div>

            {/* CDAs list */}
            {group.cdas.length === 0 ? <div style={{fontSize:10,color:'var(--text-muted)',fontStyle:'italic',padding:'4px 0'}}>Sem CDAs vinculadas a este processo</div> :
            <div style={{maxHeight:260,overflowY:'auto'}}>
              {group.cdas.map(d => {
                const autoPresc = calcAutoPresc(d, execs, data.prescriptionEvents || []);
                const prescDate = d.prescriptionDate || autoPresc;
                const days = daysUntil(prescDate);
                const isSelected = selectedCDAs.has(d.id);
                const isHandled = !!d.prescriptionHandled;
                const isAguardando = isHandled && d.prescriptionHandledType === 'aguardando_reconhecimento';
                const cdaState = isHandled ? 'tratada' : days === null ? 'sem_dados' : days <= 0 ? 'prescrito' : days <= 180 ? 'critico' : days <= 365 ? 'alerta' : 'correndo';
                const cdaSt = DEBT_STATUSES[d.status] || {};
                const toggleHandled = () => {
                  // If this CDA is in the selection, apply to ALL selected CDAs
                  const targetIds = selectedCDAs.has(d.id) && selectedCDAs.size > 1 ? [...selectedCDAs] : [d.id];
                  const newVal = !d.prescriptionHandled;
                  setData(prev => ({...prev, debts: prev.debts.map(x => targetIds.includes(x.id) ? {...x, prescriptionHandled: newVal, prescriptionHandledAt: newVal ? new Date().toISOString().slice(0,10) : x.prescriptionHandledAt, prescriptionHandledType: newVal ? (x.prescriptionHandledType || 'declarada') : x.prescriptionHandledType, updatedAt: new Date().toISOString()} : x)}));
                  if (targetIds.length > 1) setSelectedCDAs(new Set());
                };
                const markAsAguardando = () => {
                  const targetIds = selectedCDAs.has(d.id) && selectedCDAs.size > 1 ? [...selectedCDAs] : [d.id];
                  const count = targetIds.length;
                  const procRef = isExec ? (e.processNumber || '') : '';
                  const msg = count > 1
                    ? `Marcar ${count} CDA(s) selecionadas como prescritas, aguardando reconhecimento judicial?`
                    : `Marcar CDA ${d.cdaNumber || ''} como prescrita, aguardando reconhecimento judicial?`;
                  if (!confirm(msg)) return;
                  const now = new Date().toISOString();
                  const today = now.slice(0,10);
                  setData(prev => ({...prev, debts: prev.debts.map(x => targetIds.includes(x.id) ? {...x, prescriptionHandled: true, prescriptionHandledType: 'aguardando_reconhecimento', prescriptionHandledAt: today, updatedAt: now} : x)}));
                  if (targetIds.length > 1) setSelectedCDAs(new Set());
                  if (isExec && confirm(`Criar tarefa "Solicitar reconhecimento de prescrição" para o processo ${procRef}? (${count} CDA(s))`)) {
                    setModal({type:'create',entityType:'task',initial:{
                      operationId: opId,
                      title: `Solicitar reconhecimento de prescrição — ${count > 1 ? count + ' CDAs' : (d.cdaNumber || '')}`,
                      description: `${count} CDA(s) identificada(s) como prescrita(s).\nProcesso: ${procRef}\nClasse: ${e.className || ''}\nVara: ${e.court || ''}\n\nProvidenciar petição requerendo o reconhecimento da prescrição e consequente extinção do(s) crédito(s).`,
                      processNumber: procRef,
                      priority: 'media',
                      status: 'pendente',
                      taskVisibility: 'operation'
                    }});
                  }
                };
                return (<div key={d.id} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 6px',borderBottom:'1px dotted var(--border)',background:isAguardando?'rgba(245,158,11,0.08)':isHandled?'rgba(64,168,112,0.06)':isSelected?'var(--accent-dim)':'transparent',borderRadius:3,opacity:isHandled&&!isAguardando?0.85:1}}>
                  <input type="checkbox" checked={isSelected} onChange={() => toggleCDA2(d.id)} style={{width:14,cursor:'pointer',flexShrink:0}} />
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',justifyContent:'space-between',gap:4,alignItems:'center'}}>
                      <span style={{fontWeight:600,fontSize:11}}>
                        {isAguardando ? <span className="has-tip" style={{color:'var(--yellow)',marginRight:4}}>⏳<span className="tip-content">Prescrita — aguardando reconhecimento judicial.</span></span>
                         : isHandled && <span className="has-tip" style={{color:'var(--green)',marginRight:4}}>✓<span className="tip-content">Prescrição tratada.</span></span>}
                        <Copyable value={d.cdaNumber}>{d.cdaNumber || 'CDA'}</Copyable>
                      </span>
                      <span style={{fontSize:10,color:'var(--text-muted)'}}>{fmtCur(d.value)}</span>
                    </div>
                    <div style={{display:'flex',gap:6,fontSize:10,color:'var(--text-muted)',marginTop:1,alignItems:'center'}}>
                      <span className={`badge ${cdaSt.badge||''}`} style={{fontSize:8,padding:'1px 5px'}}>{cdaSt.label||d.status}</span>
                      {isAguardando ? <span className="has-tip" style={{color:'var(--yellow)',fontWeight:700}}>⏳ Aguardando reconhecimento{d.prescriptionHandledAt?` · ${fmtDate(d.prescriptionHandledAt)}`:''}<span className="tip-content">Prescrição identificada. Aguardando reconhecimento judicial. Não gera mais alertas.</span></span>
                       : isHandled ? <span className="has-tip" style={{color:'var(--green)',fontWeight:600}}>✓ Tratada{d.prescriptionHandledAt?` · ${fmtDate(d.prescriptionHandledAt)}`:''}<span className="tip-content">CDA tratada. Use ↻ para reabrir.</span></span> :
                      <span className="has-tip" style={{color: cdaState==='critico'||cdaState==='prescrito'?'var(--red)':cdaState==='alerta'?'var(--yellow)':'var(--text-secondary)'}}>
                        {prescDate?fmtDate(prescDate):'—'} {days!==null?`(${days}d)`:''}
                        <span className="tip-content">{cdaState==='prescrito'?'PRESCRIÇÃO CONSUMADA':cdaState==='critico'?'CRÍTICO — <6 meses':cdaState==='alerta'?'Alerta — <1 ano':'Correndo normal'}</span>
                      </span>}
                    </div>
                  </div>
                  <div style={{display:'flex',gap:3,flexShrink:0}}>
                    {!isHandled && <button className="btn-xs btn-secondary has-tip" onClick={(ev) => { ev.stopPropagation(); markAsAguardando(); }} style={{background:'rgba(245,158,11,0.15)',color:'var(--yellow)',borderColor:'rgba(245,158,11,0.3)'}}>⏳{selectedCDAs.has(d.id)&&selectedCDAs.size>1?` (${selectedCDAs.size})`:''}<span className="tip-content">{selectedCDAs.has(d.id)&&selectedCDAs.size>1?`Marcar ${selectedCDAs.size} CDAs selecionadas como prescritas.`:'Marcar como prescrita — aguardando reconhecimento.'}</span></button>}
                    <button className="btn-xs btn-secondary has-tip" onClick={(ev) => { ev.stopPropagation(); toggleHandled(); }}>{isHandled?'↻':'✓'}{!isHandled&&selectedCDAs.has(d.id)&&selectedCDAs.size>1?` (${selectedCDAs.size})`:''}<span className="tip-content">{isHandled?'Reabrir alerta.':selectedCDAs.has(d.id)&&selectedCDAs.size>1?`Marcar ${selectedCDAs.size} CDAs selecionadas como tratadas.`:'Marcar como tratada.'}</span></button>
                  </div>
                </div>);
              })}
            </div>}
          </div>

          {/* ═══ COL 2: Eventos prescricionais ═══ */}
          <div style={{minWidth:0,borderLeft:'1px solid var(--border)',paddingLeft:12}}>
            <div style={{fontSize:10,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:0.5,marginBottom:6,fontWeight:700}}>Eventos Prescricionais ({allDisplayedEvents.length})</div>
            {allDisplayedEvents.length === 0 ? <div style={{fontSize:11,color:'var(--text-muted)',fontStyle:'italic'}}>Nenhum evento registrado</div> :
            <div style={{maxHeight:260,overflowY:'auto'}}>
              {allDisplayedEvents.map(evt => {
                const evtType = PRESC_EVENT_TYPES[evt.type] || {};
                const cat = evtType.category;
                const catColor = cat==='interruptiva'?'var(--green)':cat==='suspensiva'?'var(--blue)':cat==='marco'?'var(--red)':'var(--text-muted)';
                const catIcon = cat==='interruptiva'?'🟢':cat==='suspensiva'?'🔵':cat==='marco'?'⏱':'ℹ';
                const isInherited = isExec && evt.executionId === e.parentExecutionId;
                return (<div key={evt.id} style={{padding:'6px 8px',marginBottom:4,background:isInherited?'rgba(91,143,217,0.06)':'var(--bg-elevated)',borderRadius:4,borderLeft:`2px solid ${catColor}`,cursor:'pointer'}}
                  onClick={() => setModal({type:'edit',entityType:'prescriptionEvent',initial:evt})}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:6}}>
                    <span style={{fontSize:11,fontWeight:700,color:catColor}}>{isInherited && '⤷ '}{catIcon} {evtType.label || evt.type}</span>
                    <span style={{fontSize:10,color:'var(--text-muted)'}}>{fmtDate(evt.date)}</span>
                  </div>
                  {evt.endDate && <div style={{fontSize:9,color:'var(--text-muted)'}}>até {fmtDate(evt.endDate)}</div>}
                  {evt.legalBasis && <div style={{fontSize:9,color:'var(--text-secondary)',marginTop:1}}>{truncate(evt.legalBasis,40)}</div>}
                  {evt.notes && <div style={{fontSize:9,color:'var(--text-muted)',marginTop:1,fontStyle:'italic'}}>{truncate(evt.notes,50)}</div>}
                </div>);
              })}
            </div>}
          </div>

          {/* ═══ COL 3: Notas do processo ═══ */}
          <div style={{minWidth:0,borderLeft:'1px solid var(--border)',paddingLeft:12}}>
            <div style={{fontSize:10,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:0.5,marginBottom:6,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'space-between',gap:4}}>
              <span>Notas ({notes.length})</span>
              {isExec && <button className="btn-secondary btn-xs" style={{fontSize:8,padding:'1px 5px'}} onClick={(ev) => {
                ev.stopPropagation();
                setModal({type:'edit',entityType:'execution',initial:e});
              }} title="Editar processo para adicionar notas">✎</button>}
            </div>
            {/* Filter out redundant notes that duplicate info shown in col 1 (class, court, SIDA origin) */}
            {(() => {
              const filteredNotes = notes.filter(n => {
                const nl = (n || '').toLowerCase();
                // Skip notes that just say "Classe: X" or "Execução Fiscal (SIDA)" — already visible
                if (/^[\s·]*classe:\s/i.test(n)) return false;
                if (/^[\s·]*execu[çc][ãa]o fiscal\s*\(?sida\)?$/i.test(nl.trim())) return false;
                return true;
              });
              return filteredNotes.length === 0 ? <div style={{fontSize:11,color:'var(--text-muted)',fontStyle:'italic'}}>Nenhuma nota</div> :
              <div className="note-stack" style={{maxHeight:260,overflowY:'auto'}}>
                {filteredNotes.map((n,i) => <div key={i} className="note-item note-item-full">{linkify(n)}</div>)}
              </div>;
            })()}
          </div>

          {/* ═══ COL 4: Ações ═══ */}
          <div style={{display:'flex',flexDirection:'column',gap:6,alignItems:'stretch'}}>
            <button className="btn-primary btn-sm" onClick={(ev) => {
              ev.stopPropagation();
              const cdaIds = group.cdas.map(d => d.id);
              setModal({type:'create',entityType:'prescriptionEvent',initial:{batchCdaIds:cdaIds, executionId: isExec ? e.id : ''}});
            }}>⏱ + Evento</button>
            {isExec && <button className="btn-secondary btn-sm" onClick={(ev) => {
              ev.stopPropagation();
              setModal({type:'edit',entityType:'execution',initial:{...e, _editMode: 'dados'}});
            }}>✎ Dados do Processo</button>}
            {isExec && <button className="btn-secondary btn-sm" onClick={(ev) => {
              ev.stopPropagation();
              setModal({type:'create',entityType:'task',initial:{
                operationId: opId,
                title: `Atuação no processo ${e.processNumber || ''}`,
                description: `Processo: ${e.processNumber || ''}\nClasse: ${e.className || ''}\nVara: ${e.court || ''}`,
                processNumber: e.processNumber || '',
                priority: 'media',
                status: 'pendente',
                taskVisibility: 'operation'
              }});
            }}>📋 Gerar Tarefa</button>}
            {group.cdas.length > 0 && <button className="btn-secondary btn-xs" onClick={(ev) => { ev.stopPropagation(); selectGroup2(group.cdas); }}>{groupAllSelected?'Desmarcar':'Marcar todas'}</button>}
            <div style={{fontSize:9,color:'var(--text-muted)',textAlign:'center',marginTop:4,paddingTop:4,borderTop:'1px dashed var(--border)'}}>
              <strong style={{color:'var(--text-secondary)',fontSize:10}}>{group.cdas.length} CDA(s)</strong><br/>
              <span style={{color:'var(--gold)',fontWeight:700,fontSize:11}}>{fmtCur(totalCDAValue)}</span>
              {isIdpjOrMcf && totalLinkedEFValue > 0 && <div style={{marginTop:4,paddingTop:4,borderTop:'1px dashed rgba(245,158,11,0.3)'}}>
                <div style={{fontSize:8,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:0.3}}>Total EFs abrangidas</div>
                <span style={{color:'var(--gold)',fontWeight:700,fontSize:12}}>{fmtCur(totalLinkedEFValue)}</span>
              </div>}
            </div>
          </div>
        </div>);
      };

      // Recursive renderer for a group + its apensos
      const renderGroupTree = (group, cardVariant = 'normal') => {
        const myApensos = group.type === 'exec' ? (apensoMap2[group.exec.id] || []) : [];
        return (<React.Fragment key={group.type === 'exec' ? group.exec.id : 'unlinked'}>
          {ProcPrescCard({ group, isApenso: false, cardVariant })}
          {myApensos.length > 0 && <div style={{marginLeft:24,borderLeft:`3px solid ${cardVariant==='central'?'rgba(122,139,163,0.4)':'var(--accent-dim)'}`,paddingLeft:10,marginTop:-4,marginBottom:8}}>
            {myApensos.map(ag => <React.Fragment key={ag.exec.id}>{ProcPrescCard({ group: ag, isApenso: true, cardVariant: cardVariant === 'central' ? 'central' : 'normal' })}</React.Fragment>)}
          </div>}
        </React.Fragment>);
      };

      return (<div className="entity-area">
        {/* Legal reference */}
        <div className="presc-legal-ref">
          <strong>Prescrição por CDA</strong> — Ajuizadas: data mais recente (inscrição ou protocolo) + 6 anos (1a suspensão + 5a arquivamento, Art. 40 LEF). Não ajuizadas: inscrição + 5 anos (Art. 174 CTN). Eventos interruptivos reiniciam a contagem; eventos suspensivos pausam.
          <br/><span style={{fontSize:10,color:'var(--text-muted)',fontStyle:'italic'}}>Esta aba exibe apenas Incidentes (IDPJ), Medidas Cautelares Fiscais e Execuções Fiscais. Embargos, recursos, processos centrais e ações declaratórias/anulatórias permanecem na aba Processos.</span>
        </div>

        {/* Bulk selection bar */}
        {selectedCDAs.size > 0 && (() => {
          const selectedArr = [...selectedCDAs];
          const selectedDebts = allDebts.filter(d => selectedArr.includes(d.id));
          const distinctProcs = new Set(selectedDebts.map(d => d.processNumber).filter(Boolean));
          const unajuizCount = selectedDebts.filter(d => !d.processNumber).length;
          const totalValue = selectedDebts.reduce((s,d) => s + (d.value||0), 0);
          return (<div style={{padding:'8px 12px',background:'var(--accent-dim)',borderRadius:'var(--radius)',marginBottom:12,border:'1px solid var(--accent)'}}>
            <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginBottom:6}}>
              <span style={{fontSize:12,fontWeight:700,color:'var(--accent)'}}>{selectedCDAs.size} CDA(s) selecionada(s)</span>
              <span style={{fontSize:10,color:'var(--text-secondary)'}}>
                · {distinctProcs.size} processo(s){unajuizCount>0?` + ${unajuizCount} não ajuizada(s)`:''}
                · Total: <strong style={{color:'var(--gold)'}}>{fmtCur(totalValue)}</strong>
              </span>
            </div>
            <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
              <button className="btn-primary btn-sm" onClick={addBatchEvent2} title="Adiciona um único evento prescricional (interruptivo, suspensivo ou marco) a todas as CDAs selecionadas, mesmo que sejam de processos diferentes. Útil para registrar, por exemplo, uma indisponibilidade obtida em IDPJ que alcança várias execuções fiscais.">+ Evento Prescricional em Bloco</button>
              <button className="btn-secondary btn-sm" onClick={() => {
                if (!confirm(`Marcar ${selectedCDAs.size} CDA(s) como prescrição tratada?`)) return;
                const ids = [...selectedCDAs];
                const now = new Date().toISOString();
                const today = now.slice(0,10);
                setData(prev => ({...prev, debts: prev.debts.map(d => ids.includes(d.id) ? {...d, prescriptionHandled: true, prescriptionHandledAt: d.prescriptionHandledAt || today, prescriptionHandledType: d.prescriptionHandledType || 'declarada', updatedAt: now} : d)}));
                setSelectedCDAs(new Set());
              }}>✓ Marcar como tratadas</button>
              <button className="btn-secondary btn-sm" onClick={() => {
                if (!confirm(`Reabrir ${selectedCDAs.size} CDA(s)?`)) return;
                const ids = [...selectedCDAs];
                const now = new Date().toISOString();
                setData(prev => ({...prev, debts: prev.debts.map(d => ids.includes(d.id) ? {...d, prescriptionHandled: false, updatedAt: now} : d)}));
                setSelectedCDAs(new Set());
              }}>↻ Reabrir</button>
              <button className="btn-secondary btn-xs" onClick={() => setSelectedCDAs(new Set())} style={{marginLeft:'auto'}}>Limpar</button>
            </div>
            {distinctProcs.size > 1 && <div style={{fontSize:10,color:'var(--text-secondary)',marginTop:6,paddingTop:6,borderTop:'1px dashed var(--border)',display:'flex',alignItems:'flex-start',gap:6}}>
              <span style={{color:'var(--accent)'}}>ⓘ</span>
              <span>Seleção multi-processo detectada. O evento em bloco será gravado como um único registro com <code style={{background:'var(--bg-elevated)',padding:'1px 4px',borderRadius:2,fontSize:9}}>batchCdaIds</code> cobrindo todas as CDAs marcadas, aplicando-se simultaneamente ao timeline prescricional de cada uma. Cenário típico: indisponibilidade patrimonial obtida no IDPJ que alcança todas as EFs vinculadas.</span>
            </div>}
          </div>);
        })()}

        {execs.length === 0 && allDebts.length === 0 ? <div className="empty-state"><div className="empty-icon">⏱</div><p>Importe processos e CDAs para começar.</p></div> :
        <div className="entity-list">
          {/* IDPJ / Cautelar section */}
          {idpjGroups.length > 0 && <div style={{marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:700,color:'var(--pgfn-light)',marginBottom:8,textTransform:'uppercase',letterSpacing:0.5,display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
              <span>🛡️ Incidentes de Desconsideração / Cautelares Fiscais ({idpjGroups.length})</span>
              {idpjGroups.some(g => (g.exec.linkedExecutionIds||[]).length > 0) && <button className="btn-secondary btn-xs has-tip" style={{fontSize:9,padding:'2px 8px',fontWeight:600,textTransform:'none',letterSpacing:0}} onClick={() => {
                // Collect all CDAs from every EF covered by any IDPJ in the list
                const coveredExecIds = new Set();
                idpjGroups.forEach(g => (g.exec.linkedExecutionIds||[]).forEach(id => coveredExecIds.add(id)));
                const coveredExecs = execs.filter(e => coveredExecIds.has(e.id));
                const cdasToSelect = allDebts.filter(d => d.processNumber && coveredExecs.some(e => sameProc(e.processNumber, d.processNumber)));
                setSelectedCDAs(prev => { const n = new Set(prev); cdasToSelect.forEach(d => n.add(d.id)); return n; });
              }}>⊕ Selecionar CDAs das EFs cobertas<span className="tip-content">Seleciona todas as CDAs de todas as execuções fiscais abrangidas pelos incidentes/cautelares acima. Útil para lançar um único evento interruptivo (ex: indisponibilidade patrimonial obtida no IDPJ) que alcance todas as CDAs de uma vez.</span></button>}
            </div>
            {idpjGroups.map(g => renderGroupTree(g, 'idpj'))}
          </div>}

          {/* Regular processes — linked to IDPJ/Cautelar (close to the incident) */}
          {regularLinkedToIdpj.length > 0 && <div style={{marginBottom:8}}>
            <div style={{fontSize:10,fontWeight:600,color:'var(--pgfn-light)',marginBottom:6,letterSpacing:0.3,display:'flex',alignItems:'center',gap:8}}>
              <span style={{flex:'0 0 auto'}}>⚖️🔗 Execuções Fiscais vinculadas ao Incidente/Cautelar ({regularLinkedToIdpj.length})</span>
              <span style={{flex:1,height:1,background:'linear-gradient(90deg, rgba(155,40,72,0.4), transparent)'}}></span>
            </div>
            {regularLinkedToIdpj.map(g => renderGroupTree(g, 'normal'))}
          </div>}

          {/* Visual divider between linked and standalone regulars */}
          {regularLinkedToIdpj.length > 0 && regularStandalone.length > 0 && (
            <div style={{margin:'14px 0 10px',display:'flex',alignItems:'center',gap:10}}>
              <span style={{flex:1,height:1,background:'repeating-linear-gradient(90deg, var(--border) 0, var(--border) 6px, transparent 6px, transparent 12px)'}}></span>
              <span style={{fontSize:9,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:0.5,fontWeight:600}}>⚖️ Demais Processos</span>
              <span style={{flex:1,height:1,background:'repeating-linear-gradient(90deg, var(--border) 0, var(--border) 6px, transparent 6px, transparent 12px)'}}></span>
            </div>
          )}

          {/* Regular processes — standalone (no IDPJ link) */}
          {regularStandalone.length > 0 && <div>
            {regularStandalone.map(g => renderGroupTree(g, 'normal'))}
          </div>}

          {/* Embargos at the end */}
          {regularEmbargos.length > 0 && <div style={{marginTop:16}}>
            <div style={{fontSize:11,fontWeight:700,color:'var(--text-muted)',marginBottom:8,textTransform:'uppercase',letterSpacing:0.5}}>📎 Embargos à Execução ({regularEmbargos.length})</div>
            {regularEmbargos.map(g => renderGroupTree(g, 'normal'))}
          </div>}
        </div>}
      </div>);
    }

    if (activeTab === 'medidas') {
      const items = getOpSlices(opId).measures;
      const opExecs = getOpSlices(opId).executions;
      return (<div className="entity-area">
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}>
          <span style={{color:'var(--text-muted)',fontSize:11}}>{items.length} medida(s)</span>
          <button className="btn-primary btn-sm" onClick={() => setModal({type:'create',entityType:'measure',initial:{}})}>+ Medida</button>
        </div>
        {items.length === 0 ? <div className="empty-state"><div className="empty-icon">🛡️</div><p>Nenhuma medida</p></div> :
        <div className="entity-list">{items.map(m => {
          const lp = (data.links.measurePeople||[]).filter(l=>l.measureId===m.id);
          const la = (data.links.measureAssets||[]).filter(l=>l.measureId===m.id);
          const linkedExecIds = m.linkedExecutionIds || (m.executionId ? [m.executionId] : []);
          const linkedExecs = opExecs.filter(e => linkedExecIds.includes(e.id));
          const linkedPeople = lp.map(l => data.people.find(p=>p.id===l.personId)).filter(Boolean);
          const linkedAssets = la.map(l => data.assets.find(a=>a.id===l.assetId)).filter(Boolean);
          return (<div key={m.id} className="entity-card" onClick={() => setModal({type:'edit',entityType:'measure',initial:getMeasureInitial(m)})}>
            <div className="ec-header"><div><div className="ec-title">{MEASURE_SUBTYPES[m.subtype]||m.subtype}</div><div className="ec-sub">{m.processNumber ? <Copyable value={m.processNumber}>{m.processNumber}</Copyable> : ''}</div></div>
              <span className={`badge ${m.status==='deferida'?'badge-green':m.status==='indeferida'?'badge-red':'badge-blue'}`}>{m.status}</span></div>
            <div className="ec-rows">
              {linkedExecs.length > 0 && <div className="ec-row"><span className="label">Execuções:</span>
                <span>{linkedExecs.map((e,i) => <span key={e.id} style={{fontSize:10}}>{i>0?', ':''}{truncate(e.processNumber,20)}</span>)}</span></div>}
              {linkedPeople.length > 0 && <div className="ec-row"><span className="label">Pessoas ({linkedPeople.length}):</span>
                <span style={{fontSize:10}}>{linkedPeople.map(p=>p.name).join(', ')}</span></div>}
              {linkedAssets.length > 0 && <div className="ec-row"><span className="label">Bens ({linkedAssets.length}):</span>
                <span style={{fontSize:10}}>{linkedAssets.map(a=>truncate(a.description,25)).join(', ')}</span></div>}
              {!linkedExecs.length && !linkedPeople.length && !linkedAssets.length && <div style={{fontSize:10,color:'var(--text-muted)',fontStyle:'italic'}}>Sem vínculos cadastrados</div>}
            </div>
            {m.notes && <div style={{marginTop:6,borderTop:'1px solid var(--border)',paddingTop:6,fontSize:10,color:'var(--text-muted)'}}>{truncate(m.notes,80)}</div>}
          </div>);
        })}</div>}
      </div>);
    }

    if (activeTab === 'bens') {
      const items = getOpSlices(opId).assets;
      const statusOrder = ['indisponibilidade_ativa','indisponibilidade_requerida','controvertido','liberado'];
      
      // Grouping logic based on assetSort
      let orderedGroups = [];
      if (assetSort === 'status') {
        const groups = {};
        items.forEach(a => { const s = a.status || 'liberado'; if (!groups[s]) groups[s] = []; groups[s].push(a); });
        orderedGroups = statusOrder.map(s => ({ key: s, label: (ASSET_STATUSES[s]||{}).label || s, badge: (ASSET_STATUSES[s]||{}).badge || '', items: groups[s] || [] })).filter(g => g.items.length > 0);
        Object.entries(groups).forEach(([k, v]) => { if (!statusOrder.includes(k)) orderedGroups.push({ key: k, label: k, badge: '', items: v }); });
      } else if (assetSort === 'titular') {
        const groups = {};
        items.forEach(a => {
          const holder = data.people.find(p => p.id === a.holderId);
          const key = holder ? holder.id : '_sem';
          const label = holder ? holder.name : 'Sem titular';
          if (!groups[key]) groups[key] = { label, items: [] };
          groups[key].items.push(a);
        });
        orderedGroups = Object.entries(groups).sort((a,b) => a[1].label.localeCompare(b[1].label)).map(([k,v]) => ({ key: k, label: v.label, badge: '', items: v.items }));
      } else if (assetSort === 'processo') {
        const groups = {};
        items.forEach(a => {
          const key = a.processRef || '_sem';
          if (!groups[key]) groups[key] = { items: [] };
          groups[key].items.push(a);
        });
        orderedGroups = Object.entries(groups).sort((a,b) => a[0].localeCompare(b[0])).map(([k,v]) => ({ key: k, label: k === '_sem' ? 'Sem processo vinculado' : k, badge: '', items: v.items, isMono: k !== '_sem' }));
      } else if (assetSort === 'tipo') {
        const groups = {};
        items.forEach(a => {
          const key = a.subtype || 'outro';
          if (!groups[key]) groups[key] = { items: [] };
          groups[key].items.push(a);
        });
        orderedGroups = Object.entries(groups).sort((a,b) => a[0].localeCompare(b[0])).map(([k,v]) => ({ key: k, label: ASSET_SUBTYPES[k] || k, badge: '', items: v.items }));
      } else if (assetSort === 'valor_desc') {
        const sorted = [...items].sort((a,b) => (b.value||0) - (a.value||0));
        orderedGroups = [{ key: 'all', label: `Todos os bens (por valor)`, badge: '', items: sorted }];
      } else if (assetSort === 'valor_asc') {
        const sorted = [...items].sort((a,b) => (a.value||0) - (b.value||0));
        orderedGroups = [{ key: 'all', label: `Todos os bens (por valor)`, badge: '', items: sorted }];
      }

      const totalVal = items.reduce((s,a) => s+(a.value||0), 0);
      const allIds = new Set(items.map(a => a.id));
      const allSelected = items.length > 0 && items.every(a => selectedAssets.has(a.id));
      return (<div className="entity-area">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,flexWrap:'wrap',gap:8}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            {items.length > 0 && <input type="checkbox" checked={allSelected} onChange={() => setSelectedAssets(allSelected ? new Set() : allIds)} title="Selecionar todos" style={{cursor:'pointer',width:15,height:15}} />}
            <span style={{color:'var(--text-muted)',fontSize:11}}>{items.length} bem(ns) · {fmtCur(totalVal)} · {items.filter(a=>!a.analyticsRegistered).length} sem Analytics</span>
          </div>
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            <select value={assetSort} onChange={e => setAssetSort(e.target.value)} style={{fontSize:10,padding:'4px 8px',background:'var(--bg-deep)',color:'var(--text-primary)',border:'1px solid var(--border)',borderRadius:3}}>
              <option value="status">Por Status</option>
              <option value="titular">Por Titular</option>
              <option value="processo">Por Processo</option>
              <option value="tipo">Por Tipo</option>
              <option value="valor_desc">Valor (maior)</option>
              <option value="valor_asc">Valor (menor)</option>
            </select>
            <button className="btn-primary btn-sm" onClick={() => setModal({type:'create',entityType:'asset',initial:{}})}>+ Bem</button>
          </div>
        </div>
        {selectedAssets.size > 0 && <div className="bulk-bar" style={{marginBottom:12}}>
          <span>{selectedAssets.size} selecionado(s)</span>
          <select style={{fontSize:10,padding:'3px 6px',background:'var(--bg-deep)',color:'var(--text-primary)',border:'1px solid var(--border)',borderRadius:3}} onChange={e => { if (e.target.value) { bulkUpdateAssets('status', e.target.value); e.target.value = ''; }}} defaultValue="">
            <option value="" disabled>Alterar status...</option>
            {Object.entries(ASSET_STATUSES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button className="btn-secondary btn-xs" onClick={() => bulkUpdateAssets('analyticsRegistered', true)}>✓ Marcar Analytics</button>
          <button className="btn-secondary btn-xs" onClick={() => bulkUpdateAssets('analyticsRegistered', false)}>✗ Desmarcar Analytics</button>
          <button className="btn-danger btn-xs" onClick={() => bulkDelete('assets', selectedAssets)}>Excluir</button>
          <button className="btn-secondary btn-xs" onClick={() => setSelectedAssets(new Set())}>Limpar</button>
        </div>}
        {items.length === 0 ? <div className="empty-state"><div className="empty-icon">💎</div><p>Nenhum bem</p></div> :
        <div className="entity-list">{orderedGroups.map(g => {
          const gst = ASSET_STATUSES[g.key] || { label: g.label || g.key, badge: g.badge || '' };
          const gTotal = g.items.reduce((s,a)=>s+(a.value||0),0);
          const isCollapsed2 = collapsedGroups.has('asset-'+g.key);
          const groupIds = new Set(g.items.map(a => a.id));
          const allGroupSelected = g.items.every(a => selectedAssets.has(a.id));
          return (<React.Fragment key={g.key}>
            <div className="group-header" style={{display:'flex',alignItems:'center',gap:8}}>
              <input type="checkbox" checked={allGroupSelected} onChange={() => {
                setSelectedAssets(prev => {
                  const n = new Set(prev);
                  if (allGroupSelected) g.items.forEach(a => n.delete(a.id));
                  else g.items.forEach(a => n.add(a.id));
                  return n;
                });
              }} onClick={e => e.stopPropagation()} style={{cursor:'pointer',width:14,height:14}} />
              <span className={`gh-toggle ${isCollapsed2?'':'open'}`} onClick={() => toggleGroup('asset-'+g.key)} style={{cursor:'pointer'}}>▶</span>
              {assetSort === 'status' ? <span className={`badge ${gst.badge}`} style={{fontSize:11}} onClick={() => toggleGroup('asset-'+g.key)}>{gst.label}</span>
              : <span style={{fontSize:12,fontWeight:600,color:'var(--text-secondary)',cursor:'pointer'}} onClick={() => toggleGroup('asset-'+g.key)}>
                  {g.isMono ? <span style={{fontFamily:'var(--font-mono)',fontSize:11}}>{g.label}</span> : g.label}
                </span>}
              <span className="gh-count" onClick={() => toggleGroup('asset-'+g.key)}>({g.items.length})</span>
              <span className="gh-total">{fmtCur(gTotal)}</span>
            </div>
            {!isCollapsed2 && g.items.map(a => {
              const holder = data.people.find(p => p.id === a.holderId);
              const notes = a.notesList || (a.notes ? [a.notes] : []);
              const linkedExec = a.processRef ? data.executions.find(e => e.operationId === opId && sameProc(e.processNumber, a.processRef)) : null;
              const ast = ASSET_STATUSES[a.status] || {};
              return (<div key={a.id} className="entity-card-selectable">
                <input type="checkbox" checked={selectedAssets.has(a.id)} onChange={() => toggleAsset(a.id)} />
                <div className="entity-card" style={{flex:1,display:'grid',gridTemplateColumns:'2fr 1fr 1.2fr auto',gap:12,alignItems:'start'}} onClick={() => setModal({type:'edit',entityType:'asset',initial:a})}>
                  {/* Col 1: Descrição + tipo + matrícula + processo + origem */}
                  <div style={{minWidth:0}}>
                    <div className="ec-title">{a.description || 'Sem descrição'}</div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:3,fontSize:10,color:'var(--text-muted)',lineHeight:1.5}}>
                      <span>{ASSET_SUBTYPES[a.subtype]||a.subtype||'Outro'}</span>
                      {a.registry && <><span>·</span><span style={{fontFamily:'var(--font-mono)'}}>Matr. {a.registry}</span></>}
                    </div>
                    {a.processRef && <div style={{marginTop:3,fontSize:10}}>
                      <span style={{color:'var(--text-muted)'}}>Proc.: </span>
                      <span style={{fontFamily:'var(--font-mono)',color:'var(--text-secondary)',cursor:linkedExec?'pointer':'default',textDecoration:linkedExec?'underline':'none',textDecorationColor:'rgba(255,255,255,0.15)'}} onClick={e => { if (linkedExec) { e.stopPropagation(); setModal({type:'edit',entityType:'execution',initial:linkedExec}); }}}>{a.processRef}</span>
                    </div>}
                    {a.source && <div style={{fontSize:9,color:'var(--text-muted)',marginTop:2}}>Origem: {a.source}</div>}
                  </div>
                  {/* Col 2: Valor + titular (devedor em destaque) */}
                  <div style={{fontSize:11}}>
                    {a.value ? <div style={{marginBottom:4}}><strong style={{fontSize:13,color:'var(--text-primary)'}}>{fmtCur(a.value)}</strong></div> : <div style={{fontSize:10,color:'var(--text-muted)',fontStyle:'italic',marginBottom:4}}>Sem avaliação</div>}
                    {holder ? <div style={{padding:'3px 7px',background:'rgba(255,255,255,0.04)',borderRadius:3,borderLeft:'2px solid rgba(59,130,246,0.4)'}}>
                      <div style={{fontSize:9,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:0.3,fontWeight:600}}>Titular</div>
                      <div style={{fontSize:10,fontWeight:600,color:'var(--text-secondary)',cursor:'pointer'}} onClick={e => { e.stopPropagation(); setModal({type:'edit',entityType:'person',initial:holder}); }}>{holder.name}</div>
                      {holder.cpfCnpj && <div style={{fontSize:9,color:'var(--text-muted)',fontFamily:'var(--font-mono)'}}>{holder.cpfCnpj}</div>}
                    </div> : a.holderDoc ? <div style={{fontSize:10,color:'var(--text-muted)'}}>Titular: {a.holderDoc}</div> : null}
                  </div>
                  {/* Col 3: Notas */}
                  <div style={{fontSize:10,color:'var(--text-secondary)'}}>
                    {notes.length > 0 ? <div className="note-stack" style={{maxHeight:100,overflowY:'auto'}}>
                      {notes.map((n,i)=><div key={i} className="note-item note-item-full">{linkify(n)}</div>)}
                    </div> : <span style={{fontStyle:'italic',color:'var(--text-muted)'}}>Sem observações</span>}
                  </div>
                  {/* Col 4: Status + Analytics */}
                  <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
                    <span className={`badge ${ast.badge}`}>{ast.label}</span>
                    <span className={`analytics-dot has-tip ${a.analyticsRegistered?'registered':'pending'}`}>{a.analyticsRegistered?'A':'!A'}<span className="tip-content">{a.analyticsRegistered?'Registrado no Analytics PGFN.':'Pendente de registro no Analytics.'}</span></span>
                  </div>
                </div>
              </div>);
            })}
          </React.Fragment>);
        })}</div>}
      </div>);
    }

    if (activeTab === 'timeline') {
      // ═══ LINHA DO TEMPO UNIFICADA ═══
      // Agrega eventos de todas as fontes em ordem cronológica
      const events = [];
      const opDebts = getOpSlices(opId).debts;
      const opExecs = getOpSlices(opId).executions;
      const opMeasures = getOpSlices(opId).measures;
      const opAssets = getOpSlices(opId).assets;
      const opIntims = (data.intimations || []).filter(x => x.operationId === opId);
      const opTasks = (data.tasks || []).filter(t => t.operationId === opId);
      const opPrescEvts = (data.prescriptionEvents || []).filter(pe => opExecs.some(e => e.id === pe.executionId));
      const opPeople = getOpSlices(opId).people;
      const PRESC_EVT = PRESC_EVENT_TYPES || {};

      // CDAs — inscrição
      opDebts.forEach(d => {
        if (d.inscriptionDate) events.push({ date: d.inscriptionDate, type: 'cda', icon: '📄', color: 'var(--gold)', title: `CDA inscrita: ${d.cdaNumber || 'S/N'}`, detail: `${fmtCur(d.value || 0)} · Status: ${d.status || '-'}`, entity: d });
      });

      // Execuções — protocolo
      opExecs.forEach(e => {
        if (e.protocolDate) events.push({ date: e.protocolDate, type: 'exec', icon: '⚖️', color: 'var(--blue)', title: `Ajuizamento: ${e.className || 'Execução'}`, detail: `${e.processNumber || ''}${e.court ? ` · ${e.court}` : ''}`, entity: e });
      });

      // Eventos de prescrição
      opPrescEvts.forEach(pe => {
        const evtDef = PRESC_EVT[pe.type] || {};
        const exec = opExecs.find(e => e.id === pe.executionId);
        events.push({ date: pe.date, type: 'presc', icon: '⏱', color: evtDef.color || 'var(--text-muted)', title: `${evtDef.label || pe.type}`, detail: `${exec ? truncate(exec.processNumber, 25) : ''}${pe.notes ? ` · ${pe.notes}` : ''}`, entity: pe });
      });

      // Intimações — data de recebimento
      opIntims.forEach(x => {
        const intimDate = x.dateReceived || x.createdAt?.slice(0, 10);
        if (intimDate) events.push({ date: intimDate, type: 'intim', icon: '📬', color: 'var(--blue)', title: `Intimação: ${x.partyName || truncate(x.processNumber, 25)}`, detail: `Prazo: ${x.dateDeadline ? fmtDate(x.dateDeadline) : 'N/I'} · ${x.status || ''}`, entity: x });
      });

      // Medidas — data de criação
      opMeasures.forEach(m => {
        const mDate = m.date || m.createdAt?.slice(0, 10);
        if (mDate) events.push({ date: mDate, type: 'measure', icon: '🛡️', color: 'var(--green)', title: `Medida: ${m.type || m.description || 'Medida'}`, detail: m.description || '', entity: m });
      });

      // Tarefas concluídas
      opTasks.filter(t => t.status === 'concluida' && t.completedAt).forEach(t => {
        events.push({ date: t.completedAt.slice(0, 10), type: 'task_done', icon: '✅', color: 'var(--green)', title: `Tarefa concluída: ${truncate(t.title, 40)}`, detail: t.processNumber || '', entity: t });
      });

      // Ordenar por data decrescente
      events.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

      // Filtro por tipo
      const typeOptions = [
        { key: 'all', label: 'Todos' },
        { key: 'cda', label: '📄 CDAs' },
        { key: 'exec', label: '⚖️ Processos' },
        { key: 'presc', label: '⏱ Prescrição' },
        { key: 'intim', label: '📬 Intimações' },
        { key: 'measure', label: '🛡️ Medidas' },
      ];
      const filtered = tlFilter === 'all' ? events : events.filter(e => e.type === tlFilter);

      // Agrupar por mês/ano para cabeçalhos
      const monthGroups = {};
      filtered.forEach(e => {
        const key = e.date ? e.date.slice(0, 7) : 'sem-data';
        if (!monthGroups[key]) monthGroups[key] = [];
        monthGroups[key].push(e);
      });

      return (<div className="entity-area">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,flexWrap:'wrap',gap:8}}>
          <span style={{color:'var(--text-muted)',fontSize:11}}>{filtered.length} evento(s) · {events.length} total</span>
          <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
            {typeOptions.map(o => <button key={o.key} className={`btn-xs ${tlFilter===o.key?'btn-primary':'btn-secondary'}`} style={{fontSize:9,padding:'2px 8px'}} onClick={() => setTlFilter(o.key)}>{o.label}</button>)}
          </div>
        </div>

        {filtered.length === 0 ? <div className="empty-state"><div className="empty-icon">📅</div><p>Nenhum evento com data registrada</p><p style={{fontSize:11}}>Importe dados ou cadastre processos/CDAs com datas para popular a linha do tempo</p></div> : (
          <div className="timeline-container">
            {Object.entries(monthGroups).map(([monthKey, monthEvents]) => {
              const [y, m] = monthKey.split('-');
              const monthLabel = monthKey === 'sem-data' ? 'Sem data' : `${['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][parseInt(m)-1] || m} ${y}`;
              return (<div key={monthKey} style={{marginBottom:20}}>
                <div style={{fontSize:10,fontWeight:700,color:'var(--accent)',textTransform:'uppercase',letterSpacing:0.5,marginBottom:8,padding:'4px 0',borderBottom:'1px solid var(--border)',position:'sticky',top:0,background:'var(--bg-primary)',zIndex:2}}>{monthLabel} ({monthEvents.length})</div>
                {monthEvents.map((ev, i) => (
                  <div key={i} className="tl-event" style={{display:'flex',gap:12,padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.03)',alignItems:'flex-start'}}>
                    <div style={{width:70,flexShrink:0,textAlign:'right'}}>
                      <div style={{fontSize:11,fontFamily:'var(--font-mono)',color:'var(--text-secondary)',fontWeight:600}}>{ev.date ? fmtDate(ev.date) : '—'}</div>
                    </div>
                    <div style={{width:2,flexShrink:0,background:ev.color||'var(--border)',borderRadius:1,minHeight:32,position:'relative'}}>
                      <div style={{position:'absolute',top:4,left:-8,width:18,height:18,borderRadius:'50%',background:'var(--bg-card)',border:`2px solid ${ev.color||'var(--border)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10}}>{ev.icon}</div>
                    </div>
                    <div style={{flex:1,paddingLeft:12,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:600,color:'var(--text-primary)',marginBottom:2}}>{ev.title}</div>
                      {ev.detail && <div style={{fontSize:10,color:'var(--text-muted)',lineHeight:1.4}}>{ev.detail}</div>}
                    </div>
                  </div>
                ))}
              </div>);
            })}
          </div>
        )}
      </div>);
    }

    if (activeTab === 'docs') {
      const docs = (data.documents || []).filter(d => d.operationId === opId);
      return (<div className="entity-area">
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}>
          <span style={{color:'var(--text-muted)',fontSize:11}}>{docs.length} documento(s)</span>
          <button className="btn-primary btn-sm" onClick={() => setModal({type:'create',entityType:'document',initial:{}})}>+ Documento</button>
        </div>
        {docs.length === 0 ? <div className="empty-state"><div className="empty-icon">📎</div><p>Nenhum documento vinculado</p><p style={{fontSize:11}}>Adicione links para peças judiciais no Google Docs</p></div> :
        <div className="docs-section">
          {docs.map(d => {
            const fromIntim = !!d.sourceIntimationId;
            const sourceIntim = fromIntim ? (data.intimations || []).find(i => i.id === d.sourceIntimationId) : null;
            // Data de atuação: prioriza actionDate; fallback para createdAt (slice ISO → YYYY-MM-DD)
            const actDate = d.actionDate || (d.createdAt ? String(d.createdAt).slice(0,10) : '');
            const procNum = d.processNumber || d.processRef || '';
            return (<div key={d.id} className="doc-link-item" style={fromIntim ? {borderLeft:'3px solid var(--green)'} : {}}>
              <span className="doc-type">{d.type || d.docType || 'Outro'}</span>
              <div style={{flex:1,minWidth:0}}>
                <a href={d.url} target="_blank" rel="noopener noreferrer" title={d.url}>{d.title || d.url}</a>
                {fromIntim && <span className="badge badge-green has-tip" style={{marginLeft:6,fontSize:8}}>📬 origem: intimação<span className="tip-content">Documento criado automaticamente a partir de peticionamento em resposta a intimação{sourceIntim?.eventDescription ? ': ' + sourceIntim.eventDescription : ''}{sourceIntim?.dateDeadline ? ' (prazo: ' + fmtDate(sourceIntim.dateDeadline) + ')' : ''}.</span></span>}
                {d.description && <div style={{fontSize:10,color:'var(--text-muted)',marginTop:2}}>{truncate(d.description, 100)}</div>}
              </div>
              <span className="doc-action-date has-tip" title="Data de atuação">
                {actDate ? fmtDate(actDate) : '—'}
                <span className="tip-content">{d.actionDate ? 'Data de atuação registrada' : (d.createdAt ? 'Data de criação do registro (sem data de atuação informada)' : 'Sem data de atuação')}</span>
              </span>
              {procNum ? (
                <span className="doc-procnum" title="Clique para copiar o nº do processo" onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(procNum).then(() => {
                    e.currentTarget.classList.add('copied');
                    setTimeout(() => { try { e.currentTarget && e.currentTarget.classList.remove('copied'); } catch {} }, 1500);
                  }).catch(() => {});
                }}>{procNum}</span>
              ) : <span style={{fontSize:10,color:'var(--text-muted)',whiteSpace:'nowrap'}}>—</span>}
              <button className="btn-xs btn-secondary" onClick={(e) => { e.stopPropagation(); setModal({type:'edit',entityType:'document',initial:d}); }}>✎</button>
            </div>);
          })}
        </div>}
      </div>);
    }

    if (activeTab === 'insights') {
      const opSugs = allSuggestions.filter(s => s.opId === opId && !dismissedSuggestions.has(s.id));
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      opSugs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
      const priorityColors = {
        high: { bg: 'rgba(244,63,94,0.08)', border: 'var(--red)', dot: 'var(--red)', label: 'ALTA' },
        medium: { bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.3)', dot: 'var(--yellow)', label: 'MÉDIA' },
        low: { bg: 'rgba(59,130,246,0.05)', border: 'rgba(59,130,246,0.2)', dot: 'var(--blue)', label: 'BAIXA' }
      };
      const hasHigh = opSugs.some(s => s.priority === 'high');
      return (<div className="entity-area">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <span style={{color:'var(--text-muted)',fontSize:11}}>
            {opSugs.length > 0 ? `${opSugs.length} sugestão(ões) ativa(s)${hasHigh ? ' — atenção requerida' : ''}` : '✓ Nenhuma sugestão pendente para esta operação.'}
          </span>
          {dismissedSuggestions.size > 0 && <button className="btn-secondary btn-xs" onClick={undismissAll} style={{fontSize:10}}>↺ Restaurar descartadas</button>}
        </div>
        {/* Sugestões proativas (primeiro) */}
        {opSugs.length > 0 && (<div style={{marginBottom:16}}>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {opSugs.map(s => {
              const pc = priorityColors[s.priority];
              return (<div key={s.id} style={{background:pc.bg,border:`1px solid ${pc.border}`,borderLeft:`3px solid ${pc.dot}`,borderRadius:'var(--radius)',padding:'10px 12px',display:'flex',gap:10,alignItems:'flex-start'}}>
                <div style={{fontSize:16,flexShrink:0,lineHeight:1}}>{s.icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2,flexWrap:'wrap'}}>
                    <span style={{fontSize:12,fontWeight:600,color:'var(--text-primary)'}}>{s.title}</span>
                    <span style={{fontSize:8,padding:'1px 5px',borderRadius:2,background:pc.dot,color:'#fff',fontWeight:700,letterSpacing:0.3}}>{pc.label}</span>
                  </div>
                  <div style={{fontSize:10,color:'var(--text-secondary)',lineHeight:1.4}}>{s.detail}</div>
                </div>
                <div style={{display:'flex',gap:4,flexShrink:0,alignItems:'center'}}>
                  {s.actionLabel && s.action && <button className="btn-secondary btn-xs" onClick={s.action} style={{fontSize:10,whiteSpace:'nowrap'}}>{s.actionLabel}</button>}
                  <button className="btn-xs" onClick={() => dismissSuggestion(s.id)} style={{fontSize:10,padding:'2px 6px',background:'transparent',color:'var(--text-muted)',border:'1px solid var(--border)',borderRadius:3,cursor:'pointer'}}>✕</button>
                </div>
              </div>);
            })}
          </div>
        </div>)}
        {/* Análise automática (depois) */}
        {insights.length > 0 && (<div>
          <div style={{fontSize:10,fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:0.3,marginBottom:8}}>Análise automática</div>
          {insights.map((ins, i) => <div key={i} className={`insight-card ${ins.type}`}><div className="ic-title">{ins.title}</div><div className="ic-desc">{ins.desc}</div></div>)}
        </div>)}
      </div>);
    }

    return null;
  };

  // ─── Form renderer ───
  const renderForm = () => {
    if (!modal) return null;
    const { type, entityType, initial } = modal;

    // ─── CDA DETAIL VIEW ───
    if (type === 'cdaDetail' && entityType === 'debt' && initial) {
      const d = initial;
      const st = DEBT_STATUSES[d.status] || {};
      const opExecsLocal = data.executions.filter(e => e.operationId === d.operationId);
      const autoPresc = calcAutoPresc(d, opExecsLocal, data.prescriptionEvents || []);
      const prescDate = d.prescriptionDate || autoPresc;
      const prescDays = daysUntil(prescDate);
      const linkedExec = d.processNumber ? data.executions.find(e => sameProc(e.processNumber, d.processNumber) && e.operationId === d.operationId) : null;
      const notes = d.notesList || (d.notes ? [d.notes] : []);
      const responsibilities = (data.links?.cdaResponsibilities || []).filter(r => r.cdaId === d.id);
      const respPeople = responsibilities.map(r => {
        const person = data.people.find(p => p.id === r.personId);
        return person ? { ...r, personName: person.name, cpfCnpj: person.cpfCnpj } : null;
      }).filter(Boolean);
      const row = (label, value, color) => value ? (<div style={{display:'flex',gap:8,padding:'4px 0',borderBottom:'1px solid rgba(255,255,255,0.03)',fontSize:11}}>
        <span style={{color:'var(--text-muted)',minWidth:130,flexShrink:0}}>{label}</span>
        <span style={{color:color||'var(--text-primary)',fontWeight:500}}>{value}</span>
      </div>) : null;
      return (<div style={{maxHeight:'80vh',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div><span className={`badge ${st.badge||''}`} style={{fontSize:10,marginRight:8}}>{st.label||d.status}</span>
            {d.processNumber && linkedExec && <span className="badge badge-muted" style={{fontSize:9}}>Ajuizada</span>}
            {!d.processNumber && <span className="badge badge-muted" style={{fontSize:9}}>Não ajuizada</span>}
          </div>
          <button className="btn-secondary btn-xs" onClick={() => setModal({type:'edit',entityType:'debt',initial:d})}>✏ Editar</button>
        </div>
        {row('Nº CDA / Debcad', d.cdaNumber)}
        {row('Devedor', d.devedor)}
        {row('CPF/CNPJ (principal)', d.cnpj)}
        {row('Situação (SIDA/Debcad)', d.rawStatus)}
        {row('Tributo / Natureza', d.tribute)}
        {row('Sistema / Receita', d.system)}
        {row('Valor inscrito', d.valueInscrito ? fmtCur(d.valueInscrito) : null)}
        {row('Valor total', d.value ? fmtCur(d.value) : null)}
        {row('Período da dívida', d.periodo)}
        {row('Data de inscrição', fmtDate(d.inscriptionDate))}
        {row('Forma de constituição', d.formaConstituicao || d.docOrigem)}
        {row('Nº processo judicial', d.processNumber)}
        {d.processNumber && linkedExec && row('Vara/Juízo', linkedExec.court)}
        {row('Data protocolo', fmtDate(d.protocolDate))}
        {row('Prescrição' + (!d.prescriptionDate && autoPresc ? ' (auto)' : ''),
          prescDate ? `${fmtDate(prescDate)}${prescDays !== null ? ` (${prescDays}d)` : ''}` : '—',
          prescDays !== null && prescDays <= 180 ? 'var(--red)' : null)}
        {d.prescriptionHandled && row('Prescrição tratada', d.prescriptionHandledType === 'aguardando_reconhecimento' ? '⏳ Aguardando reconhecimento' : '✓ Tratada')}
        {respPeople.length > 0 && (<div style={{marginTop:12}}>
          <div style={{fontSize:9,textTransform:'uppercase',letterSpacing:0.5,fontWeight:700,color:'var(--text-muted)',marginBottom:6}}>Responsáveis ({respPeople.length})</div>
          {respPeople.map((r, i) => (
            <div key={i} style={{display:'flex',gap:8,alignItems:'center',padding:'3px 0',fontSize:11}}>
              <span style={{color:'var(--text-primary)',fontWeight:500,cursor:'pointer'}} onClick={() => { const p = data.people.find(pp => pp.id === r.personId); if (p) setModal({type:'edit',entityType:'person',initial:p}); }}>{r.personName}</span>
              <span style={{fontSize:9,color:'var(--text-muted)'}}>{r.cpfCnpj}</span>
              <span className="badge badge-muted" style={{fontSize:8}}>{r.role === 'originario' ? 'Originário' : 'Corresponsável'}</span>
            </div>
          ))}
        </div>)}
        {notes.length > 0 && (<div style={{marginTop:12}}>
          <div style={{fontSize:9,textTransform:'uppercase',letterSpacing:0.5,fontWeight:700,color:'var(--text-muted)',marginBottom:6}}>Notas ({notes.length})</div>
          <div className="note-stack" style={{maxHeight:150,overflowY:'auto'}}>
            {notes.map((n, i) => <div key={i} className="note-item note-item-full">{linkify(n)}</div>)}
          </div>
        </div>)}
        <div style={{display:'flex',gap:8,marginTop:16,justifyContent:'flex-end'}}>
          <button className="btn-secondary" onClick={() => setModal(null)}>Fechar</button>
          <button className="btn-primary" onClick={() => setModal({type:'edit',entityType:'debt',initial:d})}>✏ Editar CDA</button>
        </div>
      </div>);
    }

    const isEdit = type === 'edit';
    return <EntityFormRouter entityType={entityType} initial={initial} data={data} operationId={activeOpId}
      addResponsibility={addResponsibility} removeResponsibility={removeResponsibility}
      onSave={(e) => handleSave(entityType, e)} onCancel={() => setModal(null)}
      onDelete={isEdit ? (id) => handleDelete(entityType, id) : null} />;
  };

  const modalTitle = modal ? (modal.type === 'cdaDetail' ? 'Detalhes da CDA' : (modal.type === 'create' ? 'Novo(a) ' : 'Editar ') + ({operation:'Operação',person:'Pessoa',debt:'CDA',execution:'Execução',measure:'Medida',asset:'Bem',document:'Documento',prescriptionEvent:'Evento Prescricional',intimation:'Intimação',task:'Tarefa',stickyNote:'Anotação',watch:'Acompanhamento',hearing:'Audiência'}[modal.entityType]||'')) : '';

  const tabList = ['notas','grafo','tarefas','importar','pessoas','dividas','execucoes','prescricao_v2','bens','timeline','docs','insights'];
  const tabLabels = { notas:'Anotações', grafo:'Grafo', tarefas:'Tarefas', importar:'Importar', pessoas:'Pessoas', dividas:'CDAs', execucoes:'Processos', prescricao_v2:'Controle da Prescrição', bens:'Bens', timeline:'Linha do Tempo', docs:'Docs', insights:'Insights' };
  const DEMO_ZONES = {
    briefing: { label: 'Briefing', tabs: ['notas'] },
    acervo: { label: 'Acervo', tabs: ['pessoas', 'dividas', 'execucoes', 'bens'] },
    risco: { label: 'Risco', tabs: ['prescricao_v2', 'timeline'] },
    ferramentas: { label: 'Ferramentas', tabs: ['tarefas', 'importar', 'docs', 'grafo', 'insights'] },
  };
  const tabToDemoZone = (tab) => {
    for (const [z, cfg] of Object.entries(DEMO_ZONES)) { if (cfg.tabs.includes(tab)) return z; }
    return 'briefing';
  };
  const setDemoZoneAndTab = (zone, tab) => {
    setDemoZone(zone);
    startTabSwitch(() => { setActiveTab(tab || DEMO_ZONES[zone].tabs[0]); setSelectedNode(null); });
  };
  const switchEdition = (edition) => {
    updateSetting('uiEdition', edition);
    if (edition === 'demo') {
      if (!DEMO_THEMES_OK.includes(appSettings.demoTheme)) updateSetting('demoTheme', 'mar');
      setViewMode(prev => (prev === 'painel' ? 'hoje' : prev));
      setDemoZone(tabToDemoZone(activeTab));
    } else {
      setViewMode(prev => (prev === 'hoje' ? 'painel' : prev));
    }
    setShowSettings(false);
  };
  const loadDemoData = () => {
    const demo = generateDemoData();
    setData(prev => {
      // Demo Experimental: substitui o dataset para o quadro semanal/filas ficarem coerentes.
      // Clássico: se já houver dados, faz merge (comportamento anterior).
      if (isDemo || (prev.operations || []).length === 0) return demo;
      const merged = { ...prev };
      Object.keys(demo).forEach(k => {
        if (k === 'links') {
          merged.links = { ...(prev.links || {}) };
          Object.keys(demo.links).forEach(lk => { merged.links[lk] = [...((prev.links || {})[lk] || []), ...demo.links[lk]]; });
        } else if (Array.isArray(demo[k])) {
          merged[k] = [...(prev[k] || []), ...demo[k]];
        }
      });
      return merged;
    });
    setActiveOpId(null);
    if (isDemo) setViewMode('hoje');
    alert('✅ Dados de demonstração carregados (3 operações fictícias).');
  };
  const openIntimsCount = (data.intimations || []).filter(x => (x.status === 'pendente_analise' || x.status === 'aguardando_subsidios' || x.status === 'peca_edicao') && !x.responseAction).length;
  const openTasksCount = (data.tasks || []).filter(t => t.status !== 'concluida' && t.status !== 'cancelada').length;
  const deskCount = (data.desk || []).length;
  const watchCount = (data.watchlist || []).filter(w => w.status !== 'encerrado').length;
  const hearingsAheadCount = (() => { const t = new Date(); t.setHours(0, 0, 0, 0); return (data.hearings || []).filter(h => (h.status === 'agendada' || h.status === 'redesignada') && h.date && new Date(h.date + 'T00:00:00') >= t).length; })();

  const renderSettingsPanel = () => (showSettings && <div className="settings-panel" onClick={e => e.stopPropagation()}>
    <div className="settings-group">
      <div className="settings-label">Edição da interface</div>
      <div className="settings-options">
        <button className={`settings-opt ${!isDemo ? 'active' : ''}`} onClick={() => switchEdition('classic')}>Clássico</button>
        <button className={`settings-opt ${isDemo ? 'active' : ''}`} onClick={() => switchEdition('demo')}>Demo Experimental</button>
      </div>
      <div style={{fontSize:10,color:'var(--text-muted)',marginTop:6,lineHeight:1.4}}>A Demo remodela navegação e layout (Central de Comando). Dados e funcionalidades permanecem os mesmos.</div>
    </div>
    <div className="settings-group">
      <div className="settings-label">Zoom / Escala</div>
      <div className="settings-zoom">
        <span>{appSettings.zoom}%</span>
        <input type="range" min="70" max="140" step="5" value={appSettings.zoom} onChange={e => updateSetting('zoom', Number(e.target.value))} />
        <button style={{fontSize:9,padding:'2px 6px',border:'1px solid var(--border)',borderRadius:3,background:'transparent',color:'var(--text-muted)',cursor:'pointer'}} onClick={() => updateSetting('zoom', 100)}>Reset</button>
      </div>
    </div>
    {!isDemo && <div className="settings-group">
      <div className="settings-label">Fonte</div>
      <div className="settings-options">
        <button className={`settings-opt ${appSettings.font===''?'active':''}`} onClick={() => updateSetting('font','')}>Public Sans</button>
        <button className={`settings-opt ${appSettings.font==='font-inter'?'active':''}`} onClick={() => updateSetting('font','font-inter')}>Inter</button>
        <button className={`settings-opt ${appSettings.font==='font-outfit'?'active':''}`} onClick={() => updateSetting('font','font-outfit')}>Outfit</button>
        <button className={`settings-opt ${appSettings.font==='font-source'?'active':''}`} onClick={() => updateSetting('font','font-source')}>Source Sans</button>
      </div>
    </div>}
    {!isDemo && <div className="settings-group">
      <div className="settings-label">Tema</div>
      <div className="settings-options">
        <button className={`settings-opt ${appSettings.theme===''?'active':''}`} onClick={() => updateSetting('theme','')}>Noite Azulada</button>
        <button className={`settings-opt ${appSettings.theme==='theme-ferro'?'active':''}`} onClick={() => updateSetting('theme','theme-ferro')}>Ferro e Maré</button>
      </div>
    </div>}
    {isDemo && <div className="settings-group">
      <div className="settings-label">Tema da Demo</div>
      <div className="settings-options demo-theme-opts">
        {[
          { id: 'mar', label: 'Mar Profundo', tip: 'Padrão experimental · azul-marinho' },
          { id: 'clara', label: 'Clara', tip: 'Papel-ardósia claro' },
          { id: 'ardosia', label: 'Ardósia', tip: 'Cinza-azulado frio' },
          { id: 'grafite', label: 'Grafite', tip: 'Carvão neutro, baixo brilho' },
        ].map(t => (
          <button key={t.id} type="button" title={t.tip}
            className={`settings-opt demo-theme-opt ${demoThemeId === t.id ? 'active' : ''}`}
            onClick={() => updateSetting('demoTheme', t.id)}>
            <span className={`demo-theme-swatch demo-swatch-${t.id}`} aria-hidden="true"></span>
            {t.label}
          </button>
        ))}
      </div>
      <div style={{fontSize:10,color:'var(--text-muted)',marginTop:6,lineHeight:1.4}}>Padrão: Mar Profundo. Obsidian removido.</div>
    </div>}
    <div className="settings-group">
      <div className="settings-label">Dados / Sync</div>
      <div className="settings-options" style={{flexDirection:'column'}}>
        {isGAS && <>
          <button className="settings-opt" style={{width:'100%'}} onClick={() => { cloudPush(); setShowSettings(false); }}>⬆ Salvar na Planilha</button>
          <button className="settings-opt" style={{width:'100%'}} onClick={() => { cloudPull(); setShowSettings(false); }}>⬇ Carregar da Planilha</button>
          <button className="settings-opt" style={{width:'100%'}} onClick={() => {
            const v = !autoSyncEnabled;
            setAutoSyncEnabled(v);
            localStorage.setItem('nexus_autosync_enabled', v ? 'true' : 'false');
          }}>Auto-sync: {autoSyncEnabled ? 'ON' : 'OFF'}</button>
        </>}
        <button className="settings-opt" style={{width:'100%'}} onClick={() => { handleBackup(); setShowSettings(false); }}>⬇ Exportar JSON</button>
        <button className="settings-opt" style={{width:'100%'}} onClick={() => { fileInputRef.current?.click(); setShowSettings(false); }}>⬆ Importar JSON</button>
        {!isGAS && <button className="settings-opt" style={{width:'100%'}} onClick={() => { loadDemoData(); setShowSettings(false); }}>🧪 Carregar dados demo</button>}
      </div>
      {cloudMsg && <div style={{fontSize:10,color:'var(--text-muted)',marginTop:6}}>{cloudMsg}</div>}
    </div>
    <div className="settings-group">
      <div className="settings-label">Visão Gemini (Workspace)</div>
      <div style={{fontSize:10,color:'var(--text-muted)',marginBottom:6,lineHeight:1.4}}>
        Materializa abas Gemini_* na Planilha para análise no painel Gemini do Workspace. Sob demanda — nada é enviado automaticamente.
      </div>
      <div className="settings-options" style={{flexDirection:'column'}}>
        <button className="settings-opt" style={{width:'100%'}} onClick={() => exportGeminiView('carteira')}>Atualizar · Carteira</button>
        <button className="settings-opt" style={{width:'100%'}} onClick={() => exportGeminiView('hoje')}>Atualizar · Fila de hoje</button>
        <button className="settings-opt" style={{width:'100%'}} onClick={() => exportGeminiView('operacao')} disabled={!activeOpId}>Atualizar · Operação atual</button>
      </div>
    </div>
    <div className="settings-group">
      <div className="settings-label">Manutenção</div>
      <button className="settings-opt" style={{width:'100%'}} onClick={() => { setShowDiagnostico(true); setShowSettings(false); }}>🩺 Diagnóstico de integridade</button>
    </div>
  </div>);

  const buildHojeFila = () => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const items = [];
    (data.intimations || []).forEach(x => {
      const open = (x.status === 'pendente_analise' || x.status === 'aguardando_subsidios' || x.status === 'peca_edicao') && !x.responseAction;
      if (!open) return;
      const dd = x.dateDeadline ? daysUntil(x.dateDeadline) : null;
      if (dd === null || dd > 7) return;
      const op = data.operations.find(o => o.id === x.operationId);
      items.push({
        id: 'intim-' + x.id, kind: 'Intimação', due: dd,
        title: truncate(x.className || x.eventDescription || x.processNumber || 'Intimação', 70),
        meta: [op?.name, x.processNumber].filter(Boolean).join(' · '),
        urgent: dd < 0 || dd <= 2,
        go: () => { setViewMode('intimacoes'); setTimeout(() => setModal({ type: 'edit', entityType: 'intimation', initial: x }), 80); },
      });
    });
    (data.tasks || []).forEach(t => {
      if (t.status === 'concluida' || t.status === 'cancelada') return;
      const dd = t.dueDate ? daysUntil(t.dueDate) : null;
      if (dd === null || dd > 7) return;
      const op = data.operations.find(o => o.id === t.operationId);
      items.push({
        id: 'task-' + t.id, kind: 'Tarefa', due: dd,
        title: truncate(t.title || t.description || 'Tarefa', 70),
        meta: [op?.name, t.priority].filter(Boolean).join(' · '),
        urgent: dd < 0 || dd <= 2,
        go: () => {
          if (t.operationId) { setActiveOpId(t.operationId); setViewMode('operation'); setDemoZoneAndTab('ferramentas', 'tarefas'); }
          else setViewMode('tarefas_global');
          setTimeout(() => setModal({ type: 'edit', entityType: 'task', initial: t }), 80);
        },
      });
    });
    (data.hearings || []).forEach(h => {
      if (h.status === 'realizada' || h.status === 'cancelada' || !h.date) return;
      const dd = Math.round((new Date(h.date + 'T00:00:00') - today) / 86400000);
      if (dd < 0 || dd > 7) return;
      items.push({
        id: 'hear-' + h.id, kind: 'Audiência', due: dd,
        title: truncate(h.parties || h.processNumber || 'Audiência', 70),
        meta: [h.time, h.processNumber].filter(Boolean).join(' · '),
        urgent: dd <= 2,
        go: () => { setViewMode('audiencias'); setTimeout(() => setModal({ type: 'edit', entityType: 'hearing', initial: h }), 80); },
      });
    });
    (data.debts || []).forEach(d => {
      if (d.prescriptionHandled) return;
      const opExecs = data.executions.filter(e => e.operationId === d.operationId);
      const pd = d.prescriptionDate || calcAutoPresc(d, opExecs, data.prescriptionEvents || []);
      const dd = daysUntil(pd);
      if (dd === null || dd > 180) return;
      const op = data.operations.find(o => o.id === d.operationId);
      items.push({
        id: 'presc-' + d.id, kind: 'Prescrição', due: dd,
        title: `CDA ${d.number || d.cdaNumber || ''} · ${fmtCur(d.value || 0)}`.trim(),
        meta: [op?.name, dd < 0 ? 'vencida' : `${dd}d`].filter(Boolean).join(' · '),
        urgent: dd <= 30,
        go: () => {
          if (d.operationId) { setActiveOpId(d.operationId); setViewMode('operation'); setDemoZoneAndTab('risco', 'prescricao_v2'); }
          setTimeout(() => setModal({ type: 'edit', entityType: 'debt', initial: d }), 80);
        },
      });
    });
    items.sort((a, b) => {
      const ad = a.due === null ? 9999 : a.due;
      const bd = b.due === null ? 9999 : b.due;
      return ad - bd;
    });
    return items.slice(0, 18);
  };

  const renderHojeView = () => {
    const fila = buildHojeFila();
    const hour = new Date().getHours();
    const saudacao = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    return (
      <div className="demo-hoje">
        <div className="demo-hoje-hero">
          <div className="demo-hoje-kicker">NEXUS Demo · Central de Comando</div>
          <h2>{saudacao}. O que exige ação hoje?</h2>
          <p>Fila unificada de intimações, tarefas, audiências e riscos prescricionais — no espírito do Painel do Advogado (eproc) e dos matter hubs (Clio/MyCase).</p>
          <div className="demo-hoje-ctas">
            <button className="btn-primary" onClick={() => setViewMode('intimacoes')}>Abrir Intimações {openIntimsCount > 0 ? `(${openIntimsCount})` : ''}</button>
            <button className="btn-secondary" onClick={() => setViewMode('tarefas_global')}>Abrir Tarefas {openTasksCount > 0 ? `(${openTasksCount})` : ''}</button>
            <button className="btn-secondary" onClick={() => setViewMode('mesa')}>Abrir Mesa {deskCount > 0 ? `(${deskCount})` : ''}</button>
            <button className="btn-secondary" onClick={() => setModal({ type: 'create', entityType: 'intimation', initial: {} })}>Nova intimação</button>
            <button className="btn-secondary" onClick={openCarteiraHome}>Ver Carteira</button>
            <button className="btn-secondary" onClick={() => exportGeminiView('hoje')} title="Materializa abas Gemini_* na Planilha">✦ Visão Gemini</button>
            {!isGAS && <button className="btn-secondary" onClick={loadDemoData}>Carregar dados demo</button>}
          </div>
        </div>
        {fila.length === 0 ? (
          <div className="demo-fila-empty">Nada urgente nos próximos 7 dias (e nenhuma prescrição ≤180d). Use a Carteira ou Intimações e Tarefas para navegar o acervo.</div>
        ) : (
          <div className="demo-fila">
            {fila.map(it => (
              <div key={it.id} className="demo-fila-item" onClick={it.go}>
                <div className="demo-fila-kind">{it.kind}</div>
                <div>
                  <div className="demo-fila-title">{it.title}</div>
                  <div className="demo-fila-meta">{it.meta}</div>
                </div>
                <div className={`demo-fila-due ${it.urgent ? 'urgent' : ''}`}>
                  {it.due === null ? '—' : it.due < 0 ? `${Math.abs(it.due)}d atrasado` : it.due === 0 ? 'hoje' : `${it.due}d`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const openCarteiraHome = () => {
    setCarteiraTreeOpen(true);
    setSidebarCollapsed(false);
    try { localStorage.setItem('nexus_sidebar_collapsed', '0'); } catch {}
    setDemoTrabalhoOpen(false);
    startTabSwitch(() => {
      setViewMode('operacoes');
      setSelectedNode(null);
      setImportResult(null);
    });
  };
  const openCarteiraOp = (op) => {
    setCarteiraTreeOpen(true);
    setSidebarCollapsed(false);
    try { localStorage.setItem('nexus_sidebar_collapsed', '0'); } catch {}
    startTabSwitch(() => {
      setActiveOpId(op.id);
      setSelectedNode(null);
      setImportResult(null);
      setViewMode('operation');
      setDemoZone(tabToDemoZone(activeTab));
    });
    setTimeout(() => upsert('operations', { ...op, lastAccessed: new Date().toISOString() }), 800);
  };
  const carteiraContext = isDemo && (viewMode === 'operacoes' || viewMode === 'operation' || viewMode === 'painel');
  const alphaOps = (data.operations || []).slice().sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR'));

  const renderCarteiraRankingPanel = () => {
    const ops = data.operations.filter(o => o.status !== 'encerrada');
    if (ops.length === 0) return null;
    const allDebts = data.debts || [];
    const allExecs = data.executions || [];
    const allAssets = data.assets || [];
    const allIntims = data.intimations || [];
    const allTasks = data.tasks || [];
    const allPrescEvts = data.prescriptionEvents || [];
    const opAnalytics = ops.map(op => {
      const debts = allDebts.filter(d => d.operationId === op.id && d.status !== 'extinta');
      const execs = allExecs.filter(e => e.operationId === op.id);
      const assets = allAssets.filter(a => a.operationId === op.id);
      const intims = allIntims.filter(x => x.operationId === op.id);
      const tasks = allTasks.filter(t => t.operationId === op.id);
      const totalValue = debts.reduce((s, d) => s + (d.value || 0), 0);
      const guaranteedValue = debts.filter(d => d.status === 'garantida').reduce((s, d) => s + (d.value || 0), 0);
      const prescRisk = debts.filter(d => {
        const pd = d.prescriptionDate || calcAutoPresc(d, execs, allPrescEvts);
        const dd = daysUntil(pd);
        return dd !== null && dd <= 180 && !d.prescriptionHandled;
      }).length;
      const openIntims = intims.filter(x => (x.status === 'pendente_analise' || x.status === 'aguardando_subsidios' || x.status === 'peca_edicao') && !x.responseAction).length;
      const openTasks = tasks.filter(t => t.status !== 'concluida' && t.status !== 'cancelada').length;
      const idpjCount = execs.filter(e => e.processTag === 'idpj').length;
      const cautelarCount = execs.filter(e => e.processTag === 'cautelar_fiscal').length;
      const lastAccess = op.lastAccessed ? new Date(op.lastAccessed) : null;
      const daysSinceAccess = lastAccess ? Math.floor((Date.now() - lastAccess.getTime()) / 86400000) : null;
      return { op, totalValue, guaranteedValue, prescRisk, openIntims, openTasks, debtsCount: debts.length, execsCount: execs.length, assetsCount: assets.length, idpjCount, cautelarCount, daysSinceAccess };
    });
    const carteiraSortFns = {
      valor_desc: (a, b) => b.totalValue - a.totalValue,
      valor_asc: (a, b) => a.totalValue - b.totalValue,
      presc: (a, b) => b.prescRisk - a.prescRisk || b.totalValue - a.totalValue,
      intims: (a, b) => b.openIntims - a.openIntims || b.totalValue - a.totalValue,
      tasks: (a, b) => b.openTasks - a.openTasks || b.totalValue - a.totalValue,
      cobertura_asc: (a, b) => {
        const ca = a.totalValue > 0 ? a.guaranteedValue / a.totalValue : 1;
        const cb = b.totalValue > 0 ? b.guaranteedValue / b.totalValue : 1;
        return ca - cb;
      },
      acesso_recente: (a, b) => {
        const da = a.daysSinceAccess === null ? 99999 : a.daysSinceAccess;
        const db = b.daysSinceAccess === null ? 99999 : b.daysSinceAccess;
        return da - db;
      },
      revisao_atrasada: (a, b) => {
        const ra = reviewStatus(a.op);
        const rb = reviewStatus(b.op);
        return (ra.daysLeft ?? 99999) - (rb.daysLeft ?? 99999);
      },
      nome: (a, b) => (a.op.name || '').localeCompare(b.op.name || '', 'pt-BR'),
      idpj: (a, b) => (b.idpjCount + b.cautelarCount) - (a.idpjCount + a.cautelarCount) || b.totalValue - a.totalValue,
    };
    opAnalytics.sort(carteiraSortFns[carteiraSort] || carteiraSortFns.valor_desc);
    const sortLabels = {
      valor_desc: 'Maior valor de crédito', valor_asc: 'Menor valor de crédito', presc: 'Maior risco de prescrição',
      intims: 'Mais intimações abertas', tasks: 'Mais tarefas pendentes', cobertura_asc: 'Menor cobertura de garantia',
      acesso_recente: 'Acessadas recentemente', revisao_atrasada: 'Revisão mais atrasada primeiro',
      nome: 'Nome (A→Z)', idpj: 'Mais IDPJs/Cautelares',
    };
    const totalCredito = opAnalytics.reduce((s, o) => s + o.totalValue, 0);
    return (
      <div style={{marginTop:20}}>
        <h4 style={{fontSize:13,fontWeight:700,color:'var(--text-secondary)',marginBottom:12,letterSpacing:0.3}}>Lista e ranking da carteira</h4>
        <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',overflow:'hidden'}}>
          <div style={{padding:'10px 14px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
            <span style={{fontSize:11,fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:0.5}}>Operações · {sortLabels[carteiraSort]}</span>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <label style={{fontSize:10,color:'var(--text-muted)'}}>Ordenar:</label>
              <select value={carteiraSort} onChange={e => setCarteiraSort(e.target.value)} style={{fontSize:11,padding:'3px 6px',background:'var(--bg-input)',color:'var(--text-primary)',border:'1px solid var(--border)',borderRadius:4,cursor:'pointer'}}>
                <optgroup label="Financeiro">
                  <option value="valor_desc">Maior valor de crédito</option>
                  <option value="valor_asc">Menor valor de crédito</option>
                  <option value="cobertura_asc">Menor cobertura de garantia</option>
                </optgroup>
                <optgroup label="Risco / Urgência">
                  <option value="presc">Maior risco de prescrição</option>
                  <option value="intims">Mais intimações abertas</option>
                  <option value="tasks">Mais tarefas pendentes</option>
                </optgroup>
                <optgroup label="Atividade">
                  <option value="acesso_recente">Acessadas recentemente</option>
                  <option value="revisao_atrasada">Revisão mais atrasada</option>
                </optgroup>
                <optgroup label="Estratégico">
                  <option value="idpj">Mais IDPJs / Cautelares</option>
                  <option value="nome">Nome (A→Z)</option>
                </optgroup>
              </select>
              <span style={{fontSize:10,color:'var(--text-muted)'}}>· {opAnalytics.length} ativa(s)</span>
            </div>
          </div>
          <div style={{maxHeight:420,overflowY:'auto'}}>
            {opAnalytics.map((oa, idx) => {
              const barPct = totalCredito > 0 ? Math.max(2, (oa.totalValue / totalCredito) * 100) : 0;
              const guarPct = oa.totalValue > 0 ? (oa.guaranteedValue / oa.totalValue) * 100 : 0;
              return (
                <div key={oa.op.id} style={{padding:'10px 14px',borderBottom:'1px solid var(--border)',cursor:'pointer',transition:'background 0.15s'}}
                  onClick={() => openCarteiraOp(oa.op)}
                  onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,flex:1,minWidth:0}}>
                      <span style={{fontSize:10,color:'var(--text-muted)',fontWeight:700,width:18}}>{idx + 1}.</span>
                      <span style={{fontSize:12,fontWeight:600,color:'var(--text-primary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{oa.op.name}</span>
                      {oa.prescRisk > 0 && <span style={{fontSize:9,padding:'1px 5px',borderRadius:3,background:'var(--red-dim)',color:'var(--red)',fontWeight:700}}>⏱{oa.prescRisk}</span>}
                      {oa.openIntims > 0 && <span style={{fontSize:9,padding:'1px 5px',borderRadius:3,background:'var(--blue-dim)',color:'var(--blue)',fontWeight:700}}>📬{oa.openIntims}</span>}
                      {oa.openTasks > 0 && <span style={{fontSize:9,padding:'1px 5px',borderRadius:3,background:'var(--yellow-dim)',color:'var(--yellow)',fontWeight:700}}>✓{oa.openTasks}</span>}
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <div style={{fontSize:12,fontWeight:700,color:'var(--accent)',fontFamily:'var(--font-mono)'}}>{fmtCur(oa.totalValue)}</div>
                      <div style={{fontSize:9,color:'var(--text-muted)'}}>{oa.debtsCount} CDAs · {oa.execsCount} proc. · {oa.assetsCount} bens</div>
                    </div>
                  </div>
                  <div style={{height:4,background:'var(--bg-elevated)',borderRadius:2,overflow:'hidden',position:'relative'}}>
                    <div style={{height:'100%',width:barPct + '%',background:'rgba(184,115,51,0.35)',borderRadius:2,position:'absolute'}}></div>
                    <div style={{height:'100%',width:(barPct * guarPct / 100) + '%',background:'var(--green)',borderRadius:2,position:'absolute'}}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Quadro semanal Demo: cards de fim de prazo, audiências e termo final de prescrição.
  const renderAgendaWeek = (opts = {}) => {
    const embedded = !!opts.embedded;
    const start = new Date(agendaWeekStart);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start); d.setDate(start.getDate() + i); return d;
    });
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const weekStartKey = days[0].toISOString().slice(0, 10);
    const weekEndKey = days[6].toISOString().slice(0, 10);
    const label = `${days[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} – ${days[6].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    const shift = (n) => { const d = new Date(agendaWeekStart); d.setDate(d.getDate() + n * 7); setAgendaWeekStart(d); };
    const opName = (id) => data.operations.find(o => o.id === id)?.name || '';
    const inWeek = (iso) => iso && iso >= weekStartKey && iso <= weekEndKey;

    // Coleta por dia: prazo (intimação/tarefa), audiência, termo final de prescrição
    const byDay = {};
    days.forEach(d => { byDay[d.toISOString().slice(0, 10)] = []; });

    (data.intimations || []).forEach(x => {
      if (!x.dateDeadline || x.responseAction || x.status === 'analisado') return;
      if (!inWeek(x.dateDeadline)) return;
      byDay[x.dateDeadline].push({
        id: 'intim-' + x.id, kind: 'prazo', sub: 'intim',
        title: truncate(x.processNumber || x.partyName || 'Intimação', 32),
        meta: opName(x.operationId),
        tip: `Fim de prazo · intimação${x.partyName ? ' · ' + x.partyName : ''}`,
        onClick: () => { setViewMode('intimacoes'); },
      });
    });
    (data.tasks || []).forEach(t => {
      if (!t.dueDate || t.status === 'concluida' || t.status === 'cancelada') return;
      if (!inWeek(t.dueDate)) return;
      byDay[t.dueDate].push({
        id: 'task-' + t.id, kind: 'prazo', sub: 'task',
        title: truncate(t.title || 'Tarefa', 32),
        meta: opName(t.operationId),
        tip: 'Fim de prazo · tarefa',
        onClick: () => {
          if (t.operationId) { setActiveOpId(t.operationId); setViewMode('operation'); setActiveTab('tarefas'); }
          else setViewMode('tarefas_global');
        },
      });
    });
    (data.hearings || []).forEach(h => {
      if (!h.date || h.status === 'cancelada' || h.status === 'realizada') return;
      if (!inWeek(h.date)) return;
      byDay[h.date].push({
        id: 'hear-' + h.id, kind: 'audiencia', sub: 'hearing',
        title: truncate((h.time ? h.time + ' · ' : '') + (h.parties || h.processNumber || 'Audiência'), 34),
        meta: opName(h.operationId),
        tip: h.parties || h.processNumber || 'Audiência',
        onClick: () => setModal({ type: 'edit', entityType: 'hearing', initial: h }),
      });
    });
    const allExecs = data.executions || [];
    const allPrescEvts = data.prescriptionEvents || [];
    (data.debts || []).forEach(d => {
      if (d.status === 'extinta' || d.prescriptionHandled) return;
      const pd = d.prescriptionDate || calcAutoPresc(d, allExecs, allPrescEvts);
      if (!inWeek(pd)) return;
      byDay[pd].push({
        id: 'presc-' + d.id, kind: 'presc', sub: 'presc',
        title: truncate(d.cdaNumber || 'CDA', 28),
        meta: (d.value ? fmtCur(d.value) + ' · ' : '') + opName(d.operationId),
        tip: `Termo final de prescrição · ${fmtDate(pd)}${!d.prescriptionDate ? ' (auto)' : ''}`,
        onClick: () => {
          if (d.operationId) { setActiveOpId(d.operationId); setViewMode('operation'); setActiveTab('prescricao_v2'); }
        },
      });
    });

    const kindLabel = { prazo: 'Prazo', audiencia: 'Audiência', presc: 'Prescrição' };
    let totalCards = 0;
    Object.values(byDay).forEach(arr => { totalCards += arr.length; });

    return (
      <div className={embedded ? 'demo-week-embed' : undefined} style={embedded ? undefined : { padding: '12px 24px 0' }}>
        <div className="demo-week-nav">
          <button className="btn-secondary btn-xs" onClick={() => shift(-1)}>← Semana</button>
          <button className="btn-secondary btn-xs" onClick={() => { const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - ((d.getDay()+6)%7)); setAgendaWeekStart(d); }}>Hoje</button>
          <button className="btn-secondary btn-xs" onClick={() => shift(1)}>Semana →</button>
          <span style={{fontSize:12,color:'var(--text-secondary)',fontWeight:600}}>{label}</span>
          <span className="demo-week-legend" aria-hidden="true">
            <span className="demo-week-leg kind-prazo">Prazo</span>
            <span className="demo-week-leg kind-audiencia">Audiência</span>
            <span className="demo-week-leg kind-presc">Prescrição</span>
          </span>
          <span style={{fontSize:10,color:'var(--text-muted)',marginLeft:'auto'}}>{totalCards} card(s)</span>
        </div>
        <div className="demo-week">
          {days.map(d => {
            const key = d.toISOString().slice(0, 10);
            const isToday = d.getTime() === today.getTime();
            const cards = byDay[key] || [];
            return (
              <div key={key} className={`demo-week-day ${isToday ? 'today' : ''}`}>
                <div className="demo-week-day-h">{d.toLocaleDateString('pt-BR', { weekday: 'short' })}</div>
                <div className="demo-week-day-n">{d.getDate()}</div>
                {cards.length === 0 && <div className="demo-week-empty">—</div>}
                {cards.map(c => (
                  <button key={c.id} type="button" className={`demo-week-card kind-${c.kind}`}
                    title={c.tip} onClick={c.onClick}>
                    <span className="demo-week-card-k">{kindLabel[c.kind]}</span>
                    <span className="demo-week-card-t">{c.title}</span>
                    {c.meta ? <span className="demo-week-card-m">{truncate(c.meta, 28)}</span> : null}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (<div className={`app-layout ${sidebarCollapsed?'sidebar-collapsed':''} ${isDemo?'edition-demo':''} ${demoThemeClass} ${isDemo && (!sidebarCollapsed || (carteiraContext && carteiraTreeOpen))?'demo-rail-expanded':''} ${carteiraContext && carteiraTreeOpen?'demo-carteira-open':''} ${isDemo?'':appSettings.theme} ${isDemo?'':appSettings.font}`} style={appSettings.zoom !== 100 ? {zoom: appSettings.zoom/100} : undefined}>
    {/* ═══ DEMO RAIL ═══ */}
    {isDemo && <nav className="demo-rail">
      <div className="demo-rail-brand">
        {sidebarCollapsed && !(carteiraContext && carteiraTreeOpen) ? 'N' : 'NEXUS'}
        {(!sidebarCollapsed || (carteiraContext && carteiraTreeOpen)) && <small>Central de Comando</small>}
      </div>
      <div className="demo-rail-nav">
        <button className={`demo-rail-btn ${viewMode==='hoje'?'active':''}`} onClick={() => { setDemoTrabalhoOpen(false); setViewMode('hoje'); }}><span className="demo-rail-ico">☀</span><span>Hoje</span></button>
        <button className={`demo-rail-btn ${viewMode==='intimacoes'||viewMode==='tarefas_global'?'active':''}`} onClick={() => { setDemoTrabalhoOpen(false); setViewMode(viewMode==='tarefas_global'?'tarefas_global':'intimacoes'); }} title="Intimações e Tarefas">
          <span className="demo-rail-ico">📥</span>
          <span>{(!sidebarCollapsed || (carteiraContext && carteiraTreeOpen)) ? 'Intimações e Tarefas' : 'Intimações'}</span>
          {(openIntimsCount + openTasksCount) > 0 && <span className="demo-rail-count">{openIntimsCount + openTasksCount}</span>}
        </button>

        <div className={`demo-rail-branch ${carteiraContext ? 'open' : ''} ${viewMode==='operacoes'||viewMode==='painel'||viewMode==='operation'?'active-branch':''}`}>
          <button className={`demo-rail-btn ${viewMode==='operacoes'||viewMode==='painel'?'active':''} ${viewMode==='operation'?'soft-active':''}`}
            onClick={openCarteiraHome}
            title="Carteira — página inicial do portfólio">
            <span className="demo-rail-ico">◈</span>
            <span>Carteira</span>
            {(!sidebarCollapsed || (carteiraContext && carteiraTreeOpen)) && (
              <span className="demo-rail-chevron" onClick={e => { e.stopPropagation(); setCarteiraTreeOpen(v => !v); setSidebarCollapsed(false); }}
                title={carteiraTreeOpen ? 'Recolher operações' : 'Expandir operações'}>
                {carteiraTreeOpen && carteiraContext ? '▾' : '▸'}
              </span>
            )}
            {(data.operations||[]).length > 0 && <span className="demo-rail-count">{(data.operations||[]).length}</span>}
          </button>
          {carteiraContext && carteiraTreeOpen && (
            <div className="demo-rail-tree">
              <button type="button" className={`demo-rail-tree-item rootish ${viewMode==='operacoes'?'active':''}`} onClick={openCarteiraHome}>
                <span className="demo-rail-tree-mark">◉</span>
                <span>Visão geral</span>
              </button>
              {alphaOps.length === 0 && <div className="demo-rail-tree-empty">Nenhuma operação</div>}
              {alphaOps.map(op => (
                <button type="button" key={op.id}
                  className={`demo-rail-tree-item ${viewMode==='operation' && activeOpId===op.id?'active':''}`}
                  onClick={() => openCarteiraOp(op)}
                  title={op.name}>
                  <span className="demo-rail-tree-mark">○</span>
                  <span className="demo-rail-tree-label">{op.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button className={`demo-rail-btn ${viewMode==='audiencias'?'active':''}`} onClick={() => { setDemoTrabalhoOpen(false); setViewMode('audiencias'); }}><span className="demo-rail-ico">⚖</span><span>Agenda</span>{hearingsAheadCount>0 && <span className="demo-rail-count">{hearingsAheadCount}</span>}</button>
        <button className={`demo-rail-btn ${viewMode==='modelos'?'active':''}`} onClick={() => { setDemoTrabalhoOpen(false); setViewMode('modelos'); }}><span className="demo-rail-ico">📄</span><span>Biblioteca</span></button>
        <div className={`demo-rail-branch ${viewMode==='mesa'||viewMode==='acompanhar'||viewMode==='painel'?'active-branch':''}`}>
          <button className={`demo-rail-btn ${viewMode==='mesa'?'active':''} ${viewMode==='acompanhar'||viewMode==='painel'?'soft-active':''}`}
            onClick={() => { setDemoTrabalhoOpen(false); setViewMode('mesa'); }}
            title="Mesa de trabalho">
            <span className="demo-rail-ico">🗂</span>
            <span>Trabalho</span>
            {deskCount > 0 && <span className="demo-rail-count">{deskCount}</span>}
            {(!sidebarCollapsed || (carteiraContext && carteiraTreeOpen)) && (
              <span className="demo-rail-chevron" onClick={e => { e.stopPropagation(); setDemoTrabalhoOpen(v => !v); }} title="Mais opções">▸</span>
            )}
          </button>
        </div>
      </div>
      {demoTrabalhoOpen && <div className="demo-trabalho-drawer">
        <button onClick={() => { setViewMode('mesa'); setDemoTrabalhoOpen(false); }}><span>Mesa de trabalho</span><span>{deskCount||''}</span></button>
        <button onClick={() => { setViewMode('acompanhar'); setDemoTrabalhoOpen(false); }}><span>Acompanhar</span><span>{watchCount||''}</span></button>
        <button onClick={() => { setViewMode('painel'); setDemoTrabalhoOpen(false); }}><span>Painel KPIs</span><span></span></button>
      </div>}
      <div className="demo-rail-foot">
        <button className="demo-rail-btn" onClick={() => { const next = !sidebarCollapsed; setSidebarCollapsed(next); try { localStorage.setItem('nexus_sidebar_collapsed', next?'1':'0'); } catch {} }} title="Expandir/recolher">
          <span className="demo-rail-ico">{sidebarCollapsed?'»':'«'}</span>{!sidebarCollapsed && <span>Recolher</span>}
        </button>
        <button className="demo-rail-btn" onClick={() => {setGlobalSearch(true);setGsQuery('');}}><span className="demo-rail-ico">⌕</span>{!sidebarCollapsed && <span>Busca</span>}</button>
        <div style={{position:'relative'}}>
          <button className="demo-rail-btn" onClick={() => setShowSettings(!showSettings)}><span className="demo-rail-ico">⚙</span>{!sidebarCollapsed && <span>Ajustes</span>}</button>
          {renderSettingsPanel()}
        </div>
      </div>
    </nav>}

    <div className={`sidebar ${sidebarCollapsed?'collapsed':''}`}>
      <div className="sidebar-header">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h1>{sidebarCollapsed ? 'N' : 'NEXUS'}</h1>
          <button className="sidebar-toggle" onClick={() => { const next = !sidebarCollapsed; setSidebarCollapsed(next); try { localStorage.setItem('nexus_sidebar_collapsed', next?'1':'0'); } catch {} }} title={sidebarCollapsed?'Expandir sidebar':'Recolher sidebar'}>{sidebarCollapsed?'☰':'◀'}</button>
        </div>
      </div>
      <div className="sidebar-search">
        <input placeholder="Buscar operação..." value={search} onChange={e => setSearch(e.target.value)} />
        <button className="btn-secondary btn-sm" style={{marginTop:6,width:'100%',fontSize:10}} onClick={() => {setGlobalSearch(true);setGsQuery('');}}>🔍 Busca Global (Ctrl+K)</button>
      </div>
      <div className="sidebar-ops">
        {filteredOps.length === 0 && <div style={{textAlign:'center',padding:20,color:'var(--text-muted)',fontSize:11}}>{data.operations.length===0?'Crie sua primeira operação':'Nenhum resultado'}</div>}
        {filteredOps.map(op => {
          const dCount = data.debts.filter(d => d.operationId === op.id).length;
          const pCount = data.people.filter(p => p.operationId === op.id).length;
          const opExecsForPresc = data.executions.filter(e => e.operationId === op.id);
          const opIntims = (data.intimations||[]).filter(x => x.operationId === op.id);
          const openIntims = opIntims.filter(x => (x.status === 'pendente_analise' || x.status === 'aguardando_subsidios' || x.status === 'peca_edicao') && !x.responseAction);
          const overdueIntims = opIntims.filter(x => x.dateDeadline && new Date(x.dateDeadline+'T00:00:00') < new Date() && x.status !== 'analisado');
          const openTasks = (data.tasks||[]).filter(t => t.operationId === op.id && t.status !== 'concluida' && t.status !== 'cancelada');
          const alerts = data.debts.filter(d => { if (d.operationId!==op.id) return false; const pd = d.prescriptionDate || calcAutoPresc(d, opExecsForPresc, data.prescriptionEvents || []); const dd = daysUntil(pd); return dd !== null && dd <= 180 && !d.prescriptionHandled; }).length;
          return (<div key={op.id} className={`sidebar-op-item ${activeOpId===op.id?'active':''} ${op.opCategory && op.opCategory !== 'none' ? 'cat-'+op.opCategory.replace('alta_relevancia','alta') : ''}`} onClick={() => { startTabSwitch(() => { setActiveOpId(op.id); setSelectedNode(null); setImportResult(null); setViewMode('operation'); }); setTimeout(() => upsert('operations', {...op, lastAccessed: new Date().toISOString()}), 800); }}>
            <div className="op-name">
              {op.name}
              {overdueIntims.length > 0 && <span className="op-intim-dot op-intim-overdue urgent has-tip" title={`${overdueIntims.length} intimação(ões) vencida(s)`}><span className="tip-content">{overdueIntims.length} intimação(ões) VENCIDA(S) nesta operação.</span></span>}
              {overdueIntims.length === 0 && openIntims.length > 0 && (() => {
                const soonest = openIntims.filter(x => x.dateDeadline).map(x => daysUntil(x.dateDeadline)).filter(d => d !== null).sort((a,b) => a-b)[0];
                const isUrgent = soonest !== undefined && soonest <= 5;
                return <span className={`op-intim-dot${isUrgent?' urgent':''} has-tip`}><span className="tip-content">{openIntims.length} intimação(ões) abertas{isUrgent?` — prazo mais próximo em ${soonest}d`:''}</span></span>;
              })()}
              {openTasks.length > 0 && (() => {
                const soonest = openTasks.filter(t => t.dueDate).map(t => daysUntil(t.dueDate)).filter(d => d !== null).sort((a,b) => a-b)[0];
                const isUrgent = soonest !== undefined && soonest <= 5;
                return <span className={`op-task-dot${isUrgent?' urgent':''} has-tip`}><span className="tip-content">{openTasks.length} tarefa(s){isUrgent?` — prazo mais próximo em ${soonest}d`:''}</span></span>;
              })()}
              {alerts > 0 && <span style={{color:'var(--red)',marginLeft:4,fontSize:10}}>● {alerts}</span>}
            </div>
            <div className="op-meta">{pCount}P · {dCount}CDAs {openTasks.length > 0 ? `· ${openTasks.length}✓` : ''}</div>
          </div>);
        })}
      </div>

      {/* Cloud Sync Panel — Apps Script only (variante standalone removida por segurança) */}
      <div className="cloud-panel">
        <h5 onClick={() => setShowCloudConfig(!showCloudConfig)} style={{cursor:'pointer'}}>
          ☁️ Google Sheets
          <span className={`cloud-dot ${cloudStatus}`}></span>
          <span style={{fontSize:9,color:'var(--text-muted)',fontWeight:400,marginLeft:'auto'}}>{showCloudConfig ? '▾' : '▸'}</span>
        </h5>
        {isGAS ? (<>
          <div className="cloud-actions">
            <button className="btn-secondary btn-xs" onClick={cloudPush}>⬆ Salvar na Planilha</button>
            <button className="btn-secondary btn-xs" onClick={cloudPull}>⬇ Carregar da Planilha</button>
          </div>
          {cloudMsg && <div className="cloud-last-sync" style={{color: cloudStatus==='connected'?'var(--green)':'var(--text-muted)'}}>{cloudMsg}</div>}
          {cloudLastSync && <div className="cloud-last-sync">Última sync: {cloudLastSync}</div>}
          <div className="autosync-row has-tip" onClick={() => {
            const v = !autoSyncEnabled;
            setAutoSyncEnabled(v);
            localStorage.setItem('nexus_autosync_enabled', v ? 'true' : 'false');
          }}>
            <span className={`autosync-pill ${autoSyncEnabled ? 'on' : 'off'}`}>
              <span className="autosync-pill-knob"></span>
            </span>
            <span className="autosync-label">Auto-sync · 5 min</span>
            {autoSyncEnabled && dirtyRef.current && <span className="autosync-pending">● pend.</span>}
            <span className="tip-content">Quando ativo, salva automaticamente na Planilha a cada 5 minutos (se houve alterações e você não está digitando). Também tenta salvar ao fechar a aba. Ao abrir o app, verifica se há versão mais recente na nuvem.</span>
          </div>
          {showCloudConfig && <div style={{marginTop:10,paddingTop:10,borderTop:'1px dashed var(--border)',display:'flex',flexDirection:'column',gap:8}}>
            <button className="btn-secondary btn-xs" style={{width:'100%'}} onClick={() => {
              if (!isGAS) return;
              google.script.run.withSuccessHandler(res => {
                if (!res || !res.success) { alert('Erro ao listar backups'); return; }
                const list = res.backups;
                if (list.length === 0) { alert('Nenhum backup encontrado.\n\nO primeiro backup é criado automaticamente no primeiro save do dia.'); return; }
                const msg = list.map((b,i) => `${i+1}. ${b.date}  (${(b.size/1024).toFixed(0)} KB)`).join('\n');
                const choice = prompt(`📦 Backups disponíveis (últimos 7 dias):\n\n${msg}\n\nDigite o NÚMERO para restaurar, ou cancele:`);
                if (!choice) return;
                const idx = parseInt(choice) - 1;
                if (isNaN(idx) || idx < 0 || idx >= list.length) { alert('Número inválido.'); return; }
                const chosen = list[idx];
                if (!confirm(`Restaurar backup de ${chosen.date}?\n\n⚠ Isso SUBSTITUIRÁ os dados atuais.\n(O estado atual será salvo como backup de emergência antes da restauração.)\n\nContinuar?`)) return;
                google.script.run.withSuccessHandler(rr => {
                  if (rr && rr.success) {
                    alert(`✅ Restaurado de ${chosen.date}. A página será recarregada.`);
                    window.location.reload();
                  } else { alert('Erro: ' + (rr && rr.error || 'desconhecido')); }
                }).restoreBackup(chosen.name);
              }).listBackups();
            }}>📦 Restaurar backup</button>
            <button className="btn-secondary btn-sm" style={{marginTop:4,width:'100%',fontSize:10}} onClick={() => setShowChangeLog(true)}>📜 Histórico de alterações</button>
            <button className="btn-secondary btn-xs" style={{width:'100%',background:'rgba(244,63,94,0.08)',color:'var(--red)',border:'1px solid rgba(244,63,94,0.3)'}} onClick={() => {
              if (!confirm('Limpar cache local?\n\nIsso apaga TODOS os dados salvos neste navegador (localStorage).\n\n⚠ Use ao encerrar sessão em máquina compartilhada / institucional.\n\nRecomenda-se sincronizar com a Planilha ANTES (botão ⬆ acima).\n\nOs dados no Google Drive (nexus_data.json) não são afetados — só o cache do navegador.\n\nContinuar?')) return;
              try { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem('nexus_cloud_lastsync'); } catch(e) {}
              alert('✅ Cache local limpo. A página será recarregada.');
              window.location.reload();
            }}>🔒 Limpar cache local</button>
            <div style={{fontSize:9,color:'var(--text-muted)',lineHeight:1.4}}>📦 Backups diários automáticos (7 dias). 🔒 Limpa localStorage deste navegador.</div>
          </div>}
        </>) : (<>
          {/* Modo fora do Apps Script (ex.: abrindo nexus_demo.html diretamente) — só informativo */}
          <div style={{fontSize:10,color:'var(--text-muted)',padding:'6px 0'}}>
            App fora do ambiente Apps Script. Sincronização com Planilha indisponível.
          </div>
          <button className="btn-secondary btn-xs" style={{width:'100%',marginTop:4}} onClick={() => {
            const hasData = (data.operations || []).length > 0;
            if (hasData && !confirm('⚠ Já existem operações neste navegador.\n\nOs dados de demonstração serão SOMADOS aos existentes (podem se misturar com dados reais). O ideal é usar só em ambiente vazio.\n\nContinuar mesmo assim?')) return;
            loadDemoData();
          }}>🧪 Carregar dados de demonstração</button>
        </>)}
      </div>

      <div className="sidebar-footer">
        <button className="btn-primary btn-sm" onClick={() => setModal({type:'create',entityType:'operation',initial:{}})}>+ Operação</button>
        <button className="btn-secondary btn-sm" onClick={handleBackup}>⬇</button>
        <button className="btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()}>⬆</button>
        <input ref={fileInputRef} type="file" accept=".json" style={{display:'none'}} onChange={handleRestore} />
      </div>
    </div>

    <div className="main-content">
      {/* Top Navigation */}
      <div className="top-nav">
        <button className={`top-nav-btn ${viewMode==='painel'?'active':''}`} onClick={() => setViewMode('painel')}>Painel</button>
        <button className={`top-nav-btn ${viewMode==='operacoes'?'active':''}`} onClick={() => setViewMode('operacoes')}>Operações</button>
        <button className={`top-nav-btn ${viewMode==='intimacoes'?'active':''}`} onClick={() => setViewMode('intimacoes')}>
          Intimações
          {(() => { const open = (data.intimations||[]).filter(x=>(x.status==='pendente_analise'||x.status==='aguardando_subsidios'||x.status==='peca_edicao') && !x.responseAction).length; return open > 0 ? <span style={{marginLeft:4,fontSize:10,color:'var(--text-muted)'}}>({open})</span> : null; })()}
        </button>
        <button className={`top-nav-btn ${viewMode==='mesa'?'active':''}`} onClick={() => setViewMode('mesa')}>
          🗂 Mesa
          {(() => { const n = (data.desk||[]).length; return n > 0 ? <span style={{marginLeft:4,fontSize:10,color:'var(--text-muted)'}}>({n})</span> : null; })()}
        </button>
        <button className={`top-nav-btn ${viewMode==='tarefas_global'?'active':''}`} onClick={() => setViewMode('tarefas_global')}>
          Tarefas
          {(() => { const open = (data.tasks||[]).filter(t=>t.status!=='concluida'&&t.status!=='cancelada').length; return open > 0 ? <span style={{marginLeft:4,fontSize:10,color:'var(--text-muted)'}}>({open})</span> : null; })()}
        </button>
        <button className={`top-nav-btn ${viewMode==='acompanhar'?'active':''}`} onClick={() => setViewMode('acompanhar')}>
          Acompanhar
          {(() => { const open = (data.watchlist||[]).filter(w=>w.status!=='encerrado').length; return open > 0 ? <span style={{marginLeft:4,fontSize:10,color:'var(--text-muted)'}}>({open})</span> : null; })()}
        </button>
        <button className={`top-nav-btn ${viewMode==='audiencias'?'active':''}`} onClick={() => setViewMode('audiencias')}>Audiências{(() => { const t=new Date(); t.setHours(0,0,0,0); const n=(data.hearings||[]).filter(h=>(h.status==='agendada'||h.status==='redesignada')&&h.date&&new Date(h.date+'T00:00:00')>=t).length; return n>0 ? <span style={{marginLeft:4,fontSize:10,color:'var(--text-muted)'}}>({n})</span> : null; })()}</button>
        <button className={`top-nav-btn ${viewMode==='modelos'?'active':''}`} onClick={() => setViewMode('modelos')}>
          📄 Modelos
          {(() => { const n = (data.models||[]).length; return n > 0 ? <span style={{marginLeft:4,fontSize:10,color:'var(--text-muted)'}}>({n})</span> : null; })()}
        </button>
        {activeOp && <><div className="top-nav-sep"></div>
          <button className={`top-nav-btn ${viewMode==='operation'?'active':''}`} onClick={() => setViewMode('operation')}>
            {truncate(activeOp.name, 28)}
          </button>
        </>}
        <div style={{marginLeft:'auto',position:'relative'}}>
          <button className="settings-btn" onClick={() => setShowSettings(!showSettings)} title="Configurações">⚙</button>
          {renderSettingsPanel()}
        </div>
      </div>

      {/* Demo topbar */}
      {isDemo && <div className="demo-topbar">
        <div>
          <div className="demo-topbar-title">
            {viewMode === 'hoje' ? 'Hoje' :
             viewMode === 'intimacoes' || viewMode === 'tarefas_global' ? 'Intimações e Tarefas' :
             viewMode === 'operacoes' ? 'Carteira' :
             viewMode === 'painel' ? 'Painel' :
             viewMode === 'audiencias' ? 'Agenda' :
             viewMode === 'modelos' ? 'Biblioteca' :
             viewMode === 'mesa' ? 'Trabalho · Mesa' :
             viewMode === 'acompanhar' ? 'Acompanhar' :
             viewMode === 'operation' && activeOp ? truncate(activeOp.name, 40) : 'NEXUS'}
          </div>
          <div className="demo-topbar-sub">
            {viewMode === 'hoje' ? 'Fila do dia · intimações, tarefas, audiências e riscos' :
             viewMode === 'intimacoes' || viewMode === 'tarefas_global' ? 'Uma aba · alterne entre Intimações e Tarefas' :
             viewMode === 'operacoes' ? 'Página inicial · cards por classificação e ranking' :
             viewMode === 'painel' ? 'KPIs · quadro semanal de prazos, audiências e prescrição' :
             viewMode === 'audiencias' ? 'Grade semanal e lista de audiências' :
             viewMode === 'mesa' ? 'Mesa de trabalho · pin de intimações, tarefas e audiências' :
             viewMode === 'operation' ? 'Workspace da operação · briefing, acervo, risco e ferramentas' :
             'NEXUS Demo Experimental'}
          </div>
        </div>
        <div className="demo-topbar-actions">
          <span className="demo-pill">Demo</span>
          {isGAS && <span className={`cloud-dot ${cloudStatus}`} title={cloudMsg || 'Sync'} style={{margin:0}}></span>}
          {viewMode === 'operation' && (
            <button className="btn-secondary btn-sm" onClick={openCarteiraHome}>← Carteira</button>
          )}
          {isGAS && <button className="btn-secondary btn-sm" onClick={cloudPush} title="Salvar na Planilha">⬆ Sync</button>}
          <button className="btn-secondary btn-sm" onClick={() => {setGlobalSearch(true);setGsQuery('');}}>Busca ⌘K</button>
          <button className="btn-primary btn-sm" onClick={() => setModal({type:'create',entityType:'operation',initial:{}})}>+ Operação</button>
        </div>
      </div>}

      {(() => {
        const today = new Date(); today.setHours(0,0,0,0);
        const imm = (data.hearings||[]).filter(h => h.status !== 'realizada' && h.status !== 'cancelada' && h.date).map(h => ({ h, dd: Math.round((new Date(h.date+'T00:00:00') - today)/86400000) })).filter(x => x.dd >= 0 && x.dd <= 2).sort((a,b) => a.dd - b.dd);
        if (imm.length === 0) return null;
        const f = imm[0];
        return (<div onClick={() => { setViewMode('audiencias'); setTimeout(() => setModal({type:'edit',entityType:'hearing',initial:f.h}), 100); }} style={{margin:'8px 16px 0',padding:'8px 14px',background:'rgba(244,63,94,0.12)',border:'1px solid var(--red)',borderRadius:6,cursor:'pointer',display:'flex',alignItems:'center',gap:10,fontSize:12}}>
          <span style={{fontSize:15}}>⚖️</span>
          <span style={{color:'var(--red)',fontWeight:700}}>{f.dd === 0 ? 'Audiência HOJE' : f.dd === 1 ? 'Audiência AMANHÃ' : `Audiência em ${f.dd} dias`}</span>
          <span style={{color:'var(--text-secondary)'}}>{f.h.time ? f.h.time+' · ' : ''}{truncate(f.h.parties || f.h.processNumber || '', 50)}</span>
          {imm.length > 1 && <span style={{color:'var(--text-muted)',marginLeft:'auto'}}>+{imm.length-1} em ≤48h</span>}
        </div>);
      })()}

      {/* Demo: Intimações e Tarefas fundidas — transição interna na mesma aba */}
      {isDemo && (viewMode === 'intimacoes' || viewMode === 'tarefas_global') && (
        <div className="demo-inbox-switch" role="tablist" aria-label="Intimações e Tarefas">
          <button type="button" role="tab" aria-selected={viewMode==='intimacoes'}
            className={`demo-inbox-tab ${viewMode==='intimacoes'?'active':''}`}
            onClick={() => setViewMode('intimacoes')}>
            Intimações{openIntimsCount > 0 ? ` · ${openIntimsCount}` : ''}
          </button>
          <button type="button" role="tab" aria-selected={viewMode==='tarefas_global'}
            className={`demo-inbox-tab ${viewMode==='tarefas_global'?'active':''}`}
            onClick={() => setViewMode('tarefas_global')}>
            Tarefas{openTasksCount > 0 ? ` · ${openTasksCount}` : ''}
          </button>
        </div>
      )}

      {/* ═══ HOJE (Demo Command Center) ═══ */}
      {viewMode === 'hoje' && renderHojeView()}

      {/* ═══ PAINEL GERAL ═══ */}
      {viewMode === 'painel' && (
        <div className="painel-container">
          {data.operations.length === 0 ? (
            <div className="welcome-screen" style={{height:'auto',padding:'60px 20px'}}>
              <h2>NEXUS</h2><p>Crie sua primeira operação para começar.</p>
              <button className="btn-primary" onClick={() => setModal({type:'create',entityType:'operation',initial:{}})}>Criar Operação</button>
            </div>
          ) : (<>
            {/* Dashboard KPIs */}
            {(() => {
              const allDebts = data.debts || [];
              const allExecs = data.executions || [];
              const allIntims = data.intimations || [];
              const allTasks = data.tasks || [];
              const activeDebts = allDebts.filter(d => d.status !== 'extinta');
              const totalValue = activeDebts.reduce((s,d) => s+(d.value||0), 0);
              const openIntims = allIntims.filter(x => (x.status==='pendente_analise'||x.status==='aguardando_subsidios'||x.status==='peca_edicao') && !x.responseAction).length;
              const overdueIntims = allIntims.filter(x => x.dateDeadline && new Date(x.dateDeadline+'T00:00:00') < new Date() && x.status !== 'analisado').length;
              const prescRisk = allDebts.filter(d => { const pd = d.prescriptionDate || calcAutoPresc(d, allExecs, data.prescriptionEvents || []); const dd = daysUntil(pd); return dd !== null && dd <= 180 && !d.prescriptionHandled; });
              const prescRiskVal = prescRisk.reduce((s,d) => s+(d.value||0), 0);
              return (<>
                <div className="dashboard-kpis">
                  <div className="kpi-widget kpi-pgfn">
                    <div className="kpi-label has-tip">Operações ativas<span className="tip-content">Total de operações com status "ativa". Não inclui operações encerradas.</span></div>
                    <div className="kpi-value">{data.operations.filter(o=>o.status!=='encerrada').length}</div>
                    <div className="kpi-sub">{data.operations.length} total · {allExecs.length} processos</div>
                  </div>
                  <div className="kpi-widget kpi-gold">
                    <div className="kpi-label has-tip">Crédito sob gestão<span className="tip-content">Soma do valor de todas as CDAs ativas em todas as operações.</span></div>
                    <div className="kpi-value">{fmtCur(totalValue)}</div>
                    <div className="kpi-sub">{activeDebts.length} CDAs ativas</div>
                  </div>
                  <div className="kpi-widget kpi-red">
                    <div className="kpi-label has-tip">Intimações abertas<span className="tip-content">Intimações que ainda exigem atuação.</span></div>
                    <div className="kpi-value" style={{color: overdueIntims > 0 ? 'var(--red)' : 'inherit'}}>{openIntims}</div>
                    <div className="kpi-sub">{overdueIntims > 0 ? `${overdueIntims} vencida(s)` : 'Nenhuma vencida'}</div>
                  </div>
                  <div className="kpi-widget kpi-green">
                    <div className="kpi-label has-tip">Risco prescricional<span className="tip-content">CDAs com previsão de prescrição em até 6 meses, sem tratamento.</span></div>
                    <div className="kpi-value" style={{color: prescRisk.length > 0 ? 'var(--red)' : 'inherit'}}>{prescRisk.length}</div>
                    <div className="kpi-sub">{prescRisk.length > 0 ? fmtCur(prescRiskVal)+' em risco' : 'Situação controlada'}</div>
                  </div>
                </div>

              </>);
            })()}

            {/* ═══ PRESCRIÇÃO IMINENTE — CDAs em risco ═══ */}
            {(() => {
              const allDebts = data.debts || [];
              const allExecs = data.executions || [];
              const allPrescEvts = data.prescriptionEvents || [];
              const prescRisk = [];
              data.operations.filter(o => o.status !== 'encerrada').forEach(op => {
                const opExecs = allExecs.filter(e => e.operationId === op.id);
                const idpjIds = new Set();
                opExecs.filter(e => e.processTag === 'idpj' || e.processTag === 'cautelar_fiscal').forEach(e => {
                  if (e.linkedExecutionIds) e.linkedExecutionIds.forEach(id => idpjIds.add(id));
                });
                allDebts.filter(d => d.operationId === op.id && d.status !== 'extinta' && !d.prescriptionHandled).forEach(d => {
                  const pd = d.prescriptionDate || calcAutoPresc(d, opExecs, allPrescEvts);
                  const dd = daysUntil(pd);
                  if (dd !== null && dd > 0 && dd <= 180) {
                    const linkedExec = d.processNumber ? opExecs.find(e => sameProc(e.processNumber, d.processNumber)) : null;
                    const hasIDPJ = linkedExec ? idpjIds.has(linkedExec.id) : false;
                    prescRisk.push({ ...d, prescDate: pd, prescDays: dd, opName: op.name, opId: op.id, linkedExec, hasIDPJ });
                  }
                });
              });
              if (prescRisk.length === 0) return null;
              prescRisk.sort((a, b) => a.prescDays - b.prescDays);
              const totalRisk = prescRisk.reduce((s,d) => s + (d.value||0), 0);
              const prescOpen = !painelCollapsed.has('presc');
              return (<div style={{marginBottom:20,background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',overflow:'hidden'}}>
                <div style={{padding:'12px 16px',borderBottom:prescOpen?'1px solid var(--border)':'none',display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer'}} onClick={() => togglePainel('presc')} title={prescOpen?'Recolher':'Expandir'}>
                  <div style={{fontSize:12,fontWeight:700,color:'var(--text-primary)',display:'flex',alignItems:'center',gap:7}}>
                    <span style={{fontSize:9,color:'var(--text-muted)',display:'inline-block',transform:prescOpen?'rotate(90deg)':'none',transition:'transform 0.15s'}}>▶</span>
                    Prescrição iminente — {prescRisk.length} CDA(s)
                  </div>
                  <div style={{fontSize:11,color:'var(--text-muted)'}}>Total exposto: <strong style={{color:prescRisk.length > 0 ? 'var(--red)' : 'var(--text-muted)'}}>{fmtCur(totalRisk)}</strong></div>
                </div>
                {prescOpen && <>
                {/* Header */}
                <div style={{display:'grid',gridTemplateColumns:'45px 1fr 1fr 90px 70px 50px 130px',gap:8,padding:'8px 16px',borderBottom:'1px solid var(--border)',fontSize:9,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:0.3,fontWeight:600}}>
                  <span>Prazo</span><span>CDA</span><span>Processo</span><span>Status</span><span>Valor</span><span>IDPJ</span><span>Operação</span>
                </div>
                <div style={{maxHeight:350,overflowY:'auto'}}>
                  {prescRisk.slice(0, 20).map(d => {
                    const st = DEBT_STATUSES[d.status] || {};
                    return (<div key={d.id} style={{display:'grid',gridTemplateColumns:'45px 1fr 1fr 90px 70px 50px 130px',gap:8,padding:'6px 16px',borderBottom:'1px solid rgba(255,255,255,0.03)',fontSize:10,cursor:'pointer',alignItems:'center'}} onClick={() => { setActiveOpId(d.opId); setViewMode('operation'); setActiveTab('prescricao_v2'); }}>
                      <span style={{fontWeight:700,fontFamily:'var(--font-mono)',color:d.prescDays <= 30 ? 'var(--red)' : d.prescDays <= 90 ? 'var(--yellow)' : 'var(--text-secondary)'}}>{d.prescDays}d</span>
                      <span style={{fontFamily:'var(--font-mono)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.cdaNumber || 'S/N'}</span>
                      <span style={{fontFamily:'var(--font-mono)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'var(--text-muted)'}}>{d.processNumber || '—'}</span>
                      <span className={`badge ${st.badge||''}`} style={{fontSize:8,justifySelf:'start'}}>{st.label||d.status}</span>
                      <span style={{color:'var(--text-muted)',fontFamily:'var(--font-mono)'}}>{fmtCur(d.value)}</span>
                      <span style={{fontSize:9,color:d.hasIDPJ ? 'var(--text-secondary)' : 'var(--text-muted)'}}>{d.hasIDPJ ? '✓' : '—'}</span>
                      <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'var(--text-muted)'}}>◎ {d.opName}</span>
                    </div>);
                  })}
                  {prescRisk.length > 20 && <div style={{fontSize:10,color:'var(--text-muted)',textAlign:'center',padding:8}}>+{prescRisk.length - 20} CDA(s)</div>}
                </div>
                </>}
              </div>);
            })()}

            {/* ═══ AGENDA — Demo: quadro semanal · Clássico: lista 30 dias ═══ */}
            {isDemo ? (
              <div style={{marginBottom:20,background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',overflow:'hidden'}}>
                <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div style={{fontSize:12,fontWeight:700,color:'var(--text-primary)'}}>
                    Agenda da semana
                    <span style={{fontWeight:400,color:'var(--text-muted)',fontSize:10,marginLeft:8}}>
                      Fim de prazos · audiências · termo final de prescrição
                    </span>
                  </div>
                </div>
                {renderAgendaWeek({ embedded: true })}
              </div>
            ) : (() => {
              const HORIZON = 30;
              const items = [];
              const opName = (id) => data.operations.find(o => o.id === id)?.name || '';
              // Intimações com prazo, não respondidas
              (data.intimations || []).forEach(x => {
                if (!x.dateDeadline || x.responseAction || x.status === 'analisado') return;
                const dd = daysUntil(x.dateDeadline);
                if (dd === null || dd > HORIZON) return;
                items.push({ kind: 'intim', icon: '📬', date: x.dateDeadline, days: dd, label: `Intimação — ${x.processNumber || 'S/N'}`, sub: truncate(x.partyName || x.eventDescription || '', 60), opId: x.operationId, opName: opName(x.operationId), go: () => { setViewMode('intimacoes'); } });
              });
              // Tarefas abertas com vencimento
              (data.tasks || []).forEach(t => {
                if (!t.dueDate || t.status === 'concluida' || t.status === 'cancelada') return;
                const dd = daysUntil(t.dueDate);
                if (dd === null || dd > HORIZON) return;
                items.push({ kind: 'task', icon: '✓', date: t.dueDate, days: dd, label: t.title || 'Tarefa', sub: '', opId: t.operationId, opName: opName(t.operationId), go: () => { if (t.operationId) { setActiveOpId(t.operationId); setViewMode('operation'); setActiveTab('tarefas'); } else { setViewMode('tarefas_global'); } } });
              });
              // Audiências dentro do horizonte
              (data.hearings || []).forEach(h => {
                if (!h.date || h.status === 'realizada' || h.status === 'cancelada') return;
                const dd = daysUntil(h.date);
                if (dd === null || dd > HORIZON) return;
                items.push({ kind: 'hearing', icon: '⚖️', date: h.date, days: dd, label: `Audiência — ${h.parties || h.processNumber || 'S/N'}`, sub: `${h.time||''}${h.location?' · '+truncate(h.location,30):''}`, opId: h.operationId, opName: opName(h.operationId), go: () => { setViewMode('audiencias'); setTimeout(() => setModal({type:'edit',entityType:'hearing',initial:h}), 100); } });
              });
              // Revisões de operação vencendo
              data.operations.filter(o => o.status !== 'encerrada').forEach(o => {
                const rs = reviewStatus(o);
                if (rs.daysLeft === null || rs.daysLeft > HORIZON || rs.overdue) return; // vencidas já têm seção própria
                const dt = new Date(); dt.setDate(dt.getDate() + rs.daysLeft);
                items.push({ kind: 'review', icon: '🔄', date: dt.toISOString().slice(0,10), days: rs.daysLeft, label: `Revisão — ${o.name}`, sub: REVIEW_INTERVALS[o.reviewInterval || 'mensal'].label, opId: o.id, opName: '', go: () => { setActiveOpId(o.id); setViewMode('operation'); setActiveTab('notas'); } });
              });
              if (items.length === 0) return null;
              items.sort((a, b) => a.days - b.days);
              const kindColor = { intim: 'var(--blue)', task: 'var(--yellow)', hearing: 'var(--yellow)', review: 'var(--text-muted)' };
              // Agrupar por bucket temporal
              const buckets = [
                { label: '⚠ VENCIDOS', test: (d) => d < 0 },
                { label: 'Hoje', test: (d) => d === 0 },
                { label: 'Esta semana', test: (d) => d >= 1 && d <= 7 },
                { label: 'Próximas 2 semanas', test: (d) => d >= 8 && d <= 14 },
                { label: 'Até 30 dias', test: (d) => d >= 15 && d <= HORIZON }
              ];
              const agendaOpen = !painelCollapsed.has('agenda');
              return (<div style={{marginBottom:20,background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',overflow:'hidden'}}>
                <div style={{padding:'12px 16px',borderBottom:agendaOpen?'1px solid var(--border)':'none',display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer'}} onClick={() => togglePainel('agenda')} title={agendaOpen?'Recolher':'Expandir'}>
                  <div style={{fontSize:12,fontWeight:700,color:'var(--text-primary)',display:'flex',alignItems:'center',gap:7}}>
                    <span style={{fontSize:9,color:'var(--text-muted)',display:'inline-block',transform:agendaOpen?'rotate(90deg)':'none',transition:'transform 0.15s'}}>▶</span>
                    📅 Agenda — próximos 30 dias <span style={{fontWeight:400,color:'var(--text-muted)',fontSize:10}}>({items.length} prazos: intimações, tarefas, audiências e revisões)</span>
                  </div>
                </div>
                {agendaOpen && <div style={{maxHeight:320,overflowY:'auto',padding:'4px 0'}}>
                  {buckets.map(bk => {
                    const bi = items.filter(it => bk.test(it.days));
                    if (bi.length === 0) return null;
                    return (<div key={bk.label}>
                      <div style={{fontSize:9,fontWeight:700,color:bk.label.startsWith('⚠')?'var(--red)':'var(--text-muted)',textTransform:'uppercase',letterSpacing:0.5,padding:'6px 16px 2px'}}>{bk.label} ({bi.length})</div>
                      {bi.map((it, i) => (
                        <div key={it.kind + i + it.date} onClick={it.go} className={it.kind === 'hearing' ? 'hover-bg agenda-hearing' : 'hover-bg'} style={{display:'flex',gap:10,alignItems:'center',padding:'5px 16px',fontSize:11,cursor:'pointer',borderLeft:`${it.kind === 'hearing' ? 3 : 2}px solid ${kindColor[it.kind]}`}}>
                          <span style={{fontFamily:'var(--font-mono)',fontWeight:700,width:38,flexShrink:0,color:it.days < 0 ? 'var(--red)' : it.days <= 5 ? 'var(--yellow)' : 'var(--text-secondary)'}}>{it.days < 0 ? `${it.days}d` : it.days === 0 ? 'HOJE' : `${it.days}d`}</span>
                          <span style={{flexShrink:0}}>{it.icon}</span>
                          {it.kind === 'hearing' && <span style={{flexShrink:0,fontSize:8,fontWeight:800,letterSpacing:0.4,color:'var(--yellow)',background:'rgba(212,168,56,0.18)',border:'1px solid rgba(212,168,56,0.4)',borderRadius:3,padding:'1px 5px',textTransform:'uppercase'}}>Audiência</span>}
                          <span style={{fontWeight:600,color:it.kind === 'hearing' ? 'var(--yellow)' : undefined,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{it.label}</span>
                          <span style={{color:'var(--text-muted)',fontSize:10,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{it.sub}</span>
                          <span style={{color:'var(--text-muted)',fontSize:9,flexShrink:0}}>{it.opName && `◎ ${truncate(it.opName, 24)}`}</span>
                          <span style={{color:'var(--text-muted)',fontSize:9,fontFamily:'var(--font-mono)',flexShrink:0}}>{fmtDate(it.date)}</span>
                        </div>
                      ))}
                    </div>);
                  })}
                </div>}
              </div>);
            })()}

            {/* ═══ REVISÕES DEVIDAS ═══ */}
            {(() => {
              const ops = data.operations.filter(o => o.status !== 'encerrada');
              const due = ops.map(o => ({ op: o, rs: reviewStatus(o) })).filter(o => o.rs.overdue);
              if (due.length === 0) return null;
              due.sort((a, b) => a.rs.daysLeft - b.rs.daysLeft);
              return (<div style={{marginBottom:20,padding:'10px 14px',background:'rgba(244,63,94,0.04)',border:'1px solid rgba(244,63,94,0.15)',borderRadius:'var(--radius-lg)'}}>
                <div style={{fontSize:10,fontWeight:700,color:'var(--red)',marginBottom:6}}>📅 Revisões devidas ({due.length})</div>
                <div style={{fontSize:10,color:'var(--text-secondary)',lineHeight:1.8}}>
                  {due.map(o => (
                    <span key={o.op.id} style={{cursor:'pointer',marginRight:12,display:'inline-flex',alignItems:'center',gap:4}} onClick={() => { setActiveOpId(o.op.id); setViewMode('operation'); }}>
                      <span style={{textDecoration:'underline',textDecorationColor:'rgba(244,63,94,0.3)'}}>{o.op.name}</span>
                      <span style={{fontSize:9,color:'var(--red)',fontWeight:600}}>({o.rs.label})</span>
                    </span>
                  ))}
                </div>
              </div>);
            })()}

            {/* ═══ PAINEL DA CARTEIRA — Análise comparativa entre operações ═══ */}
            {(() => {
              const ops = data.operations.filter(o => o.status !== 'encerrada');
              if (ops.length === 0) return null;
              const allDebts = data.debts || [];
              const allExecs = data.executions || [];
              const allAssets = data.assets || [];
              const allIntims = data.intimations || [];
              const allTasks = data.tasks || [];
              const allPrescEvts = data.prescriptionEvents || [];

              // ─── Stats por operação ───
              const opAnalytics = ops.map(op => {
                const debts = allDebts.filter(d => d.operationId === op.id && d.status !== 'extinta');
                const execs = allExecs.filter(e => e.operationId === op.id);
                const assets = allAssets.filter(a => a.operationId === op.id);
                const intims = allIntims.filter(x => x.operationId === op.id);
                const tasks = allTasks.filter(t => t.operationId === op.id);
                const totalValue = debts.reduce((s,d) => s + (d.value||0), 0);
                const guaranteedValue = debts.filter(d => d.status === 'garantida').reduce((s,d) => s + (d.value||0), 0);
                const prescRisk = debts.filter(d => {
                  const pd = d.prescriptionDate || calcAutoPresc(d, execs, allPrescEvts);
                  const dd = daysUntil(pd);
                  return dd !== null && dd <= 180 && !d.prescriptionHandled;
                }).length;
                const openIntims = intims.filter(x => (x.status==='pendente_analise'||x.status==='aguardando_subsidios'||x.status==='peca_edicao') && !x.responseAction).length;
                const openTasks = tasks.filter(t => t.status !== 'concluida' && t.status !== 'cancelada').length;
                const idpjCount = execs.filter(e => e.processTag === 'idpj').length;
                const cautelarCount = execs.filter(e => e.processTag === 'cautelar_fiscal').length;
                const lastAccess = op.lastAccessed ? new Date(op.lastAccessed) : null;
                const daysSinceAccess = lastAccess ? Math.floor((Date.now() - lastAccess.getTime()) / 86400000) : null;
                return { op, totalValue, guaranteedValue, prescRisk, openIntims, openTasks, debtsCount: debts.length, execsCount: execs.length, assetsCount: assets.length, idpjCount, cautelarCount, daysSinceAccess };
              });

              // ─── Ordenação dinâmica ───
              const carteiraSortFns = {
                valor_desc: (a, b) => b.totalValue - a.totalValue,
                valor_asc: (a, b) => a.totalValue - b.totalValue,
                presc: (a, b) => b.prescRisk - a.prescRisk || b.totalValue - a.totalValue,
                intims: (a, b) => b.openIntims - a.openIntims || b.totalValue - a.totalValue,
                tasks: (a, b) => b.openTasks - a.openTasks || b.totalValue - a.totalValue,
                cobertura_asc: (a, b) => {
                  const ca = a.totalValue > 0 ? a.guaranteedValue / a.totalValue : 1;
                  const cb = b.totalValue > 0 ? b.guaranteedValue / b.totalValue : 1;
                  return ca - cb;
                },
                acesso_recente: (a, b) => {
                  const da = a.daysSinceAccess === null ? 99999 : a.daysSinceAccess;
                  const db = b.daysSinceAccess === null ? 99999 : b.daysSinceAccess;
                  return da - db;
                },
                revisao_atrasada: (a, b) => {
                  const ra = reviewStatus(a.op);
                  const rb = reviewStatus(b.op);
                  return (ra.daysLeft ?? 99999) - (rb.daysLeft ?? 99999);
                },
                nome: (a, b) => (a.op.name || '').localeCompare(b.op.name || '', 'pt-BR'),
                idpj: (a, b) => (b.idpjCount + b.cautelarCount) - (a.idpjCount + a.cautelarCount) || b.totalValue - a.totalValue,
              };
              const sortFn = carteiraSortFns[carteiraSort] || carteiraSortFns.valor_desc;
              opAnalytics.sort(sortFn);

              const sortLabels = {
                valor_desc: 'Maior valor de crédito',
                valor_asc: 'Menor valor de crédito',
                presc: 'Maior risco de prescrição',
                intims: 'Mais intimações abertas',
                tasks: 'Mais tarefas pendentes',
                cobertura_asc: 'Menor cobertura de garantia',
                acesso_recente: 'Acessadas recentemente',
                revisao_atrasada: 'Revisão mais atrasada primeiro',
                nome: 'Nome (A→Z)',
                idpj: 'Mais IDPJs/Cautelares',
              };

              // ─── Agregados globais ───
              const totalCredito = opAnalytics.reduce((s, o) => s + o.totalValue, 0);
              const totalGarantido = opAnalytics.reduce((s, o) => s + o.guaranteedValue, 0);
              const totalPresc = opAnalytics.reduce((s, o) => s + o.prescRisk, 0);
              const totalIntims = opAnalytics.reduce((s, o) => s + o.openIntims, 0);
              const totalTasks = opAnalytics.reduce((s, o) => s + o.openTasks, 0);
              const totalIDPJs = opAnalytics.reduce((s, o) => s + o.idpjCount, 0);
              const totalCautelares = opAnalytics.reduce((s, o) => s + o.cautelarCount, 0);
              const coveragePct = totalCredito > 0 ? ((totalGarantido / totalCredito) * 100).toFixed(1) : 0;

              return (<div style={{marginTop:12}}>
                <h4 style={{fontSize:13,fontWeight:700,color:'var(--text-secondary)',marginBottom:12,letterSpacing:0.3}}>📊 Painel da Carteira</h4>

                {/* Ranking de operações */}
                <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',overflow:'hidden'}}>
                  <div style={{padding:'10px 14px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
                    <span style={{fontSize:11,fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:0.5}}>Operações · {sortLabels[carteiraSort]}</span>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <label style={{fontSize:10,color:'var(--text-muted)'}}>Ordenar:</label>
                      <select value={carteiraSort} onChange={e => setCarteiraSort(e.target.value)} style={{fontSize:11,padding:'3px 6px',background:'var(--bg-deep)',color:'var(--text-primary)',border:'1px solid var(--border)',borderRadius:4,cursor:'pointer'}}>
                        <optgroup label="Financeiro">
                          <option value="valor_desc">💰 Maior valor de crédito</option>
                          <option value="valor_asc">💰 Menor valor de crédito</option>
                          <option value="cobertura_asc">⚠ Menor cobertura de garantia</option>
                        </optgroup>
                        <optgroup label="Risco / Urgência">
                          <option value="presc">⏱ Maior risco de prescrição</option>
                          <option value="intims">📬 Mais intimações abertas</option>
                          <option value="tasks">✓ Mais tarefas pendentes</option>
                        </optgroup>
                        <optgroup label="Atividade">
                          <option value="acesso_recente">🕒 Acessadas recentemente</option>
                          <option value="revisao_atrasada">📅 Revisão mais atrasada</option>
                        </optgroup>
                        <optgroup label="Estratégico">
                          <option value="idpj">🛡️ Mais IDPJs / Cautelares</option>
                          <option value="nome">🔤 Nome (A→Z)</option>
                        </optgroup>
                      </select>
                      <span style={{fontSize:10,color:'var(--text-muted)'}}>· {opAnalytics.length} ativa(s)</span>
                    </div>
                  </div>
                  <div style={{maxHeight:350,overflowY:'auto'}}>
                    {opAnalytics.map((oa, idx) => {
                      const barPct = totalCredito > 0 ? Math.max(2, (oa.totalValue / totalCredito) * 100) : 0;
                      const guarPct = oa.totalValue > 0 ? (oa.guaranteedValue / oa.totalValue) * 100 : 0;
                      return (<div key={oa.op.id} style={{padding:'10px 14px',borderBottom:'1px solid rgba(255,255,255,0.03)',cursor:'pointer',transition:'background 0.15s'}}
                        onClick={() => { setActiveOpId(oa.op.id); setViewMode('operation'); }}
                        onMouseOver={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                        onMouseOut={e => e.currentTarget.style.background='transparent'}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                          <div style={{display:'flex',alignItems:'center',gap:8,flex:1,minWidth:0}}>
                            <span style={{fontSize:10,color:'var(--text-muted)',fontWeight:700,width:18}}>{idx+1}.</span>
                            <span style={{fontSize:12,fontWeight:600,color:'var(--text-primary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{oa.op.name}</span>
                            {oa.prescRisk > 0 && <span style={{fontSize:9,padding:'1px 5px',borderRadius:3,background:'rgba(244,63,94,0.15)',color:'var(--red)',fontWeight:700}}>⏱{oa.prescRisk}</span>}
                            {oa.openIntims > 0 && <span style={{fontSize:9,padding:'1px 5px',borderRadius:3,background:'rgba(59,130,246,0.15)',color:'var(--blue)',fontWeight:700}}>📬{oa.openIntims}</span>}
                            {oa.openTasks > 0 && <span style={{fontSize:9,padding:'1px 5px',borderRadius:3,background:'rgba(245,158,11,0.15)',color:'var(--yellow)',fontWeight:700}}>✓{oa.openTasks}</span>}
                            {(() => { const rs = reviewStatus(oa.op); return rs.overdue ? <span style={{fontSize:9,padding:'1px 5px',borderRadius:3,background:'rgba(244,63,94,0.15)',color:'var(--red)',fontWeight:700}}>📅 {rs.label}</span> : null; })()}
                          </div>
                          <div style={{textAlign:'right',flexShrink:0}}>
                            <div style={{fontSize:12,fontWeight:700,color:'var(--gold)',fontFamily:'var(--font-mono)'}}>{fmtCur(oa.totalValue)}</div>
                            <div style={{fontSize:9,color:'var(--text-muted)'}}>{oa.debtsCount} CDAs · {oa.execsCount} proc. · {oa.assetsCount} bens</div>
                          </div>
                        </div>
                        <div style={{height:4,background:'var(--bg-deep)',borderRadius:2,overflow:'hidden',position:'relative'}}>
                          <div style={{height:'100%',width:barPct+'%',background:'rgba(245,158,11,0.3)',borderRadius:2,position:'absolute'}}></div>
                          <div style={{height:'100%',width:(barPct * guarPct / 100)+'%',background:'var(--green)',borderRadius:2,position:'absolute'}}></div>
                        </div>
                      </div>);
                    })}
                  </div>
                </div>

              </div>);
            })()}
          </>)}
        </div>
      )}

      {/* ═══ OPERAÇÕES (visão geral agrupada) ═══ */}
      {viewMode === 'operacoes' && (
        <div className="painel-container">
          {data.operations.length === 0 ? (
            <div className="welcome-screen" style={{height:'auto',padding:'60px 20px'}}>
              <h2>NEXUS</h2><p>Crie sua primeira operação para começar.</p>
              <button className="btn-primary" onClick={() => setModal({type:'create',entityType:'operation',initial:{}})}>Criar Operação</button>
            </div>
          ) : (
            <div className="painel-section">
              <h3>Operações <span className="count">({data.operations.length})</span></h3>
              {(() => {
                const classOrder = [...Object.keys(OP_CLASSIFICATIONS), ''];
                const groups = {};
                // Uma operação pode ter múltiplas classificações: aparece em cada grupo correspondente.
                // Operações sem classificação caem no grupo '' (Sem classificação).
                [...data.operations].forEach(op => {
                  const cls = getOpClassifications(op);
                  if (cls.length === 0) { if (!groups['']) groups[''] = []; groups[''].push(op); }
                  else cls.forEach(k => { if (!groups[k]) groups[k] = []; groups[k].push(op); });
                });
                const orderedKeys = classOrder.filter(k => groups[k]?.length > 0);

                return orderedKeys.map(clsKey => {
                  const cls = OP_CLASSIFICATIONS[clsKey] || { label: 'Sem classificação', color: 'var(--text-muted)', border: 'var(--border)' };
                  const opsInGroup = groups[clsKey];
                  const isCollapsed3 = collapsedGroups.has('painel-'+clsKey);
                  const groupTotal = opsInGroup.reduce((s,op) => s + data.debts.filter(d=>d.operationId===op.id&&d.status!=='extinta').reduce((ss,d)=>ss+(d.value||0),0), 0);

                  return (<div key={clsKey} style={{marginBottom:12}}>
                    <div className="group-header" onClick={() => toggleGroup('painel-'+clsKey)} style={{borderLeft:`3px solid ${cls.border}`}}>
                      <span className={`gh-toggle ${isCollapsed3?'':'open'}`}>▶</span>
                      <span className="gh-label" style={{color:cls.color}}>{cls.label}</span>
                      <span className="gh-count">({opsInGroup.length})</span>
                      <span className="gh-total">{fmtCur(groupTotal)}</span>
                    </div>
                    {!isCollapsed3 && <div className="ops-priority-grid" style={{marginTop:8}}>
                      {opsInGroup.map(op => {
                        const debts = data.debts.filter(d=>d.operationId===op.id);
                        const total = debts.filter(d=>d.status!=='extinta').reduce((s,d)=>s+(d.value||0),0);
                        const people = data.people.filter(p=>p.operationId===op.id).length;
                        const opExecs = data.executions.filter(e=>e.operationId===op.id);
                        const execs = opExecs.length;
                        const opIntims = (data.intimations||[]).filter(x=>x.operationId===op.id && (x.status==='pendente_analise'||x.status==='aguardando_subsidios'||x.status==='peca_edicao') && !x.responseAction);
                        const opTasks = (data.tasks||[]).filter(t=>t.operationId===op.id && t.status!=='concluida' && t.status!=='cancelada');
                        const prescAlerts = debts.filter(d => { const pd = d.prescriptionDate || calcAutoPresc(d, opExecs, data.prescriptionEvents || []); const dd = daysUntil(pd); return dd !== null && dd <= 180 && !d.prescriptionHandled; }).length;
                        const notes = op.notesList || (op.notes ? [op.notes] : []);
                        return (<div key={op.id} className="ops-priority-card" style={{borderLeftColor: cls.border}}
                          onClick={() => { if (isDemo) openCarteiraOp(op); else { startTabSwitch(() => { setActiveOpId(op.id); setViewMode('operation'); }); setTimeout(() => upsert('operations', {...op, lastAccessed: new Date().toISOString()}), 800); } }}>
                          <div className="opc-header">
                            <div className="opc-name">{op.name}</div>
                            <span className={`badge ${op.status==='ativa'?'badge-muted':'badge-muted-strong'}`}>{op.status||'ativa'}</span>
                          </div>
                          {(() => { const oc = getOpClassifications(op); return oc.length > 1 ? (
                            <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:4}}>
                              {oc.map(ck => { const cc = OP_CLASSIFICATIONS[ck]; return (
                                <span key={ck} style={{fontSize:9,fontWeight:600,padding:'1px 6px',borderRadius:3,color:cc.color,border:`1px solid ${cc.border}`,letterSpacing:0.2}}>{cc.label}</span>
                              ); })}
                            </div>
                          ) : null; })()}
                          <div className="opc-stats">
                            <span>{people} pessoas</span><span>{debts.length} CDAs</span><span>{execs} EFs</span>
                            <span style={{fontWeight:600}}>{fmtCur(total)}</span>
                          </div>
                          {notes.length > 0 && <div className="intim-center-text-wrap" style={{marginTop:4}}>
                            <div style={{fontSize:10,color:'var(--text-muted)',display:'-webkit-box',WebkitLineClamp:1,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{notes[0]}{notes.length>1?` (+${notes.length-1})`:''}</div>
                            {notes.join(' ').length > 30 && <div className="intim-tooltip">{notes.map((n,i)=><div key={i} style={{marginBottom:4}}>• {n}</div>)}</div>}
                          </div>}
                          <div className="opc-alerts">
                            {opIntims.length > 0 && <span className="badge badge-yellow has-tip">📬 {opIntims.length}<span className="tip-content">Intimações abertas (Prazo Fechado, Pendente de Análise ou Peça em Edição). Clique na operação para tratar.</span></span>}
                            {opTasks.length > 0 && <span className="badge badge-blue has-tip">✓ {opTasks.length}<span className="tip-content">Tarefas pendentes ou em andamento vinculadas a esta operação.</span></span>}
                            {prescAlerts > 0 && <span className="badge badge-red has-tip">⏱ {prescAlerts}<span className="tip-content">CDAs com risco de prescrição em até 6 meses, ainda sem tratamento. Acesse a aba Prescrição para analisar.</span></span>}
                          </div>
                        </div>);
                      })}
                    </div>}
                  </div>);
                });
              })()}
              {isDemo && renderCarteiraRankingPanel()}
            </div>
          )}
        </div>
      )}

      {/* ═══ INTIMAÇÕES GLOBAIS ═══ */}
      {viewMode === 'intimacoes' && (() => {
        const allIntim = data.intimations || [];
        // Default: exclude responded ones (they're archived in Docs). Filter "resolvidas" shows only resolved.
        let filtered;
        if (intimFilter === 'all') filtered = allIntim.filter(x => !x.responseAction);
        else if (intimFilter === 'resolvidas') filtered = allIntim.filter(x => !!x.responseAction);
        else filtered = allIntim.filter(x => x.status === intimFilter && !x.responseAction);
        const today = new Date(); today.setHours(0,0,0,0);
        const byJuris = {};
        allIntim.filter(x => !x.responseAction).forEach(x => { const j = x.jurisdiction || '?'; if (!byJuris[j]) byJuris[j] = { total: 0, abertos: 0, fechados: 0 }; byJuris[j].total++; if (x.dateDeadline) byJuris[j].abertos++; else byJuris[j].fechados++; });
        const overdue = allIntim.filter(x => x.dateDeadline && new Date(x.dateDeadline+'T00:00:00') < today && x.status !== 'analisado' && !x.responseAction).length;
        const resolvidasCount = allIntim.filter(x => !!x.responseAction).length;

        return (<div key="demo-inbox-intimacoes" className={`entity-area ${isDemo ? 'demo-inbox-panel' : ''}`}>
          <div className="intim-summary">
            <div className="intim-summary-card has-tip"><div className="is-label">Total ativas</div><div className="is-value">{allIntim.filter(x => !x.responseAction).length}</div><span className="tip-content">Intimações que ainda requerem atuação.</span></div>
            <div className="intim-summary-card"><div className="is-label">Pendentes</div><div className="is-value" style={{color:'var(--yellow)'}}>{allIntim.filter(x=>x.status==='pendente_analise' && !x.responseAction).length}</div></div>
            <div className="intim-summary-card"><div className="is-label">Vencidas</div><div className="is-value" style={{color:'var(--red)'}}>{overdue}</div></div>
            {(() => { const nNew = allIntim.filter(x => x._importFlag === 'new').length; const nUpd = allIntim.filter(x => x._importFlag === 'updated').length; if (nNew + nUpd === 0) return null; return <div className="intim-summary-card"><div className="is-label">Último import</div><div className="is-value" style={{fontSize:11}}>{nNew > 0 && <span style={{color:'var(--green)'}}>{nNew} nova(s)</span>}{nNew > 0 && nUpd > 0 && ' · '}{nUpd > 0 && <span style={{color:'var(--blue)'}}>{nUpd} atualiz.</span>}</div></div>; })()}
            {Object.keys(byJuris).length > 0 && Object.entries(byJuris).sort((a,b) => (jurisRank(a[0]) - jurisRank(b[0])) || a[0].localeCompare(b[0])).map(([j,v]) => <div key={j} className="intim-state-card"><div className="isc-uf">{j}</div><div className="isc-stats"><div className="isc-stat"><div className="isc-num" style={{color:'var(--blue)'}}>{v.abertos}</div><div className="isc-lbl">abertos</div></div><div className="isc-stat"><div className="isc-num" style={{color:'var(--text-muted)'}}>{v.fechados}</div><div className="isc-lbl">fechados</div></div><div className="isc-stat"><div className="isc-num">{v.total}</div><div className="isc-lbl">total</div></div></div></div>)}
          </div>
          <div className="intim-filter-bar">
            <select value={intimFilter} onChange={e => setIntimFilter(e.target.value)}>
              <option value="all">Todas (ativas)</option>
              {Object.entries(INTIM_STATUSES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
              <option value="resolvidas">✓ Resolvidas ({resolvidasCount})</option>
            </select>
            <select value={intimSort} onChange={e => setIntimSort(e.target.value)} style={{minWidth:200}} title="Urgente primeiro; depois importância, complexidade e prazo">
              <option value="attention">Atenção: Urgente → Imp. → Complexidade → Prazo</option>
              <option value="importance">Importância</option>
              <option value="difficulty">Complexidade</option>
              <option value="deadline">Prazo final (mais próximo)</option>
              <option value="deadline_desc">Prazo final (mais distante)</option>
              <option value="days_left">Dias restantes (menor)</option>
              <option value="overdue_first">Vencidas primeiro</option>
              <option value="processo">Agrupar por Processo</option>
              <option value="jurisdiction">Agrupar por Estado</option>
              <option value="class">Agrupar por Classe</option>
              <option value="operation">Agrupar por Operação</option>
              <option value="action_date">Agrupar por Data de atuação</option>
              <option value="sent">Data de envio (recente)</option>
            </select>
            <button className="btn-secondary btn-sm" onClick={() => setModal({type:'create',entityType:'intimation',initial:{status:'pendente_analise',priority:'normal',difficulty:'media',urgent:false}})}>+ Intimação</button>
            <button className="btn-secondary btn-sm" onClick={() => eprocInputRef.current?.click()}>📬 Importar eproc</button>
            <input ref={eprocInputRef} type="file" accept=".xls,.xlsx" multiple style={{display:'none'}} onChange={handleEprocImport} />
            <div className="view-toggle" style={{marginLeft:'auto'}}>
              <button className={intimView==='list'?'active':''} onClick={()=>setIntimView('list')}>☰ Lista</button>
              <button className={intimView==='kanban'?'active':''} onClick={()=>setIntimView('kanban')}>▦ Kanban</button>
            </div>
          </div>
          {filtered.length === 0 ? <div className="empty-state"><div className="empty-icon">📬</div><p>Nenhuma intimação{intimFilter!=='all'?' neste filtro':''}.</p></div> :
          intimView === 'kanban' ? (() => {
            // Kanban view
            const statusCols = Object.entries(INTIM_STATUSES);
            const handleDrop = (intimId, newStatus) => {
              setData(prev => ({...prev, intimations: prev.intimations.map(x => x.id === intimId ? {...x, status: newStatus} : x)}));
            };
            const getPartyName = (intim) => {
              const name = intim.partyName || '';
              if (name && !name.toUpperCase().includes('FAZENDA') && !name.toUpperCase().includes('UNIÃO')) return name;
              const parts = (intim.parties||'').split(/\s+X\s+/i);
              for (const p of parts) { if (!p.toUpperCase().includes('FAZENDA') && !p.toUpperCase().includes('UNIÃO')) return truncate(p.replace(/^(Executado|Embargante|Autor|Réu|Requerido|Requerente|Exequente|Embargado|Impetrante)\s+/i,'').replace(/\(.*/, '').trim(), 30); }
              return '—';
            };
            return (<div className="kanban-board">
              {statusCols.map(([statusKey, statusDef]) => {
                const colItems = filtered.filter(x => x.status === statusKey).sort((a,b) => {
                  const aU = intimIsUrgent(a) ? 0 : 1, bU = intimIsUrgent(b) ? 0 : 1;
                  if (aU !== bU) return aU - bU;
                  const ia = intimImpOrder(a) - intimImpOrder(b); if (ia) return ia;
                  if (!a.dateDeadline) return 1; if (!b.dateDeadline) return -1;
                  return new Date(a.dateDeadline) - new Date(b.dateDeadline);
                });
                return (<div key={statusKey} className="kanban-col"
                  onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('dragover'); }}
                  onDragLeave={e => e.currentTarget.classList.remove('dragover')}
                  onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('dragover'); const id = e.dataTransfer.getData('text/plain'); if (id) handleDrop(id, statusKey); }}>
                  <div className="kanban-col-header" style={{borderBottom:`2px solid ${statusKey==='pendente_analise'?'var(--yellow)':statusKey==='analisado'?'var(--green)':'#4ade80'}`}}>
                    <span>{statusDef.label}</span>
                    <span className={`badge ${statusDef.badge}`}>{colItems.length}</span>
                  </div>
                  <div className="kanban-col-body">
                    {colItems.map(intim => {
                      const days = daysUntil(intim.dateDeadline);
                      const isOverdue = days !== null && days < 0;
                      return (<div key={intim.id} className={`kanban-card${intim.priority==='baixa'?' prio-baixa':''}`} draggable
                        onDragStart={e => e.dataTransfer.setData('text/plain', intim.id)}
                        onClick={() => setModal({type:'edit',entityType:'intimation',initial:intim})}>
                        <div className="kc-party">{getPartyName(intim)}</div>
                        <div className="kc-proc">{intim.processNumber}</div>
                        {intim.dateDeadline && <div className="kc-deadline" style={{color:isOverdue?'var(--red)':days<=5?'var(--yellow)':'var(--text-secondary)'}}>
                          {isOverdue ? `VENCIDA ${Math.abs(days)}d` : `${days}d — ${fmtDate(intim.dateDeadline)}`}
                        </div>}
                        {(intim.obs1 || intim.object) && <div className="kc-obs">{intim.object || intim.obs1}</div>}
                        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:4,fontSize:9}}>
                          {intimIsUrgent(intim) && <span style={{color:'var(--red)',fontWeight:700}}>URGENTE</span>}
                          <span style={{color:intimImpKey(intim)==='alta'?'var(--red)':'var(--text-secondary)'}}>{INTIM_PRIORITIES[intimImpKey(intim)].label}</span>
                          <span style={{color:intimDifKey(intim)==='alta'?'var(--orange)':'var(--text-muted)'}}>{INTIM_DIFFICULTY[intimDifKey(intim)].label}</span>
                        </div>
                      </div>);
                    })}
                  </div>
                </div>);
              })}
            </div>);
          })() :
          (() => {
            // Sort
            let sorted = [...filtered];
            const now = new Date(); now.setHours(0,0,0,0);
            const actionDateBucket = (intim) => {
              const at = intim.responseAction?.respondedAt;
              if (!at) return 'Sem data de atuação';
              const d = new Date(at); d.setHours(0,0,0,0);
              const today = new Date(); today.setHours(0,0,0,0);
              const startOfWeek = new Date(today); startOfWeek.setDate(startOfWeek.getDate() - 7);
              const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
              const startOfPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
              if (d.getTime() === today.getTime()) return 'Hoje';
              if (d >= startOfWeek && d < today) return 'Esta semana';
              if (d >= startOfMonth && d < startOfWeek) return 'Este mês';
              if (d >= startOfPrevMonth && d < startOfMonth) return 'Mês passado';
              return 'Anteriores';
            };
            const byDeadlineAsc = (a,b) => { if (!a.dateDeadline) return 1; if (!b.dateDeadline) return -1; return new Date(a.dateDeadline) - new Date(b.dateDeadline); };
            if (intimSort === 'attention') sorted.sort((a,b) => {
              const ua = intimIsUrgent(a) ? 0 : 1, ub = intimIsUrgent(b) ? 0 : 1; if (ua !== ub) return ua - ub;
              const ia = intimImpOrder(a), ib = intimImpOrder(b); if (ia !== ib) return ia - ib;
              const da = intimDifOrder(a), db = intimDifOrder(b); if (da !== db) return da - db;
              return byDeadlineAsc(a,b);
            });
            else if (intimSort === 'importance') sorted.sort((a,b) => {
              const ua = intimIsUrgent(a) ? 0 : 1, ub = intimIsUrgent(b) ? 0 : 1; if (ua !== ub) return ua - ub;
              const d = intimImpOrder(a) - intimImpOrder(b); return d !== 0 ? d : byDeadlineAsc(a,b);
            });
            else if (intimSort === 'difficulty') sorted.sort((a,b) => { const d = intimDifOrder(a) - intimDifOrder(b); return d !== 0 ? d : byDeadlineAsc(a,b); });
            else if (intimSort === 'deadline') sorted.sort(byDeadlineAsc);
            else if (intimSort === 'deadline_desc') sorted.sort((a,b) => { if (!a.dateDeadline) return 1; if (!b.dateDeadline) return -1; return new Date(b.dateDeadline) - new Date(a.dateDeadline); });
            else if (intimSort === 'days_left') sorted.sort((a,b) => { const da = daysUntil(a.dateDeadline), db = daysUntil(b.dateDeadline); if (da===null) return 1; if (db===null) return -1; return da - db; });
            else if (intimSort === 'overdue_first') sorted.sort((a,b) => { const aO = a.dateDeadline && new Date(a.dateDeadline+'T00:00:00') < now && a.status!=='analisado'; const bO = b.dateDeadline && new Date(b.dateDeadline+'T00:00:00') < now && b.status!=='analisado'; if (aO&&!bO) return -1; if (!aO&&bO) return 1; if (a.dateDeadline&&b.dateDeadline) return new Date(a.dateDeadline)-new Date(b.dateDeadline); return 0; });
            else if (intimSort === 'sent') sorted.sort((a,b) => { if (!a.dateSent) return 1; if (!b.dateSent) return -1; return new Date(b.dateSent) - new Date(a.dateSent); });
            else if (intimSort === 'jurisdiction') sorted.sort((a,b) => (jurisRank(a.jurisdiction) - jurisRank(b.jurisdiction)) || (a.jurisdiction||'').localeCompare(b.jurisdiction||''));
            else if (intimSort === 'class') sorted.sort((a,b) => (a.className||'').localeCompare(b.className||''));
            else if (intimSort === 'processo') sorted.sort((a,b) => (a.processNumber||'').localeCompare(b.processNumber||'') || (a.dateDeadline||'').localeCompare(b.dateDeadline||''));
            else if (intimSort === 'operation') sorted.sort((a,b) => { const oa = data.operations.find(o=>o.id===a.operationId)?.name||'zzz'; const ob = data.operations.find(o=>o.id===b.operationId)?.name||'zzz'; return oa.localeCompare(ob); });
            else if (intimSort === 'action_date') sorted.sort((a,b) => { const ta = a.responseAction?.respondedAt, tb = b.responseAction?.respondedAt; if (!ta && !tb) return 0; if (!ta) return 1; if (!tb) return -1; return new Date(tb) - new Date(ta); });

            // Urgente no topo (exceto agrupamentos)
            if (!['jurisdiction','class','operation','processo','action_date'].includes(intimSort)) {
              const pinsUrgent = (x) => !x.responseAction && x.status !== 'analisado' && intimIsUrgent(x);
              sorted.sort((a,b) => (pinsUrgent(a)?0:1) - (pinsUrgent(b)?0:1));
            }

            // Group headers for grouped sorts
            const needsGroupHeader = ['jurisdiction','class','operation','processo','action_date'].includes(intimSort);
            let lastGroup = null;

            return (<div className="intim-grid">{sorted.map((intim, idx) => {
            const days = daysUntil(intim.dateDeadline);
            const isOverdue = days !== null && days < 0 && intim.status !== 'analisado';
            const isDueSoon = days !== null && days >= 0 && days <= 5 && intim.status !== 'analisado';
            const st = INTIM_STATUSES[intim.status] || {};
            const linkedOp = data.operations.find(o => o.id === intim.operationId);
            // Group header
            let groupHeader = null;
            if (needsGroupHeader) {
              const gk = intimSort === 'jurisdiction' ? (intim.jurisdiction || 'Outros') : intimSort === 'class' ? (intim.className || 'Sem classe') : intimSort === 'processo' ? (intim.processNumber || 'Sem processo') : intimSort === 'action_date' ? actionDateBucket(intim) : (linkedOp?.name || 'Sem operação');
              if (gk !== lastGroup) {
                lastGroup = gk;
                const countInGroup = sorted.filter(x => {
                  if (intimSort === 'processo') return sameProc(x.processNumber, intim.processNumber);
                  if (intimSort === 'jurisdiction') return (x.jurisdiction||'Outros') === gk;
                  if (intimSort === 'class') return (x.className||'Sem classe') === gk;
                  if (intimSort === 'action_date') return actionDateBucket(x) === gk;
                  return (data.operations.find(o => o.id === x.operationId)?.name || 'Sem operação') === gk;
                }).length;
                groupHeader = <div key={'gh-'+idx} style={{padding:'10px 0 4px',fontSize:12,fontWeight:600,color:'var(--text-secondary)',borderBottom:'1px solid var(--border)',marginBottom:4,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span>{intimSort === 'processo' ? <span style={{fontFamily:'var(--font-mono)',fontSize:11}}>{gk}</span> : gk}</span>
                  <span style={{fontSize:10,color:'var(--text-muted)',fontWeight:400}}>{countInGroup} intimação(ões)</span>
                </div>;
              }
            }
            return (<React.Fragment key={intim.id}>{groupHeader}<div className={`intim-card ${isOverdue?'overdue':isDueSoon?'due-soon':intim.status==='analisado'?'responded':intim.status==='peca_edicao'?'peca-edicao':(!intim.dateStart||!intim.dateDeadline)?'not-started':''}${intimIsUrgent(intim)?' prio-urgente':intimImpKey(intim)==='alta'?' prio-alta':intimImpKey(intim)==='baixa'?' prio-baixa':''}${intim._importFlag==='new'?' import-new':''}${intim._importFlag==='updated'?' import-updated':''}`}
              onClick={() => setModal({type:'edit',entityType:'intimation',initial:intim})}>
              {/* COL 1: party + process */}
              <div className="intim-left">
                <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:4}}>
                  {linkedOp ? <span className="intim-op-tag" onClick={e => { e.stopPropagation(); setActiveOpId(linkedOp.id); setViewMode('operation'); }}>◎ {linkedOp.name}</span>
                    : <span className="intim-op-tag unlinked">Sem operação</span>}
                  <span title={intim.hasPending?'Pendência marcada — clique para desmarcar':'Marcar pendência (algo a fazer aqui)'} onClick={e => { e.stopPropagation(); upsert('intimations', { ...intim, hasPending: !intim.hasPending }); }} style={{cursor:'pointer',fontSize:10,lineHeight:1,padding:'2px 7px',borderRadius:999,border:`1px solid ${intim.hasPending?'var(--yellow)':'var(--border)'}`,background:intim.hasPending?'rgba(212,168,56,0.15)':'transparent',color:intim.hasPending?'var(--yellow)':'var(--text-muted)',fontWeight:intim.hasPending?600:400}}>⚑{intim.hasPending?' pendência':''}</span>
                </div>
                <div className="intim-party">{(() => {
                  const name = intim.partyName || '';
                  if (name && !name.toUpperCase().includes('FAZENDA') && !name.toUpperCase().includes('UNIÃO')) return name;
                  const parts = (intim.parties || '').split(/\s+X\s+/i);
                  for (const p of parts) { if (!p.toUpperCase().includes('FAZENDA') && !p.toUpperCase().includes('UNIÃO')) return truncate(p.replace(/^(Executado|Embargante|Autor|Réu|Requerido|Requerente|Exequente|Embargado|Impetrante)\s+/i,'').replace(/\(.*/, '').trim(), 40); }
                  return '—';
                })()}</div>
                <div className="intim-proc-row">
                  <span className="intim-juris">{intim.jurisdiction || '?'}</span>
                  <span className="intim-procnum" title="Clique para copiar" onClick={e => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(intim.processNumber).then(() => {
                      e.target.classList.add('copied');
                      setTimeout(() => e.target.classList.remove('copied'), 1500);
                    });
                  }}>{intim.processNumber}</span>
                </div>
                <div className="intim-classname" style={{marginTop:2}}>{truncate(intim.className, 35)}</div>
              </div>
              {/* COL 2: nas RESOLVIDAS o espaço das datas passa a mostrar a atuação (o prazo já não importa) */}
              <div className="intim-dates-col">
                {intim.responseAction ? (() => {
                  const ra = intim.responseAction;
                  const tipoLbl = ra.type === 'peticionamento' ? '📝 ' + (ra.peticionType || 'Peticionamento') : ra.type === 'ciencia' ? '✓ Ciência' : '⋯ Outra medida';
                  return (<>
                    <div style={{fontSize:10,color:'var(--green)',fontWeight:700,lineHeight:1.3}}>{tipoLbl}</div>
                    <div style={{fontSize:10,color:'var(--text-secondary)',fontFamily:'var(--font-mono)'}}>{ra.respondedAt ? fmtDate(ra.respondedAt.slice(0,10)) : '—'}</div>
                    {intim.dateDeadline && <div style={{fontSize:9,color:'var(--text-muted)',marginTop:2}}>prazo era {fmtDate(intim.dateDeadline)}</div>}
                  </>);
                })() : (<>
                <div style={{fontSize:10,color:'var(--text-secondary)'}}>
                  <span className="im-label">Envio:</span> {fmtDate(intim.dateSent)}
                </div>
                <div style={{fontSize:10,color:'var(--text-secondary)'}}>
                  <span className="im-label">Início:</span> {fmtDate(intim.dateStart)}
                </div>
                <div style={{fontSize:10,color:'var(--text-secondary)'}}>
                  <span className="im-label">Final:</span> <strong>{fmtDate(intim.dateDeadline)}</strong>
                </div>
                </>)}
                {intim.dateStart && intim.status !== 'analisado' && (() => {
                  const embDate = addBusinessDays(intim.dateStart, 10);
                  const embDays = daysUntil(embDate);
                  const embOver = embDays !== null && embDays < 0;
                  const embSoon = embDays !== null && embDays >= 0 && embDays <= 3;
                  return <div style={{fontSize:9,marginTop:3,padding:'2px 6px',borderRadius:3,background:embOver?'transparent':embSoon?'rgba(212,168,56,0.10)':'rgba(59,130,246,0.08)',color:embOver?'var(--text-muted)':embSoon?'var(--yellow)':'var(--text-muted)',opacity:embOver?0.4:1,display:'inline-flex',alignItems:'center',gap:4}}>
                    <span style={{fontWeight:600}}>Emb.Decl.</span>
                    <span>{fmtDate(embDate)}</span>
                    <span style={{fontWeight:embOver?400:700}}>{embOver ? 'expirado' : embDays === 0 ? 'HOJE' : `${embDays}d`}</span>
                  </div>;
                })()}
                <div className="intim-event" style={{marginTop:4}}>{truncate(intim.eventDescription, 55)}</div>
              </div>
              {/* COL 3: atuação (quando resolvida), objeto, notas, docs */}
              <div className="intim-center">
                {intim.responseAction && (() => {
                  const ra = intim.responseAction;
                  const desc = (ra.description || '').trim();
                  const url = ra.type === 'peticionamento' ? ra.peticionUrl : ra.docUrl;
                  const aberto = expandedActions.has(intim.id);
                  const LIM = 160;
                  const longo = desc.length > LIM;
                  return (<div style={{background:'rgba(64,168,112,0.07)',borderLeft:'2px solid var(--green)',borderRadius:3,padding:'5px 8px',marginBottom:4}}>
                    <div className="intim-center-label" style={{color:'var(--green)',marginBottom:2}}>Atuação registrada</div>
                    {desc ? <div style={{fontSize:11,color:'var(--text-secondary)',lineHeight:1.45,whiteSpace:'pre-wrap',wordBreak:'break-word'}}>
                      {aberto || !longo ? desc : desc.slice(0, LIM).trimEnd() + '…'}
                    </div> : <div style={{fontSize:10,color:'var(--text-muted)',fontStyle:'italic'}}>Sem descrição do ato.</div>}
                    <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap',marginTop:4}}>
                      {longo && <span style={{fontSize:10,color:'var(--blue)',cursor:'pointer',fontWeight:600}} onClick={e => { e.stopPropagation(); toggleAction(intim.id); }}>{aberto ? '▾ ocultar' : '▸ ver mais'}</span>}
                      {desc && <span style={{fontSize:10,color:'var(--text-muted)',cursor:'pointer'}} title="Copiar a descrição" onClick={e => { e.stopPropagation(); copyText(desc); const el = e.currentTarget; const o = el.textContent; el.textContent = '✓ copiado'; setTimeout(() => { try { el.textContent = o; } catch(x){} }, 1400); }}>📋 copiar</span>}
                      {url && <a href={url} target="_blank" rel="noopener noreferrer" className="intim-doc-link" style={{marginLeft:'auto'}} onClick={e => e.stopPropagation()}>📝 {String(url).includes('docs.google') ? 'Google Docs' : 'peça'}</a>}
                    </div>
                  </div>);
                })()}
                {intim.object && <><div className="intim-center-label">Objeto</div><div className="intim-center-text-wrap"><div className="intim-center-text">{intim.object}</div>{intim.object.length > 50 && <div className="intim-tooltip">{intim.object}</div>}</div></>}
                {(() => {
                  // Notas no padrão uniforme do app (notesList), com fallback para obs1/obs2 legados
                  const iNotes = intim.notesList && intim.notesList.length > 0
                    ? intim.notesList
                    : [intim.obs1, intim.obs2].filter(Boolean);
                  if (iNotes.length === 0) return null;
                  return (<>
                    <div className="intim-center-label">Notas ({iNotes.length})</div>
                    <div className="note-stack" style={{maxHeight:100,overflowY:'auto'}}>
                      {iNotes.map((n, i) => <div key={i} className="note-item note-item-full">{linkify(n)}</div>)}
                    </div>
                  </>);
                })()}
                {intim.minutaUrl && <a href={intim.minutaUrl} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} className="intim-doc-link">📝 {intim.minutaUrl.includes('docs.google') ? 'Google Docs' : 'Documento'}</a>}
                {!intim.responseAction && !intim.object && !(intim.notesList && intim.notesList.length > 0) && !intim.obs1 && !intim.obs2 && !intim.minutaUrl && <div style={{fontSize:10,color:'var(--text-muted)',fontStyle:'italic'}}>—</div>}
              </div>
              {/* COL 4: deadline + status + eproc */}
              <div className="intim-right">
                {intim.dateDeadline ? <span className={`intim-deadline ${isOverdue?'overdue':isDueSoon?'due-soon':'normal'}`}>
                  {isOverdue ? `VENCIDA ${Math.abs(days)}d` : `${days}d`}
                </span> : <span className="intim-deadline not-started">prazo fechado</span>}
                <span className={`badge ${st.badge||''}`}>{st.label||intim.status}</span>
                {intim.processNumber && <a href={`https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=processo_selecionar&num_processo=${intim.processNumber.replace(/[.\-]/g,'')}`} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} className="intim-eproc-link">⚖️ eproc</a>}
              </div>
              {/* Faixa inferior: atenção à esquerda · ações à direita */}
              <div className="intim-attention">
                <div className="intim-att-left">
                  {intimIsUrgent(intim) && <span className="intim-att-chip urgent-mark">URGENTE</span>}
                  <span className={`intim-att-chip imp-${intimImpKey(intim)}`}>
                    {INTIM_PRIORITIES[intimImpKey(intim)].label}
                  </span>
                  <span className={`intim-att-chip dif-${intimDifKey(intim)}`}>
                    {INTIM_DIFFICULTY[intimDifKey(intim)].label}
                  </span>
                </div>
                <div className="intim-att-actions">
                  <button type="button" className="intim-att-btn" onClick={e => { e.stopPropagation(); setRespondModal({intim, type:null}); }}>Atuação</button>
                  <button type="button" className="intim-att-btn" title="Adicionar à watchlist" onClick={e => { e.stopPropagation(); setModal({type:'create',entityType:'watch',initial:{processNumber:intim.processNumber,parties:intim.parties,operationId:intim.operationId,reason:`Origem: ${intim.eventDescription||'intimação'}`,createdAt:new Date().toISOString()}}); }}>Acompanhar</button>
                  <button type="button" className={`intim-att-btn${isOnDesk('intimation',intim.id)?' on-desk':''}`} title={isOnDesk('intimation',intim.id)?'Remover da Mesa de trabalho':'Enviar para a Mesa de trabalho'} onClick={e => { e.stopPropagation(); toggleDesk('intimation', intim.id, daysUntil(intim.dateDeadline)); }}>{isOnDesk('intimation',intim.id)?'Na mesa':'Mesa'}</button>
                </div>
              </div>
            </div></React.Fragment>);
          })}</div>);
          })()}
        </div>);
      })()}

      {/* ═══ MODELOS ═══ */}
      {viewMode === 'modelos' && (() => {
        const models = data.models || [];
        // Árvore: categoria → subcategoria
        const tree = {};
        models.forEach(m => {
          const c = m.category || 'Sem categoria', s = m.subcategory || '—';
          if (!tree[c]) tree[c] = { total: 0, subs: {} };
          tree[c].total++; tree[c].subs[s] = (tree[c].subs[s] || 0) + 1;
        });
        const cats = Object.keys(tree).sort();
        const matterSet = new Set(modelMatters.map(x => x.materia));
        // Filtro: matérias inferidas > nó da árvore > tudo
        let lista = models;
        if (matterSet.size > 0) {
          lista = models.filter(m => matterSet.has(m.subcategory) || (m.tags || []).some(t => matterSet.has(t)));
          const rank = (m) => { const i = modelMatters.findIndex(x => x.materia === m.subcategory); return i === -1 ? 99 : i; };
          lista = [...lista].sort((a, b) => rank(a) - rank(b) || (b.useCount || 0) - (a.useCount || 0));
        } else if (modelSel) {
          lista = models.filter(m => (m.category || 'Sem categoria') === modelSel.cat && (!modelSel.sub || (m.subcategory || '—') === modelSel.sub));
        }
        const analisar = () => { const r = guessMatters(modelQuery); setModelMatters(r); setModelSel(null); if (modelQuery.trim() && r.length === 0) alert('Não reconheci a matéria nesse texto.\n\nTente colar um trecho com os termos jurídicos centrais (ex.: "prescrição intercorrente", "dissolução irregular").'); };
        const limpar = () => { setModelQuery(''); setModelMatters([]); };
        // Catálogo em texto para colar no Gemini junto com a peça
        const copiarCatalogo = () => {
          if (models.length === 0) { alert('Cadastre modelos primeiro.'); return; }
          const linhas = models.map((m, i) => `${i+1}. ${m.title || 'Sem título'}\n   Categoria: ${m.category || '—'} | Matéria: ${m.subcategory || '—'}${(m.tags||[]).length ? ' | Tags: ' + m.tags.join(', ') : ''}\n   Quando usar: ${m.description || '—'}\n   Link: ${m.url || '—'}`).join('\n\n');
          const txt = `Abaixo está o catálogo de modelos de peças de um Procurador da Fazenda Nacional.\n\nAnalise a peça que estou anexando e responda:\n1) Qual é a peça (tipo/rito) e qual a matéria central debatida;\n2) Quais modelos do catálogo abaixo são adequados para responder, em ordem de aderência, justificando em uma linha cada um;\n3) Que pontos da peça anexada o modelo escolhido não cobre e precisam ser redigidos do zero.\n\n=== CATÁLOGO (${models.length} modelos) ===\n\n${linhas}`;
          copyText(txt);
          alert(`Catálogo copiado (${models.length} modelos).\n\nAgora, no Gemini: cole este texto e anexe a peça (PDF).\nEle vai apontar os modelos adequados e o que falta cobrir.`);
        };
        return (<div className="entity-area">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,gap:10,flexWrap:'wrap'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
              <span style={{fontSize:15,fontWeight:700,color:'var(--text-primary)'}}>📄 Modelos</span>
              <span style={{color:'var(--text-muted)',fontSize:11}}>{models.length} modelo(s)</span>
            </div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              <button className="btn-secondary btn-sm" title="Copia o catálogo + um pedido pronto. Cole no Gemini e anexe a peça para ele indicar o modelo." onClick={copiarCatalogo}>✨ Catálogo para IA</button>
              <button className="btn-primary btn-sm" onClick={() => setModal({type:'create',entityType:'model',initial:{}})}>+ Modelo</button>
            </div>
          </div>

          {/* Busca livre — cola o texto da peça e ele infere a matéria */}
          <div style={{marginBottom:12,padding:'10px 12px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)'}}>
            <div style={{display:'flex',gap:8,alignItems:'flex-start',flexWrap:'wrap'}}>
              <textarea value={modelQuery} onChange={e => setModelQuery(e.target.value)} rows={2}
                placeholder="Cole aqui o texto da intimação ou da peça adversa — o app identifica a matéria e filtra os modelos."
                style={{flex:1,minWidth:240,fontSize:11,resize:'vertical'}} />
              <div style={{display:'flex',flexDirection:'column',gap:5}}>
                <button className="btn-primary btn-sm" onClick={analisar} disabled={!modelQuery.trim()}>🔎 Identificar</button>
                {(modelQuery || modelMatters.length > 0) && <button className="btn-secondary btn-xs" onClick={limpar}>Limpar</button>}
              </div>
            </div>
            {modelMatters.length > 0 && <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap',marginTop:8}}>
              <span style={{fontSize:9,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:0.5,fontWeight:700}}>Matérias identificadas</span>
              {modelMatters.map(x => <span key={x.materia} style={{fontSize:10,padding:'2px 9px',borderRadius:999,border:'1px solid var(--accent)',background:'var(--accent-dim)',color:'var(--accent)',fontWeight:600}}>{x.materia}</span>)}
            </div>}
          </div>

          {models.length === 0 ? <div className="empty-state"><div className="empty-icon">📄</div><p>Nenhum modelo cadastrado.</p><p style={{fontSize:11}}>Cadastre os links dos seus modelos no Google Docs, classificados por peça e matéria.</p></div> :
          <div style={{display:'grid',gridTemplateColumns:'190px 1fr',gap:12,alignItems:'start'}}>
            {/* Árvore lateral */}
            <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:8,position:'sticky',top:8}}>
              <div style={{fontSize:9,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:0.5,fontWeight:700,padding:'2px 6px 6px'}}>Categorias</div>
              <div onClick={() => { setModelSel(null); setModelMatters([]); }} style={{fontSize:11,padding:'4px 7px',borderRadius:4,cursor:'pointer',color:!modelSel&&!modelMatters.length?'var(--text-primary)':'var(--text-secondary)',background:!modelSel&&!modelMatters.length?'var(--bg-elevated)':'transparent',marginBottom:2}}>Todos <span style={{color:'var(--text-muted)'}}>{models.length}</span></div>
              {cats.map(c => { const selCat = modelSel && modelSel.cat === c;
                return (<div key={c}>
                  <div onClick={() => { setModelSel({ cat: c }); setModelMatters([]); }} style={{fontSize:11,padding:'4px 7px',borderRadius:4,cursor:'pointer',color:selCat&&!modelSel.sub?'var(--text-primary)':'var(--text-secondary)',background:selCat&&!modelSel.sub?'var(--bg-elevated)':'transparent',display:'flex',gap:6}}>
                    <span style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c}</span>
                    <span style={{color:'var(--text-muted)',flexShrink:0}}>{tree[c].total}</span>
                  </div>
                  {selCat && Object.keys(tree[c].subs).sort().map(s => (
                    <div key={s} onClick={() => { setModelSel({ cat: c, sub: s }); setModelMatters([]); }} style={{fontSize:10,padding:'3px 7px 3px 18px',borderRadius:4,cursor:'pointer',color:modelSel.sub===s?'var(--accent)':'var(--text-muted)',background:modelSel.sub===s?'var(--accent-dim)':'transparent',display:'flex',gap:6}}>
                      <span style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>↳ {s}</span>
                      <span style={{flexShrink:0}}>{tree[c].subs[s]}</span>
                    </div>
                  ))}
                </div>);
              })}
            </div>
            {/* Lista de modelos */}
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {lista.length === 0 ? <div style={{padding:20,textAlign:'center',color:'var(--text-muted)',fontSize:11,border:'1px dashed var(--border)',borderRadius:6}}>Nenhum modelo {modelMatters.length ? 'para as matérias identificadas' : 'nesta categoria'}.</div> :
              lista.map(m => (<div key={m.id} style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderLeft:`3px solid ${matterSet.has(m.subcategory)?'var(--accent)':'var(--border-light)'}`,borderRadius:6,padding:'9px 12px'}}>
                <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                  <span style={{fontSize:13,fontWeight:600,color:'var(--text-primary)',cursor:'pointer',flex:1,minWidth:0}} onClick={() => setModal({type:'edit',entityType:'model',initial:m})}>{m.title || 'Sem título'}</span>
                  {m.url && <a href={m.url} target="_blank" rel="noopener noreferrer" className="intim-doc-link" style={{flexShrink:0}} onClick={e => { e.stopPropagation(); upsert('models', { ...m, useCount: (m.useCount||0)+1, lastUsedAt: new Date().toISOString() }); }}>📝 abrir</a>}
                </div>
                {m.description && <div style={{fontSize:11,color:'var(--text-secondary)',lineHeight:1.5,marginTop:3}}>{m.description}</div>}
                <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap',marginTop:6}}>
                  {m.category && <span style={{fontSize:9,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:0.4,fontWeight:700}}>{m.category}{m.subcategory ? ' · ' + m.subcategory : ''}</span>}
                  {(m.tags || []).map(t => <span key={t} style={{fontSize:10,padding:'1px 8px',borderRadius:999,border:'1px solid var(--border)',color:'var(--text-muted)'}}>{t}</span>)}
                  {m.useCount > 0 && <span style={{fontSize:9,color:'var(--text-muted)',marginLeft:'auto'}}>usado {m.useCount}×</span>}
                </div>
              </div>))}
            </div>
          </div>}
        </div>);
      })()}

      {/* ═══ MESA DE TRABALHO ═══ */}
      {viewMode === 'mesa' && (() => {
        const META = {
          intimation: { label: 'INTIMAÇÃO', color: 'var(--blue)', bg: 'rgba(91,143,217,0.18)' },
          task:       { label: 'TAREFA',    color: 'var(--yellow)', bg: 'rgba(212,168,56,0.18)' },
          hearing:    { label: 'AUDIÊNCIA', color: 'var(--accent)', bg: 'rgba(200,160,74,0.18)' },
        };
        const resolve = (d) => {
          const coll = d.type === 'intimation' ? data.intimations : d.type === 'task' ? data.tasks : data.hearings;
          const x = (coll || []).find(i => i.id === d.id);
          return x ? { d, x } : null;
        };
        const items = (data.desk || []).map(resolve).filter(Boolean);
        const rowInfo = (d, x) => {
          const op = data.operations.find(o => o.id === x.operationId);
          const doc = d.type === 'intimation' ? x.minutaUrl : x.docUrl; // intimação: minutaUrl · tarefa/audiência: docUrl
          // Notas herdadas do card de origem (intimação tem fallback para obs1/obs2 legados)
          const notes = d.type === 'intimation'
            ? ((x.notesList && x.notesList.length) ? x.notesList : [x.obs1, x.obs2].filter(Boolean))
            : (x.notesList || (x.notes ? [x.notes] : []));
          if (d.type === 'intimation') return { title: x.partyName || x.parties || x.processNumber || 'Intimação', proc: x.processNumber || '', op, extra: '', days: daysUntil(x.dateDeadline), dateLbl: x.dateDeadline ? fmtDate(x.dateDeadline) : '', doc, notes };
          if (d.type === 'task') return { title: x.title || 'Tarefa', proc: '', op, extra: '', days: daysUntil(x.dueDate), dateLbl: x.dueDate ? fmtDate(x.dueDate) : '', doc, notes };
          return { title: x.parties || 'Audiência', proc: x.processNumber || '', op, extra: `${x.time || ''}${x.location ? (x.time ? ' · ' : '') + truncate(x.location, 30) : ''}`, days: daysUntil(x.date), dateLbl: x.date ? fmtDate(x.date) : '', doc, notes };
        };
        const daysColor = (dd) => dd === null ? 'var(--text-muted)' : dd <= 2 ? 'var(--red)' : dd <= 7 ? 'var(--yellow)' : 'var(--text-secondary)';
        const daysText = (dd) => dd === null ? '—' : dd < 0 ? `vencido ${Math.abs(dd)}d` : dd === 0 ? 'hoje' : dd === 1 ? 'amanhã' : `${dd} dias`;
        return (<div className="entity-area">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,gap:10,flexWrap:'wrap'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
              <span style={{fontSize:15,fontWeight:700,color:'var(--text-primary)'}}>🗂 Mesa de trabalho</span>
              <span style={{color:'var(--text-muted)',fontSize:11}}>{items.length} item(ns) em foco</span>
            </div>
            {items.length > 0 && <span style={{fontSize:10,color:'var(--text-muted)',fontStyle:'italic'}}>Arraste ⠿ para reordenar · marque ☐ para tirar da mesa</span>}
          </div>
          {items.length === 0 ? <div className="empty-state"><div className="empty-icon">🗂</div><p>Mesa vazia.</p><p style={{fontSize:11}}>Envie intimações, tarefas ou audiências para cá com o botão 🗂 Mesa nos cards.</p></div> :
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {items.map(({ d, x }, i) => {
              const m = META[d.type]; const r = rowInfo(d, x);
              return (<div key={d.type + ':' + d.id} draggable
                onDragStart={() => { deskDragRef.current = i; }}
                onDragOver={e => e.preventDefault()}
                onDrop={() => { reorderDesk(deskDragRef.current, i); deskDragRef.current = null; }}
                style={{display:'flex',alignItems:'flex-start',gap:10,background:'var(--bg-card)',border:'1px solid var(--border)',borderLeft:`3px solid ${m.color}`,borderRadius:6,padding:'9px 12px',cursor:'grab'}}>
                <span style={{color:'var(--text-muted)',fontSize:14,flexShrink:0,marginTop:1}} title="Arraste para reordenar">⠿</span>
                <div onClick={e => { e.stopPropagation(); removeFromDesk(d.type, d.id); }} title="Tirar da mesa (sem concluir)" style={{width:16,height:16,borderRadius:4,border:'1.5px solid var(--text-muted)',flexShrink:0,cursor:'pointer',marginTop:2}} />
                <span style={{fontSize:10,fontWeight:700,padding:'1px 7px',borderRadius:3,background:m.bg,color:m.color,flexShrink:0,marginTop:3}}>{m.label}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,color:'var(--text-primary)',cursor:'pointer',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title="Abrir para editar" onClick={() => setModal({ type:'edit', entityType: d.type, initial: x })}>{r.title}</div>
                  {(r.proc || r.op || r.extra) && <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginTop:1}}>
                    {r.proc && <Copyable value={r.proc} className="intim-procnum">{r.proc}</Copyable>}
                    {r.op && <span style={{fontSize:11,color:'var(--accent)',cursor:'pointer'}} title="Abrir a operação" onClick={e => { e.stopPropagation(); setActiveOpId(r.op.id); setViewMode('operation'); }}>◎ {truncate(r.op.name, 26)}</span>}
                    {r.extra && <span style={{fontSize:11,color:'var(--text-muted)'}}>{r.extra}</span>}
                  </div>}
                  {r.notes.length > 0 && <div className="note-stack" style={{marginTop:4,maxHeight:64,overflowY:'auto'}}>
                    {r.notes.slice(0,3).map((n,ni) => <div key={ni} className="note-item">{linkify(n)}</div>)}
                    {r.notes.length > 3 && <div style={{fontSize:9,color:'var(--text-muted)',marginTop:2}}>+{r.notes.length-3} nota(s)</div>}
                  </div>}
                </div>
                {r.doc && <a href={r.doc} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} className="intim-doc-link" style={{flexShrink:0}}>📝 {r.doc.includes('docs.google') ? 'Google Docs' : 'Documento'}</a>}
                {d.type === 'intimation' && <button className="btn-secondary btn-xs" style={{flexShrink:0}} title="Registrar atuação — conclui a intimação e tira da mesa" onClick={e => { e.stopPropagation(); setRespondModal({ intim: x, type: null }); }}>✎ Atuação</button>}
                <div style={{textAlign:'right',flexShrink:0,minWidth:56}}>
                  <div style={{fontSize:12,fontWeight:600,color:daysColor(r.days)}}>{daysText(r.days)}</div>
                  {r.dateLbl && <div style={{fontSize:9,color:'var(--text-muted)',fontFamily:'var(--font-mono)'}}>{r.dateLbl}</div>}
                </div>
              </div>);
            })}
          </div>}
        </div>);
      })()}

      {/* ═══ TAREFAS GLOBAIS ═══ */}
      {viewMode === 'tarefas_global' && (() => {
        // Global tasks view: show tasks with explicit 'global' visibility, OR legacy tasks
        // without operation link, OR legacy tasks from before taskVisibility existed (backward compat).
        // Tasks linked to an operation AND with taskVisibility === 'operation' are HIDDEN here.
        const allTasks = (data.tasks || []).filter(t => {
          if (!t.operationId) return true; // operation-less tasks always global
          if (t.taskVisibility === 'global') return true;
          if (t.taskVisibility === 'operation') return false;
          return true; // legacy (undefined) — show by default
        });
        const open = allTasks.filter(t => t.status !== 'concluida' && t.status !== 'cancelada');
        const done = allTasks.filter(t => t.status === 'concluida');
        const toggleTask = (t) => { upsert('tasks', { ...t, status: t.status === 'concluida' ? 'pendente' : 'concluida' }); };
        return (<div key="demo-inbox-tarefas" className={`entity-area ${isDemo ? 'demo-inbox-panel' : ''}`}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,gap:10,flexWrap:'wrap'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
              <span style={{color:'var(--text-muted)',fontSize:11}}>{open.length} aberta(s) · {done.length} concluída(s)</span>
              <span style={{fontSize:10,color:'var(--text-muted)',fontStyle:'italic'}}>🌐 Exibindo tarefas globais e avulsas. Tarefas marcadas como "internas" ficam apenas na operação correspondente.</span>
            </div>
            <button className="btn-primary btn-sm" onClick={() => setModal({type:'create',entityType:'task',initial:{taskVisibility:'global'}})}>+ Tarefa</button>
          </div>
          {[...open].sort((a,b) => {
            const po = {urgente:0,alta:1,media:2,baixa:3};
            if ((po[a.priority]||1) !== (po[b.priority]||1)) return (po[a.priority]||1) - (po[b.priority]||1);
            if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
            return 0;
          }).map(t => {
            const op = data.operations.find(o => o.id === t.operationId);
            const prio = TASK_PRIORITIES[t.priority] || TASK_PRIORITIES.media;
            const days = daysUntil(t.dueDate);
            const notes = t.notesList || (t.notes ? [t.notes] : []);
            return (<div key={t.id} className="task-card" style={{display:'grid',gridTemplateColumns:'auto 1fr 1.4fr 1fr auto',gap:12,alignItems:'start',padding:'12px 14px'}} onClick={() => setModal({type:'edit',entityType:'task',initial:t})}>
              <div className="task-check" onClick={e => { e.stopPropagation(); toggleTask(t); }}></div>
              <div style={{minWidth:0}}>
                <div className="task-title" style={{fontSize:13,fontWeight:700,lineHeight:1.3,marginBottom:4}}>{t.title}</div>
                <div className="task-meta" style={{fontSize:11,flexWrap:'wrap'}}>
                  <span className="task-prio-dot" style={{background:prio.color}}></span>
                  <span style={{color:prio.color,fontWeight:600}}>{prio.label}</span>
                  {op && <span style={{color:'var(--accent)',cursor:'pointer',fontWeight:600}} onClick={e => { e.stopPropagation(); setActiveOpId(op.id); setViewMode('operation'); }}>◎ {op.name}</span>}
                  {t.dueDate && <span style={{color: days !== null && days <= 3 ? 'var(--red)' : 'var(--text-secondary)',fontWeight:600}}>{fmtDate(t.dueDate)} {days !== null ? `(${days}d)` : ''}</span>}
                </div>
              </div>
              {t.description ? <div className="task-desc-wrap">
                <div style={{fontSize:9,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:0.3,fontWeight:600,marginBottom:2}}>Descrição</div>
                <div className="task-desc-multi">{t.description}</div>
                <div className="task-desc-tooltip">{t.description}</div>
              </div> : <div style={{fontSize:10,color:'var(--text-muted)',fontStyle:'italic'}}>Sem descrição</div>}
              <div style={{fontSize:10}}>
                {notes.length > 0 && <div className="note-stack" style={{maxHeight:60,overflowY:'auto'}}>
                  <div style={{fontSize:9,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:0.3,fontWeight:600,marginBottom:2}}>Notas ({notes.length})</div>
                  {notes.slice(0,3).map((n,i) => <div key={i} className="note-item note-item-full">{linkify(n)}</div>)}
                  {notes.length > 3 && <div style={{fontSize:9,color:'var(--text-muted)',marginTop:1}}>+{notes.length-3} nota(s)</div>}
                </div>}
                {t.docUrl && <a href={t.docUrl} target="_blank" rel="noopener noreferrer" className="intim-doc-link" style={{marginTop:4}} onClick={e=>e.stopPropagation()}>📝 Documento</a>}
              </div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:5}}>
                <span className={`badge ${TASK_STATUSES[t.status]?.badge||''}`} style={{fontSize:10,fontWeight:700}}>{TASK_STATUSES[t.status]?.label||t.status}</span>
                <button className="btn-secondary btn-xs" title={isOnDesk('task',t.id)?'Remover da Mesa':'Enviar para a Mesa'} onClick={e => { e.stopPropagation(); toggleDesk('task', t.id, daysUntil(t.dueDate)); }} style={isOnDesk('task',t.id)?{borderColor:'var(--blue)',color:'var(--blue)'}:{}}>🗂 {isOnDesk('task',t.id)?'na mesa':'Mesa'}</button>
              </div>
            </div>);
          })}
          {done.length > 0 && (<>
            <div style={{margin:'16px 0 8px',fontSize:11,color:'var(--text-muted)'}}>Concluídas ({done.length})</div>
            {done.slice(0,10).map(t => {
              const op = data.operations.find(o => o.id === t.operationId);
              return (<div key={t.id} className="task-card done" style={{display:'grid',gridTemplateColumns:'auto 1fr auto',gap:10,alignItems:'center'}} onClick={() => setModal({type:'edit',entityType:'task',initial:t})}>
                <div className="task-check checked" onClick={e => { e.stopPropagation(); toggleTask(t); }}>✓</div>
                <div><div className="task-title" style={{textDecoration:'line-through'}}>{t.title}</div>
                  <div className="task-meta">{op && <span style={{color:'var(--accent)'}}>{op.name}</span>}</div>
                </div>
                <span className="badge badge-green" style={{fontSize:9}}>Concluída</span>
              </div>);
            })}
          </>)}
        </div>);
      })()}

      {/* ═══ ACOMPANHAR (WATCHLIST) ═══ */}
      {viewMode === 'acompanhar' && (() => {
        const allWatch = data.watchlist || [];
        const open = allWatch.filter(w => w.status !== 'encerrado');
        const closed = allWatch.filter(w => w.status === 'encerrado');
        const sortedOpen = [...open].sort((a,b) => {
          const so = {aguardando:0, movimentado:1};
          if ((so[a.status]||0) !== (so[b.status]||0)) return (so[a.status]||0) - (so[b.status]||0);
          return (b.createdAt||'').localeCompare(a.createdAt||'');
        });
        return (<div className="entity-area">
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:12,alignItems:'center'}}>
            <div>
              <span style={{color:'var(--text-muted)',fontSize:11}}>{open.length} em acompanhamento</span>
              {closed.length > 0 && <span style={{color:'var(--text-muted)',fontSize:11,marginLeft:8}}>· {closed.length} encerrado(s)</span>}
            </div>
            <button className="btn-primary btn-sm" onClick={() => setModal({type:'create',entityType:'watch',initial:{}})}>+ Acompanhar</button>
          </div>
          {open.length === 0 ? <div className="empty-state"><div className="empty-icon">👁</div><p>Nenhum processo em acompanhamento</p>
            <p style={{fontSize:11,marginTop:8,color:'var(--text-muted)',maxWidth:400,textAlign:'center'}}>Use esta aba para monitorar processos após manifestação pontual, quando não há garantia de nova intimação.</p>
          </div> :
          <div className="entity-list">{sortedOpen.map(w => {
            const op = data.operations.find(o => o.id === w.operationId);
            const ws = WATCH_STATUSES[w.status] || WATCH_STATUSES.aguardando;
            const notes = w.notesList || (w.notes ? [w.notes] : []);
            const days = w.createdAt ? Math.floor((new Date() - new Date(w.createdAt))/(1000*60*60*24)) : null;
            const lastCheck = w.lastCheckedAt ? Math.floor((new Date() - new Date(w.lastCheckedAt))/(1000*60*60*24)) : null;
            return (<div key={w.id} className="entity-card" style={{display:'grid',gridTemplateColumns:'1.3fr 1fr 1fr auto',gap:12,alignItems:'start',borderLeft:`3px solid ${w.status==='aguardando'?'var(--yellow)':w.status==='movimentado'?'var(--blue)':'var(--green)'}`}} onClick={() => setModal({type:'edit',entityType:'watch',initial:w})}>
              <div style={{minWidth:0}}>
                <div style={{fontFamily:'var(--font-mono)',fontSize:11,fontWeight:600,color:'var(--text-primary)'}}>{w.processNumber || 'Sem nº'}</div>
                <div className="ec-sub">{w.parties || ''}</div>
                {op && <div style={{fontSize:10,color:'var(--accent)',cursor:'pointer',marginTop:2}} onClick={e => { e.stopPropagation(); setActiveOpId(op.id); setViewMode('operation'); }}>↗ {op.name}</div>}
              </div>
              <div style={{fontSize:10,color:'var(--text-muted)'}}>
                {w.reason ? <div className="intim-center-text-wrap"><div><span style={{color:'var(--text-secondary)'}}>Motivo:</span> <span style={{display:'-webkit-box',WebkitLineClamp:1,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{truncate(w.reason, 50)}</span></div><div className="intim-tooltip"><div style={{fontWeight:600,marginBottom:6,color:'var(--accent)'}}>Motivo</div>{w.reason}</div></div> : <div><span style={{color:'var(--text-secondary)'}}>Motivo:</span> —</div>}
                {days !== null && <div style={{marginTop:2}}>Acompanhando há <strong>{days}d</strong></div>}
                {lastCheck !== null && <div style={{marginTop:2}}>Última verif.: {lastCheck}d atrás</div>}
              </div>
              <div style={{fontSize:10}}>
                {notes.length > 0 ? <div className="intim-center-text-wrap">
                  <div style={{display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden',color:'var(--text-muted)'}}>{notes[0]}{notes.length>1?` (+${notes.length-1})`:''}</div>
                  <div className="intim-tooltip"><div style={{fontWeight:600,marginBottom:6,color:'var(--accent)'}}>Notas ({notes.length})</div>{notes.map((n,i)=><div key={i} style={{marginBottom:4}}>• {n}</div>)}</div>
                </div> : <span style={{fontStyle:'italic',color:'var(--text-muted)'}}>—</span>}
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:4,alignItems:'flex-end'}}>
                <span className={`badge ${ws.badge}`}>{ws.label}</span>
                <button className="btn-secondary btn-xs" onClick={e => { e.stopPropagation(); upsert('watchlist', {...w, lastCheckedAt: new Date().toISOString()}); }}>✓ Verificar</button>
              </div>
            </div>);
          })}</div>}
          {closed.length > 0 && (<>
            <div style={{margin:'20px 0 8px',fontSize:11,color:'var(--text-muted)'}}>Encerrados ({closed.length})</div>
            {closed.slice(0,10).map(w => {
              const op = data.operations.find(o => o.id === w.operationId);
              return (<div key={w.id} className="entity-card" style={{opacity:0.5,display:'grid',gridTemplateColumns:'1fr auto',gap:12,alignItems:'center'}} onClick={() => setModal({type:'edit',entityType:'watch',initial:w})}>
                <div>
                  <div style={{fontFamily:'var(--font-mono)',fontSize:11,fontWeight:600,textDecoration:'line-through'}}>{w.processNumber}</div>
                  <div className="ec-sub">{op?.name||''} · {w.reason}</div>
                </div>
                <span className="badge badge-green" style={{fontSize:9}}>Encerrado</span>
              </div>);
            })}
          </>)}
        </div>);
      })()}

      {viewMode === 'audiencias' && (() => {
        const all = data.hearings || [];
        const today = new Date(); today.setHours(0,0,0,0);
        const weekBlock = isDemo ? renderAgendaWeek() : null;
        const monNames = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
        const typeLabels = {instrucao:'Instrução',conciliacao:'Conciliação',una:'Una',justificacao:'Justificação',inquiricao:'Inquirição',outra:'Outra'};
        const isClosed = (h) => h.status === 'realizada' || h.status === 'cancelada';
        const withDays = all.map(h => ({ h, dd: h.date ? Math.round((new Date(h.date+'T00:00:00') - today)/86400000) : null }));
        const upcoming = withDays.filter(x => !isClosed(x.h) && x.dd !== null && x.dd >= 0).sort((a,b) => a.dd - b.dd || (a.h.time||'').localeCompare(b.h.time||''));
        const thisWeek = upcoming.filter(x => x.dd <= 7);
        const thisMonth = upcoming.filter(x => x.dd > 7 && x.dd <= 31);
        const later = upcoming.filter(x => x.dd > 31);
        const noDate = withDays.filter(x => x.dd === null && !isClosed(x.h));
        const past = withDays.filter(x => isClosed(x.h) || (x.dd !== null && x.dd < 0)).sort((a,b) => (b.h.date||'').localeCompare(a.h.date||''));
        const card = (x) => { const h = x.h; const dd = x.dd; const op = data.operations.find(o => o.id === h.operationId); const st = AUDIENCIA_STATUSES[h.status] || AUDIENCIA_STATUSES.agendada; const urgent = !isClosed(h) && dd !== null && dd >= 0 && dd <= 2; const soon = !isClosed(h) && dd !== null && dd > 2 && dd <= 7; const accent = isClosed(h) ? 'var(--border)' : urgent ? 'var(--red)' : soon ? 'var(--yellow)' : 'var(--border)'; const dObj = h.date ? new Date(h.date+'T00:00:00') : null; const ddColor = isClosed(h) ? 'var(--text-muted)' : urgent ? 'var(--red)' : soon ? 'var(--yellow)' : 'var(--text-muted)'; const ddText = isClosed(h) ? st.label.replace(/^[^ ]+ /,'') : dd === 0 ? 'hoje' : dd === 1 ? 'amanhã' : dd > 0 ? `em ${dd} dias` : `há ${Math.abs(dd)}d`; const hasMat = h.roteiro || (h.notesList && h.notesList.length) || (h.documentIds && h.documentIds.length);
          return (<div key={h.id} className="entity-card" onClick={() => setModal({type:'edit',entityType:'hearing',initial:h})} style={{display:'grid',gridTemplateColumns:'64px 1fr auto',gap:14,alignItems:'center',borderLeft:`3px solid ${accent}`,cursor:'pointer',opacity:isClosed(h)?0.6:1}}>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:22,fontWeight:700,fontFamily:'var(--font-display)',color:'var(--text-primary)',lineHeight:1}}>{dObj?dObj.getDate():'—'}</div>
              <div style={{fontSize:11,color:'var(--text-muted)'}}>{dObj?monNames[dObj.getMonth()]:''}</div>
              {h.time && <div style={{fontSize:12,fontWeight:600,color:ddColor,marginTop:2}}>{h.time}</div>}
            </div>
            <div style={{minWidth:0}}>
              <div style={{fontSize:14,fontWeight:600,color:'var(--text-primary)'}}>{h.parties || 'Audiência'}</div>
              {h.processNumber && <div style={{fontSize:12,color:'var(--text-secondary)',fontFamily:'var(--font-mono)'}}>{h.processNumber}</div>}
              <div style={{marginTop:5,display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
                <span className={`badge ${st.badge}`} style={{fontSize:9}}>{typeLabels[h.hearingType]||'Audiência'}</span>
                <span style={{fontSize:11,color:'var(--text-muted)'}}>{h.modality==='virtual'?'🖥 Virtual':'📍 Presencial'}{h.location?' · '+truncate(h.location,40):''}</span>
                {hasMat && <span style={{fontSize:10,color:'var(--accent)'}}>📎 material</span>}
              </div>
              {h.docUrl && <div style={{marginTop:5}}><a href={h.docUrl} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} className="intim-doc-link">📝 {h.docUrl.includes('docs.google') ? 'Google Docs' : 'Documento'}</a></div>}
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:12,fontWeight:600,color:ddColor}}>{ddText}</div>
              {op ? <div style={{fontSize:11,color:'var(--accent)',cursor:'pointer',marginTop:6}} onClick={e => { e.stopPropagation(); setActiveOpId(op.id); setViewMode('operation'); }}>↗ {truncate(op.name,22)}</div> : <div style={{fontSize:11,color:'var(--text-muted)',marginTop:6}}>sem operação</div>}
              <button className="btn-secondary btn-xs" title={isOnDesk('hearing',h.id)?'Remover da Mesa':'Enviar para a Mesa'} onClick={e => { e.stopPropagation(); toggleDesk('hearing', h.id, daysUntil(h.date)); }} style={{marginTop:6, ...(isOnDesk('hearing',h.id)?{borderColor:'var(--blue)',color:'var(--blue)'}:{})}}>🗂 {isOnDesk('hearing',h.id)?'na mesa':'Mesa'}</button>
            </div>
          </div>); };
        const grp = (title, arr, color) => arr.length > 0 ? (<React.Fragment key={title}><div style={{fontSize:12,fontWeight:600,color:color,margin:'14px 0 8px'}}>{title}</div>{arr.map(card)}</React.Fragment>) : null;
        return (<div style={{flex:1,minHeight:0,overflow:'auto',display:'flex',flexDirection:'column'}}>
          {weekBlock}
          <div className="entity-area">
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:8,alignItems:'center'}}>
            <span style={{color:'var(--text-muted)',fontSize:11}}>{upcoming.length} audiência(s) agendada(s)</span>
            <button className="btn-primary btn-sm" onClick={() => setModal({type:'create',entityType:'hearing',initial:{status:'agendada',modality:'presencial',hearingType:'instrucao',remindDays:'3'}})}>+ Nova audiência</button>
          </div>
          {all.length === 0 ? <div className="empty-state"><div className="empty-icon">⚖️</div><p>Nenhuma audiência cadastrada</p><p style={{fontSize:11,marginTop:8,color:'var(--text-muted)',maxWidth:420,textAlign:'center'}}>Cadastre audiências para acompanhar datas, colar roteiro e material de apoio, e ser avisado quando a data se aproximar.</p></div> : <>
            {grp('Esta semana', thisWeek, 'var(--red)')}
            {grp('Este mês', thisMonth, 'var(--text-secondary)')}
            {grp('Mais adiante', later, 'var(--text-muted)')}
            {grp('Sem data definida', noDate, 'var(--text-muted)')}
            {past.length > 0 && <><div style={{margin:'20px 0 8px',fontSize:11,color:'var(--text-muted)'}}>Realizadas / passadas ({past.length})</div>{past.slice(0,15).map(card)}</>}
          </>}
        </div></div>);
      })()}

      {/* ═══ OPERATION VIEW ═══ */}
      {viewMode === 'operation' && !activeOp && (
        <div className="welcome-screen"><h2>NEXUS</h2><p>Selecione uma operação na barra lateral.</p></div>
      )}
      {viewMode === 'operation' && activeOp && <>
        <div className="main-header">
          <div style={{flex:1,minWidth:0}}><h2>{activeOp.name}</h2>{activeOp.description&&<div style={{fontSize:12,color:'var(--text-secondary)',marginTop:4,lineHeight:1.5,maxWidth:'95%'}}>{activeOp.description}</div>}</div>
          <div className="header-actions" style={{display:'flex',alignItems:'center',gap:10}}>
            {(() => {
              const clsKeys = getOpClassifications(activeOp);
              if (!clsKeys.length) return null;
              return <div style={{display:'flex',flexWrap:'wrap',gap:6,justifyContent:'flex-end',maxWidth:440}}>
                {clsKeys.map(k => { const cls = OP_CLASSIFICATIONS[k]; return (
                  <span key={k} style={{fontSize:11,fontWeight:600,padding:'4px 12px',borderRadius:4,background:'rgba(255,255,255,0.04)',color:cls.color,border:`1px solid ${cls.border}`,letterSpacing:0.2}}>{cls.label}</span>
                ); })}
              </div>;
            })()}
            <button className="btn-secondary btn-sm" onClick={() => setModal({type:'edit',entityType:'operation',initial:activeOp})}>Editar</button>
          </div>
        </div>
        {opStats && <div style={{display:'flex',background:'var(--bg-main)',borderBottom:'1px solid var(--border)',alignItems:'stretch'}}><div className="stats-bar" style={{flex:1,minWidth:0,borderBottom:'none'}}>
          <div className="stat-card"><div className="stat-label">Dívida Total</div><div className="stat-value" style={{color:'var(--text-primary)',fontSize:15}}>{fmtCur(opStats.total)}</div><div className="stat-sub">{opStats.debts} CDAs</div></div>
          <div className="stat-card"><div className="stat-label has-tip">Garantido (CDA)<span className="tip-content">Soma dos valores das CDAs com status "Garantida". Reflete a garantia formal reconhecida por CDA, não o valor de mercado dos bens constritados.</span></div><div className="stat-value" style={{color:'var(--text-secondary)',fontSize:15}}>{fmtCur(opStats.guar)}</div><div className="stat-sub">{opStats.total>0?((opStats.guar/opStats.total)*100).toFixed(0):0}%</div></div>
          <div className="stat-card has-tip" onClick={() => { if (opStats.indispCount>0) setActiveTab('bens'); }} style={{cursor:opStats.indispCount>0?'pointer':'default'}}>
            <div className="stat-label">Indisponibilidades</div>
            <div className="stat-value" style={{color:opStats.indispHasValue?'var(--text-primary)':'var(--text-muted)',fontSize:opStats.indispHasValue?15:12}}>{opStats.indispLabel}</div>
            <div className="stat-sub">{opStats.indispCount > 0 ? `${opStats.indispCount} bem(ns)` : ''}</div>
            <span className="tip-content">{opStats.indispCount === 0 ? 'Nenhum bem com status de indisponibilidade cadastrado nesta operação.' : opStats.indispHasValue ? `Soma dos valores dos ${opStats.indispCount} bem(ns) com indisponibilidade ativa/requerida que possuem valor informado. Clique para ver a aba Bens.` : `${opStats.indispCount} bem(ns) constritado(s), mas nenhum com valor de avaliação preenchido. Informe os valores na aba Bens para ver o total aqui.`}</span>
          </div>
          <div className="stat-card"><div className="stat-label">Presc. CDA</div><div className="stat-value" style={{color:opStats.prescA>0?'var(--red)':'var(--text-muted)',fontSize:15}}>{opStats.prescA}</div><div className="stat-sub">≤180 dias</div></div>
          <div className="stat-card"><div className="stat-label">Presc. Interc.</div><div className="stat-value" style={{color:opStats.prescExec>0?'var(--red)':'var(--text-muted)',fontSize:15}}>{opStats.prescExec}</div><div className="stat-sub">≤365 dias</div></div>
          <div className={`stat-card ${opStats.openIntims>0?'alert-pulse-blue':''}`} onClick={() => { if (opStats.openIntims>0) setIntimWork(true); }} style={{cursor:opStats.openIntims>0?'pointer':'default'}}>
            <div className="stat-label">Intimações</div>
            <div className="stat-value" style={{color: opStats.overdueIntims > 0 ? 'var(--red)' : opStats.openIntims > 0 ? 'var(--blue)' : 'var(--text-muted)',fontSize:15}}>{opStats.openIntims}</div>
            <div className="stat-sub">{opStats.overdueIntims > 0 ? `${opStats.overdueIntims} vencida(s)` : opStats.openIntims > 0 ? 'em aberto' : 'nenhuma'}</div>
          </div>
          <div className={`stat-card ${opStats.openTasks>0?'alert-pulse-yellow':''}`} onClick={() => { if (opStats.openTasks>0) setActiveTab('tarefas'); }} style={{cursor:opStats.openTasks>0?'pointer':'default'}}>
            <div className="stat-label">Tarefas</div>
            <div className="stat-value" style={{color: opStats.overdueTasks > 0 ? 'var(--red)' : opStats.openTasks > 0 ? 'var(--yellow)' : 'var(--text-muted)',fontSize:15}}>{opStats.openTasks}</div>
            <div className="stat-sub">{opStats.overdueTasks > 0 ? `${opStats.overdueTasks} vencida(s)` : opStats.openTasks > 0 ? 'em aberto' : 'nenhuma'}</div>
          </div>
          </div>
              <div style={{display:'flex',flexDirection:'column',justifyContent:'center',gap:6,padding:'8px 18px',flexShrink:0,borderLeft:'1px solid var(--border)',background:'var(--bg-main)'}}>
                <div style={{display:'flex',gap:6,justifyContent:'flex-end'}}>
                  <button className="btn-secondary btn-sm has-tip" onClick={() => generateHandoverReport(activeOp)}>📄 Relatório<span className="tip-content">Gerar relatório de passagem de serviço (HTML imprimível): briefing, processos ativos, prazos abertos, bens constritos e alvos. Útil para férias, substituição ou prestação de contas.</span></button>
                  <button className="btn-secondary btn-sm" onClick={() => upsert('operations', { ...activeOp, lastReviewedAt: new Date().toISOString() })}>✓ Revisada</button>
                </div>
                <div style={{display:'flex',gap:8,justifyContent:'flex-end',alignItems:'center'}}>
                  {(() => { const rs = reviewStatus(activeOp); return (<span style={{fontSize:9,color:rs.color,fontWeight:600,padding:'2px 8px',borderRadius:3,background:`${rs.color.replace('var(--','rgba(').replace(')',', 0.1)')}`,border:`1px solid ${rs.color.replace('var(--','rgba(').replace(')',', 0.25)')}`}}>{rs.label}</span>); })()}
                  <span style={{fontSize:9,color:'var(--text-muted)'}}>Atualizada {activeOp.updatedAt ? new Date(activeOp.updatedAt).toLocaleDateString('pt-BR') : '—'}</span>
                </div>
              </div>
        </div>}
        {isDemo ? (<>
          <div className="demo-zones">
            {Object.entries(DEMO_ZONES).map(([z, cfg]) => (
              <button key={z} className={`demo-zone-btn ${demoZone===z?'active':''}`}
                onClick={() => setDemoZoneAndTab(z, cfg.tabs.includes(activeTab) ? activeTab : cfg.tabs[0])}>
                {cfg.label}
              </button>
            ))}
          </div>
          {DEMO_ZONES[demoZone]?.tabs.length > 1 && (
            <div className="demo-zone-sub">
              {DEMO_ZONES[demoZone].tabs.map(t => {
                const isInsights = t === 'insights';
                const insightAlerts = isInsights && activeOp ? allSuggestions.filter(s => s.opId === activeOp.id && s.priority === 'high' && !dismissedSuggestions.has(s.id)).length : 0;
                return (
                  <button key={t} className={`demo-zone-chip ${activeTab===t?'active':''}`}
                    onClick={() => startTabSwitch(() => { setActiveTab(t); setSelectedNode(null); })}>
                    {tabLabels[t]}
                    {insightAlerts > 0 && <span style={{display:'inline-block',width:7,height:7,borderRadius:'50%',background:'var(--red)',marginLeft:4,verticalAlign:'middle'}}></span>}
                  </button>
                );
              })}
            </div>
          )}
        </>) : (
          <div className="tabs">{tabList.map(t => {
            const isInsights = t === 'insights';
            const insightAlerts = isInsights && activeOp ? allSuggestions.filter(s => s.opId === activeOp.id && s.priority === 'high' && !dismissedSuggestions.has(s.id)).length : 0;
            return <button key={t} className={`tab ${activeTab===t?'active':''}`} onClick={() => startTabSwitch(() => {setActiveTab(t);setSelectedNode(null);})} style={isTabSwitching?{opacity:0.6}:undefined}>
              {tabLabels[t]}
              {insightAlerts > 0 && <span style={{display:'inline-block',width:7,height:7,borderRadius:'50%',background:'var(--red)',marginLeft:4,verticalAlign:'middle',boxShadow:'0 0 6px rgba(244,63,94,0.6)',animation:'pulse 2s infinite'}}></span>}
            </button>;
          })}</div>
        )}
        <div className={isDemo ? 'demo-zone-panel' : undefined} style={isDemo ? undefined : undefined}>
        {(() => {
          try { return renderTab(); }
          catch (err) {
            console.error('[Tab render error]', err);
            return (<div style={{padding:24,margin:24,background:'rgba(244,63,94,0.08)',border:'2px solid var(--red)',borderRadius:8,color:'var(--text-primary)'}}>
              <h3 style={{color:'var(--red)',marginTop:0}}>⚠ Erro ao renderizar aba "{tabLabels[activeTab]||activeTab}"</h3>
              <div style={{fontFamily:'monospace',fontSize:11,background:'var(--bg-deep)',padding:12,borderRadius:4,whiteSpace:'pre-wrap',maxHeight:400,overflow:'auto'}}>
                <div style={{color:'var(--red)',fontWeight:700,marginBottom:6}}>{err.name}: {err.message}</div>
                <div style={{color:'var(--text-muted)'}}>{err.stack}</div>
              </div>
              <div style={{marginTop:12,fontSize:11,color:'var(--text-secondary)'}}>Clique em outra aba para continuar trabalhando. Reporte o erro acima.</div>
            </div>);
          }
        })()}
        </div>
      </>}
    </div>

    <Modal show={!!modal} onClose={() => setModal(null)} title={modalTitle} wide={modal?.entityType==='measure'||modal?.entityType==='intimation'||modal?.entityType==='hearing'}>
      {renderForm()}
    </Modal>

    {/* Response modal — register medida adotada in response to intimação */}
    <Modal show={!!respondModal} onClose={() => setRespondModal(null)} title={respondModal ? (respondModal.type === 'peticionamento' ? 'Registrar resposta — 📝 Peticionamento' : respondModal.type === 'ciencia' ? 'Registrar resposta — ✓ Ciência' : respondModal.type === 'outra' ? 'Registrar resposta — ⋯ Outra medida' : 'Registrar atuação') : ''}>
      {respondModal && <RespondForm intim={respondModal.intim} type={respondModal.type} onSave={(action) => handleRespondIntim(respondModal.intim, action)} onCancel={() => setRespondModal(null)} />}
    </Modal>

    {/* Diagnóstico de integridade */}
    {showDiagnostico && (() => {
      const achados = runDiagnostics(data);
      const SEV = { alta: { c:'var(--red)', l:'ALTA' }, media: { c:'var(--yellow)', l:'MÉDIA' }, info: { c:'var(--blue)', l:'INFO' } };
      const aplicar = (f) => {
        const n = f.itens.length;
        if (!confirm(`Aplicar correção em ${n} registro(s)?\n\n${f.titulo}\n\nA ação é registrada e pode ser desfeita com Ctrl+Z.`)) return;
        pushUndo('Correção do diagnóstico: ' + f.titulo);
        setData(prev => {
          const next = { ...prev };
          if (f.id === 'mesa') {
            const alive = { intimation: new Set((next.intimations||[]).map(i=>i.id)), task: new Set((next.tasks||[]).map(t=>t.id)), hearing: new Set((next.hearings||[]).map(h=>h.id)) };
            next.desk = (next.desk||[]).filter(x => x && alive[x.type] && alive[x.type].has(x.id));
          } else if (f.id === 'vinculos') {
            const ids = new Set((next.executions||[]).map(e=>e.id));
            next.executions = (next.executions||[]).map(e => {
              let ch = e;
              if (ch.parentExecutionId && !ids.has(ch.parentExecutionId)) ch = { ...ch, parentExecutionId: null };
              if (Array.isArray(ch.linkedExecutionIds) && ch.linkedExecutionIds.some(x => !ids.has(x))) ch = { ...ch, linkedExecutionIds: ch.linkedExecutionIds.filter(x => ids.has(x)) };
              return ch;
            });
          } else if (f.id === 'orfaos') {
            const kill = new Set(f.itens.map(i => i.id));
            ['debts','executions','intimations','hearings','people','assets'].forEach(col => { next[col] = (next[col]||[]).map(x => kill.has(x.id) ? { ...x, operationId: '' } : x); });
          } else if (f.id === 'intimsemop') {
            const map = {}; f.itens.forEach(i => { map[i.id] = i.opId; });
            next.intimations = (next.intimations||[]).map(x => map[x.id] ? { ...x, operationId: map[x.id] } : x);
          } else if (f.id === 'formato') {
            // Padroniza pelo formato do processo cadastrado em executions (a fonte mais confiável)
            const canon = {}; (next.executions||[]).forEach(e => { const n = normProc(e.processNumber); if (n && e.processNumber) canon[n] = e.processNumber; });
            ['debts','intimations','hearings'].forEach(col => { next[col] = (next[col]||[]).map(x => { const n = normProc(x.processNumber); return (n && canon[n] && canon[n] !== x.processNumber) ? { ...x, processNumber: canon[n] } : x; }); });
          }
          return next;
        });
      };
      return (<div className="global-search-overlay" onClick={() => setShowDiagnostico(false)}>
        <div className="global-search-box" onClick={e => e.stopPropagation()} style={{maxHeight:'85vh',display:'flex',flexDirection:'column',maxWidth:760}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 16px',borderBottom:'1px solid var(--border)'}}>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:'var(--text-primary)'}}>🩺 Diagnóstico de integridade</div>
              <div style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>{achados.length === 0 ? 'Nenhum problema encontrado.' : achados.reduce((s,f)=>s+f.itens.length,0) + ' registro(s) em ' + achados.length + ' categoria(s)'}</div>
            </div>
            <span style={{cursor:'pointer',color:'var(--text-muted)',fontSize:18}} onClick={() => setShowDiagnostico(false)}>✕</span>
          </div>
          <div style={{overflowY:'auto',padding:'12px 16px'}}>
            {achados.length === 0 && <div style={{padding:'28px 10px',textAlign:'center',color:'var(--text-muted)',fontSize:12}}>✓ Dados consistentes — nada a corrigir.</div>}
            {achados.map(f => { const sv = SEV[f.sev];
              return (<div key={f.id} style={{marginBottom:12,border:'1px solid var(--border)',borderLeft:`3px solid ${sv.c}`,borderRadius:6,padding:'10px 12px'}}>
                <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:4}}>
                  <span style={{fontSize:8,fontWeight:800,padding:'1px 6px',borderRadius:3,color:sv.c,border:`1px solid ${sv.c}`}}>{sv.l}</span>
                  <span style={{fontSize:12,fontWeight:700,color:'var(--text-primary)'}}>{f.titulo}</span>
                  <span style={{fontSize:11,color:'var(--text-muted)'}}>({f.itens.length})</span>
                  {f.fix && <button className="btn-secondary btn-xs" style={{marginLeft:'auto'}} onClick={() => aplicar(f)}>⚙ corrigir</button>}
                </div>
                <div style={{fontSize:10,color:'var(--text-muted)',lineHeight:1.5,marginBottom:6}}>{f.detalhe}</div>
                <div style={{maxHeight:132,overflowY:'auto',display:'flex',flexDirection:'column',gap:2}}>
                  {f.itens.slice(0,40).map((it,ix) => (<div key={ix} style={{display:'flex',gap:8,fontSize:11,padding:'2px 6px',background:'var(--bg-elevated)',borderRadius:3}}>
                    <span style={{fontFamily:'var(--font-mono)',color:'var(--text-secondary)',flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{it.texto}</span>
                    <span style={{color:'var(--text-muted)',fontSize:10,flexShrink:0}}>{it.sub}</span>
                  </div>))}
                  {f.itens.length > 40 && <div style={{fontSize:10,color:'var(--text-muted)',padding:'2px 6px'}}>+{f.itens.length-40} …</div>}
                </div>
              </div>);
            })}
          </div>
        </div>
      </div>);
    })()}

    {/* Change log modal */}
    {showChangeLog && (
      <div className="global-search-overlay" onClick={() => setShowChangeLog(false)}>
        <div className="global-search-box" onClick={e => e.stopPropagation()} style={{maxHeight:'80vh',display:'flex',flexDirection:'column'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'1px solid var(--border)'}}>
            <span style={{fontWeight:700,fontSize:13}}>📜 Histórico de alterações <span style={{fontWeight:400,color:'var(--text-muted)',fontSize:10}}>({(data.changeLog||[]).length} registros · cap 500)</span></span>
            <button onClick={() => setShowChangeLog(false)} style={{background:'transparent',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:16}}>✕</button>
          </div>
          <div style={{overflowY:'auto',padding:'8px 16px',flex:1}}>
            {(data.changeLog||[]).length === 0 ? (
              <div style={{padding:20,textAlign:'center',color:'var(--text-muted)',fontSize:11}}>Nenhuma alteração registrada ainda.<br/><span style={{fontSize:10}}>Mudanças de status, prescrição, prazos e classificações passam a ser registradas automaticamente a partir de agora.</span></div>
            ) : (data.changeLog||[]).map(le => {
              const op = data.operations.find(o => o.id === le.operationId);
              const fieldLabels = { status:'Status', prescriptionHandled:'Prescrição tratada', prescriptionDate:'Data de prescrição', value:'Valor', processTag:'Natureza', hasGuarantee:'Garantia', prescriptionInterrupted:'Presc. interrompida', responseAction:'Resposta', dateDeadline:'Prazo', classifications:'Classificações', dueDate:'Vencimento' };
              return (<div key={le.id} style={{padding:'7px 0',borderBottom:'1px solid var(--border)',fontSize:11}}>
                <div style={{display:'flex',justifyContent:'space-between',gap:8,flexWrap:'wrap'}}>
                  <span style={{fontWeight:600,color:'var(--text-primary)'}}>{le.ref}</span>
                  <span style={{color:'var(--text-muted)',fontSize:9,fontFamily:'var(--font-mono)'}}>{new Date(le.date).toLocaleString('pt-BR')}</span>
                </div>
                <div style={{color:'var(--text-secondary)',marginTop:2}}>
                  {fieldLabels[le.field] || le.field}: <span style={{color:'var(--text-muted)',textDecoration:'line-through'}}>{truncate(le.from, 40)}</span> → <span style={{color:'var(--gold)',fontWeight:600}}>{truncate(le.to, 40)}</span>
                  {op && <span style={{color:'var(--text-muted)',fontSize:9}}> · {op.name}</span>}
                </div>
              </div>);
            })}
          </div>
        </div>
      </div>
    )}

    {/* Undo toast */}
    {undoToast && (
      <div style={{position:'fixed',bottom:20,left:'50%',transform:'translateX(-50%)',zIndex:9999,background:'var(--bg-card)',border:'1px solid var(--border-light)',borderRadius:8,padding:'10px 16px',display:'flex',alignItems:'center',gap:12,boxShadow:'0 4px 20px rgba(0,0,0,0.5)'}}>
        <span style={{fontSize:12,color:'var(--text-secondary)'}}>🗑 {undoToast}</span>
        <button className="btn-secondary btn-sm" style={{fontWeight:700}} onClick={doUndo}>↺ Desfazer</button>
        <button onClick={() => setUndoToast(null)} style={{background:'transparent',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:14,padding:0}}>✕</button>
      </div>
    )}

    {/* Global Search */}
    {globalSearch && (
      <div className="global-search-overlay" onClick={() => setGlobalSearch(false)}>
        <div className="global-search-box" onClick={e => e.stopPropagation()}>
          <div className="gs-input-wrap">
            <input autoFocus value={gsQuery} onChange={e => setGsQuery(e.target.value)} placeholder="Buscar CPF/CNPJ, processo, pessoa, operação..." />
          </div>
          <div className="gs-results">
            {gsQuery.length < 2 ? <div className="gs-empty">Digite ao menos 2 caracteres... <br/><span style={{fontSize:10,color:'var(--text-muted)'}}>Atalho: Ctrl+K</span></div> :
            gsResults.length === 0 ? <div className="gs-empty">Nenhum resultado para "{gsQuery}"</div> :
            gsResults.map((r, i) => (
              <div key={i} className="gs-result-item" onClick={() => {
                setGlobalSearch(false);
                if (r.type === 'operation') {
                  setActiveOpId(r.opId); setViewMode('operation');
                  return;
                }
                if (r.type === 'intimation') {
                  setViewMode('intimacoes');
                  if (r.entity) setTimeout(() => setModal({type:'edit',entityType:'intimation',initial:r.entity}), 100);
                  return;
                }
                // All other types: navigate to operation + tab, then open modal
                if (r.opId) { setActiveOpId(r.opId); setViewMode('operation'); }
                if (r.tab) setActiveTab(r.tab);
                if (r.entity && r.entityType) {
                  setTimeout(() => setModal({type:'edit',entityType:r.entityType,initial:r.entity}), 150);
                }
              }}>
                <div className="gs-name">{r.icon} {r.name}</div>
                <div className="gs-meta">{r.meta}</div>
                {r.opName && <div className="gs-op">◎ {r.opName}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
    {intimWork && activeOp && (() => {
        const openIntims = (data.intimations || []).filter(x => x.operationId === activeOp.id)
          .filter(x => (x.status === 'pendente_analise' || x.status === 'aguardando_subsidios' || x.status === 'peca_edicao') && !x.responseAction)
          .sort((a, b) => (a.dateDeadline || '9999').localeCompare(b.dateDeadline || '9999'));
        return (
          <div className="intimwork-overlay" onClick={() => setIntimWork(false)}>
            <div className="intimwork-box" onClick={e => e.stopPropagation()}>
              <div className="intimwork-header">
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:13,fontWeight:700,color:'var(--text-primary)'}}>📬 Intimações abertas</span>
                  <span style={{fontSize:11,color:'var(--text-muted)'}}>{truncate(activeOp.name, 32)}</span>
                  <span style={{fontSize:10,color:'var(--blue)',fontWeight:600}}>({openIntims.length})</span>
                </div>
                <button className="btn-secondary btn-xs" onClick={() => setIntimWork(false)}>✕</button>
              </div>
              <div className="intimwork-body">
                {openIntims.length === 0 ? (
                  <div style={{padding:24,textAlign:'center',color:'var(--text-muted)',fontSize:12}}>Nenhuma intimação aberta nesta operação.</div>
                ) : openIntims.map(intim => {
                  const st = INTIM_STATUSES[intim.status] || { label: intim.status, badge: 'badge-muted' };
                  const dl = intim.dateDeadline ? daysUntil(intim.dateDeadline) : null;
                  const party = (() => {
                    const name = intim.partyName || '';
                    if (name && !name.toUpperCase().includes('FAZENDA') && !name.toUpperCase().includes('UNIÃO')) return name;
                    const parts = (intim.parties || '').split(/\s+X\s+/i);
                    for (const p of parts) { if (!p.toUpperCase().includes('FAZENDA') && !p.toUpperCase().includes('UNIÃO')) return truncate(p.replace(/^(Executado|Embargante|Autor|Réu|Requerido|Requerente|Exequente|Embargado|Impetrante)\s+/i,'').replace(/\(.*/, '').trim(), 50); }
                    return '—';
                  })();
                  const iNotes = intim.notesList || (intim.notes ? [intim.notes] : []);
                  return (
                    <div className="intimwork-card" key={intim.id}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,flexWrap:'wrap'}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                          <span style={{fontFamily:'var(--font-mono)',fontSize:12,color:'var(--text-primary)'}}>{intim.processNumber || '—'}</span>
                          <button className="btn-secondary btn-xs" onClick={() => navigator.clipboard.writeText(intim.processNumber || '')}>📋 Copiar nº</button>
                          {intim.jurisdiction && <span style={{fontSize:10,color:'var(--text-muted)'}}>{intim.jurisdiction}</span>}
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <span className={`badge ${st.badge}`} style={{fontSize:9}}>{st.label}</span>
                          {dl !== null && <span style={{fontSize:10,fontWeight:600,color: dl < 0 ? 'var(--red)' : dl <= 3 ? 'var(--yellow)' : 'var(--text-secondary)'}}>{dl < 0 ? `${Math.abs(dl)}d vencido` : dl === 0 ? 'vence hoje' : `${dl}d`}</span>}
                        </div>
                      </div>
                      <div style={{marginTop:6,fontSize:12,color:'var(--text-secondary)'}}>{party}</div>
                      {intim.className && <div style={{marginTop:2,fontSize:11,color:'var(--text-muted)'}}>{intim.className}</div>}
                      {(intim.dateStart || intim.dateDeadline) && <div style={{marginTop:4,fontSize:10,color:'var(--text-muted)'}}>{intim.dateStart ? `Início ${fmtDate(intim.dateStart)}` : ''}{intim.dateDeadline ? ` · Prazo ${fmtDate(intim.dateDeadline)}` : ''}</div>}
                      {intim.eventDescription && <div style={{marginTop:6,fontSize:11,color:'var(--text-secondary)',whiteSpace:'pre-wrap'}}>{intim.eventDescription}</div>}
                      {intim.object && <div style={{marginTop:4,fontSize:11,color:'var(--text-secondary)',whiteSpace:'pre-wrap'}}>{intim.object}</div>}
                      {iNotes.length > 0 && <div className="note-stack" style={{marginTop:8}}>{iNotes.map((n, ix) => <div className="note-item note-item-full" key={ix}>{linkify(typeof n === 'string' ? n : (n.text || n.content || ''))}</div>)}</div>}
                      {intim.minutaUrl && <div style={{marginTop:6}}><a href={intim.minutaUrl} target="_blank" rel="noopener noreferrer" className="intim-doc-link">📎 Minuta / documento</a></div>}
                      <div style={{display:'flex',gap:8,marginTop:10}}>
                        <button className="btn-sm" style={{background:'var(--blue)',color:'#fff'}} onClick={() => setModal({type:'edit',entityType:'intimation',initial:intim})}>✎ Editar / inserir notas e documentos</button>
                        <button className="btn-secondary btn-sm" onClick={() => setRespondModal({intim, type:null})}>✓ Registrar atuação</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}
  </div>);
}

// ═══════════════════════════════════════════════
// FORM ROUTER
// ═══════════════════════════════════════════════
// Checkbox multi-select component
// Click-to-copy element with visual feedback
function Copyable({ value, children, className = '', style }) {
  const [copied, setCopied] = React.useState(false);
  if (!value) return <span>{children || '—'}</span>;
  return (<span className={`copyable ${copied?'copied':''} ${className}`} style={style}
    title="Clique para copiar"
    onClick={e => {
      e.stopPropagation();
      navigator.clipboard.writeText(value).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    }}>{children || value}</span>);
}

// Inline help tooltip — pass children as the trigger element
function HelpIcon({ tip }) {
  return (<span className="has-tip" style={{cursor:'help',marginLeft:4,fontSize:11,color:'var(--text-muted)'}}>ⓘ
    <span className="tip-content">{tip}</span>
  </span>);
}

// Renders chips for all responsible persons of a CDA, color-coded by role
function ResponsibilityChips({ cdaId, data, onClickPerson }) {
  const links = (data?.links?.cdaResponsibilities || []).filter(r => r.cdaId === cdaId);
  if (links.length === 0) return <span style={{fontSize:10,color:'var(--text-muted)',fontStyle:'italic'}}>sem responsável</span>;
  // Sort: originario first, then others
  const sorted = [...links].sort((a, b) => (a.role === 'originario' ? -1 : 1));
  return (<div style={{display:'flex',flexWrap:'wrap',gap:3}}>
    {sorted.map(link => {
      const person = (data?.people || []).find(p => p.id === link.personId);
      if (!person) return null;
      const roleInfo = RESPONSIBILITY_ROLES[link.role] || {};
      return (<span key={link.id} className="has-tip"
        onClick={(e) => { e.stopPropagation(); if (onClickPerson) onClickPerson(person); }}
        style={{display:'inline-flex',alignItems:'center',gap:3,padding:'1px 6px',background:roleInfo.bg||'var(--bg-elevated)',color:roleInfo.color||'var(--text-secondary)',borderRadius:3,fontSize:9,fontWeight:600,cursor:'pointer',border:`1px solid ${roleInfo.color||'var(--border)'}30`}}>
        {roleInfo.icon} {truncate(person.name, 22)}
        <span className="tip-content"><strong>{roleInfo.label}</strong><br/>{person.name} ({person.cpfCnpj})<br/>{link.basis || roleInfo.desc}</span>
      </span>);
    })}
  </div>);
}

// Person sub-tabs: pills with "Todas" + one per person who has CDAs (in any role) in current operation
// ═══════════════════════════════════════════════
// EDITOR RICO + PAINEL DE BLOCOS DE ESTRATÉGIA
// ═══════════════════════════════════════════════
// Editor contentEditable NÃO-controlado: o HTML digitado vai para draftRef (ref),
// nunca para state — zero re-render por tecla, zero lag de digitação.
function RichNoteEditor({ initialHtml, placeholder, draftRef, autoFocus }) {
  const edRef = React.useRef(null);
  React.useEffect(() => {
    const ed = edRef.current;
    if (!ed) return;
    ed.innerHTML = initialHtml || '';
    draftRef.current = initialHtml || '';
    if (autoFocus) {
      ed.focus();
      try {
        const sel = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(ed);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      } catch (e) {}
    }
  }, []);
  const exec = (cmd, val) => {
    const ed = edRef.current; if (!ed) return;
    ed.focus();
    if (cmd === 'hiliteColor') { try { document.execCommand('styleWithCSS', false, true); } catch (e) {} }
    try { document.execCommand(cmd, false, val); } catch (e) {}
    if (cmd === 'hiliteColor') { try { document.execCommand('styleWithCSS', false, false); } catch (e) {} }
    draftRef.current = ed.innerHTML;
  };
  const HL = [
    ['rgba(212,168,56,0.45)', 'Marca-texto amarelo'],
    ['rgba(64,168,112,0.45)', 'Marca-texto verde'],
    ['rgba(229,64,96,0.45)', 'Marca-texto vermelho']
  ];
  const tb = (e) => e.preventDefault(); // a toolbar não rouba foco/seleção do editor
  return (<div className="rich-note">
    <div className="rn-toolbar" onMouseDown={tb}>
      <button type="button" className="rn-btn" style={{fontWeight:800}} title="Negrito (Ctrl+B)" onClick={() => exec('bold')}>B</button>
      <button type="button" className="rn-btn" style={{fontStyle:'italic'}} title="Itálico (Ctrl+I)" onClick={() => exec('italic')}>I</button>
      <button type="button" className="rn-btn" style={{textDecoration:'underline'}} title="Sublinhado (Ctrl+U)" onClick={() => exec('underline')}>U</button>
      <span className="rn-sep"></span>
      {HL.map(([c, t]) => <button key={c} type="button" className="rn-swatch" style={{background:c}} title={t} onClick={() => exec('hiliteColor', c)}></button>)}
      <button type="button" className="rn-btn" title="Remover marca-texto" onClick={() => exec('hiliteColor', 'transparent')}>⌫</button>
      <span className="rn-sep"></span>
      <button type="button" className="rn-btn" title="Lista com marcadores" onClick={() => exec('insertUnorderedList')}>•≡</button>
      <button type="button" className="rn-btn" title="Limpar formatação da seleção" onClick={() => exec('removeFormat')}>Tx</button>
    </div>
    <div ref={edRef} className="rn-editor" contentEditable suppressContentEditableWarning
      data-placeholder={placeholder || 'Escreva aqui...'}
      onInput={() => { draftRef.current = edRef.current ? edRef.current.innerHTML : ''; }} />
  </div>);
}

// Painel de blocos: feed cronológico de entradas tipadas (Risco, Estratégia, Decisão judicial,
// Providência, Replicação, Observação), com fixar no topo e formatação rica.
// Popup de registro de fase (régua dos cards IDPJ/MCF/Central). Estado LOCAL para digitação fluida:
// grava no estado global (onCommit) só ao sair do campo (blur), ao fechar ou ao registrar nota —
// evita re-render da aba inteira a cada tecla (causa da lentidão anterior).
function StagePopup({ sd, rec, onCommit, onDelete, onAddNote, onClose }) {
  const isMulti = !!sd.multiRecurso;
  const [date, setDate] = React.useState((rec && rec.date) || '');
  const [evento, setEvento] = React.useState((rec && rec.evento) || '');
  const [outcome, setOutcome] = React.useState((rec && rec.outcome) || '');
  const [recursos, setRecursos] = React.useState(() => getRecursos(rec).map(r => ({ ...r })));
  const outs = Object.entries(sd.outcomes);
  const hadData = rec && (rec.date || rec.evento || rec.outcome || rec.recursos || rec.procs);
  const commit = () => {
    if (isMulti) { if (recursos.length || (rec && (rec.recursos || rec.procs))) onCommit({ recursos, procs: undefined }); return; }
    if (date || evento || outcome || hadData) onCommit({ date, evento, outcome });
  };
  const close = () => { commit(); onClose(); };
  const noteText = () => {
    if (isMulti) { if (!recursos.length) return null; return sd.label + ': ' + recursos.map((r,i) => `${i+1}) ${r.date?fmtDate(r.date):'s/ data'}${r.proc?' · proc. '+r.proc:''}${r.outcome&&sd.outcomes[r.outcome]?' ('+sd.outcomes[r.outcome]+')':''}`).join('; '); }
    if (!date && !evento && !outcome) return null;
    const outLbl = outcome && sd.outcomes[outcome] ? ' — ' + sd.outcomes[outcome] : '';
    const evLbl = evento ? ' · Evento ' + evento : '';
    const dLbl = date ? ' · ' + fmtDate(date) : '';
    return sd.label + outLbl + evLbl + dLbl;
  };
  const updR = (ri, patch) => setRecursos(rs => rs.map((r,j) => j===ri ? { ...r, ...patch } : r));
  const rmR = (ri) => setRecursos(rs => rs.filter((_,j) => j!==ri));
  const hasData = isMulti ? recursos.length > 0 : (!!date || !!evento || !!outcome);
  return (<div onClick={(e) => { e.stopPropagation(); close(); }} style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center'}}>
    <div onClick={e => e.stopPropagation()} style={{background:'var(--bg-card)',border:'1px solid var(--border-light)',borderRadius:8,padding:16,width:300,maxWidth:'92vw',boxShadow:'0 16px 48px rgba(0,0,0,0.55)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <span style={{fontSize:13,fontWeight:700,color:'var(--text-primary)'}}>{sd.label}</span>
        <span style={{cursor:'pointer',color:'var(--text-muted)',fontSize:16}} onClick={close}>✕</span>
      </div>
      {isMulti ? (<div style={{marginBottom:14}}>
        <label style={{fontSize:9,color:'var(--text-muted)',display:'block',marginBottom:6}}>Recursos interpostos <span style={{opacity:0.7}}>(um ou mais)</span></label>
        {recursos.length === 0 && <div style={{fontSize:10,color:'var(--text-muted)',fontStyle:'italic',marginBottom:6}}>Nenhum recurso registrado.</div>}
        {recursos.map((r, ri) => (<div key={ri} style={{border:'1px solid var(--border)',borderRadius:5,padding:8,marginBottom:6}}>
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
            <span style={{fontSize:11,fontWeight:700,color:'var(--text-secondary)',minWidth:14}}>{ri+1}</span>
            <input type="date" value={r.date||''} onChange={e => updR(ri, { date: e.target.value })} style={{flex:1,fontSize:11,padding:'4px 6px',background:'var(--bg-input)',color:'var(--text-primary)',border:'1px solid var(--border)',borderRadius:4}} />
            <span style={{cursor:'pointer',color:'var(--text-muted)',fontSize:12}} title="Remover recurso" onClick={() => rmR(ri)}>✕</span>
          </div>
          <input value={r.proc||''} onChange={e => updR(ri, { proc: e.target.value })} placeholder="nº do processo do recurso (opcional)" style={{width:'100%',fontSize:10,padding:'4px 6px',marginBottom:6,background:'var(--bg-input)',color:'var(--text-primary)',border:'1px solid var(--border)',borderRadius:4,boxSizing:'border-box',fontFamily:'var(--font-mono)'}} />
          <div style={{display:'flex',gap:5}}>
            {outs.map(([ok,ol]) => { const on = r.outcome === ok; const oc = outcomeColor(ok);
              return <button key={ok} type="button" onClick={() => updR(ri, { outcome: on?'':ok })} style={{flex:1,fontSize:9,padding:'3px 4px',borderRadius:4,cursor:'pointer',border:`1px solid ${on?oc:'var(--border)'}`,background:on?outcomeTint(ok):'transparent',color:on?oc:'var(--text-secondary)',fontWeight:on?700:400}}>{ol}</button>; })}
          </div>
        </div>))}
        <button type="button" onClick={() => setRecursos(rs => [...rs, { date:'', proc:'', outcome:'pendente' }])} style={{fontSize:10,padding:'4px 10px',borderRadius:4,border:'1px dashed var(--border)',background:'transparent',color:'var(--text-secondary)',cursor:'pointer'}}>+ adicionar recurso</button>
      </div>) : (<>
        {outs.length > 0 && <div style={{display:'flex',gap:6,marginBottom:12}}>
          {outs.map(([ok,ol]) => { const on = outcome === ok; const oc = outcomeColor(ok);
            return <button key={ok} type="button" onClick={() => setOutcome(on?'':ok)} style={{flex:1,fontSize:11,padding:'6px 8px',borderRadius:5,cursor:'pointer',border:`1px solid ${on?oc:'var(--border)'}`,background:on?outcomeTint(ok):'transparent',color:on?oc:'var(--text-secondary)',fontWeight:on?700:400}}>{ol}</button>; })}
        </div>}
        <div style={{display:'flex',gap:8,marginBottom:14}}>
          <div style={{flex:1}}><label style={{fontSize:9,color:'var(--text-muted)',display:'block',marginBottom:3}}>Data</label><input type="date" value={date} onChange={e => setDate(e.target.value)} onBlur={commit} style={{width:'100%',fontSize:11,padding:'5px 7px',background:'var(--bg-input)',color:'var(--text-primary)',border:'1px solid var(--border)',borderRadius:4,boxSizing:'border-box'}} /></div>
          <div style={{width:100}}><label style={{fontSize:9,color:'var(--text-muted)',display:'block',marginBottom:3}}>Nº do evento</label><input value={evento} onChange={e => setEvento(e.target.value)} onBlur={commit} placeholder="ex.: 5" style={{width:'100%',fontSize:11,padding:'5px 7px',background:'var(--bg-input)',color:'var(--text-primary)',border:'1px solid var(--border)',borderRadius:4,boxSizing:'border-box'}} /></div>
        </div>
      </>)}
      <div style={{display:'flex',gap:8,justifyContent:'space-between',alignItems:'center'}}>
        <button type="button" onClick={() => { commit(); const t = noteText(); if (t) onAddNote(t); else alert('Nada para registrar.'); }} style={{fontSize:10,padding:'5px 8px',borderRadius:4,border:'1px dashed var(--border)',background:'transparent',color:'var(--blue)',cursor:'pointer'}}>↳ registrar como nota</button>
        <div style={{display:'flex',gap:6}}>
          {hasData && <button type="button" onClick={onDelete} style={{fontSize:10,padding:'5px 10px',borderRadius:4,border:'1px solid rgba(244,63,94,0.4)',background:'transparent',color:'var(--red)',cursor:'pointer'}}>Remover</button>}
          <button type="button" onClick={close} style={{fontSize:10,padding:'5px 14px',borderRadius:4,border:'none',background:'var(--accent)',color:'#1a1206',fontWeight:700,cursor:'pointer'}}>Fechar</button>
        </div>
      </div>
    </div>
  </div>);
}
// Os 3 campos legados (risks/strategicNotes/replicationNotes) aparecem como entradas "migradas"
// e são convertidos definitivamente para o novo modelo na primeira edição/criação.
function BriefingStrategyPanel({ op, upsert, leftTools }) {
  const briefing = op.briefing || {};
  const entries = getBriefingEntries(briefing);
  const [composer, setComposer] = React.useState(null); // null | { mode:'new'|'edit', entry }
  const [draftType, setDraftType] = React.useState('observacao');
  const [draftDate, setDraftDate] = React.useState('');
  const draftHtmlRef = React.useRef('');

  // Converte entradas virtuais legadas em entradas reais, mantendo ids estáveis (legacy_*)
  const materialize = (list) => list.map(en => en._legacy
    ? { id: en.id, type: en.type, html: en.html, pinned: !!en.pinned, eventDate: en.eventDate || '', createdAt: en.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString(), migrated: true }
    : en);
  const persist = (list) => {
    upsert('operations', { ...op, briefing: { ...briefing, entries: materialize(list) } });
  };

  const openNew = () => { setDraftType('observacao'); setDraftDate(new Date().toISOString().slice(0,10)); setComposer({ mode: 'new', entry: null }); };
  const openEdit = (en) => { setDraftType(en.type || 'observacao'); setDraftDate(en.eventDate || ''); setComposer({ mode: 'edit', entry: en }); };
  const saveComposer = () => {
    const clean = sanitizeNoteHtml(draftHtmlRef.current);
    if (!htmlToPlainText(clean)) { alert('A entrada está vazia.'); return; }
    const now = new Date().toISOString();
    if (composer.mode === 'new') {
      persist([{ id: uid(), type: draftType, html: clean, pinned: false, eventDate: draftDate || '', createdAt: now, updatedAt: now }, ...entries]);
    } else {
      persist(entries.map(x => x.id === composer.entry.id
        ? { id: x.id, type: draftType, html: clean, pinned: !!x.pinned, eventDate: draftDate || '', createdAt: x.createdAt || now, updatedAt: now, migrated: !!(x.migrated || x._legacy) }
        : x));
    }
    setComposer(null);
  };
  const togglePin = (en) => persist(entries.map(x => x.id === en.id ? { ...x, pinned: !x.pinned, updatedAt: new Date().toISOString() } : x));
  const removeEntry = (en) => { if (!confirm('Excluir esta entrada?')) return; persist(entries.filter(x => x.id !== en.id)); };

  const sortKey = (en) => en.eventDate || (en.createdAt || '').slice(0,10);
  const sorted = [...entries].sort((a, b) => { const p = (!!b.pinned) - (!!a.pinned); if (p) return p; return sortKey(b).localeCompare(sortKey(a)); });

  // Filtro por tipo, lembrado por operação (preferência de UI — não vai para os dados sincronizados)
  const filterKey = 'nexus_notasfilter_' + op.id;
  const [filterType, setFilterType] = React.useState(() => { try { return localStorage.getItem(filterKey) || 'all'; } catch { return 'all'; } });
  const [showFilter, setShowFilter] = React.useState(false);
  const changeFilter = (t) => { setFilterType(t); try { localStorage.setItem(filterKey, t); } catch {} };
  const visible = filterType === 'all' ? sorted : sorted.filter(en => (en.type || 'observacao') === filterType);

  // Composer renderizado como FUNÇÃO (nunca componente interno) — um componente interno
  // seria recriado a cada render do painel, remontando o RichNoteEditor e perdendo o texto.
  const renderComposer = () => (<div style={{marginBottom:10,padding:10,background:'var(--bg-elevated)',borderRadius:6,border:'1px solid var(--border)'}}>
    <div style={{display:'flex',gap:6,marginBottom:8,flexWrap:'wrap',alignItems:'center'}}>
      <select value={draftType} onChange={e => setDraftType(e.target.value)} style={{width:'auto',fontSize:11,padding:'4px 8px'}}>
        {Object.entries(BRIEFING_ENTRY_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
      </select>
      <input type="date" value={draftDate} onChange={e => setDraftDate(e.target.value)} style={{width:'auto',fontSize:11,padding:'4px 8px'}} title="Data do fato — define a posição na linha do tempo" />
      <span style={{fontSize:9,color:'var(--text-muted)'}}>data do fato (opcional)</span>
    </div>
    <RichNoteEditor initialHtml={composer.mode === 'edit' ? (composer.entry.html || '') : ''} placeholder="Escreva a entrada... use a barra acima para negrito, sublinhado e marca-texto" draftRef={draftHtmlRef} autoFocus />
    <div style={{display:'flex',gap:6,marginTop:8,justifyContent:'flex-end'}}>
      <button type="button" className="btn-secondary btn-sm" onClick={() => setComposer(null)}>Cancelar</button>
      <button type="button" className="btn-primary btn-sm" onClick={saveComposer}>{composer.mode === 'new' ? '+ Adicionar' : 'Salvar'}</button>
    </div>
  </div>);

  const hasLegacy = entries.some(e => e._legacy);
  return (<div>
    <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:8}}>
      {leftTools}
      <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
        {!composer && <button type="button" className="btn-secondary btn-xs" onClick={openNew}>+ Nova entrada</button>}
        {entries.length > 0 && !showFilter && <span style={{display:'inline-flex',alignItems:'center',gap:6}}>
          <button type="button" onClick={() => setShowFilter(true)} title="Filtrar entradas" style={{fontSize:11,lineHeight:1,padding:'2px 9px',border:'1px dashed var(--border)',borderRadius:999,background:'transparent',color:'var(--text-muted)',cursor:'pointer'}}>⚟</button>
          {filterType !== 'all' && BRIEFING_ENTRY_TYPES[filterType] && <span onClick={() => setShowFilter(true)} style={{fontSize:10,cursor:'pointer',color:BRIEFING_ENTRY_TYPES[filterType].color,fontWeight:700,borderBottom:`1.5px solid ${BRIEFING_ENTRY_TYPES[filterType].color}`,paddingBottom:1}}>{BRIEFING_ENTRY_TYPES[filterType].label}</span>}
        </span>}
      </div>
    </div>
    {entries.length > 0 && showFilter && <div style={{display:'flex',flexWrap:'wrap',gap:12,marginBottom:10,alignItems:'center'}}>
      {[['all',{label:'Todos'}]].concat(Object.entries(BRIEFING_ENTRY_TYPES)).map(([k,v]) => {
        const on = filterType === k;
        const col = k === 'all' ? 'var(--text-secondary)' : v.color;
        return <span key={k} onClick={() => { changeFilter(k); setShowFilter(false); }} style={{fontSize:10,cursor:'pointer',color:on?col:'var(--text-muted)',fontWeight:on?700:400,borderBottom:`1.5px solid ${on?col:'transparent'}`,paddingBottom:1,whiteSpace:'nowrap'}}>{v.label}</span>;
      })}
    </div>}
    {hasLegacy && <div style={{fontSize:9,color:'var(--text-muted)',fontStyle:'italic',marginBottom:8}}>conteúdo antigo preservado — será convertido em blocos na primeira edição</div>}
    {composer && composer.mode === 'new' && renderComposer()}
    {sorted.length === 0 && !composer && <div style={{padding:16,textAlign:'center',color:'var(--text-muted)',fontSize:11,border:'1px dashed var(--border)',borderRadius:6}}>Nenhuma entrada. Registre riscos, estratégias, decisões judiciais e providências em blocos datados.</div>}
    {sorted.length > 0 && visible.length === 0 && !composer && <div style={{padding:14,textAlign:'center',color:'var(--text-muted)',fontSize:11,border:'1px dashed var(--border)',borderRadius:6}}>Nenhuma entrada do tipo selecionado. <span style={{color:'var(--blue)',cursor:'pointer'}} onClick={() => changeFilter('all')}>Ver todas</span></div>}
    {visible.map(en => {
      if (composer && composer.mode === 'edit' && composer.entry.id === en.id) return <React.Fragment key={en.id}>{renderComposer()}</React.Fragment>;
      const t = BRIEFING_ENTRY_TYPES[en.type] || BRIEFING_ENTRY_TYPES.observacao;
      const dt = en.eventDate ? fmtDate(en.eventDate) : (en.createdAt ? fmtDate(en.createdAt.slice(0,10)) : '');
      return (<div key={en.id} className={`be-entry ${en.pinned ? 'pinned' : ''}`} style={{borderLeftColor: t.color}} onDoubleClick={() => openEdit(en)} title="Duplo clique para editar">
        <div className="be-entry-hd">
          <span className="be-type-badge" style={{color: t.color, background: t.bg}}>{t.label}</span>
          {en.pinned && <span style={{fontSize:9,color:'var(--gold)'}} title="Fixada no topo">📌</span>}
          {(en.migrated || en._legacy) && <span style={{fontSize:8,color:'var(--text-muted)',border:'1px dashed var(--border)',borderRadius:3,padding:'0 4px'}} title="Convertida automaticamente dos campos antigos (Riscos / Notas estratégicas / Replicação)">migrada</span>}
          {dt && <span className="be-entry-dt">{dt}</span>}
          <div className="be-entry-actions">
            <button type="button" className="be-icon-btn" title={en.pinned ? 'Desafixar' : 'Fixar no topo'} onClick={() => togglePin(en)}>📌</button>
            <button type="button" className="be-icon-btn" title="Editar" onClick={() => openEdit(en)}>✎</button>
            <button type="button" className="be-icon-btn" title="Excluir" onClick={() => removeEntry(en)}>✕</button>
          </div>
        </div>
        <div className="be-entry-body" dangerouslySetInnerHTML={{__html: en.html || ''}} />
      </div>);
    })}
  </div>);
}

function RespondForm({ intim, type: initialType, onSave, onCancel }) {
  const PETITION_TYPES = ['Manifestação', 'Contestação', 'Impugnação', 'Réplica', 'Contrarrazões', 'Recurso', 'Embargos de Declaração', 'Petição Avulsa', 'Outro'];
  const [type, setType] = React.useState(initialType || '');
  const [description, setDescription] = React.useState('');
  const [peticionType, setPeticionType] = React.useState('Manifestação');
  const [peticionUrl, setPeticionUrl] = React.useState('');
  const [docUrl, setDocUrl] = React.useState('');

  const isPeticion = type === 'peticionamento';
  const hasUrl = isPeticion ? !!peticionUrl.trim() : !!docUrl.trim();
  const canSave = type ? (isPeticion ? !!peticionUrl.trim() : !!description.trim()) : false;

  return (<div>
    {/* Context summary of the intimação */}
    <div style={{padding:10,background:'var(--bg-elevated)',borderRadius:'var(--radius)',marginBottom:12,fontSize:11}}>
      <div style={{fontSize:10,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:0.5,fontWeight:600,marginBottom:4}}>Intimação</div>
      <div style={{fontFamily:'var(--font-mono)',fontSize:11,fontWeight:600}}>{intim.processNumber || '—'}</div>
      <div style={{fontSize:10,color:'var(--text-secondary)',marginTop:2}}>{intim.className || ''} {intim.jurisdiction ? '· '+intim.jurisdiction : ''}</div>
      {intim.eventDescription && <div style={{fontSize:10,color:'var(--text-muted)',marginTop:4,fontStyle:'italic'}}>{intim.eventDescription}</div>}
      {intim.dateDeadline && <div style={{fontSize:10,color:'var(--yellow)',marginTop:4}}>Prazo final: {fmtDate(intim.dateDeadline)}</div>}
    </div>

    <div className="form-group"><label>Tipo de atuação</label>
      <select value={type} onChange={e => setType(e.target.value)}>
        <option value="">— Selecione —</option>
        <option value="peticionamento">📝 Peticionamento</option>
        <option value="ciencia">✓ Ciência</option>
        <option value="outra">⋯ Outra medida</option>
      </select>
    </div>

    {type && <>
      {isPeticion && <>
        <div className="form-row">
          <div className="form-group"><label>Tipo de peça</label>
            <select value={peticionType} onChange={e => setPeticionType(e.target.value)}>
              {PETITION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group"><label>URL da peça (Google Docs / arquivo) *</label>
          <input value={peticionUrl} onChange={e => setPeticionUrl(e.target.value)} placeholder="https://docs.google.com/document/d/..." autoFocus />
          <span style={{fontSize:9,color:'var(--text-muted)'}}>Cole o link do Google Doc ou outro local onde a peça está salva. A peça aparecerá automaticamente na aba Docs da operação.</span>
        </div>
      </>}

      <div className="form-group"><label>{isPeticion ? 'Observações sobre o peticionamento (opcional)' : type === 'ciencia' ? 'Descrição do ato — qual decisão/despacho objeto da ciência *' : 'Descrição da medida adotada *'}</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} autoFocus={!isPeticion}
          placeholder={isPeticion ? 'Ex: Manifestação solicitando expedição de mandado de penhora' : type === 'ciencia' ? 'Ex: Ciência da decisão monocrática evento 52 — não houve provimento ao recurso, sem necessidade de manifestação' : 'Ex: Encaminhamento ao setor de cálculos para apuração de valores. Aguardando retorno em 10 dias.'} />
      </div>

      {/* URL field for ciência/outra — optional, creates Doc when filled */}
      {!isPeticion && <div className="form-group">
        <label>📎 Link do documento / peça (opcional)</label>
        <input value={docUrl} onChange={e => setDocUrl(e.target.value)} placeholder="https://docs.google.com/document/d/..." />
        <span style={{fontSize:9,color:'var(--text-muted)'}}>Se houver peça judicial ou documento vinculado, cole o link aqui. {intim.operationId ? 'O documento será salvo automaticamente na aba Docs da operação.' : 'Se o nº de processo corresponder a uma operação existente, o documento será vinculado automaticamente.'}</span>
      </div>}

      <div style={{padding:10,background:'rgba(64,168,112,0.08)',borderRadius:'var(--radius)',marginTop:8,fontSize:10,color:'var(--text-secondary)',borderLeft:'2px solid var(--green)'}}>
        ⓘ Após confirmar, esta intimação será arquivada e removida da visão ativa{hasUrl ? '. O documento será adicionado à aba Docs da operação correspondente, com referência completa à intimação.' : '. Você poderá consultá-la depois pelo filtro "✓ Resolvidas".'}
      </div>

      {isPeticion && !canSave && <div style={{padding:8,background:'rgba(244,63,94,0.1)',borderRadius:'var(--radius)',marginTop:8,fontSize:10,color:'var(--red)',borderLeft:'2px solid var(--red)'}}>
        ⚠ Informe o URL da peça (campo obrigatório) para habilitar o botão de registro. Caso ainda não tenha o link do Google Doc, cole qualquer referência temporária (ex: "pendente upload") e edite depois.
      </div>}
    </>}

    <div className="form-actions">
      <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>
      <button type="button" className="btn-primary" disabled={!canSave} onClick={() => onSave({ type, description, peticionType, peticionUrl, docUrl })}>{isPeticion ? '📝 Registrar peticionamento' : type === 'ciencia' ? '✓ Confirmar ciência' : '⋯ Confirmar medida'}</button>
    </div>
  </div>);
}

function PersonSubtabs({ data, opId, currentFilter, onChange, mode }) {
  // mode: 'cda' (filter by responsibility links) or 'exec' (filter by linked CDAs through exec processNumber)
  const opPeople = data.people.filter(p => p.operationId === opId);
  const opDebts = data.debts.filter(d => d.operationId === opId);
  const opExecs = data.executions.filter(e => e.operationId === opId);
  const links = data.links?.cdaResponsibilities || [];

  const peopleWithRelevance = opPeople.map(p => {
    let count = 0;
    if (mode === 'cda') {
      count = links.filter(l => l.personId === p.id && opDebts.some(d => d.id === l.cdaId)).length;
    } else {
      // Count distinct executions linked to CDAs of this person
      const myCdaIds = new Set(links.filter(l => l.personId === p.id).map(l => l.cdaId));
      const myCdas = opDebts.filter(d => myCdaIds.has(d.id));
      const procNums = new Set(myCdas.map(d => d.processNumber).filter(Boolean));
      count = opExecs.filter(e => procNums.has(e.processNumber)).length;
    }
    return { person: p, count };
  }).filter(x => x.count > 0).sort((a,b) => b.count - a.count);

  if (peopleWithRelevance.length === 0) return null;
  const totalCount = peopleWithRelevance.reduce((s,x) => s+x.count, 0);

  return (<div style={{display:'flex',gap:4,flexWrap:'wrap',padding:'8px 10px',background:'var(--bg-elevated)',borderRadius:'var(--radius)',marginBottom:10,alignItems:'center'}}>
    <span style={{fontSize:9,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:0.5,fontWeight:600,marginRight:4}}>Filtrar por pessoa:</span>
    <button className={`btn-xs ${currentFilter==='all'?'btn-primary':'btn-secondary'}`} onClick={() => onChange('all')}>Todas <span style={{opacity:0.7}}>({totalCount})</span></button>
    {peopleWithRelevance.map(({person, count}) => {
      const isActive = currentFilter === person.id;
      const isRelacionada = person.operationRole === 'relacionada';
      return (<button key={person.id} className={`btn-xs ${isActive?'btn-primary':'btn-secondary'}`}
        onClick={() => onChange(person.id)}
        style={{opacity: isRelacionada ? 0.75 : 1, fontSize: 10}}>
        {isRelacionada && '📎 '}{truncate(person.name, 20)} <span style={{opacity:0.7}}>({count})</span>
      </button>);
    })}
  </div>);
}

function CheckList({ options, selected, onChange, emptyText }) {
  const sel = new Set(selected || []);
  const [q, setQ] = React.useState('');
  const [onlySel, setOnlySel] = React.useState(false);
  const toggle = (id) => {
    const n = new Set(sel);
    if (n.has(id)) n.delete(id); else n.add(id);
    onChange([...n]);
  };
  const ql = q.trim().toLowerCase();
  const matchesQ = (o) => !ql || (o.label || '').toLowerCase().includes(ql) || (o.badge || '').toLowerCase().includes(ql);
  let pool = options.filter(matchesQ);
  if (onlySel) pool = pool.filter(o => sel.has(o.id));
  const selPool = pool.filter(o => sel.has(o.id));
  const unselPool = pool.filter(o => !sel.has(o.id));
  const showTools = options.length > 8;
  const highlight = (text) => {
    const t = String(text || '');
    if (!ql) return t;
    const i = t.toLowerCase().indexOf(ql);
    if (i < 0) return t;
    return (<React.Fragment>{t.slice(0, i)}<mark style={{background:'var(--accent-dim)',color:'var(--accent)',borderRadius:2,padding:'0 1px'}}>{t.slice(i, i + ql.length)}</mark>{t.slice(i + ql.length)}</React.Fragment>);
  };
  const Row = (o) => (
    <label key={o.id} style={{display:'flex',alignItems:'center',gap:8,padding:'4px 6px',cursor:'pointer',borderRadius:4,fontSize:11,color:sel.has(o.id)?'var(--text-primary)':'var(--text-secondary)',background:sel.has(o.id)?'var(--accent-dim)':'transparent',transition:'background 0.15s',marginBottom:1}}>
      <input type="checkbox" checked={sel.has(o.id)} onChange={() => toggle(o.id)} style={{width:14,height:14,cursor:'pointer',flexShrink:0}} />
      <span style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{highlight(o.label)}</span>
      {o.badge && <span style={{fontSize:9,color:'var(--text-muted)',whiteSpace:'nowrap',flexShrink:0,marginLeft:6}}>{highlight(o.badge)}</span>}
    </label>
  );
  const selectVisible = () => { const n = new Set(sel); pool.forEach(o => n.add(o.id)); onChange([...n]); };
  const selectAll = () => onChange(options.map(o => o.id));
  const clearAll = () => onChange([]);
  if (options.length === 0) {
    return (<div style={{maxHeight:140,overflowY:'auto',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:4,background:'var(--bg-elevated)'}}>
      <div style={{fontSize:10,color:'var(--text-muted)',padding:6}}>{emptyText || 'Nenhum item disponível'}</div>
    </div>);
  }
  return (<div>
    {showTools && (<React.Fragment>
      <div style={{display:'flex',alignItems:'center',gap:6,border:'1px solid var(--border)',borderRadius:'var(--radius)',background:'var(--bg-input)',padding:'0 8px',marginBottom:6}}>
        <span style={{fontSize:11,color:'var(--text-muted)',flexShrink:0}}>🔎</span>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por número ou descrição…" style={{flex:1,minWidth:0,background:'transparent',border:'none',outline:'none',color:'var(--text-primary)',fontSize:11,fontFamily:'var(--font-mono)',padding:'7px 0'}} />
      {q && <span onClick={() => setQ('')} title="Limpar busca" style={{cursor:'pointer',color:'var(--text-muted)',fontSize:11,flexShrink:0,padding:'0 2px'}}>✕</span>}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6,flexWrap:'wrap'}}>
        <span style={{fontSize:10,color:'var(--accent)',fontWeight:600,flexShrink:0}}>{sel.size} de {options.length} selecionadas</span>
        <div style={{display:'flex',alignItems:'center',gap:5,marginLeft:'auto',flexWrap:'wrap'}}>
          <button type="button" className="btn-secondary btn-xs" onClick={selectVisible}>Selecionar visíveis</button>
          <button type="button" className="btn-secondary btn-xs" onClick={selectAll}>Todas</button>
          <button type="button" className="btn-secondary btn-xs" onClick={clearAll}>Limpar</button>
          <label style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:10,color:'var(--text-secondary)',cursor:'pointer'}}>
            <input type="checkbox" checked={onlySel} onChange={e => setOnlySel(e.target.checked)} style={{width:13,height:13,cursor:'pointer'}} /> Só selecionadas
          </label>
        </div>
      </div>
    </React.Fragment>)}
    <div style={{maxHeight:showTools?260:140,overflowY:'auto',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:4,background:'var(--bg-elevated)'}}>
      {pool.length === 0 ? <div style={{fontSize:10,color:'var(--text-muted)',padding:6}}>{ql ? ('Nenhum resultado para “' + q + '”.') : 'Nenhum item.'}</div> :
       (selPool.length > 0 && unselPool.length > 0 && !onlySel) ? (<React.Fragment>
         {selPool.map(Row)}
         <div style={{fontSize:9,color:'var(--text-muted)',letterSpacing:0.3,padding:'5px 6px 3px',borderTop:'1px dashed var(--border)',marginTop:3}}>selecionadas ({selPool.length}) · demais ({unselPool.length})</div>
         {unselPool.map(Row)}
       </React.Fragment>) :
       pool.map(Row)}
    </div>
  </div>);
}

function EntityFormRouter({ entityType, initial, data, operationId, onSave, onCancel, onDelete, addResponsibility, removeResponsibility }) {
  // Migração one-shot: se esta entidade é intimação com obs1/obs2 legado e ainda não tem notesList,
  // converte ao abrir o formulário. Os campos antigos são removidos no save (ver `save` abaixo).
  const migratedInitial = (() => {
    if (!initial) return {};
    if (entityType === 'intimation' && !initial.notesList && (initial.obs1 || initial.obs2)) {
      const legacyNotes = [initial.obs1, initial.obs2].filter(Boolean);
      return { ...initial, notesList: legacyNotes };
    }
    if (entityType === 'operation' && !Array.isArray(initial.classifications)) {
      const seed = (initial.classification && OP_CLASSIFICATIONS[initial.classification]) ? [initial.classification] : [];
      return { ...initial, classifications: seed };
    }
    return initial;
  })();
  const [form, setForm] = useState(migratedInitial);
  const [newNote, setNewNote] = useState('');
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  // Reusable multiple-notes editor
  const NotesList = ({ field = 'notesList', legacyField = 'notes', label = 'Notas / Observações' } = {}) => {
    const notes = form[field] || (form[legacyField] ? [form[legacyField]] : []);
    return (<div className="form-group"><label>{label}</label>
      {notes.map((n, i) => (
        <div key={i} style={{display:'flex',gap:6,marginBottom:4}}>
          <input value={n} style={{flex:1,fontSize:11}} onChange={e => { const u = [...notes]; u[i] = e.target.value; set(field, u); }} />
          <button type="button" className="btn-xs btn-danger" onClick={() => set(field, notes.filter((_,j)=>j!==i))}>✕</button>
        </div>
      ))}
      <div style={{display:'flex',gap:6}}>
        <input value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Nova observação..." style={{flex:1,fontSize:11}}
          onKeyDown={e => { if (e.key==='Enter' && newNote.trim()) { set(field, [...notes, newNote.trim()]); setNewNote(''); }}} />
        <button type="button" className="btn-secondary btn-xs" onClick={() => { if (newNote.trim()) { set(field, [...notes, newNote.trim()]); setNewNote(''); }}}>+ Nota</button>
      </div>
    </div>);
  };
  const save = () => {
    // For intimations and tasks, operationId comes from the form (user can unlink)
    const entityOpId = (entityType === 'intimation' || entityType === 'task' || entityType === 'watch' || entityType === 'hearing') ? (form.operationId || '') : (operationId || form.operationId || '');
    let payload = { ...form, operationId: entityOpId, id: form.id || uid() };
    // Operação: consolida classificações múltiplas e aposenta o campo legado `classification`.
    // = null (não delete) porque upsert faz merge {...old, ...new}.
    if (entityType === 'operation') {
      const sel = Array.isArray(payload.classifications)
        ? payload.classifications
        : (payload.classification ? [payload.classification] : []);
      payload.classifications = [...new Set(sel.filter(k => OP_CLASSIFICATIONS[k]))];
      payload.classification = null;
    }
    // Cleanup: se é intimação com notesList preenchido, descarta os campos legados obs1/obs2
    if (entityType === 'intimation' && Array.isArray(payload.notesList) && payload.notesList.length > 0) {
      delete payload.obs1;
      delete payload.obs2;
    }
    // Clear import flag when user interacts (saves/edits) — the intimation has been "treated"
    // Must set to null (not delete) because upsert does {...old, ...new} merge
    if (entityType === 'intimation') {
      payload._importFlag = null;
      payload._importFlagAt = null;
    }
    onSave(payload);
  };
  const del = () => onDelete && onDelete(form.id);

  const Actions = () => (<div className="form-actions">
    {form.id && onDelete && <button className="btn-danger btn-sm" onClick={del}>Excluir</button>}
    <button className="btn-secondary" onClick={onCancel}>Cancelar</button>
    <button className="btn-primary" onClick={save}>Salvar</button>
  </div>);

  if (entityType === 'operation') return (<>
    <div className="form-group"><label>Nome da Operação</label><input value={form.name||''} onChange={e=>set('name',e.target.value)} placeholder="Ex: Operação Fachada" /></div>
    <div className="form-group"><label>Descrição</label><textarea value={form.description||''} onChange={e=>set('description',e.target.value)} /></div>
    <div className="form-row">
      <div className="form-group"><label>Status</label><select value={form.status||'ativa'} onChange={e=>set('status',e.target.value)}><option value="ativa">Ativa</option><option value="encerrada">Encerrada</option></select></div>
      <div className="form-group"><label>Prioridade</label><select value={form.priority||'normal'} onChange={e=>set('priority',e.target.value)}><option value="alta">Alta</option><option value="normal">Normal</option><option value="baixa">Baixa</option></select></div>
    </div>
    <div className="form-group"><label>Classificação <span style={{fontWeight:400,color:'var(--text-muted)',fontSize:10}}>(múltipla)</span></label>
      {(() => {
        const sel = Array.isArray(form.classifications) ? form.classifications : (form.classification ? [form.classification] : []);
        const toggle = (k) => { const next = sel.includes(k) ? sel.filter(x=>x!==k) : [...sel, k]; set('classifications', next); };
        return (<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px 14px',padding:10,background:'var(--bg-input)',border:'1px solid var(--border)',borderRadius:6}}>
          {Object.entries(OP_CLASSIFICATIONS).map(([k,v]) => { const on = sel.includes(k); return (
            <label key={k} style={{display:'flex',alignItems:'center',gap:7,fontSize:12,cursor:'pointer',color:on?v.color:'var(--text-secondary)',fontWeight:on?600:400}}>
              <input type="checkbox" checked={on} onChange={()=>toggle(k)} style={{accentColor:'var(--accent)',cursor:'pointer'}} />
              {v.label}
            </label>
          ); })}
        </div>);
      })()}
      <span style={{fontSize:9,color:'var(--text-muted)'}}>Marque todas as classificações aplicáveis — aparecem juntas no cabeçalho da operação.</span>
    </div>
    <div className="form-row">
      <div className="form-group"><label>Sinal visual (sidebar)</label>
        <select value={form.opCategory||'none'} onChange={e=>set('opCategory',e.target.value)}>
          <option value="none">Nenhum</option>
          <option value="alta_relevancia">🔴 Alta relevância</option>
          <option value="replicar">🟡 Replicar medidas</option>
          <option value="nova">⚪ Nova</option>
          <option value="parcelada">🔵 Parcelada</option>
        </select>
        <span style={{fontSize:9,color:'var(--text-muted)'}}>Indicador colorido na barra lateral.</span>
      </div>
      <div className="form-group"><label>Intervalo de revisão</label>
        <select value={form.reviewInterval||'mensal'} onChange={e=>set('reviewInterval',e.target.value)}>
          <option value="semanal">Semanal (7 dias)</option>
          <option value="quinzenal">Quinzenal (14 dias)</option>
          <option value="mensal">Mensal (30 dias)</option>
          <option value="trimestral">Trimestral (90 dias)</option>
          <option value="none">Sem revisão automática</option>
        </select>
        <span style={{fontSize:9,color:'var(--text-muted)'}}>Cadência de revisão sistemática. Operações fora do prazo aparecem alertadas no Painel.</span>
      </div>
    </div>
    {NotesList()}
    {Actions()}
  </>);

  if (entityType === 'person') return (<>
    <div className="form-group"><label>Nome / Razão Social</label><input value={form.name||''} onChange={e=>set('name',e.target.value)} /></div>
    <div className="form-row">
      <div className="form-group"><label>Tipo</label><select value={form.subtype||'PJ'} onChange={e=>set('subtype',e.target.value)}><option value="PJ">PJ</option><option value="PF">PF</option></select></div>
      <div className="form-group"><label>CPF/CNPJ</label><input value={form.cpfCnpj||''} onChange={e=>set('cpfCnpj',e.target.value)} /></div>
    </div>
    <div className="form-row">
      <div className="form-group"><label>Papel descritivo</label><input value={form.role||''} onChange={e=>set('role',e.target.value)} placeholder="Sócio administrador, Laranja, Fachada..." /></div>
      <div className="form-group"><label>Posição na operação <HelpIcon tip="Alvo Direto = pessoa contra quem a operação é dirigida; será incluída em pedidos, IDPJ, indisponibilidades. Relacionada = cadastrada apenas para subsídio analítico (corresponsável colateral, sucessora não-alvo); aparece com destaque visual reduzido e pode ser filtrada nos totalizadores." /></label>
        <select value={form.operationRole||'alvo'} onChange={e=>set('operationRole',e.target.value)}>
          {Object.entries(PERSON_OPERATION_ROLES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
    </div>
    {NotesList()}
    {Actions()}
  </>);

  if (entityType === 'debt') {
    const pjPeople = (data?.people||[]).filter(p=>p.operationId===operationId&&p.subtype==='PJ');
    const pfPeople = (data?.people||[]).filter(p=>p.operationId===operationId&&p.subtype==='PF');
    const allPeople = [...pjPeople, ...pfPeople];
    const responsibilities = (data?.links?.cdaResponsibilities || []).filter(r => r.cdaId === form.id);
    const [newResp, setNewResp] = React.useState({ personId: '', role: 'coresponsavel_legal', basis: '' });
    return (<>
      <div className="form-group"><label>Devedor Originário (PJ)</label><select value={form.personId||''} onChange={e=>set('personId',e.target.value)}><option value="">Selecione...</option>{pjPeople.map(p=><option key={p.id} value={p.id}>{p.name} ({p.cpfCnpj})</option>)}</select></div>
      <div className="form-row-3">
        <div className="form-group"><label>Nº CDA</label><input value={form.cdaNumber||''} onChange={e=>set('cdaNumber',e.target.value)} /></div>
        <div className="form-group"><label>Valor (R$)</label><input type="number" step="0.01" value={form.value||''} onChange={e=>set('value',parseFloat(e.target.value)||0)} /></div>
        <div className="form-group"><label>Sistema</label><input value={form.system||''} onChange={e=>set('system',e.target.value)} placeholder="SIDA, Pandora..." /></div>
      </div>
      <div className="form-row-3">
        <div className="form-group"><label>Status</label><select value={form.status||'ativa'} onChange={e=>set('status',e.target.value)}>{Object.entries(DEBT_STATUSES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></div>
        <div className="form-group"><label>Data Prescrição</label><input type="date" value={form.prescriptionDate||''} onChange={e=>set('prescriptionDate',e.target.value)} /></div>
        <div className="form-group"><label>Data Inscrição</label><input type="date" value={form.inscriptionDate||''} onChange={e=>set('inscriptionDate',e.target.value)} /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Processo Judicial</label><input value={form.processNumber||''} onChange={e=>set('processNumber',e.target.value)} placeholder="Nº do processo vinculado" /></div>
        <div className="form-group"><label>Tributo</label><input value={form.tribute||''} onChange={e=>set('tribute',e.target.value)} placeholder="IRPJ, CSLL, PIS..." /></div>
      </div>

      {/* Corresponsáveis section */}
      {form.id && <div style={{padding:10,background:'var(--bg-elevated)',borderRadius:'var(--radius)',marginTop:8}}>
        <label style={{display:'flex',alignItems:'center',gap:6}}>👥 Corresponsáveis e Sucessores
          <HelpIcon tip="Adicione pessoas que respondem por esta CDA além do devedor originário — sucessores legais (art. 132/133 CTN), pessoas incluídas por IDPJ, sócios redirecionados, sucessores de fato. O originário é gerenciado pelo campo 'Devedor Originário' acima." />
        </label>
        {responsibilities.filter(r => r.role !== 'originario').length === 0 ? <div style={{fontSize:11,color:'var(--text-muted)',fontStyle:'italic',marginTop:6}}>Nenhum corresponsável adicionado.</div> :
        <div style={{marginTop:6,display:'flex',flexDirection:'column',gap:4}}>
          {responsibilities.filter(r => r.role !== 'originario').map(r => {
            const p = allPeople.find(pp => pp.id === r.personId);
            const ri = RESPONSIBILITY_ROLES[r.role] || {};
            return (<div key={r.id} style={{display:'flex',alignItems:'center',gap:6,padding:'6px 8px',background:'var(--bg-card)',borderRadius:4,borderLeft:`3px solid ${ri.color||'var(--border)'}`}}>
              <span style={{fontSize:14}}>{ri.icon}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:11,fontWeight:600}}>{p?.name || '?'} <span style={{fontSize:9,color:'var(--text-muted)'}}>({p?.cpfCnpj||''})</span></div>
                <div style={{fontSize:9,color:ri.color||'var(--text-muted)'}}>{ri.label}{r.basis ? ' · ' + r.basis : ''}</div>
              </div>
              <button type="button" className="btn-xs btn-danger" onClick={() => removeResponsibility(r.id)}>×</button>
            </div>);
          })}
        </div>}
        <div style={{marginTop:8,padding:8,background:'var(--bg-card)',borderRadius:4,border:'1px dashed var(--border)'}}>
          <div style={{fontSize:10,color:'var(--text-muted)',marginBottom:4,fontWeight:600,textTransform:'uppercase',letterSpacing:0.5}}>Adicionar corresponsável</div>
          <div className="form-row-3" style={{marginBottom:4}}>
            <div className="form-group"><label>Pessoa</label>
              <select value={newResp.personId} onChange={e=>setNewResp({...newResp,personId:e.target.value})} style={{fontSize:11}}>
                <option value="">Selecione...</option>
                {allPeople.filter(p => p.id !== form.personId && !responsibilities.some(r => r.personId === p.id)).map(p =><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Papel</label>
              <select value={newResp.role} onChange={e=>setNewResp({...newResp,role:e.target.value})} style={{fontSize:11}}>
                {Object.entries(RESPONSIBILITY_ROLES).filter(([k]) => k !== 'originario').map(([k,v]) =><option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
            </div>
            <div className="form-group" style={{display:'flex',alignItems:'flex-end'}}><button type="button" className="btn-primary btn-sm" disabled={!newResp.personId} onClick={() => {
              addResponsibility(form.id, newResp.personId, newResp.role, newResp.basis);
              setNewResp({ personId: '', role: 'coresponsavel_legal', basis: '' });
            }}>+ Adicionar</button></div>
          </div>
          <input value={newResp.basis} onChange={e=>setNewResp({...newResp,basis:e.target.value})} placeholder="Base legal/judicial (ex: 'Decisão evento 47 do IDPJ XXX', 'Sucessão por incorporação 03/2020')" style={{fontSize:11}} />
        </div>
      </div>}

      <div style={{padding:'10px 12px',background:'var(--bg-elevated)',borderRadius:'var(--radius)',marginTop:8}}>
        <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:12}}>
          <input type="checkbox" checked={!!form.prescriptionHandled} onChange={e => { set('prescriptionHandled', e.target.checked); if (e.target.checked && !form.prescriptionHandledAt) set('prescriptionHandledAt', new Date().toISOString().slice(0,10)); }} style={{width:16,height:16,cursor:'pointer'}} />
          <span><strong>Prescrição já tratada / declarada</strong> — marque quando a prescrição foi reconhecida no processo (sentença, baixa) ou após análise concluída. Remove dos alertas.</span>
        </label>
        {form.prescriptionHandled && <div style={{marginTop:8,paddingLeft:24}}>
          <div className="form-row">
            <div className="form-group"><label>Data do tratamento</label><input type="date" value={form.prescriptionHandledAt||''} onChange={e=>set('prescriptionHandledAt',e.target.value)} /></div>
            <div className="form-group"><label>Forma</label>
              <select value={form.prescriptionHandledType||'declarada'} onChange={e=>set('prescriptionHandledType',e.target.value)}>
                <option value="aguardando_reconhecimento">⏳ Prescrita — aguardando reconhecimento judicial</option>
                <option value="declarada">Declarada e baixada no processo</option>
                <option value="analisada_nao_consumada">Analisada — não houve prescrição</option>
                <option value="extinta">Extinta por prescrição</option>
              </select>
            </div>
          </div>
        </div>}
      </div>
      {NotesList()}
      {Actions()}
    </>);
  }

  if (entityType === 'execution') {
    const opExecs = (data?.executions||[]).filter(e=>e.operationId===operationId && e.id !== form.id);
    return (<>
    <div className="form-group"><label>Nº Processo</label><input value={form.processNumber||''} onChange={e=>set('processNumber',e.target.value)} placeholder="50000000020244047001" style={validateCNJ(form.processNumber) === false ? {borderColor:'var(--red)'} : {}} />
      {validateCNJ(form.processNumber) === false && <span style={{fontSize:10,color:'var(--red)',fontWeight:600}}>⚠ Dígito verificador CNJ inválido — confira o número (um typo aqui impede o casamento com importações do eproc).</span>}
    </div>
    <div className="form-row">
      <div className="form-group"><label>Classe</label><input value={form.className||''} onChange={e=>set('className',e.target.value)} placeholder="Execução Fiscal (SIDA)..." /></div>
      <div className="form-group"><label>Vara / Juízo</label><input value={form.court||''} onChange={e=>set('court',e.target.value)} /></div>
    </div>
    <div className="form-row">
      <div className="form-group"><label>Natureza / Destaque</label>
        <select value={form.processTag||'normal'} onChange={e=>set('processTag',e.target.value)}>
          <option value="normal">Processo comum</option>
          <option value="idpj">🔴 IDPJ — Incidente de Desconsideração</option>
          <option value="cautelar_fiscal">🟠 Medida Cautelar Fiscal</option>
          <option value="central">◆ Processo Central da Operação</option>
        </select>
      </div>
      <div className="form-group"><label>Status</label><select value={form.status||'ativa'} onChange={e=>set('status',e.target.value)}>{Object.entries(EXEC_STATUSES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></div>
    </div>
    {(form.processTag === 'idpj' || form.processTag === 'cautelar_fiscal') && (
      <div className="form-group"><label>Execuções Abrangidas</label>
        <CheckList
          options={opExecs.map(e => ({ id: e.id, label: e.processNumber||'EF', badge: e.court||'' }))}
          selected={form.linkedExecutionIds||[]}
          onChange={ids => set('linkedExecutionIds', ids)}
          emptyText="Cadastre execuções primeiro"
        />
      </div>
    )}
    <div className="form-row-3">
      <div className="form-group"><label>Garantia</label><select value={form.hasGuarantee?'sim':'nao'} onChange={e=>set('hasGuarantee',e.target.value==='sim')}><option value="nao">Não</option><option value="sim">Sim</option></select></div>
      <div className="form-group"><label>Presc. Interrompida</label><select value={form.prescriptionInterrupted?'sim':'nao'} onChange={e=>set('prescriptionInterrupted',e.target.value==='sim')}><option value="nao">Não</option><option value="sim">Sim</option></select></div>
      <div className="form-group"><label>Analytics</label><select value={form.analyticsRegistered?'sim':'nao'} onChange={e=>set('analyticsRegistered',e.target.value==='sim')}><option value="nao">❌ Pendente</option><option value="sim">✅ Registrado</option></select></div>
    </div>
    <div className="form-row">
      <div className="form-group"><label>Prev. Presc. Intercorrente</label><input type="date" value={form.prescriptionForecast||''} onChange={e=>set('prescriptionForecast',e.target.value)} /></div>
      <div className="form-group"><label>Data Protocolo</label><input type="date" value={form.protocolDate||''} onChange={e=>set('protocolDate',e.target.value)} /></div>
    </div>
    {/* Vínculo a outro processo — embargo, recurso, ou apenso */}
    {(() => {
      // Classify current process to determine the semantic of parentExecutionId
      const cn = (form.className || '').toLowerCase();
      const isEmbargo = /embargo/.test(cn);
      const isRecurso = /agravo|apela[çc][ãa]o|recurso(?!.*execu)|reclama[çc][ãa]o constitucional|mandado de seguran[çc]a/.test(cn);
      const kind = isEmbargo ? 'embargo' : isRecurso ? 'recurso' : 'apenso';
      const sectionLabel = kind === 'embargo' ? '🔗 Execução Embargada' : kind === 'recurso' ? '🔗 Processo de Origem do Recurso' : '📎 Apensamento';
      const fieldLabel = kind === 'embargo' ? 'Execução Fiscal embargada' : kind === 'recurso' ? 'Processo recorrido (EF, IDPJ, Cautelar ou outro)' : 'Apensado a (principal)';
      const emptyLabel = kind === 'embargo' ? '— Selecione a EF embargada —' : kind === 'recurso' ? '— Selecione o processo de origem —' : '— Não é apenso (processo independente ou principal) —';
      const dateLabel = kind === 'embargo' ? 'Data de oposição' : kind === 'recurso' ? 'Data de interposição' : 'Data do apensamento';
      const helpTip = kind === 'embargo' ? 'Vincule este embargo à Execução Fiscal que está sendo embargada. Ao vincular, o embargo aparece indentado sob a EF na aba Processos.'
        : kind === 'recurso' ? 'Vincule este recurso ao processo de origem — pode ser uma Execução Fiscal, um IDPJ, uma Cautelar Fiscal ou outro processo. Ao vincular, o recurso aparece indentado sob o processo de origem na aba Processos.'
        : 'Quando uma execução fiscal é apensada a outra, o prosseguimento ocorre nos autos do principal. Atos interruptivos da prescrição praticados no principal estendem-se aos apensos automaticamente.';
      // Options: for embargo/recurso, allow any other process (EFs, IDPJs, Cautelares, Centrais, etc.)
      // For regular apensamento, only show top-level EFs as before.
      const availableParents = kind === 'apenso'
        ? opExecs.filter(ex => !ex.parentExecutionId && ex.id !== form.id)
        : opExecs.filter(ex => ex.id !== form.id);
      // Group options by type for readability when it's recurso/embargo
      const groupOption = (ex) => {
        const ecn = (ex.className || '').toLowerCase();
        const tag = ex.processTag || 'normal';
        if (tag === 'idpj') return '🔴 IDPJ';
        if (tag === 'cautelar_fiscal') return '🟠 Cautelar Fiscal';
        if (tag === 'central') return '◆ Central';
        if (/execu[çc][ãa]o fiscal/.test(ecn)) return '⚖️ Execução Fiscal';
        if (/embargo/.test(ecn)) return '📎 Embargo';
        if (/agravo|apela|recurso|mandado/.test(ecn)) return '⚖️ Recurso';
        return '📋 Outro';
      };
      const grouped = {};
      availableParents.forEach(ex => {
        const g = groupOption(ex);
        if (!grouped[g]) grouped[g] = [];
        grouped[g].push(ex);
      });
      const groupOrder = ['⚖️ Execução Fiscal', '🔴 IDPJ', '🟠 Cautelar Fiscal', '◆ Central', '📎 Embargo', '⚖️ Recurso', '📋 Outro'];
      return (<div className="form-group" style={{padding:10,background:'var(--bg-elevated)',borderRadius:'var(--radius)'}}>
        <label style={{display:'flex',alignItems:'center',gap:6}}>{sectionLabel}
          <HelpIcon tip={helpTip} />
        </label>
        <div className="form-row">
          <div className="form-group"><label>{fieldLabel}</label>
            {/* Searchable process selector */}
            {(() => {
              const [searchTerm, setSearchTerm] = React.useState('');
              const allOptions = kind === 'apenso' ? availableParents : groupOrder.filter(g => grouped[g]).flatMap(g => grouped[g]);
              const filtered = searchTerm.length >= 2 ? allOptions.filter(ex => (ex.processNumber||'').includes(searchTerm) || (ex.court||'').toLowerCase().includes(searchTerm.toLowerCase()) || (ex.className||'').toLowerCase().includes(searchTerm.toLowerCase())) : allOptions;
              const current = form.parentExecutionId ? allOptions.find(ex => ex.id === form.parentExecutionId) : null;
              return (<div style={{position:'relative'}}>
                {current ? (
                  <div style={{display:'flex',alignItems:'center',gap:6,padding:'5px 8px',background:'var(--bg-deep)',border:'1px solid var(--border)',borderRadius:3,fontSize:11}}>
                    <span style={{fontFamily:'var(--font-mono)',flex:1}}>{current.processNumber}</span>
                    <span style={{fontSize:9,color:'var(--text-muted)'}}>{current.court || current.className || ''}</span>
                    <span style={{cursor:'pointer',color:'var(--text-muted)',fontSize:12}} onClick={() => set('parentExecutionId', '')}>✕</span>
                  </div>
                ) : (
                  <div>
                    <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                      placeholder={`Buscar entre ${allOptions.length} processos...`}
                      style={{width:'100%',fontSize:11,padding:'5px 8px',background:'var(--bg-deep)',color:'var(--text-primary)',border:'1px solid var(--border)',borderRadius:3,boxSizing:'border-box'}} />
                    {searchTerm.length >= 2 && filtered.length > 0 && (
                      <div style={{position:'absolute',top:'100%',left:0,right:0,maxHeight:200,overflowY:'auto',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:3,zIndex:20,boxShadow:'0 4px 12px rgba(0,0,0,0.4)'}}>
                        {filtered.slice(0, 20).map(ex => (
                          <div key={ex.id} style={{padding:'5px 8px',fontSize:10,cursor:'pointer',borderBottom:'1px solid rgba(255,255,255,0.03)',display:'flex',gap:6,alignItems:'center'}}
                            onMouseDown={() => { set('parentExecutionId', ex.id); setSearchTerm(''); }}>
                            <span style={{fontFamily:'var(--font-mono)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ex.processNumber || 'S/N'}</span>
                            <span style={{fontSize:9,color:'var(--text-muted)',maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ex.court || ''}{ex.className ? ` · ${ex.className}` : ''}</span>
                          </div>
                        ))}
                        {filtered.length > 20 && <div style={{padding:'4px 8px',fontSize:9,color:'var(--text-muted)',textAlign:'center'}}>+{filtered.length-20} resultados...</div>}
                      </div>
                    )}
                    {searchTerm.length >= 2 && filtered.length === 0 && <div style={{fontSize:10,color:'var(--text-muted)',marginTop:4}}>Nenhum processo encontrado.</div>}
                    {searchTerm.length < 2 && allOptions.length > 10 && <div style={{fontSize:9,color:'var(--text-muted)',marginTop:2}}>Digite ao menos 2 caracteres para filtrar ({allOptions.length} processos)</div>}
                  </div>
                )}
              </div>);
            })()}
          </div>
          {form.parentExecutionId && <div className="form-group"><label>{dateLabel}</label>
            <input type="date" value={form.apensadoEm||''} onChange={e=>set('apensadoEm',e.target.value)} />
          </div>}
        </div>
        {!form.parentExecutionId && form.id && (() => {
          const children = opExecs.filter(ex => ex.parentExecutionId === form.id);
          if (children.length === 0) return null;
          return <div style={{fontSize:11,color:'var(--text-secondary)',marginTop:6,padding:8,background:'var(--bg-card)',borderRadius:4}}>
            <strong style={{color:'var(--accent)'}}>🔗 Este processo é ORIGEM/PRINCIPAL de {children.length} processo(s) vinculado(s):</strong>
            <ul style={{marginTop:4,marginLeft:16,fontSize:10}}>
              {children.map(a => {
                const acn = (a.className||'').toLowerCase();
                const aKind = /embargo/.test(acn) ? 'embargo' : /agravo|apela|recurso|mandado/.test(acn) ? 'recurso' : 'apenso';
                return <li key={a.id} style={{fontFamily:'var(--font-mono)'}}>{a.processNumber} <span style={{fontSize:9,color:'var(--text-muted)',fontFamily:'var(--font-sans)'}}>— {aKind === 'embargo' ? 'embargo' : aKind === 'recurso' ? 'recurso' : 'apenso'}{a.className?` · ${a.className}`:''}</span></li>;
              })}
            </ul>
          </div>;
        })()}
      </div>);
    })()}
    {NotesList()}
    {form.id && form.processNumber && <div style={{padding:10,background:'var(--bg-elevated)',borderRadius:'var(--radius)',marginTop:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
      <span style={{fontSize:11,color:'var(--text-secondary)'}}>👁 Quer monitorar este processo após manifestação?</span>
      <button type="button" className="btn-secondary btn-xs" onClick={() => onSave({...form, _openWatch: true})}>Adicionar à watchlist</button>
    </div>}
    {Actions()}
  </>);
  }

  if (entityType === 'measure') {
    const opExecs = (data?.executions||[]).filter(e=>e.operationId===operationId);
    const opPeople = (data?.people||[]).filter(p=>p.operationId===operationId);
    const opAssets = (data?.assets||[]).filter(a=>a.operationId===operationId);
    // Merge executionId into linkedExecutionIds for backward compat
    const currentLinked = form.linkedExecutionIds || (form.executionId ? [form.executionId] : []);
    return (<>
      <div className="form-row">
        <div className="form-group"><label>Tipo</label><select value={form.subtype||'cautelar'} onChange={e=>set('subtype',e.target.value)}>{Object.entries(MEASURE_SUBTYPES).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
        <div className="form-group"><label>Nº Processo (se distinto)</label><input value={form.processNumber||''} onChange={e=>set('processNumber',e.target.value)} /></div>
      </div>
      <div className="form-group"><label>Execuções Fiscais Abrangidas</label>
        <CheckList
          options={opExecs.map(e => ({ id: e.id, label: e.processNumber||'EF', badge: `${e.court||''} ${e.className?'('+e.className+')':''}`.trim() }))}
          selected={currentLinked}
          onChange={ids => { set('linkedExecutionIds', ids); set('executionId', ids[0]||''); }}
          emptyText="Cadastre execuções primeiro"
        />
      </div>
      <div className="form-group"><label>Status</label><select value={form.status||'ativa'} onChange={e=>set('status',e.target.value)}><option value="ativa">Ativa</option><option value="deferida">Deferida</option><option value="indeferida">Indeferida</option><option value="extinta">Extinta</option></select></div>
      <div className="form-group"><label>Pessoas Alcançadas</label>
        <CheckList
          options={opPeople.map(p => ({ id: p.id, label: p.name, badge: p.subtype }))}
          selected={form.linkedPeopleIds||[]}
          onChange={ids => set('linkedPeopleIds', ids)}
          emptyText="Cadastre pessoas primeiro"
        />
      </div>
      <div className="form-group"><label>Bens Alcançados</label>
        <CheckList
          options={opAssets.map(a => ({ id: a.id, label: a.description||'Bem', badge: ASSET_SUBTYPES[a.subtype]||a.subtype }))}
          selected={form.linkedAssetIds||[]}
          onChange={ids => set('linkedAssetIds', ids)}
          emptyText="Cadastre bens primeiro"
        />
      </div>
      {NotesList()}
      {Actions()}
    </>);
  }

  if (entityType === 'asset') return (<>
    <div className="form-group"><label>Descrição</label><input value={form.description||''} onChange={e=>set('description',e.target.value)} placeholder="Imóvel Matrícula 12345 - CRI Curitiba" /></div>
    <div className="form-row-3">
      <div className="form-group"><label>Tipo</label><select value={form.subtype||'imovel'} onChange={e=>set('subtype',e.target.value)}>{Object.entries(ASSET_SUBTYPES).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
      <div className="form-group"><label>Valor (R$)</label><input type="number" step="0.01" value={form.value||''} onChange={e=>set('value',parseFloat(e.target.value)||0)} /></div>
      <div className="form-group"><label>Status</label><select value={form.status||'indisponibilidade_ativa'} onChange={e=>set('status',e.target.value)}>{Object.entries(ASSET_STATUSES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></div>
    </div>
    <div className="form-row">
      <div className="form-group"><label>Registro / Matrícula</label><input value={form.registry||''} onChange={e=>set('registry',e.target.value)} /></div>
      <div className="form-group"><label>Titular</label><select value={form.holderId||''} onChange={e=>set('holderId',e.target.value)}><option value="">Nenhum</option>
        {(data?.people||[]).filter(p=>p.operationId===operationId).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
    </div>
    <div className="form-group">
      <label>Registrado no Analytics</label>
      <select value={form.analyticsRegistered ? 'sim' : 'nao'} onChange={e => set('analyticsRegistered', e.target.value === 'sim')}>
        <option value="nao">❌ Não — Pendente de registro</option>
        <option value="sim">✅ Sim — Registrado</option>
      </select>
    </div>
    <div className="form-row">
      <div className="form-group"><label>Origem / Sistema</label><input value={form.source||''} onChange={e=>set('source',e.target.value)} placeholder="CNIB, Sisbajud, Renajud, Analytics..." /></div>
      <div className="form-group"><label>Processo Vinculado</label><input value={form.processRef||''} onChange={e=>set('processRef',e.target.value)} placeholder="Nº do processo de constrição" /></div>
    </div>
    {NotesList()}
    {Actions()}
  </>);

  if (entityType === 'model') {
    const tags = form.tags || [];
    return (<>
      <div className="form-group"><label>Título do modelo</label>
        <input value={form.title||''} onChange={e=>set('title',e.target.value)} placeholder="Ex: Manifestação — prescrição intercorrente (art. 40 LEF)" />
      </div>
      <div className="form-group"><label>Link (Google Docs ou outro)</label>
        <input value={form.url||''} onChange={e=>set('url',e.target.value)} placeholder="https://docs.google.com/document/d/..." />
      </div>
      <div className="form-row">
        <div className="form-group"><label>Categoria <span style={{fontWeight:400,color:'var(--text-muted)',fontSize:10}}>(tipo de peça)</span></label>
          <input list="model-cats" value={form.category||''} onChange={e=>set('category',e.target.value)} placeholder="Execução Fiscal, IDPJ..." />
          <datalist id="model-cats">{MODEL_CATEGORIES.map(c => <option key={c} value={c} />)}</datalist>
        </div>
        <div className="form-group"><label>Matéria <span style={{fontWeight:400,color:'var(--text-muted)',fontSize:10}}>(tese debatida)</span></label>
          <input list="model-subs" value={form.subcategory||''} onChange={e=>set('subcategory',e.target.value)} placeholder="Prescrição, Redirecionamento..." />
          <datalist id="model-subs">{MODEL_SUBCATEGORIES.map(c => <option key={c} value={c} />)}</datalist>
        </div>
      </div>
      <div className="form-group"><label>Quando usar</label>
        <textarea value={form.description||''} onChange={e=>set('description',e.target.value)} rows={3} placeholder="Em que situação este modelo se aplica, teses que cobre, o que precisa ser adaptado..." />
        <span style={{fontSize:9,color:'var(--text-muted)'}}>Esta descrição é o que a IA lê para decidir se o modelo serve — quanto mais específica, melhor a sugestão.</span>
      </div>
      <div className="form-group"><label>Tags</label>
        {tags.length > 0 && <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:5}}>
          {tags.map((t,i) => <span key={i} style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:10,padding:'2px 8px',background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:999,color:'var(--text-secondary)'}}>{t}<span style={{cursor:'pointer',color:'var(--text-muted)',opacity:0.6}} onClick={() => set('tags', tags.filter((_,j)=>j!==i))}>✕</span></span>)}
        </div>}
        <input placeholder="tag + Enter (ex.: súmula 435, art. 135)" onKeyDown={e => { if (e.key === 'Enter' && e.target.value.trim()) { e.preventDefault(); set('tags', [...tags, e.target.value.trim()]); e.target.value = ''; } }} />
      </div>
      {form.useCount > 0 && <div style={{fontSize:10,color:'var(--text-muted)',marginBottom:8}}>Usado {form.useCount}× · último uso em {form.lastUsedAt ? fmtDate(form.lastUsedAt.slice(0,10)) : '—'}</div>}
      {Actions()}
    </>);
  }

  if (entityType === 'document') return (<>
    <div className="form-group"><label>Título</label><input value={form.title||''} onChange={e=>set('title',e.target.value)} placeholder="Petição Inicial - Cautelar Fiscal" /></div>
    <div className="form-group"><label>URL (Google Docs ou outro)</label><input value={form.url||''} onChange={e=>set('url',e.target.value)} placeholder="https://docs.google.com/document/d/..." /></div>
    <div className="form-row">
      <div className="form-group"><label>Tipo de Peça</label><select value={form.docType||'Outro'} onChange={e=>set('docType',e.target.value)}>{DOC_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div className="form-group"><label>Processo Relacionado</label><input value={form.processRef||''} onChange={e=>set('processRef',e.target.value)} placeholder="Nº do processo" /></div>
    </div>
    <div className="form-row">
      <div className="form-group"><label>Data de Atuação</label><input type="date" value={form.actionDate||''} onChange={e=>set('actionDate',e.target.value)} />
        <span style={{fontSize:9,color:'var(--text-muted)'}}>Data em que a peça foi protocolada / atuação foi realizada.</span>
      </div>
    </div>
    {NotesList()}
    {Actions()}
  </>);

  if (entityType === 'prescriptionEvent') {
    const opExecs = (data?.executions||[]).filter(e=>e.operationId===operationId);
    const opDebts = (data?.debts||[]).filter(d=>d.operationId===operationId);
    const selectedType = PRESC_EVENT_TYPES[form.type];
    const batchCdas = form.batchCdaIds ? opDebts.filter(d => form.batchCdaIds.includes(d.id)) : [];
    const singleCda = form.cdaId ? opDebts.find(d => d.id === form.cdaId) : null;
    const categories = [
      { key: 'marco', label: '⏱ Marcos Iniciais (Tema 566)', desc: 'Eventos que disparam a contagem do art. 40 LEF' },
      { key: 'interruptiva', label: '🟢 Causas Interruptivas (Tema 568)', desc: 'Reiniciam o prazo prescricional do zero' },
      { key: 'suspensiva', label: '🔵 Causas Suspensivas', desc: 'Paralisam a contagem enquanto vigentes' },
      { key: 'info', label: 'ℹ️ Eventos Informativos', desc: 'Sem efeito no cômputo — registro para controle' },
    ];
    return (<>
      {/* Context: which CDAs are affected */}
      {batchCdas.length > 0 && (
        <div style={{padding:'8px 12px',background:'var(--accent-dim)',borderRadius:'var(--radius)',marginBottom:12,fontSize:11}}>
          <strong style={{color:'var(--accent)'}}>Evento em lote — {batchCdas.length} CDA(s):</strong><br/>
          {batchCdas.map(d => <span key={d.id} style={{display:'inline-block',margin:'2px 4px',padding:'1px 6px',background:'var(--bg-elevated)',borderRadius:3,fontSize:10}}>{d.cdaNumber}</span>)}
        </div>
      )}
      {singleCda && (
        <div style={{padding:'8px 12px',background:'var(--blue-dim)',borderRadius:'var(--radius)',marginBottom:12,fontSize:11}}>
          <strong>CDA:</strong> {singleCda.cdaNumber} — {fmtCur(singleCda.value)}
        </div>
      )}
      <div className="form-group"><label>Execução Fiscal</label>
        <select value={form.executionId||''} onChange={e=>set('executionId',e.target.value)}>
          <option value="">Selecione...</option>{opExecs.map(e=><option key={e.id} value={e.id}>{e.processNumber||'EF'} — {e.court||''}</option>)}
        </select>
      </div>
      <div className="form-group"><label>Tipo de Evento</label>
        <select value={form.type||''} onChange={e=>set('type',e.target.value)} style={{fontSize:11}}>
          <option value="">Selecione o tipo...</option>
          {categories.map(cat => (
            <optgroup key={cat.key} label={cat.label}>
              {Object.entries(PRESC_EVENT_TYPES).filter(([,v])=>v.category===cat.key).map(([k,v])=>(
                <option key={k} value={k}>{v.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
        {selectedType && <div style={{marginTop:6,fontSize:10,color:'var(--text-secondary)',lineHeight:1.5,padding:'6px 8px',background:'var(--bg-elevated)',borderRadius:'var(--radius)'}}>{selectedType.desc}</div>}
      </div>
      <div className="form-row">
        <div className="form-group"><label>Data do Evento</label><input type="date" value={form.date||''} onChange={e=>set('date',e.target.value)} /></div>
        {selectedType?.category === 'suspensiva' && (
          <div className="form-group"><label>Data de Cessação (se encerrada)</label><input type="date" value={form.endDate||''} onChange={e=>set('endDate',e.target.value)} />
            <span style={{fontSize:9,color:'var(--text-muted)'}}>Deixe vazio se ainda vigente</span></div>
        )}
      </div>
      <div className="form-group"><label>Fundamentação Legal</label>
        <input value={form.legalBasis||''} onChange={e=>set('legalBasis',e.target.value)} placeholder="Ex: Art. 174, p.ú., I, CTN — Art. 40, §1º, LEF" />
      </div>
      <div className="form-group"><label>Referência Processual</label>
        <input value={form.processRef||''} onChange={e=>set('processRef',e.target.value)} placeholder="Nº evento eproc, decisão, etc." />
      </div>
      <div className="form-group"><label>Notas / Detalhamento</label>
        <textarea value={form.notes||''} onChange={e=>set('notes',e.target.value)} placeholder="Descreva o evento, circunstâncias, resultado da diligência..." rows={3} />
      </div>
      {(() => {
        // Check if the selected execution is a principal with apensos
        if (form._inheritedFromParent) return <div style={{padding:8,background:'rgba(91,143,217,0.08)',borderRadius:'var(--radius)',marginTop:8,fontSize:11,color:'var(--blue)'}}>
          ⤷ Este evento foi propagado automaticamente do processo principal. Editá-lo aqui afeta apenas este apenso.
        </div>;
        if (!form.executionId) return null;
        const principal = opExecs.find(e => e.id === form.executionId && !e.parentExecutionId);
        if (!principal) return null;
        const apensos = opExecs.filter(e => e.parentExecutionId === principal.id);
        if (apensos.length === 0) return null;
        const willPropagate = !form._noApensoPropagation;
        return <div style={{padding:10,background:willPropagate?'rgba(64,168,112,0.08)':'var(--bg-elevated)',borderRadius:'var(--radius)',marginTop:8,border:`1px solid ${willPropagate?'rgba(64,168,112,0.3)':'var(--border)'}`}}>
          <label style={{display:'flex',alignItems:'flex-start',gap:8,cursor:'pointer',fontSize:11}}>
            <input type="checkbox" checked={willPropagate} onChange={e => set('_noApensoPropagation', !e.target.checked)} style={{width:16,height:16,cursor:'pointer',marginTop:1,flexShrink:0}} />
            <span>
              <strong>📎 Estender este evento aos {apensos.length} processo(s) apensado(s)</strong> ao principal {principal.processNumber}.
              <div style={{fontSize:10,color:'var(--text-muted)',marginTop:4}}>Atos interruptivos praticados no principal estendem-se aos apensos. Desmarque apenas em casos excepcionais (ex: ato pessoal restrito ao principal).</div>
              {willPropagate && <div style={{fontSize:9,color:'var(--text-muted)',marginTop:4,fontFamily:'var(--font-mono)'}}>{apensos.map(a => '• ' + a.processNumber).join('\n')}</div>}
            </span>
          </label>
        </div>;
      })()}
      {(() => {
        // IDPJ/Cautelar → EFs vinculadas: oferecer propagação
        if (form._inheritedFromIDPJ) return <div style={{padding:8,background:'rgba(155,40,72,0.08)',borderRadius:'var(--radius)',marginTop:8,fontSize:11,color:'var(--pgfn-light)',borderLeft:'3px solid var(--pgfn)'}}>
          🛡️ Este evento foi propagado automaticamente do Incidente/Cautelar. Editá-lo aqui afeta apenas esta EF.
        </div>;
        if (!form.executionId) return null;
        const idpjExec = opExecs.find(e => e.id === form.executionId && (e.processTag === 'idpj' || e.processTag === 'cautelar_fiscal'));
        if (!idpjExec || !idpjExec.linkedExecutionIds || idpjExec.linkedExecutionIds.length === 0) return null;
        const linkedEFs = idpjExec.linkedExecutionIds.map(id => opExecs.find(e => e.id === id)).filter(Boolean);
        if (linkedEFs.length === 0) return null;
        const willPropagateIDPJ = form._propagateToLinkedEFs !== false; // default true
        return <div style={{padding:10,background:willPropagateIDPJ?'rgba(155,40,72,0.08)':'var(--bg-elevated)',borderRadius:'var(--radius)',marginTop:8,border:`1px solid ${willPropagateIDPJ?'rgba(155,40,72,0.3)':'var(--border)'}`,borderLeft:`3px solid ${willPropagateIDPJ?'var(--pgfn)':'var(--border)'}`}}>
          <label style={{display:'flex',alignItems:'flex-start',gap:8,cursor:'pointer',fontSize:11}}>
            <input type="checkbox" checked={willPropagateIDPJ} onChange={e => set('_propagateToLinkedEFs', e.target.checked)} style={{width:16,height:16,cursor:'pointer',marginTop:1,flexShrink:0}} />
            <span>
              <strong>🛡️ Estender este evento às {linkedEFs.length} Execução(ões) Fiscal(is) vinculadas</strong> ao {idpjExec.processTag === 'idpj' ? 'IDPJ' : 'Cautelar'} {truncate(idpjExec.processNumber, 30)}.
              <div style={{fontSize:10,color:'var(--text-muted)',marginTop:4}}>Eventos interruptivos/suspensivos praticados no Incidente/Cautelar podem se estender às EFs que dele dependem. Os eventos gerados nas EFs ficam marcados como "proveniente do IDPJ/Cautelar" com cor distinta.</div>
              {willPropagateIDPJ && <div style={{fontSize:9,color:'var(--pgfn-light)',marginTop:4,fontFamily:'var(--font-mono)'}}>{linkedEFs.map(e => '• ' + e.processNumber).join('\n')}</div>}
            </span>
          </label>
        </div>;
      })()}
      {form.id && <div style={{padding:8,background:'var(--bg-elevated)',borderRadius:'var(--radius)',marginTop:8,fontSize:11,color:'var(--text-muted)'}}>
        💡 Você pode editar este evento posteriormente. A exclusão remove o efeito do evento sobre o cálculo de prescrição.
      </div>}
      {Actions()}
    </>);
  }

  if (entityType === 'intimation') {
    const ops = [...(data?.operations || [])].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' }));
    return (<>
      <div className="form-row">
        <div className="form-group"><label>Nº Processo</label><input value={form.processNumber||''} onChange={e=>set('processNumber',e.target.value)} placeholder="5000000-00.2024.4.04.7000" /></div>
        <div className="form-group"><label>Jurisdição</label><input value={form.jurisdiction||''} onChange={e=>set('jurisdiction',e.target.value)} placeholder="RS, PR, SC, TJ..." /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Classe</label><input value={form.className||''} onChange={e=>set('className',e.target.value)} placeholder="Execução Fiscal, Embargos..." /></div>
        <div className="form-group"><label>Assunto</label><input value={form.subject||''} onChange={e=>set('subject',e.target.value)} /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Parte Adversa (Réu/Embargante)</label><input value={form.partyName||''} onChange={e=>set('partyName',e.target.value)} placeholder="Nome extraído automaticamente do eproc" /></div>
        <div className="form-group"><label>Partes (completo)</label><input value={form.parties||''} onChange={e=>set('parties',e.target.value)} /></div>
      </div>
      <div className="form-group"><label>Evento / Prazo</label><input value={form.eventDescription||''} onChange={e=>set('eventDescription',e.target.value)} placeholder="Expedida/certificada a intimação eletrônica 10 dias" /></div>
      <div className="form-row-3">
        <div className="form-group"><label>Data Envio</label><input type="date" value={form.dateSent||''} onChange={e=>set('dateSent',e.target.value)} /></div>
        <div className="form-group"><label>Início Prazo</label><input type="date" value={form.dateStart||''} onChange={e=>set('dateStart',e.target.value)} /></div>
        <div className="form-group"><label>Final Prazo</label><input type="date" value={form.dateDeadline||''} onChange={e=>set('dateDeadline',e.target.value)} /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Status</label><select value={form.status||'pendente_analise'} onChange={e=>set('status',e.target.value)}>
          {Object.entries(INTIM_STATUSES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select></div>
        <div className="form-group"><label>Operação vinculada</label><select value={form.operationId||''} onChange={e=>set('operationId',e.target.value)}>
          <option value="">Nenhuma</option>{ops.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
        </select></div>
      </div>
      <div className="form-group" style={{padding:12,background:'var(--accent-dim)',borderRadius:'var(--radius)',borderLeft:'3px solid var(--gold)'}}>
        <label style={{marginBottom:8,display:'block'}}>Atenção (manual)</label>
        <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:12,marginBottom:10,padding:'8px 10px',borderRadius:'var(--radius)',border:`1px solid ${intimIsUrgent(form)?'var(--red)':'var(--border)'}`,background:intimIsUrgent(form)?'var(--red-dim)':'var(--bg-input)'}}>
          <input type="checkbox" checked={intimIsUrgent(form)} onChange={e=>{
            const on = e.target.checked;
            set('urgent', on);
            if (form.priority === 'urgente' || form.priority === 'urgent') set('priority', 'alta');
          }} style={{width:16,height:16,accentColor:'var(--red)'}} />
          <span>
            <strong style={{color:intimIsUrgent(form)?'var(--red)':'var(--text-primary)'}}>Urgente</strong>
            <span style={{display:'block',fontSize:9,color:'var(--text-muted)',marginTop:2}}>Marcado: vai para o topo da lista e o card fica com tom vermelho mais forte.</span>
          </span>
        </label>
        <div className="form-row" style={{marginBottom:0}}>
          <div className="form-group" style={{marginBottom:0}}><label>Importância</label>
            <select value={intimImpKey(form)} onChange={e=>set('priority',e.target.value)}>
              <option value="alta">{INTIM_PRIORITIES.alta.label}</option>
              <option value="normal">{INTIM_PRIORITIES.normal.label}</option>
              <option value="baixa">{INTIM_PRIORITIES.baixa.label}</option>
            </select>
          </div>
          <div className="form-group" style={{marginBottom:0}}><label>Complexidade</label>
            <select value={intimDifKey(form)} onChange={e=>set('difficulty',e.target.value)}>
              <option value="alta">{INTIM_DIFFICULTY.alta.label}</option>
              <option value="media">{INTIM_DIFFICULTY.media.label}</option>
              <option value="baixa">{INTIM_DIFFICULTY.baixa.label}</option>
            </select>
          </div>
        </div>
        <span style={{fontSize:9,color:'var(--text-muted)',display:'block',marginTop:6}}>Prazo continua só nas datas do card (centro / direita) — sem repetir na faixa.</span>
      </div>
      <div className="form-group"><label>Objeto / Providência</label><input value={form.object||''} onChange={e=>set('object',e.target.value)} placeholder="Pedido de dilação, mera ciência, embargos..." /></div>
      <div className="form-group"><label>📝 Link da Minuta / Resposta (Google Docs)</label>
        <input value={form.minutaUrl||''} onChange={e=>set('minutaUrl',e.target.value)} placeholder="https://docs.google.com/document/d/..." />
        <span style={{fontSize:9,color:'var(--text-muted)'}}>Cole aqui o link do documento que está trabalhando para responder esta intimação</span>
      </div>
      {NotesList()}
      {form.responseAction && <div style={{padding:10,background:'rgba(64,168,112,0.08)',borderRadius:'var(--radius)',marginTop:8,marginBottom:8,fontSize:11,color:'var(--text-secondary)',borderLeft:'2px solid var(--green)',display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
        <div>
          <div style={{fontWeight:600,marginBottom:2}}>✓ Resolvida — {form.responseAction.type === 'peticionamento' ? '📝 Peticionamento' : form.responseAction.type === 'ciencia' ? 'Ciência' : 'Outra medida'}</div>
          <div style={{fontSize:10,color:'var(--text-muted)'}}>{form.responseAction.respondedAt ? fmtDate(form.responseAction.respondedAt.slice(0,10)) : ''}{form.responseAction.description ? ' · '+truncate(form.responseAction.description,60) : ''}</div>
        </div>
        <button type="button" className="btn-secondary btn-xs" style={{whiteSpace:'nowrap'}} onClick={() => { set('responseAction', null); set('status', 'pendente_analise'); }}>↩ Reativar</button>
      </div>}
      {Actions()}
    </>);
  }

  if (entityType === 'task') {
    const ops = [...(data?.operations || [])].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' }));
    return (<>
      <div className="form-group"><label>Título da Tarefa</label>
        <input value={form.title||''} onChange={e=>set('title',e.target.value)} placeholder="Ex: Requerer extensão de penhora para CDA 90.2.23..." />
      </div>
      <div className="form-group"><label>Descrição / Detalhamento</label>
        <textarea value={form.description||''} onChange={e=>set('description',e.target.value)} rows={3} placeholder="Detalhes da atuação proativa necessária..." />
      </div>
      <div className="form-row">
        <div className="form-group"><label>Operação Vinculada</label>
          <select value={form.operationId||''} onChange={e=>set('operationId',e.target.value)}>
            <option value="">Nenhuma (geral)</option>
            {ops.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
        <div className="form-group"><label>Prioridade</label>
          <select value={form.priority||'media'} onChange={e=>set('priority',e.target.value)}>
            <option value="urgente">🔴 Urgente</option>
            <option value="alta">🟠 Alta</option>
            <option value="media">🟡 Média</option>
            <option value="baixa">⚪ Baixa</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Data Limite</label>
          <input type="date" value={form.dueDate||''} onChange={e=>set('dueDate',e.target.value)} />
        </div>
        <div className="form-group"><label>Status</label>
          <select value={form.status||'pendente'} onChange={e=>set('status',e.target.value)}>
            <option value="pendente">Pendente</option>
            <option value="em_andamento">Em andamento</option>
            <option value="concluida">Concluída</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
      </div>
      {form.operationId && <div className="form-group" style={{padding:10,background:'var(--bg-elevated)',borderRadius:'var(--radius)'}}>
        <label style={{display:'flex',alignItems:'center',gap:6}}>👁 Visibilidade
          <HelpIcon tip="Interna: a tarefa só aparece na aba Tarefas DENTRO da operação. Global: aparece também na aba Tarefas do menu superior (agenda geral). Use 'Global' para tarefas estratégicas ou com prazo curto que você quer enxergar entre várias operações. Use 'Interna' (padrão) para tarefas rotineiras de gestão processual que só importam no contexto da operação." />
        </label>
        <select value={form.taskVisibility||'operation'} onChange={e=>set('taskVisibility',e.target.value)} style={{marginTop:4}}>
          <option value="operation">🔒 Interna — apenas na aba Tarefas da operação</option>
          <option value="global">🌐 Global — aparece também na aba Tarefas geral</option>
        </select>
      </div>}
      <div className="form-group"><label>Link da Peça / Documento</label>
        <input value={form.docUrl||''} onChange={e=>set('docUrl',e.target.value)} placeholder="https://docs.google.com/..." />
      </div>
      {NotesList()}
      {Actions()}
    </>);
  }

  if (entityType === 'watch') {
    const ops = [...(data?.operations || [])].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' }));
    return (<>
      <div className="form-group"><label>Nº do Processo</label>
        <input value={form.processNumber||''} onChange={e=>set('processNumber',e.target.value)} placeholder="50000000020244047001" style={{fontFamily:'var(--font-mono)'}} />
      </div>
      <div className="form-group"><label>Partes</label>
        <input value={form.parties||''} onChange={e=>set('parties',e.target.value)} placeholder="Ex: FAZENDA NACIONAL X EMPRESA EXEMPLO LTDA" />
      </div>
      <div className="form-row">
        <div className="form-group"><label>Operação Vinculada</label>
          <select value={form.operationId||''} onChange={e=>set('operationId',e.target.value)}>
            <option value="">Nenhuma (avulso)</option>
            {ops.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
        <div className="form-group"><label>Status</label>
          <select value={form.status||'aguardando'} onChange={e=>set('status',e.target.value)}>
            {Object.entries(WATCH_STATUSES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group"><label>Motivo do Acompanhamento</label>
        <textarea value={form.reason||''} onChange={e=>set('reason',e.target.value)} rows={2} placeholder="Ex: Manifestação sobre proposta de parcelamento — aguardando homologação" />
      </div>
      {NotesList()}
      {Actions()}
    </>);
  }

  if (entityType === 'hearing') {
    const ops = [...(data?.operations || [])].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' }));
    const docs = (data?.documents || []).filter(dc => !form.operationId || dc.operationId === form.operationId);
    const linkedDocs = form.documentIds || [];
    const toggleDoc = (id) => { const next = linkedDocs.includes(id) ? linkedDocs.filter(x=>x!==id) : [...linkedDocs, id]; set('documentIds', next); };
    return (<>
      <div className="form-row">
        <div className="form-group"><label>Data</label><input type="date" value={form.date||''} onChange={e=>set('date',e.target.value)} /></div>
        <div className="form-group"><label>Hora</label><input type="time" value={form.time||''} onChange={e=>set('time',e.target.value)} /></div>
      </div>
      <div className="form-group"><label>Nº do Processo</label><input value={form.processNumber||''} onChange={e=>set('processNumber',e.target.value)} placeholder="50000000020244047001" style={{fontFamily:'var(--font-mono)'}} /></div>
      <div className="form-group"><label>Partes</label><input value={form.parties||''} onChange={e=>set('parties',e.target.value)} placeholder="Ex: FAZENDA NACIONAL X EMPRESA EXEMPLO LTDA" /></div>
      <div className="form-row">
        <div className="form-group"><label>Tipo</label><select value={form.hearingType||'instrucao'} onChange={e=>set('hearingType',e.target.value)}><option value="instrucao">Instrução</option><option value="conciliacao">Conciliação</option><option value="una">Una</option><option value="justificacao">Justificação</option><option value="inquiricao">Inquirição</option><option value="outra">Outra</option></select></div>
        <div className="form-group"><label>Status</label><select value={form.status||'agendada'} onChange={e=>set('status',e.target.value)}>{Object.entries(AUDIENCIA_STATUSES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Modalidade</label><select value={form.modality||'presencial'} onChange={e=>set('modality',e.target.value)}><option value="presencial">Presencial</option><option value="virtual">Virtual</option></select></div>
        <div className="form-group"><label>Operação Vinculada</label><select value={form.operationId||''} onChange={e=>set('operationId',e.target.value)}><option value="">Nenhuma (avulso)</option>{ops.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
      </div>
      <div className="form-group"><label>{form.modality==='virtual'?'Link da sala virtual':'Local / Juízo / Vara'}</label><input value={form.location||''} onChange={e=>set('location',e.target.value)} placeholder={form.modality==='virtual'?'https://...':'Ex: 1ª Vara Federal de Maringá'} /></div>
      <div className="form-group"><label>Avisar com antecedência</label><select value={form.remindDays||'3'} onChange={e=>set('remindDays',e.target.value)}><option value="1">1 dia</option><option value="2">2 dias</option><option value="3">3 dias</option><option value="5">5 dias</option><option value="7">7 dias</option></select></div>
      <div className="form-group"><label>📝 Link do Google Docs / Documento</label>
        <input value={form.docUrl||''} onChange={e=>set('docUrl',e.target.value)} placeholder="https://docs.google.com/document/d/..." />
      </div>
      <div className="form-group"><label>Roteiro / Material de Apoio</label><textarea value={form.roteiro||''} onChange={e=>set('roteiro',e.target.value)} rows={6} placeholder="Tese, pontos a sustentar, perguntas, observações para a audiência..." /></div>
      {docs.length > 0 && <div className="form-group"><label>Documentos vinculados</label><div style={{maxHeight:120,overflowY:'auto',border:'1px solid var(--border)',borderRadius:4,padding:6}}>{docs.map(dc => <label key={dc.id} style={{display:'flex',alignItems:'center',gap:7,fontSize:12,padding:'2px 0',cursor:'pointer'}}><input type="checkbox" checked={linkedDocs.includes(dc.id)} onChange={()=>toggleDoc(dc.id)} style={{accentColor:'var(--accent)'}} />{dc.title || 'Documento'}</label>)}</div></div>}
      {NotesList()}
      {Actions()}
    </>);
  }

  if (entityType === 'stickyNote') {
    return (<>
      <div className="form-group"><label>Título (opcional)</label>
        <input value={form.title||''} onChange={e=>set('title',e.target.value)} placeholder="Título curto..." />
      </div>
      <div className="form-group"><label>Conteúdo</label>
        <textarea value={form.content||''} onChange={e=>set('content',e.target.value)} rows={5} placeholder="Anotação livre..." />
      </div>
      <div className="form-group"><label>Cor</label>
        <div style={{display:'flex',gap:8}}>
          {[['yellow','🟡 Amarelo'],['green','🟢 Verde'],['red','🔴 Vermelho']].map(([c,l]) => (
            <button key={c} type="button" className={`btn-sm ${form.color===c?'btn-primary':'btn-secondary'}`}
              onClick={() => set('color',c)} style={{flex:1}}>{l}</button>
          ))}
        </div>
      </div>
      {Actions()}
    </>);
  }

  return null;
}

ReactDOM.createRoot(document.getElementById('root')).render(<ErrorBoundary><App /></ErrorBoundary>);
