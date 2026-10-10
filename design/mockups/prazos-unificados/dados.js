/* ═══════════════════════════════════════════════════════════════════════════
   NEXUS · Prazos unificados — dados sintéticos do kit de mockups (dados.js)
   Tudo fictício. "Hoje" é fixo (NX_HOJE) para os números nunca mudarem.

   window.NX_HOJE        '2026-10-09'
   window.NX_OPERACOES   [{ nome, curto, cor }]  (5 operações; cor em hex)
   window.NX_DADOS       30 CDAs (campos abaixo)
   window.NX             utilitários (fmtData, fmtMoeda, dias, reguaHTML, linhaHTML...)

   CAMPOS DE CADA REGISTRO
     id            'nx-01'..'nx-30'
     cda           '90.6.22.000778-01'
     devedor       razão social fictícia
     operacao      nome completo, igual a NX_OPERACOES[].nome
     valor         número (R$)
     processo      CNJ '5001234-56.2015.4.04.7001' ou null (não ajuizada)
     abrangidaPor  null ou 'IDPJ 5003333-22.2024.4.04.7002'
     natureza      'decadencia' | 'ordinaria' | 'intercorrente'  (o relógio em destaque)
     fase          texto curto ("Não ajuizada", "Pedido sem desfecho"...)
     fila          SUGESTÃO de agrupamento: 'agir' | 'conferir' | 'vigiar' | 'registro' | 'adiada' | 'tratada' | 'impossivel'
     situacao      frase em linguagem do caso (estilo do app)
     termoCedo     ISO ou null — data cedo (leitura mais desfavorável, dá o alarme)
     termoTarde    ISO ou null — data tarde (tese da União). Igual à cedo = "termo" único
     diasRestantes dias de NX_HOJE até termoCedo (negativo = vencido); null quando não há contagem
     certeza       'faixa' | 'dado' | 'analisar' | 'calculado'
     podeSalvar    true = a ação cabe num formulário inline (tudo o que precisa já está na tela);
                   false = antes é preciso consultar os autos ou abrir a ficha completa
     divergencia   (opcional) true = a análise importada diverge do cálculo; vale o cálculo (selo à parte, a certeza continua a do cálculo)
     acao          null ou { tipo, rotulo, umClique }  (umClique: grava sem pedir nenhum dado)
     conferir      [texto]  — "conferir nos autos"
     eventos       [{ data, fato, efeito }]  — cronológico
     consumadaHa   dias desde a consumação (pela data tarde) ou null
     silenciadaAte ISO ou null — fora do alarme até essa data (parcelamento vigente, lembrete, ainda impossível)
     adiada        null ou { ate, motivo, desde }  — ate <= NX_HOJE significa "adiamento venceu" (volta à fila)
     tratada       null ou { tipo, rotulo, desde }
     regua         null ou { inicio, fim, segmentos: [{ de, ate, tipo, rotulo? }], marcas: [{ data, rotulo, tipo }] }
                   segmento.tipo: 'correndo' | 'suspensao' | 'pausa' | 'aguardando'
                   marca.tipo:    'cedo' | 'tarde' | 'termo' | 'hoje' | 'ciclo' | 'fato'
   ═══════════════════════════════════════════════════════════════════════════ */
(function (w) {
  'use strict';
  // Idempotente: as três propostas fundidas numa página podem incluir este arquivo mais de uma vez.
  if (w.NX_DADOS) return;

  w.NX_HOJE = '2026-10-09';

  w.NX_OPERACOES = [
    { nome: 'Operação Maré Vazante', curto: 'Maré Vazante', cor: '#2d62d3' },
    { nome: 'Operação Cais do Porto', curto: 'Cais do Porto', cor: '#bf5f16' },
    { nome: 'Operação Rota Fria', curto: 'Rota Fria', cor: '#21845a' },
    { nome: 'Operação Veredas', curto: 'Veredas', cor: '#6a4fd4' },
    { nome: 'Operação Lastro', curto: 'Lastro', cor: '#0f7888' }
  ];

  w.NX_DADOS = [
  {
    id: "nx-01",
    cda: "90.6.22.000778-01",
    devedor: "Transportadora Serra Azul Ltda",
    operacao: "Operação Maré Vazante",
    valor: 1284600,
    processo: null,
    abrangidaPor: null,
    natureza: "ordinaria",
    fase: "Não ajuizada",
    fila: "agir",
    situacao: "Os 5 anos para ajuizar vencem nos próximos 90 dias, em 18/11/2026. Falta ajuizar a execução.",
    termoCedo: "2026-11-18",
    termoTarde: "2026-11-18",
    diasRestantes: 40,
    certeza: "calculado",
    podeSalvar: true,
    acao: { tipo: "ajuizar", rotulo: "Ajuizar execução", umClique: false },
    conferir: [
      "A entrega da declaração em 18/11/2021 confere com a ficha?",
      "Houve pedido de parcelamento ou protesto da CDA desde então? (interrompe o prazo)",
      "A CDA já está em alguma petição inicial em preparo?"
    ],
    eventos: [
      { data: "2021-11-18", fato: "Declaração entregue (DCTF): constituição definitiva", efeito: "Começa a correr o prazo de 5 anos para ajuizar" },
      { data: "2022-03-09", fato: "Inscrição em dívida ativa", efeito: "Sem efeito no prazo" }
    ],
    consumadaHa: null,
    silenciadaAte: null,
    adiada: null,
    tratada: null,
    regua: {
      inicio: "2021-11-18", fim: "2027-02-17",
      segmentos: [
        { de: "2021-11-18", ate: "2026-11-18", tipo: "correndo", rotulo: "Prazo de 5 anos para ajuizar" }
      ],
      marcas: [
        { data: "2026-10-09", rotulo: "Hoje", tipo: "hoje" },
        { data: "2026-11-18", rotulo: "Termo", tipo: "termo" }
      ]
    }
  },
  {
    id: "nx-02",
    cda: "90.2.22.004120-77",
    devedor: "Comercial Mendonça & Filhos S.A.",
    operacao: "Operação Cais do Porto",
    valor: 3870250.4,
    processo: null,
    abrangidaPor: null,
    natureza: "ordinaria",
    fase: "Não ajuizada",
    fila: "agir",
    situacao: "Os 5 anos para ajuizar vencem nos próximos 90 dias, em 28/12/2026. Falta ajuizar a execução.",
    termoCedo: "2026-12-28",
    termoTarde: "2026-12-28",
    diasRestantes: 80,
    certeza: "calculado",
    podeSalvar: true,
    acao: { tipo: "ajuizar", rotulo: "Ajuizar execução", umClique: false },
    conferir: [
      "Notificação do auto em 28/11/2021 e 30 dias para pagar: a constituição definitiva em 28/12/2021 está certa?",
      "Houve impugnação administrativa ou depósito no período? (suspende a exigibilidade)",
      "Há parcelamento ou pedido de parcelamento desde a constituição?"
    ],
    eventos: [
      { data: "2021-11-28", fato: "Notificação do auto de infração", efeito: "Abre 30 dias para pagar ou impugnar" },
      { data: "2021-12-28", fato: "Fim do prazo de pagamento: constituição definitiva", efeito: "Começa a correr o prazo de 5 anos para ajuizar" },
      { data: "2022-06-14", fato: "Inscrição em dívida ativa", efeito: "Sem efeito no prazo" }
    ],
    consumadaHa: null,
    silenciadaAte: null,
    adiada: null,
    tratada: null,
    regua: {
      inicio: "2021-12-28", fim: "2027-03-29",
      segmentos: [
        { de: "2021-12-28", ate: "2026-12-28", tipo: "correndo", rotulo: "Prazo de 5 anos para ajuizar" }
      ],
      marcas: [
        { data: "2026-10-09", rotulo: "Hoje", tipo: "hoje" },
        { data: "2026-12-28", rotulo: "Termo", tipo: "termo" }
      ]
    }
  },
  {
    id: "nx-03",
    cda: "80.7.22.012956-30",
    devedor: "Distribuidora Pinheiral de Bebidas Ltda",
    operacao: "Operação Rota Fria",
    valor: 412980.15,
    processo: null,
    abrangidaPor: null,
    natureza: "ordinaria",
    fase: "Não ajuizada",
    fila: "agir",
    situacao: "Os 5 anos para ajuizar vencem em 27/04/2027. Ainda fora da janela de 90 dias, mas a CDA não foi ajuizada.",
    termoCedo: "2027-04-27",
    termoTarde: "2027-04-27",
    diasRestantes: 200,
    certeza: "calculado",
    podeSalvar: true,
    acao: { tipo: "ajuizar", rotulo: "Ajuizar execução", umClique: false },
    conferir: [
      "A entrega da declaração em 27/04/2022 confere com a ficha?",
      "Há outra CDA do mesmo devedor já em execução? Avaliar ajuizar em conjunto."
    ],
    eventos: [
      { data: "2022-04-27", fato: "Declaração entregue (DCTF): constituição definitiva", efeito: "Começa a correr o prazo de 5 anos para ajuizar" },
      { data: "2022-11-02", fato: "Inscrição em dívida ativa", efeito: "Sem efeito no prazo" }
    ],
    consumadaHa: null,
    silenciadaAte: null,
    adiada: null,
    tratada: null,
    regua: {
      inicio: "2022-04-27", fim: "2027-07-27",
      segmentos: [
        { de: "2022-04-27", ate: "2027-04-27", tipo: "correndo", rotulo: "Prazo de 5 anos para ajuizar" }
      ],
      marcas: [
        { data: "2026-10-09", rotulo: "Hoje", tipo: "hoje" },
        { data: "2027-04-27", rotulo: "Termo", tipo: "termo" }
      ]
    }
  },
  {
    id: "nx-04",
    cda: "90.5.21.003344-12",
    devedor: "Têxtil Santa Clara Ltda",
    operacao: "Operação Veredas",
    valor: 96730,
    processo: null,
    abrangidaPor: null,
    natureza: "ordinaria",
    fase: "Consumada, a conferir",
    fila: "conferir",
    situacao: "Os 5 anos para ajuizar já venceram no cálculo, em 09/08/2026. Antes de aceitar, conferir se algum fato interrompeu o prazo e o cálculo não viu.",
    termoCedo: "2026-08-09",
    termoTarde: "2026-08-09",
    diasRestantes: -61,
    certeza: "calculado",
    podeSalvar: false,
    acao: { tipo: "conferir_autos", rotulo: "Conferir nos autos", umClique: false },
    conferir: [
      "A constituição definitiva em 09/08/2021 confere com a notificação do lançamento?",
      "Houve adesão ou pedido de parcelamento antes de 09/08/2026?",
      "O devedor foi citado em outra execução que inclua esta CDA? (despacho de citação interrompe)"
    ],
    eventos: [
      { data: "2021-07-10", fato: "Notificação do lançamento", efeito: "Abre 30 dias para pagar" },
      { data: "2021-08-09", fato: "Fim do prazo de pagamento: constituição definitiva", efeito: "Começa a correr o prazo de 5 anos para ajuizar" },
      { data: "2021-12-10", fato: "Inscrição em dívida ativa", efeito: "Sem efeito no prazo" }
    ],
    consumadaHa: 61,
    silenciadaAte: null,
    adiada: null,
    tratada: null,
    regua: {
      inicio: "2021-08-09", fim: "2027-01-11",
      segmentos: [
        { de: "2021-08-09", ate: "2026-08-09", tipo: "correndo", rotulo: "Prazo de 5 anos para ajuizar" }
      ],
      marcas: [
        { data: "2026-08-09", rotulo: "Termo", tipo: "termo" },
        { data: "2026-10-09", rotulo: "Hoje", tipo: "hoje" }
      ]
    }
  },
  {
    id: "nx-05",
    cda: "90.3.13.007019-84",
    devedor: "Madeireira Três Barras Ltda",
    operacao: "Operação Lastro",
    valor: 143220.9,
    processo: null,
    abrangidaPor: null,
    natureza: "ordinaria",
    fase: "Consumada há 9 anos",
    fila: "registro",
    situacao: "Os 5 anos para ajuizar venceram em 14/09/2017, há mais de 9 anos, sem ajuizamento. Fica só no registro, fora do alarme.",
    termoCedo: "2017-09-14",
    termoTarde: "2017-09-14",
    diasRestantes: -3312,
    certeza: "calculado",
    podeSalvar: false,
    acao: null,
    conferir: [],
    eventos: [
      { data: "2012-08-15", fato: "Notificação do lançamento", efeito: "Abre 30 dias para pagar" },
      { data: "2012-09-14", fato: "Fim do prazo de pagamento: constituição definitiva", efeito: "Começa a correr o prazo de 5 anos para ajuizar" },
      { data: "2013-05-20", fato: "Inscrição em dívida ativa", efeito: "Sem efeito no prazo" }
    ],
    consumadaHa: 3312,
    silenciadaAte: null,
    adiada: null,
    tratada: null,
    regua: {
      inicio: "2012-09-14", fim: "2027-06-22",
      segmentos: [
        { de: "2012-09-14", ate: "2017-09-14", tipo: "correndo", rotulo: "Prazo de 5 anos para ajuizar" }
      ],
      marcas: [
        { data: "2017-09-14", rotulo: "Termo", tipo: "termo" },
        { data: "2026-10-09", rotulo: "Hoje", tipo: "hoje" }
      ]
    }
  },
  {
    id: "nx-06",
    cda: "80.6.19.007781-05",
    devedor: "Auto Posto Santa Rita Ltda",
    operacao: "Operação Rota Fria",
    valor: 27915.6,
    processo: "5006932-08.2019.4.04.7002",
    abrangidaPor: null,
    natureza: "decadencia",
    fase: "Lançado a tempo",
    fila: "registro",
    situacao: "Lançamento de ofício notificado em 12/06/2018, antes do fim do prazo de decadência (31/12/2018). A decadência não ocorreu.",
    termoCedo: "2018-12-31",
    termoTarde: "2018-12-31",
    diasRestantes: null,
    certeza: "calculado",
    podeSalvar: false,
    acao: null,
    conferir: [],
    eventos: [
      { data: "2013-03-31", fato: "Fato gerador (apuração de mar/2013)", efeito: "Abre o prazo de decadência (art. 173, I)" },
      { data: "2013-04-30", fato: "Vencimento do tributo", efeito: "Sem efeito na decadência" },
      { data: "2018-06-12", fato: "Lançamento de ofício notificado", efeito: "Obsta a decadência (Súmula 622/STJ)" },
      { data: "2019-02-04", fato: "Inscrição em dívida ativa", efeito: "Sem efeito no prazo" }
    ],
    consumadaHa: null,
    silenciadaAte: null,
    adiada: null,
    tratada: null,
    regua: {
      inicio: "2014-01-01", fim: "2019-04-01",
      segmentos: [
        { de: "2014-01-01", ate: "2018-12-31", tipo: "correndo", rotulo: "Prazo de decadência" }
      ],
      marcas: [
        { data: "2018-06-12", rotulo: "Lançamento notificado", tipo: "fato" },
        { data: "2018-12-31", rotulo: "Termo", tipo: "termo" }
      ]
    }
  },
  {
    id: "nx-07",
    cda: "90.7.25.001205-40",
    devedor: "Importadora Atlântico Sul Ltda",
    operacao: "Operação Maré Vazante",
    valor: 233510,
    processo: "5004477-91.2025.4.04.7001",
    abrangidaPor: null,
    natureza: "decadencia",
    fase: "Notificado entre as duas datas",
    fila: "registro",
    situacao: "Pela leitura mais desfavorável (data cedo, 31/12/2023), a decadência já tinha ocorrido quando o lançamento foi notificado, em 03/04/2024. A data tarde (31/12/2024) é a tese da União. Só registro: o lançamento já foi feito.",
    termoCedo: "2023-12-31",
    termoTarde: "2024-12-31",
    diasRestantes: null,
    certeza: "faixa",
    podeSalvar: false,
    acao: null,
    conferir: [
      "Data da notificação do lançamento (03/04/2024) confere com o AR ou a ciência no processo administrativo?"
    ],
    eventos: [
      { data: "2018-12-20", fato: "Fato gerador (apuração de dez/2018)", efeito: "Data cedo: 5 anos do exercício seguinte ao fato gerador" },
      { data: "2019-01-31", fato: "Vencimento do tributo", efeito: "Data tarde: 5 anos do exercício seguinte ao vencimento" },
      { data: "2024-04-03", fato: "Lançamento de ofício notificado", efeito: "Cai entre a data cedo e a data tarde" },
      { data: "2025-02-11", fato: "Inscrição em dívida ativa", efeito: "Sem efeito no prazo" },
      { data: "2025-06-30", fato: "Ajuizamento da execução fiscal", efeito: "Encerra o relógio da ordinária" }
    ],
    consumadaHa: null,
    silenciadaAte: null,
    adiada: null,
    tratada: null,
    regua: {
      inicio: "2019-01-01", fim: "2025-04-19",
      segmentos: [
        { de: "2019-01-01", ate: "2023-12-31", tipo: "correndo", rotulo: "Prazo de decadência" }
      ],
      marcas: [
        { data: "2023-12-31", rotulo: "Data cedo", tipo: "cedo" },
        { data: "2024-04-03", rotulo: "Lançamento notificado", tipo: "fato" },
        { data: "2024-12-31", rotulo: "Data tarde (tese da União)", tipo: "tarde" }
      ]
    }
  },
  {
    id: "nx-08",
    cda: "80.2.11.000442-19",
    devedor: "Autopeças Brasil Central Ltda",
    operacao: "Operação Veredas",
    valor: 8420.1,
    processo: "5000764-25.2012.4.04.7004",
    abrangidaPor: null,
    natureza: "decadencia",
    fase: "Sem cálculo",
    fila: "registro",
    situacao: "Sem o período de apuração e a modalidade de lançamento na ficha, a decadência não pode ser calculada.",
    termoCedo: null,
    termoTarde: null,
    diasRestantes: null,
    certeza: "dado",
    podeSalvar: false,
    acao: null,
    conferir: [
      "Informar o período de apuração e a modalidade (declarado, de ofício...) na ficha da CDA"
    ],
    eventos: [
      { data: "2011-07-22", fato: "Inscrição em dívida ativa", efeito: "Sem efeito no prazo" },
      { data: "2012-02-08", fato: "Ajuizamento da execução fiscal", efeito: "Encerra o relógio da ordinária" }
    ],
    consumadaHa: null,
    silenciadaAte: null,
    adiada: null,
    tratada: null,
    regua: null
  },
  {
    id: "nx-09",
    cda: "90.2.15.006618-39",
    devedor: "Frigorífico Vale do Iguaçu Ltda",
    operacao: "Operação Maré Vazante",
    valor: 2145300,
    processo: "5002871-40.2016.4.04.7001",
    abrangidaPor: null,
    natureza: "intercorrente",
    fase: "Penhora antiga",
    fila: "vigiar",
    situacao: "Penhora há mais de 6 anos (12/03/2020), sem outro fato lançado. Análise caso a caso: houve nova ciência de insuficiência depois dela?",
    termoCedo: null,
    termoTarde: null,
    diasRestantes: null,
    certeza: "analisar",
    podeSalvar: false,
    acao: null,
    conferir: [
      "Houve nova intimação da Fazenda sobre a insuficiência da penhora depois de 12/03/2020? (a de 30/03/2020 pode ser a ciência)",
      "O imóvel penhorado segue constrito (matrícula atualizada)?"
    ],
    eventos: [
      { data: "2016-03-14", fato: "Ajuizamento da execução fiscal", efeito: "Sem efeito no intercorrente" },
      { data: "2016-11-22", fato: "Citação do devedor (AR positivo)", efeito: "Interrompe a ordinária; ainda não conta o intercorrente" },
      { data: "2020-03-12", fato: "Penhora de imóvel (matrícula 14.882), valor insuficiente", efeito: "Encerra o ciclo. Nova inércia exige nova ciência" },
      { data: "2020-03-30", fato: "Intimação eletrônica da Fazenda sobre o resultado da penhora (disponibilizada)", efeito: "Pode ser a ciência; ainda não lançada" },
      { data: "2026-03-12", fato: "Seis anos da penhora sem outro fato", efeito: "A CDA entra na lista \"Penhora antiga: analisar\"" }
    ],
    consumadaHa: null,
    silenciadaAte: null,
    adiada: null,
    tratada: null,
    regua: {
      inicio: "2016-03-14", fim: "2027-04-20",
      segmentos: [
        { de: "2016-03-14", ate: "2020-03-12", tipo: "aguardando", rotulo: "Sem ciência: sem relógio" },
        { de: "2020-03-12", ate: "2026-10-09", tipo: "aguardando", rotulo: "Ciclo encerrado: aguarda nova ciência" }
      ],
      marcas: [
        { data: "2020-03-12", rotulo: "Penhora: ciclo encerrado", tipo: "ciclo" },
        { data: "2020-03-30", rotulo: "Intimação eletrônica (possível ciência)", tipo: "fato" },
        { data: "2026-10-09", rotulo: "Hoje", tipo: "hoje" }
      ]
    }
  },
  {
    id: "nx-10",
    cda: "90.2.15.006619-10",
    devedor: "Frigorífico Vale do Iguaçu Ltda",
    operacao: "Operação Maré Vazante",
    valor: 689440.75,
    processo: "5002871-40.2016.4.04.7001",
    abrangidaPor: null,
    natureza: "intercorrente",
    fase: "Penhora antiga",
    fila: "vigiar",
    situacao: "Penhora há mais de 6 anos (12/03/2020), sem outro fato lançado. Análise caso a caso: houve nova ciência de insuficiência depois dela?",
    termoCedo: null,
    termoTarde: null,
    diasRestantes: null,
    certeza: "analisar",
    podeSalvar: false,
    acao: null,
    conferir: [
      "Houve nova intimação da Fazenda sobre a insuficiência da penhora depois de 12/03/2020? (a de 30/03/2020 pode ser a ciência)",
      "O imóvel penhorado segue constrito (matrícula atualizada)?"
    ],
    eventos: [
      { data: "2016-03-14", fato: "Ajuizamento da execução fiscal", efeito: "Sem efeito no intercorrente" },
      { data: "2016-11-22", fato: "Citação do devedor (AR positivo)", efeito: "Interrompe a ordinária; ainda não conta o intercorrente" },
      { data: "2020-03-12", fato: "Penhora de imóvel (matrícula 14.882), valor insuficiente", efeito: "Encerra o ciclo. Nova inércia exige nova ciência" },
      { data: "2020-03-30", fato: "Intimação eletrônica da Fazenda sobre o resultado da penhora (disponibilizada)", efeito: "Pode ser a ciência; ainda não lançada" },
      { data: "2026-03-12", fato: "Seis anos da penhora sem outro fato", efeito: "A CDA entra na lista \"Penhora antiga: analisar\"" }
    ],
    consumadaHa: null,
    silenciadaAte: null,
    adiada: null,
    tratada: null,
    regua: {
      inicio: "2016-03-14", fim: "2027-04-20",
      segmentos: [
        { de: "2016-03-14", ate: "2020-03-12", tipo: "aguardando", rotulo: "Sem ciência: sem relógio" },
        { de: "2020-03-12", ate: "2026-10-09", tipo: "aguardando", rotulo: "Ciclo encerrado: aguarda nova ciência" }
      ],
      marcas: [
        { data: "2020-03-12", rotulo: "Penhora: ciclo encerrado", tipo: "ciclo" },
        { data: "2020-03-30", rotulo: "Intimação eletrônica (possível ciência)", tipo: "fato" },
        { data: "2026-10-09", rotulo: "Hoje", tipo: "hoje" }
      ]
    }
  },
  {
    id: "nx-11",
    cda: "90.6.16.009230-18",
    devedor: "Metalúrgica Tavares Indústria e Comércio Ltda",
    operacao: "Operação Cais do Porto",
    valor: 1976420,
    processo: "5007712-09.2017.4.04.7002",
    abrangidaPor: null,
    natureza: "intercorrente",
    fase: "Parcelamento a conferir",
    fila: "agir",
    situacao: "O parcelamento (adesão em 14/11/2017) está vigente e foi conferido pela última vez em 20/12/2021. A data cedo presume que acabou logo depois: 20/12/2026. O parcelamento segue vigente?",
    termoCedo: "2026-12-20",
    termoTarde: null,
    diasRestantes: 72,
    certeza: "dado",
    podeSalvar: true,
    acao: { tipo: "confirmar_vigencia", rotulo: "Ainda vale", umClique: true },
    conferir: [
      "O SIDA mostra o parcelamento como ativo hoje?",
      "Há parcelas em atraso desde a conferência de 20/12/2021?"
    ],
    eventos: [
      { data: "2017-04-26", fato: "Ajuizamento da execução fiscal", efeito: "Sem efeito no intercorrente" },
      { data: "2017-09-05", fato: "Citação do devedor (AR positivo)", efeito: "Interrompe a ordinária" },
      { data: "2017-11-14", fato: "Adesão a parcelamento (PERT)", efeito: "Interrompe e pausa o prazo" },
      { data: "2021-12-20", fato: "Conferência da vigência (importação SIDA)", efeito: "Data cedo = conferência + 5 anos" }
    ],
    consumadaHa: null,
    silenciadaAte: null,
    adiada: null,
    tratada: null,
    regua: {
      inicio: "2017-04-26", fim: "2027-06-14",
      segmentos: [
        { de: "2017-04-26", ate: "2017-11-14", tipo: "aguardando", rotulo: "Sem ciência: sem relógio" },
        { de: "2017-11-14", ate: "2026-10-09", tipo: "pausa", rotulo: "Parcelamento vigente (sem fim lançado)" }
      ],
      marcas: [
        { data: "2021-12-20", rotulo: "Última conferência da vigência", tipo: "fato" },
        { data: "2026-10-09", rotulo: "Hoje", tipo: "hoje" },
        { data: "2026-12-20", rotulo: "Data cedo", tipo: "cedo" }
      ]
    }
  },
  {
    id: "nx-12",
    cda: "90.2.13.014877-03",
    devedor: "Construtora Horizonte Sul Ltda",
    operacao: "Operação Lastro",
    valor: 3402118.92,
    processo: "5003605-77.2014.4.04.7005",
    abrangidaPor: null,
    natureza: "intercorrente",
    fase: "Pedido sem desfecho",
    fila: "agir",
    situacao: "Há pedido de bloqueio (Sisbajud) de 14/05/2026 sem desfecho nos autos. Se der resultado útil, retroage e encerra o ciclo; sem ele, o prazo vence em 02/12/2026.",
    termoCedo: "2026-12-02",
    termoTarde: "2026-12-02",
    diasRestantes: 54,
    certeza: "calculado",
    podeSalvar: false,
    acao: { tipo: "criar_evento", rotulo: "Lançar resultado do pedido", umClique: false },
    conferir: [
      "O pedido de Sisbajud de 14/05/2026 teve resposta? (bloqueio positivo, negativo ou sem resposta)",
      "Há decisão ou despacho posterior ao pedido?",
      "Se positivo: lançar o bloqueio com a data do pedido"
    ],
    eventos: [
      { data: "2014-06-02", fato: "Ajuizamento da execução fiscal", efeito: "Sem efeito no intercorrente" },
      { data: "2015-02-10", fato: "Citação do devedor (AR positivo)", efeito: "Interrompe a ordinária" },
      { data: "2020-12-02", fato: "Ciência da Fazenda: devedor sem bens localizados (art. 40)", efeito: "Começa o ano de suspensão" },
      { data: "2021-12-02", fato: "Fim do ano de suspensão: arquivamento", efeito: "Começa a correr o prazo de 5 anos" },
      { data: "2026-05-14", fato: "Pedido de bloqueio (Sisbajud) protocolado pela Fazenda", efeito: "Dentro da janela. Se der resultado útil, retroage e encerra o ciclo" }
    ],
    consumadaHa: null,
    silenciadaAte: null,
    adiada: null,
    tratada: null,
    regua: {
      inicio: "2014-06-02", fim: "2027-07-18",
      segmentos: [
        { de: "2014-06-02", ate: "2020-12-02", tipo: "aguardando", rotulo: "Sem ciência: sem relógio" },
        { de: "2020-12-02", ate: "2021-12-02", tipo: "suspensao", rotulo: "Ano de suspensão (art. 40)" },
        { de: "2021-12-02", ate: "2026-12-02", tipo: "correndo", rotulo: "5 anos após o arquivamento" }
      ],
      marcas: [
        { data: "2026-05-14", rotulo: "Pedido de Sisbajud", tipo: "fato" },
        { data: "2026-10-09", rotulo: "Hoje", tipo: "hoje" },
        { data: "2026-12-02", rotulo: "Termo", tipo: "termo" }
      ]
    }
  },
  {
    id: "nx-13",
    cda: "90.7.18.010447-52",
    devedor: "Laticínios Campos Gerais Ltda",
    operacao: "Operação Veredas",
    valor: 318760.45,
    processo: "5006120-31.2019.4.04.7001",
    abrangidaPor: null,
    natureza: "intercorrente",
    fase: "Só o arquivamento datado",
    fila: "agir",
    situacao: "Só há o arquivamento datado de 10/12/2021, sem ciência lançada. A data cedo é 10/12/2026 (arquivamento + 5 anos) e a tarde 10/12/2027 (+ 1 + 5 anos). Lance a ciência para fechar a data.",
    termoCedo: "2026-12-10",
    termoTarde: "2027-12-10",
    diasRestantes: 62,
    certeza: "dado",
    podeSalvar: false,
    acao: { tipo: "lancar_ciencia", rotulo: "Lançar a data da ciência", umClique: false },
    conferir: [
      "Certidão de intimação da Fazenda sobre a suspensão (art. 40)",
      "Despacho que suspendeu a execução antes do arquivamento"
    ],
    eventos: [
      { data: "2019-08-05", fato: "Ajuizamento da execução fiscal", efeito: "Sem efeito no intercorrente" },
      { data: "2020-02-18", fato: "Citação por edital", efeito: "Interrompe a ordinária" },
      { data: "2021-12-10", fato: "Arquivamento provisório (art. 40, § 2º), sem ciência lançada", efeito: "Só o arquivamento: data cedo + 5 anos; data tarde + 6 anos" }
    ],
    consumadaHa: null,
    silenciadaAte: null,
    adiada: null,
    tratada: null,
    regua: {
      inicio: "2019-08-05", fim: "2028-05-10",
      segmentos: [
        { de: "2019-08-05", ate: "2021-12-10", tipo: "aguardando", rotulo: "Sem ciência: sem relógio" },
        { de: "2021-12-10", ate: "2026-12-10", tipo: "correndo", rotulo: "5 anos após o arquivamento" }
      ],
      marcas: [
        { data: "2021-12-10", rotulo: "Arquivamento", tipo: "fato" },
        { data: "2026-10-09", rotulo: "Hoje", tipo: "hoje" },
        { data: "2026-12-10", rotulo: "Data cedo", tipo: "cedo" },
        { data: "2027-12-10", rotulo: "Data tarde (tese da União)", tipo: "tarde" }
      ]
    }
  },
  {
    id: "nx-14",
    cda: "90.4.13.002801-70",
    devedor: "Cooperativa Agrícola Vale Verde",
    operacao: "Operação Rota Fria",
    valor: 524305,
    processo: "5008203-16.2014.4.04.7007",
    abrangidaPor: null,
    natureza: "intercorrente",
    fase: "Só a decisão de suspensão",
    fila: "agir",
    situacao: "A data cedo (05/11/2025) já passou e falta o dado que a confirmaria: a certidão que mostra quando a Fazenda tomou ciência da suspensão. A data tarde (18/03/2027) é a tese da União. Conferir nos autos.",
    termoCedo: "2025-11-05",
    termoTarde: "2027-03-18",
    diasRestantes: -338,
    certeza: "dado",
    podeSalvar: false,
    acao: { tipo: "lancar_ciencia", rotulo: "Lançar a data da ciência", umClique: false },
    conferir: [
      "Certidão de intimação da decisão de suspensão de 18/03/2021",
      "Petição da Fazenda de 05/11/2019: pediu a suspensão?",
      "Algum ato da Fazenda entre a decisão e hoje?"
    ],
    eventos: [
      { data: "2014-09-01", fato: "Ajuizamento da execução fiscal", efeito: "Sem efeito no intercorrente" },
      { data: "2015-04-14", fato: "Citação do devedor (AR positivo)", efeito: "Interrompe a ordinária" },
      { data: "2019-11-05", fato: "Fazenda pede a suspensão da execução (art. 40)", efeito: "Marco da data cedo (+ 1 + 5 anos)" },
      { data: "2021-03-18", fato: "Decisão de suspensão (art. 40), sem certidão de intimação nos autos", efeito: "Marco da data tarde (+ 1 + 5 anos)" }
    ],
    consumadaHa: null,
    silenciadaAte: null,
    adiada: null,
    tratada: null,
    regua: {
      inicio: "2014-09-01", fim: "2027-11-02",
      segmentos: [
        { de: "2014-09-01", ate: "2019-11-05", tipo: "aguardando", rotulo: "Sem ciência: sem relógio" },
        { de: "2019-11-05", ate: "2025-11-05", tipo: "correndo", rotulo: "1 + 5 anos a partir do pedido de suspensão" }
      ],
      marcas: [
        { data: "2021-03-18", rotulo: "Decisão de suspensão", tipo: "fato" },
        { data: "2025-11-05", rotulo: "Data cedo", tipo: "cedo" },
        { data: "2026-10-09", rotulo: "Hoje", tipo: "hoje" },
        { data: "2027-03-18", rotulo: "Data tarde (tese da União)", tipo: "tarde" }
      ]
    }
  },
  {
    id: "nx-15",
    cda: "80.2.12.002216-90",
    devedor: "Mineração Pedra Branca S.A.",
    operacao: "Operação Cais do Porto",
    valor: 3998700,
    processo: "5001198-63.2013.4.04.7007",
    abrangidaPor: null,
    natureza: "intercorrente",
    fase: "Análise diverge do cálculo",
    fila: "agir",
    situacao: "A análise importada diz que o ciclo encerrou por penhora, mas não há penhora lançada nos eventos. Vale o cálculo: o prazo vence em 23/11/2026. Lance o fato que encerrou o ciclo, se ele existir.",
    termoCedo: "2026-11-23",
    termoTarde: "2026-11-23",
    diasRestantes: 45,
    certeza: "calculado",
    divergencia: true,
    podeSalvar: false,
    acao: { tipo: "criar_evento", rotulo: "Lançar o fato que encerrou o ciclo", umClique: false },
    conferir: [
      "Há penhora, bloqueio ou indisponibilidade nos autos que não foi lançada?",
      "A planilha de análise de 12/08/2026 cita a data e o bem?"
    ],
    eventos: [
      { data: "2013-02-27", fato: "Ajuizamento da execução fiscal", efeito: "Sem efeito no intercorrente" },
      { data: "2013-09-10", fato: "Citação do devedor (AR positivo)", efeito: "Interrompe a ordinária" },
      { data: "2020-11-23", fato: "Ciência da Fazenda do arquivamento (art. 40)", efeito: "Começa o ano de suspensão" },
      { data: "2026-08-12", fato: "Análise importada (planilha): \"ciclo encerrado por penhora\"", efeito: "Não substitui o cálculo: nenhuma penhora lançada" }
    ],
    consumadaHa: null,
    silenciadaAte: null,
    adiada: null,
    tratada: null,
    regua: {
      inicio: "2013-02-27", fim: "2027-07-31",
      segmentos: [
        { de: "2013-02-27", ate: "2020-11-23", tipo: "aguardando", rotulo: "Sem ciência: sem relógio" },
        { de: "2020-11-23", ate: "2021-11-23", tipo: "suspensao", rotulo: "Ano de suspensão (art. 40)" },
        { de: "2021-11-23", ate: "2026-11-23", tipo: "correndo", rotulo: "5 anos após o arquivamento" }
      ],
      marcas: [
        { data: "2026-08-12", rotulo: "Análise importada", tipo: "fato" },
        { data: "2026-10-09", rotulo: "Hoje", tipo: "hoje" },
        { data: "2026-11-23", rotulo: "Termo", tipo: "termo" }
      ]
    }
  },
  {
    id: "nx-16",
    cda: "90.4.14.005582-08",
    devedor: "Supermercados Nova Aliança Ltda",
    operacao: "Operação Maré Vazante",
    valor: 742390,
    processo: "0010345-12.1999.4.04.7003",
    abrangidaPor: null,
    natureza: "intercorrente",
    fase: "Rescisão de parcelamento",
    fila: "agir",
    situacao: "Pela leitura mais desfavorável (data cedo, 27/04/2006), o prazo já venceu há 20 anos. A data tarde (09/03/2028) é a tese da União.",
    termoCedo: "2006-04-27",
    termoTarde: "2028-03-09",
    diasRestantes: -7470,
    certeza: "faixa",
    podeSalvar: false,
    acao: { tipo: "conferir_autos", rotulo: "Conferir nos autos", umClique: false },
    conferir: [
      "Data da última parcela paga (inadimplemento) no extrato do parcelamento",
      "Data da exclusão formal publicada (09/03/2022)",
      "Algum ato da Fazenda depois de 09/03/2022?"
    ],
    eventos: [
      { data: "1999-10-04", fato: "Ajuizamento da execução fiscal", efeito: "Sem efeito no intercorrente" },
      { data: "2000-03-21", fato: "Citação do devedor (AR positivo)", efeito: "Interrompe a ordinária" },
      { data: "2000-04-10", fato: "Adesão a parcelamento", efeito: "Interrompe e pausa o prazo" },
      { data: "2001-04-27", fato: "Última parcela paga (inadimplemento)", efeito: "Marco da data cedo (+ 5 anos)" },
      { data: "2022-03-09", fato: "Exclusão do parcelamento (rescisão formal)", efeito: "Marco da data tarde (+ 1 + 5 anos)" }
    ],
    consumadaHa: null,
    silenciadaAte: null,
    adiada: null,
    tratada: null,
    regua: {
      inicio: "1999-10-04", fim: "2028-11-30",
      segmentos: [
        { de: "1999-10-04", ate: "2000-04-10", tipo: "aguardando", rotulo: "Sem ciência: sem relógio" },
        { de: "2000-04-10", ate: "2001-04-27", tipo: "pausa", rotulo: "Parcelamento vigente" },
        { de: "2001-04-27", ate: "2006-04-27", tipo: "correndo", rotulo: "5 anos após o inadimplemento" }
      ],
      marcas: [
        { data: "2006-04-27", rotulo: "Data cedo", tipo: "cedo" },
        { data: "2022-03-09", rotulo: "Exclusão do parcelamento", tipo: "fato" },
        { data: "2026-10-09", rotulo: "Hoje", tipo: "hoje" },
        { data: "2028-03-09", rotulo: "Data tarde (tese da União)", tipo: "tarde" }
      ]
    }
  },
  {
    id: "nx-17",
    cda: "80.6.15.011302-47",
    devedor: "Cerâmica Rio das Pedras Ltda",
    operacao: "Operação Rota Fria",
    valor: 1058000,
    processo: "5009034-50.2016.4.04.7009",
    abrangidaPor: null,
    natureza: "intercorrente",
    fase: "Rescisão de parcelamento",
    fila: "agir",
    situacao: "A data cedo cai nos próximos 90 dias (14/12/2026). Peticionar antes dela; a data tarde (14/12/2027) é a tese da União. O adiamento por garantia em análise venceu em 06/10/2026.",
    termoCedo: "2026-12-14",
    termoTarde: "2027-12-14",
    diasRestantes: 66,
    certeza: "faixa",
    podeSalvar: false,
    acao: { tipo: "conferir_autos", rotulo: "Conferir nos autos", umClique: false },
    conferir: [
      "O extrato do parcelamento traz a data do inadimplemento? Sem ela, vale a data da rescisão",
      "Alguma intimação da Fazenda depois da rescisão?"
    ],
    eventos: [
      { data: "2016-08-03", fato: "Ajuizamento da execução fiscal", efeito: "Sem efeito no intercorrente" },
      { data: "2017-03-15", fato: "Citação do devedor (AR positivo)", efeito: "Interrompe a ordinária" },
      { data: "2018-09-10", fato: "Adesão a parcelamento", efeito: "Interrompe e pausa o prazo" },
      { data: "2021-12-14", fato: "Rescisão do parcelamento, sem data de inadimplemento lançada", efeito: "Data cedo = rescisão + 5 anos; data tarde = + 1 + 5 anos" },
      { data: "2026-09-22", fato: "Adiado até 06/10/2026: garantia em análise", efeito: "O adiamento venceu; o item voltou à fila" }
    ],
    consumadaHa: null,
    silenciadaAte: null,
    adiada: { ate: "2026-10-06", motivo: "Garantia em análise", desde: "2026-09-22" },
    tratada: null,
    regua: {
      inicio: "2016-08-03", fim: "2028-07-08",
      segmentos: [
        { de: "2016-08-03", ate: "2018-09-10", tipo: "aguardando", rotulo: "Sem ciência: sem relógio" },
        { de: "2018-09-10", ate: "2021-12-14", tipo: "pausa", rotulo: "Parcelamento vigente" },
        { de: "2021-12-14", ate: "2026-12-14", tipo: "correndo", rotulo: "5 anos após a rescisão" }
      ],
      marcas: [
        { data: "2021-12-14", rotulo: "Rescisão do parcelamento", tipo: "fato" },
        { data: "2026-10-09", rotulo: "Hoje", tipo: "hoje" },
        { data: "2026-12-14", rotulo: "Data cedo", tipo: "cedo" },
        { data: "2027-12-14", rotulo: "Data tarde (tese da União)", tipo: "tarde" }
      ]
    }
  },
  {
    id: "nx-18",
    cda: "90.6.19.008865-21",
    devedor: "Refrigerantes Cataratas Ltda",
    operacao: "Operação Veredas",
    valor: 1412870.33,
    processo: "5003128-71.2020.4.04.7001",
    abrangidaPor: null,
    natureza: "intercorrente",
    fase: "Ciclo encerrado por penhora",
    fila: "vigiar",
    situacao: "Ciclo encerrado pela penhora de 26/01/2024. Não pode ter prescrito antes de 26/01/2030; nova inércia exige nova ciência.",
    termoCedo: "2030-01-26",
    termoTarde: "2030-01-26",
    diasRestantes: 1205,
    certeza: "calculado",
    podeSalvar: false,
    acao: null,
    conferir: [],
    eventos: [
      { data: "2020-04-20", fato: "Ajuizamento da execução fiscal", efeito: "Sem efeito no intercorrente" },
      { data: "2021-02-03", fato: "Citação do devedor (AR positivo)", efeito: "Interrompe a ordinária" },
      { data: "2024-01-26", fato: "Penhora de ativos financeiros (Sisbajud positivo, R$ 38.412,19)", efeito: "Encerra o ciclo. Nova inércia exige nova ciência" }
    ],
    consumadaHa: null,
    silenciadaAte: null,
    adiada: null,
    tratada: null,
    regua: {
      inicio: "2020-04-20", fim: "2030-07-23",
      segmentos: [
        { de: "2020-04-20", ate: "2024-01-26", tipo: "aguardando", rotulo: "Sem ciência: sem relógio" },
        { de: "2024-01-26", ate: "2030-01-26", tipo: "aguardando", rotulo: "Ciclo encerrado: aguarda nova ciência" }
      ],
      marcas: [
        { data: "2024-01-26", rotulo: "Penhora: ciclo encerrado", tipo: "ciclo" },
        { data: "2026-10-09", rotulo: "Hoje", tipo: "hoje" },
        { data: "2030-01-26", rotulo: "Piso: não antes de", tipo: "termo" }
      ]
    }
  },
  {
    id: "nx-19",
    cda: "80.7.11.003950-61",
    devedor: "Indústria de Calçados Primavera Ltda",
    operacao: "Operação Lastro",
    valor: 487210,
    processo: "5002219-84.2012.4.04.7005",
    abrangidaPor: null,
    natureza: "intercorrente",
    fase: "Parcelamento vigente",
    fila: "vigiar",
    situacao: "Parcelamento vigente (adesão em 28/01/2018, conferido em 01/06/2026): o prazo não corre. Fora do alarme até 03/03/2031, 90 dias antes da data cedo (01/06/2031).",
    termoCedo: "2031-06-01",
    termoTarde: null,
    diasRestantes: 1696,
    certeza: "dado",
    podeSalvar: false,
    acao: null,
    conferir: [],
    eventos: [
      { data: "2012-03-19", fato: "Ajuizamento da execução fiscal", efeito: "Sem efeito no intercorrente" },
      { data: "2013-05-07", fato: "Citação do devedor (AR positivo)", efeito: "Interrompe a ordinária" },
      { data: "2018-01-28", fato: "Adesão a parcelamento", efeito: "Interrompe e pausa o prazo" },
      { data: "2026-06-01", fato: "Conferência da vigência (importação SIDA)", efeito: "Data cedo = conferência + 5 anos" }
    ],
    consumadaHa: null,
    silenciadaAte: "2031-03-03",
    adiada: null,
    tratada: null,
    regua: {
      inicio: "2012-03-19", fim: "2032-05-16",
      segmentos: [
        { de: "2012-03-19", ate: "2018-01-28", tipo: "aguardando", rotulo: "Sem ciência: sem relógio" },
        { de: "2018-01-28", ate: "2026-10-09", tipo: "pausa", rotulo: "Parcelamento vigente" }
      ],
      marcas: [
        { data: "2026-06-01", rotulo: "Última conferência da vigência", tipo: "fato" },
        { data: "2026-10-09", rotulo: "Hoje", tipo: "hoje" },
        { data: "2031-03-03", rotulo: "Volta à fila", tipo: "fato" },
        { data: "2031-06-01", rotulo: "Data cedo", tipo: "cedo" }
      ]
    }
  },
  {
    id: "nx-20",
    cda: "90.5.17.004471-09",
    devedor: "Incorporadora Marechal Ltda",
    operacao: "Operação Veredas",
    valor: 2560000,
    processo: "5004410-18.2018.4.04.7003",
    abrangidaPor: "IDPJ 5003333-22.2024.4.04.7002",
    natureza: "intercorrente",
    fase: "Interrompida via IDPJ",
    fila: "vigiar",
    situacao: "Ciclo encerrado pela constrição no IDPJ 5003333-22.2024.4.04.7002 (pedido de 20/05/2024). Não pode ter prescrito antes de 20/05/2030. Aos 5 anos da informação (17/06/2029) o processo pede esclarecimento.",
    termoCedo: "2030-05-20",
    termoTarde: "2030-05-20",
    diasRestantes: 1319,
    certeza: "calculado",
    podeSalvar: false,
    acao: null,
    conferir: [
      "A constrição do IDPJ teve resultado útil (bloqueio ou indisponibilidade efetivos)?"
    ],
    eventos: [
      { data: "2018-07-02", fato: "Ajuizamento da execução fiscal", efeito: "Sem efeito no intercorrente" },
      { data: "2019-03-11", fato: "Citação do devedor (AR positivo)", efeito: "Interrompe a ordinária" },
      { data: "2022-09-30", fato: "Ciência da Fazenda: devedor sem bens (art. 40)", efeito: "Começa o ano de suspensão" },
      { data: "2024-02-15", fato: "IDPJ 5003333-22.2024.4.04.7002 instaurado", efeito: "Abrange esta execução" },
      { data: "2024-05-20", fato: "IDPJ: indisponibilidade de bens (pedido)", efeito: "Vale como interrupção, igual a uma penhora, desde o pedido" },
      { data: "2024-06-17", fato: "IDPJ: constrição informada nos autos da execução", efeito: "Marco do aviso aos 5 anos (17/06/2029)" }
    ],
    consumadaHa: null,
    silenciadaAte: null,
    adiada: null,
    tratada: null,
    regua: {
      inicio: "2018-07-02", fim: "2030-12-23",
      segmentos: [
        { de: "2018-07-02", ate: "2022-09-30", tipo: "aguardando", rotulo: "Sem ciência: sem relógio" },
        { de: "2022-09-30", ate: "2023-09-30", tipo: "suspensao", rotulo: "Ano de suspensão (art. 40)" },
        { de: "2023-09-30", ate: "2024-05-20", tipo: "correndo", rotulo: "5 anos após o arquivamento" },
        { de: "2024-05-20", ate: "2030-05-20", tipo: "aguardando", rotulo: "Ciclo encerrado: aguarda nova ciência" }
      ],
      marcas: [
        { data: "2024-05-20", rotulo: "Constrição no IDPJ (pedido)", tipo: "ciclo" },
        { data: "2024-06-17", rotulo: "Constrição informada", tipo: "fato" },
        { data: "2026-10-09", rotulo: "Hoje", tipo: "hoje" },
        { data: "2030-05-20", rotulo: "Piso: não antes de", tipo: "termo" }
      ]
    }
  },
  {
    id: "nx-21",
    cda: "90.5.17.004472-80",
    devedor: "Incorporadora Marechal Ltda",
    operacao: "Operação Veredas",
    valor: 913600,
    processo: "5004410-18.2018.4.04.7003",
    abrangidaPor: "IDPJ 5003333-22.2024.4.04.7002",
    natureza: "intercorrente",
    fase: "Interrompida via IDPJ",
    fila: "vigiar",
    situacao: "Ciclo encerrado pela constrição no IDPJ 5003333-22.2024.4.04.7002 (pedido de 20/05/2024). Não pode ter prescrito antes de 20/05/2030. Aos 5 anos da informação (17/06/2029) o processo pede esclarecimento.",
    termoCedo: "2030-05-20",
    termoTarde: "2030-05-20",
    diasRestantes: 1319,
    certeza: "calculado",
    podeSalvar: false,
    acao: null,
    conferir: [
      "A constrição do IDPJ teve resultado útil (bloqueio ou indisponibilidade efetivos)?"
    ],
    eventos: [
      { data: "2018-07-02", fato: "Ajuizamento da execução fiscal", efeito: "Sem efeito no intercorrente" },
      { data: "2019-03-11", fato: "Citação do devedor (AR positivo)", efeito: "Interrompe a ordinária" },
      { data: "2022-09-30", fato: "Ciência da Fazenda: devedor sem bens (art. 40)", efeito: "Começa o ano de suspensão" },
      { data: "2024-02-15", fato: "IDPJ 5003333-22.2024.4.04.7002 instaurado", efeito: "Abrange esta execução" },
      { data: "2024-05-20", fato: "IDPJ: indisponibilidade de bens (pedido)", efeito: "Vale como interrupção, igual a uma penhora, desde o pedido" },
      { data: "2024-06-17", fato: "IDPJ: constrição informada nos autos da execução", efeito: "Marco do aviso aos 5 anos (17/06/2029)" }
    ],
    consumadaHa: null,
    silenciadaAte: null,
    adiada: null,
    tratada: null,
    regua: {
      inicio: "2018-07-02", fim: "2030-12-23",
      segmentos: [
        { de: "2018-07-02", ate: "2022-09-30", tipo: "aguardando", rotulo: "Sem ciência: sem relógio" },
        { de: "2022-09-30", ate: "2023-09-30", tipo: "suspensao", rotulo: "Ano de suspensão (art. 40)" },
        { de: "2023-09-30", ate: "2024-05-20", tipo: "correndo", rotulo: "5 anos após o arquivamento" },
        { de: "2024-05-20", ate: "2030-05-20", tipo: "aguardando", rotulo: "Ciclo encerrado: aguarda nova ciência" }
      ],
      marcas: [
        { data: "2024-05-20", rotulo: "Constrição no IDPJ (pedido)", tipo: "ciclo" },
        { data: "2024-06-17", rotulo: "Constrição informada", tipo: "fato" },
        { data: "2026-10-09", rotulo: "Hoje", tipo: "hoje" },
        { data: "2030-05-20", rotulo: "Piso: não antes de", tipo: "termo" }
      ]
    }
  },
  {
    id: "nx-22",
    cda: "80.4.11.006102-33",
    devedor: "Posto Rodovia Km 214 Ltda",
    operacao: "Operação Cais do Porto",
    valor: 168540.2,
    processo: "5000412-03.2012.4.04.7001",
    abrangidaPor: null,
    natureza: "intercorrente",
    fase: "Penhora antiga",
    fila: "vigiar",
    situacao: "Penhora há mais de 6 anos (20/08/2019), sem outro fato lançado. Análise caso a caso: houve nova ciência de insuficiência depois dela?",
    termoCedo: null,
    termoTarde: null,
    diasRestantes: null,
    certeza: "analisar",
    podeSalvar: false,
    acao: null,
    conferir: [
      "Houve nova intimação da Fazenda sobre a insuficiência da penhora depois de 20/08/2019?",
      "O bem penhorado ainda existe e segue constrito (consulta RENAJUD)?"
    ],
    eventos: [
      { data: "2012-05-30", fato: "Ajuizamento da execução fiscal", efeito: "Sem efeito no intercorrente" },
      { data: "2013-02-12", fato: "Citação do devedor (AR positivo)", efeito: "Interrompe a ordinária" },
      { data: "2019-08-20", fato: "Penhora de veículo, valor insuficiente", efeito: "Encerra o ciclo. Nova inércia exige nova ciência" },
      { data: "2025-08-20", fato: "Seis anos da penhora sem outro fato", efeito: "A CDA entra na lista \"Penhora antiga: analisar\"" }
    ],
    consumadaHa: null,
    silenciadaAte: null,
    adiada: null,
    tratada: null,
    regua: {
      inicio: "2012-05-30", fim: "2027-06-28",
      segmentos: [
        { de: "2012-05-30", ate: "2019-08-20", tipo: "aguardando", rotulo: "Sem ciência: sem relógio" },
        { de: "2019-08-20", ate: "2026-10-09", tipo: "aguardando", rotulo: "Ciclo encerrado: aguarda nova ciência" }
      ],
      marcas: [
        { data: "2019-08-20", rotulo: "Penhora: ciclo encerrado", tipo: "ciclo" },
        { data: "2026-10-09", rotulo: "Hoje", tipo: "hoje" }
      ]
    }
  },
  {
    id: "nx-23",
    cda: "90.6.16.012334-58",
    devedor: "Clínica Médica Vida Plena S/S",
    operacao: "Operação Maré Vazante",
    valor: 205680,
    processo: "5004866-90.2017.4.04.7001",
    abrangidaPor: null,
    natureza: "intercorrente",
    fase: "Consumada, a conferir",
    fila: "conferir",
    situacao: "Consumada nas duas leituras (23/05/2026 e 02/06/2026): a ciência eletrônica foi lançada e nada interrompeu o prazo no cálculo. Conferir se há penhora, bloqueio ou parcelamento que o cálculo não viu.",
    termoCedo: "2026-05-23",
    termoTarde: "2026-06-02",
    diasRestantes: -139,
    certeza: "faixa",
    podeSalvar: false,
    acao: { tipo: "conferir_autos", rotulo: "Conferir nos autos", umClique: false },
    conferir: [
      "Penhora, bloqueio (Sisbajud) ou indisponibilidade entre 23/05/2020 e 02/06/2026?",
      "Parcelamento ou pedido de parcelamento no período?",
      "A ciência foi mesmo em 2020? Abrir a intimação nos autos"
    ],
    eventos: [
      { data: "2017-02-14", fato: "Ajuizamento da execução fiscal", efeito: "Sem efeito no intercorrente" },
      { data: "2017-10-02", fato: "Citação do devedor (AR positivo)", efeito: "Interrompe a ordinária" },
      { data: "2020-05-23", fato: "Intimação eletrônica da Fazenda disponibilizada (art. 40)", efeito: "Data cedo: ciência na disponibilização" },
      { data: "2020-06-02", fato: "Intimação aberta pela Fazenda", efeito: "Data tarde: ciência na abertura" }
    ],
    consumadaHa: 129,
    silenciadaAte: null,
    adiada: null,
    tratada: null,
    regua: {
      inicio: "2017-02-14", fim: "2027-04-03",
      segmentos: [
        { de: "2017-02-14", ate: "2020-05-23", tipo: "aguardando", rotulo: "Sem ciência: sem relógio" },
        { de: "2020-05-23", ate: "2021-05-23", tipo: "suspensao", rotulo: "Ano de suspensão (art. 40)" },
        { de: "2021-05-23", ate: "2026-05-23", tipo: "correndo", rotulo: "5 anos após o arquivamento" }
      ],
      marcas: [
        { data: "2026-05-23", rotulo: "Data cedo", tipo: "cedo" },
        { data: "2026-06-02", rotulo: "Data tarde (tese da União)", tipo: "tarde" },
        { data: "2026-10-09", rotulo: "Hoje", tipo: "hoje" }
      ]
    }
  },
  {
    id: "nx-24",
    cda: "80.2.09.004387-12",
    devedor: "Eletro Sul Comércio de Eletrodomésticos Ltda",
    operacao: "Operação Rota Fria",
    valor: 76015.9,
    processo: "5007741-25.2010.4.04.7004",
    abrangidaPor: null,
    natureza: "intercorrente",
    fase: "Consumada há 6 anos",
    fila: "registro",
    situacao: "Consumada em 15/09/2020, há mais de 6 anos. Fica só no registro, fora do alarme.",
    termoCedo: "2020-09-15",
    termoTarde: "2020-09-15",
    diasRestantes: -2215,
    certeza: "calculado",
    podeSalvar: false,
    acao: null,
    conferir: [],
    eventos: [
      { data: "2010-06-17", fato: "Ajuizamento da execução fiscal", efeito: "Sem efeito no intercorrente" },
      { data: "2011-03-08", fato: "Citação do devedor (AR positivo)", efeito: "Interrompe a ordinária" },
      { data: "2014-09-15", fato: "Ciência da Fazenda: devedor sem bens (art. 40)", efeito: "Começa o ano de suspensão" },
      { data: "2015-09-15", fato: "Fim do ano de suspensão: arquivamento", efeito: "Começa a correr o prazo de 5 anos" }
    ],
    consumadaHa: 2215,
    silenciadaAte: null,
    adiada: null,
    tratada: null,
    regua: {
      inicio: "2010-06-17", fim: "2027-08-02",
      segmentos: [
        { de: "2010-06-17", ate: "2014-09-15", tipo: "aguardando", rotulo: "Sem ciência: sem relógio" },
        { de: "2014-09-15", ate: "2015-09-15", tipo: "suspensao", rotulo: "Ano de suspensão (art. 40)" },
        { de: "2015-09-15", ate: "2020-09-15", tipo: "correndo", rotulo: "5 anos após o arquivamento" }
      ],
      marcas: [
        { data: "2020-09-15", rotulo: "Termo", tipo: "termo" },
        { data: "2026-10-09", rotulo: "Hoje", tipo: "hoje" }
      ]
    }
  },
  {
    id: "nx-25",
    cda: "90.7.18.010448-33",
    devedor: "Laticínios Campos Gerais Ltda",
    operacao: "Operação Veredas",
    valor: 141900.7,
    processo: "5006120-31.2019.4.04.7001",
    abrangidaPor: null,
    natureza: "intercorrente",
    fase: "Só o arquivamento datado",
    fila: "adiada",
    situacao: "Só há o arquivamento datado de 10/12/2021, sem ciência lançada. A data cedo é 10/12/2026 (arquivamento + 5 anos) e a tarde 10/12/2027 (+ 1 + 5 anos).",
    termoCedo: "2026-12-10",
    termoTarde: "2027-12-10",
    diasRestantes: 62,
    certeza: "dado",
    podeSalvar: false,
    acao: { tipo: "lancar_ciencia", rotulo: "Lançar a data da ciência", umClique: false },
    conferir: [
      "Certidão de intimação da Fazenda sobre a suspensão (art. 40)"
    ],
    eventos: [
      { data: "2019-08-05", fato: "Ajuizamento da execução fiscal", efeito: "Sem efeito no intercorrente" },
      { data: "2020-02-18", fato: "Citação por edital", efeito: "Interrompe a ordinária" },
      { data: "2021-12-10", fato: "Arquivamento provisório (art. 40, § 2º), sem ciência lançada", efeito: "Só o arquivamento: data cedo + 5 anos; data tarde + 6 anos" },
      { data: "2026-10-05", fato: "Adiado até 12/10/2026: aguardando certidão", efeito: "Sai da fila e volta na data marcada" }
    ],
    consumadaHa: null,
    silenciadaAte: null,
    adiada: { ate: "2026-10-12", motivo: "Aguardando certidão", desde: "2026-10-05" },
    tratada: null,
    regua: {
      inicio: "2019-08-05", fim: "2028-05-10",
      segmentos: [
        { de: "2019-08-05", ate: "2021-12-10", tipo: "aguardando", rotulo: "Sem ciência: sem relógio" },
        { de: "2021-12-10", ate: "2026-12-10", tipo: "correndo", rotulo: "5 anos após o arquivamento" }
      ],
      marcas: [
        { data: "2021-12-10", rotulo: "Arquivamento", tipo: "fato" },
        { data: "2026-10-09", rotulo: "Hoje", tipo: "hoje" },
        { data: "2026-12-10", rotulo: "Data cedo", tipo: "cedo" },
        { data: "2027-12-10", rotulo: "Data tarde (tese da União)", tipo: "tarde" }
      ]
    }
  },
  {
    id: "nx-26",
    cda: "90.7.18.010449-14",
    devedor: "Laticínios Campos Gerais Ltda",
    operacao: "Operação Veredas",
    valor: 96320.4,
    processo: "5006120-31.2019.4.04.7001",
    abrangidaPor: null,
    natureza: "intercorrente",
    fase: "Só o arquivamento datado",
    fila: "agir",
    situacao: "Só há o arquivamento datado de 10/12/2021, sem ciência lançada. A data cedo é 10/12/2026 (arquivamento + 5 anos) e a tarde 10/12/2027 (+ 1 + 5 anos). Lance a ciência para fechar a data.",
    termoCedo: "2026-12-10",
    termoTarde: "2027-12-10",
    diasRestantes: 62,
    certeza: "dado",
    podeSalvar: false,
    acao: { tipo: "lancar_ciencia", rotulo: "Lançar a data da ciência", umClique: false },
    conferir: [
      "Certidão de intimação da Fazenda sobre a suspensão (art. 40)",
      "Despacho que suspendeu a execução antes do arquivamento"
    ],
    eventos: [
      { data: "2019-08-05", fato: "Ajuizamento da execução fiscal", efeito: "Sem efeito no intercorrente" },
      { data: "2020-02-18", fato: "Citação por edital", efeito: "Interrompe a ordinária" },
      { data: "2021-12-10", fato: "Arquivamento provisório (art. 40, § 2º), sem ciência lançada", efeito: "Só o arquivamento: data cedo + 5 anos; data tarde + 6 anos" }
    ],
    consumadaHa: null,
    silenciadaAte: null,
    adiada: null,
    tratada: null,
    regua: {
      inicio: "2019-08-05", fim: "2028-05-10",
      segmentos: [
        { de: "2019-08-05", ate: "2021-12-10", tipo: "aguardando", rotulo: "Sem ciência: sem relógio" },
        { de: "2021-12-10", ate: "2026-12-10", tipo: "correndo", rotulo: "5 anos após o arquivamento" }
      ],
      marcas: [
        { data: "2021-12-10", rotulo: "Arquivamento", tipo: "fato" },
        { data: "2026-10-09", rotulo: "Hoje", tipo: "hoje" },
        { data: "2026-12-10", rotulo: "Data cedo", tipo: "cedo" },
        { data: "2027-12-10", rotulo: "Data tarde (tese da União)", tipo: "tarde" }
      ]
    }
  },
  {
    id: "nx-27",
    cda: "90.2.12.005109-75",
    devedor: "Agropecuária Boa Esperança S.A.",
    operacao: "Operação Lastro",
    valor: 2730440,
    processo: "5001907-58.2013.4.04.7005",
    abrangidaPor: null,
    natureza: "intercorrente",
    fase: "Aguardando reconhecimento",
    fila: "tratada",
    situacao: "A prescrição foi apontada em 05/08/2026 e aguarda decisão judicial. O lembrete de 60 dias venceu em 04/10/2026: vale cobrar a decisão.",
    termoCedo: "2026-03-18",
    termoTarde: "2026-03-18",
    diasRestantes: -205,
    certeza: "calculado",
    podeSalvar: false,
    acao: null,
    conferir: [],
    eventos: [
      { data: "2013-04-15", fato: "Ajuizamento da execução fiscal", efeito: "Sem efeito no intercorrente" },
      { data: "2014-01-20", fato: "Citação do devedor (AR positivo)", efeito: "Interrompe a ordinária" },
      { data: "2020-03-18", fato: "Ciência da Fazenda: devedor sem bens (art. 40)", efeito: "Começa o ano de suspensão" },
      { data: "2026-08-05", fato: "Fazenda aponta a prescrição intercorrente em petição", efeito: "Aguarda decisão judicial; lembrete em 60 dias (venceu em 04/10/2026)" }
    ],
    consumadaHa: 205,
    silenciadaAte: "2026-10-04",
    adiada: null,
    tratada: { tipo: "aguardando_reconhecimento", rotulo: "Aguardando reconhecimento", desde: "2026-08-05" },
    regua: {
      inicio: "2013-04-15", fim: "2027-06-12",
      segmentos: [
        { de: "2013-04-15", ate: "2020-03-18", tipo: "aguardando", rotulo: "Sem ciência: sem relógio" },
        { de: "2020-03-18", ate: "2021-03-18", tipo: "suspensao", rotulo: "Ano de suspensão (art. 40)" },
        { de: "2021-03-18", ate: "2026-03-18", tipo: "correndo", rotulo: "5 anos após o arquivamento" }
      ],
      marcas: [
        { data: "2026-03-18", rotulo: "Termo", tipo: "termo" },
        { data: "2026-08-05", rotulo: "Prescrição apontada", tipo: "fato" },
        { data: "2026-10-09", rotulo: "Hoje", tipo: "hoje" }
      ]
    }
  },
  {
    id: "nx-28",
    cda: "80.7.10.000927-04",
    devedor: "Casa de Saúde São Judas Ltda",
    operacao: "Operação Cais do Porto",
    valor: 389300,
    processo: "5006388-12.2011.4.04.7001",
    abrangidaPor: null,
    natureza: "intercorrente",
    fase: "Reconhecida, aguardando baixa",
    fila: "tratada",
    situacao: "Sentença de 27/08/2026 reconheceu a prescrição. Falta o trânsito em julgado e a baixa da inscrição.",
    termoCedo: "2021-04-07",
    termoTarde: "2021-04-07",
    diasRestantes: -2011,
    certeza: "calculado",
    podeSalvar: false,
    acao: null,
    conferir: [],
    eventos: [
      { data: "2011-09-12", fato: "Ajuizamento da execução fiscal", efeito: "Sem efeito no intercorrente" },
      { data: "2012-06-05", fato: "Citação do devedor (AR positivo)", efeito: "Interrompe a ordinária" },
      { data: "2015-04-07", fato: "Ciência da Fazenda: devedor sem bens (art. 40)", efeito: "Começa o ano de suspensão" },
      { data: "2026-08-27", fato: "Sentença reconhece a prescrição intercorrente", efeito: "Aguarda trânsito em julgado e baixa" }
    ],
    consumadaHa: 2011,
    silenciadaAte: null,
    adiada: null,
    tratada: { tipo: "reconhecida", rotulo: "Prescrição reconhecida", desde: "2026-08-27" },
    regua: {
      inicio: "2011-09-12", fim: "2027-07-11",
      segmentos: [
        { de: "2011-09-12", ate: "2015-04-07", tipo: "aguardando", rotulo: "Sem ciência: sem relógio" },
        { de: "2015-04-07", ate: "2016-04-07", tipo: "suspensao", rotulo: "Ano de suspensão (art. 40)" },
        { de: "2016-04-07", ate: "2021-04-07", tipo: "correndo", rotulo: "5 anos após o arquivamento" }
      ],
      marcas: [
        { data: "2021-04-07", rotulo: "Termo", tipo: "termo" },
        { data: "2026-08-27", rotulo: "Sentença", tipo: "fato" },
        { data: "2026-10-09", rotulo: "Hoje", tipo: "hoje" }
      ]
    }
  },
  {
    id: "nx-29",
    cda: "90.6.24.002018-95",
    devedor: "Hotel Costa Verde Ltda",
    operacao: "Operação Maré Vazante",
    valor: 66470,
    processo: "5005719-34.2025.4.04.7001",
    abrangidaPor: null,
    natureza: "intercorrente",
    fase: "Ainda impossível",
    fila: "impossivel",
    situacao: "Ainda não pode ter prescrito: o ato mais recente (citação, 19/08/2025) mais 1 ano e 5 anos só chega em 19/08/2031. Sem ciência lançada, não há o que fazer agora.",
    termoCedo: "2031-08-19",
    termoTarde: null,
    diasRestantes: 1775,
    certeza: "calculado",
    podeSalvar: false,
    acao: null,
    conferir: [],
    eventos: [
      { data: "2025-02-11", fato: "Protocolo da execução fiscal", efeito: "Sem efeito no intercorrente" },
      { data: "2025-08-19", fato: "Citação do devedor (AR positivo)", efeito: "Interrompe a ordinária; marca o piso do intercorrente" }
    ],
    consumadaHa: null,
    silenciadaAte: "2031-05-21",
    adiada: null,
    tratada: null,
    regua: {
      inicio: "2025-02-11", fim: "2031-12-16",
      segmentos: [
        { de: "2025-02-11", ate: "2031-08-19", tipo: "aguardando", rotulo: "Ainda impossível: piso de 1 + 5 anos" }
      ],
      marcas: [
        { data: "2025-08-19", rotulo: "Citação", tipo: "fato" },
        { data: "2026-10-09", rotulo: "Hoje", tipo: "hoje" },
        { data: "2031-08-19", rotulo: "Piso: não antes de", tipo: "cedo" }
      ]
    }
  },
  {
    id: "nx-30",
    cda: "90.5.22.009115-47",
    devedor: "Pesqueira Atlântico Norte Ltda",
    operacao: "Operação Veredas",
    valor: 884120,
    processo: null,
    abrangidaPor: null,
    natureza: "ordinaria",
    fase: "Não ajuizada",
    fila: "adiada",
    situacao: "Os 5 anos para ajuizar vencem em 22/12/2026. A petição inicial foi protocolada em 02/10/2026 e aguarda distribuição.",
    termoCedo: "2026-12-22",
    termoTarde: "2026-12-22",
    diasRestantes: 74,
    certeza: "calculado",
    podeSalvar: true,
    acao: { tipo: "ajuizar", rotulo: "Ajuizar execução", umClique: false },
    conferir: [
      "A petição inicial foi distribuída? Anotar o número do processo"
    ],
    eventos: [
      { data: "2021-12-22", fato: "Declaração entregue (DCTF): constituição definitiva", efeito: "Começa a correr o prazo de 5 anos para ajuizar" },
      { data: "2022-05-17", fato: "Inscrição em dívida ativa", efeito: "Sem efeito no prazo" },
      { data: "2026-10-02", fato: "Petição inicial protocolada, aguardando distribuição", efeito: "Adiado até 16/10/2026: peça protocolada" }
    ],
    consumadaHa: null,
    silenciadaAte: null,
    adiada: { ate: "2026-10-16", motivo: "Peça protocolada", desde: "2026-10-02" },
    tratada: null,
    regua: {
      inicio: "2021-12-22", fim: "2027-03-23",
      segmentos: [
        { de: "2021-12-22", ate: "2026-12-22", tipo: "correndo", rotulo: "Prazo de 5 anos para ajuizar" }
      ],
      marcas: [
        { data: "2026-10-02", rotulo: "Petição inicial protocolada", tipo: "fato" },
        { data: "2026-10-09", rotulo: "Hoje", tipo: "hoje" },
        { data: "2026-12-22", rotulo: "Termo", tipo: "termo" }
      ]
    }
  }
  ];

  var NX = w.NX = w.NX || {};

  /* ───────── vocabulário (rótulos já existentes no app: CX_CERT, CX_ACT_LABEL, PRESC_SNOOZE_REASONS) ───────── */
  NX.ROTULOS = {
    natureza: { decadencia: 'Decadência', ordinaria: 'Ordinária', intercorrente: 'Intercorrente' },
    certeza: { calculado: 'Calculado', faixa: 'Cedo–tarde', dado: 'Falta dado', analisar: 'Analisar' },
    certezaDica: {
      calculado: 'Data exata pelo cálculo, com os fatos lançados.',
      faixa: 'Duas leituras: a data cedo (mais desfavorável) dá o alarme; a tarde é a tese da União.',
      dado: 'Falta um fato para fechar a data. A data cedo mostra o risco se ele não vier.',
      analisar: 'Penhora antiga ou análise importada que diverge do cálculo: análise caso a caso.'
    },
    segmento: { correndo: 'Prazo correndo', suspensao: 'Suspensão (art. 40)', pausa: 'Pausa (parcelamento, embargos...)', aguardando: 'Sem relógio' },
    marca: { cedo: 'Data cedo', tarde: 'Data tarde', termo: 'Termo', hoje: 'Hoje', ciclo: 'Ciclo encerrado', fato: 'Fato' },
    acao: { ajuizar: 'Ajuizar execução', lancar_ciencia: 'Lançar ciência', confirmar_vigencia: 'Ainda vale', criar_evento: 'Lançar fato', conferir_autos: 'Conferir nos autos', analisar_penhora: 'Marcar analisada' }
  };
  NX.MOTIVOS_ADIAMENTO = ['Aguardando certidão', 'Peça protocolada', 'Garantia em análise', 'Não priorizar agora', 'Outro'];
  NX.FILAS = [
    { id: 'agir', rotulo: 'Pedem você', tom: 'red', descricao: 'Há providência a tomar: ajuizar, lançar fato ou ciência, confirmar vigência ou conferir quando a data cedo já venceu.' },
    { id: 'conferir', rotulo: 'Consumadas há pouco', tom: 'orange', descricao: 'Consumadas há até 6 meses: o cálculo pode estar errado. Conferir nos autos. É conferência, não ação.' },
    { id: 'vigiar', rotulo: 'Só vigiar', tom: 'blue', descricao: 'Ciclo encerrado, parcelamento vigente, IDPJ com constrição ou penhora antiga. Sem ação agora.' },
    { id: 'registro', rotulo: 'Só registro', tom: 'gray', descricao: 'Decadência e consumadas antigas. Nunca alarmam; a decadência fica fora da conta.' },
    { id: 'adiada', rotulo: 'Adiadas', tom: 'orange', descricao: 'Fora da fila com motivo e data para voltar.' },
    { id: 'tratada', rotulo: 'Tratadas', tom: 'green', descricao: 'Prescrição apontada ou reconhecida, aguardando decisão ou baixa.' },
    { id: 'impossivel', rotulo: 'Ainda impossível', tom: 'gray', descricao: 'Ainda não pode ter prescrito: o piso de 1 + 5 anos não chegou.' }
  ];

  /* ───────── datas e números ───────── */
  NX.parse = function (iso) {
    if (!iso) return null;
    var p = String(iso).slice(0, 10).split('-');
    return Date.UTC(+p[0], +p[1] - 1, +p[2]);
  };
  // Dias de hoje (NX_HOJE) até a data: positivo = futuro, negativo = passado.
  NX.dias = function (iso, ref) {
    var a = NX.parse(iso), b = NX.parse(ref || w.NX_HOJE);
    return a == null ? null : Math.round((a - b) / 864e5);
  };
  NX.fmtData = function (iso) {
    if (!iso) return '—';
    var p = String(iso).slice(0, 10).split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  };
  NX.fmtDataCurta = function (iso) {
    if (!iso) return '—';
    var p = String(iso).slice(0, 10).split('-');
    return p[2] + '/' + p[1] + '/' + p[0].slice(2);
  };
  NX.fmtMoeda = function (n) {
    if (n == null || isNaN(n)) return '—';
    var neg = n < 0, s = Math.abs(n).toFixed(2).split('.');
    return (neg ? '-' : '') + 'R$ ' + s[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + s[1];
  };
  NX.fmtMoedaCurta = function (n) {
    if (n == null || isNaN(n)) return '—';
    var a = Math.abs(n), t;
    if (a >= 1e6) t = (a / 1e6).toFixed(1).replace('.', ',').replace(',0', '') + ' mi';
    else if (a >= 1e5) t = Math.round(a / 1e3) + ' mil';
    else if (a >= 1e3) t = (a / 1e3).toFixed(1).replace('.', ',').replace(',0', '') + ' mil';
    else t = String(Math.round(a));
    return (n < 0 ? '-' : '') + 'R$ ' + t;
  };
  // Duração compacta a partir de um número de dias (>= 0): "12 d", "5 m", "4,1 anos".
  NX.fmtDuracao = function (a) {
    a = Math.abs(a);
    if (a <= 120) return a + ' d';
    if (a < 730) return Math.round(a / 30.44) + ' m';
    var y = a / 365.25;
    return (y < 10 ? y.toFixed(1).replace('.', ',') : String(Math.round(y))) + ' anos';
  };
  // "em 40 d", "há 5 m", "hoje".
  NX.fmtDias = function (d) {
    if (d == null) return '—';
    if (d === 0) return 'hoje';
    if (d === 1) return 'amanhã';
    if (d === -1) return 'ontem';
    return d > 0 ? 'em ' + NX.fmtDuracao(d) : 'há ' + NX.fmtDuracao(-d);
  };
  // Tom por urgência (dias até a data cedo): vencido = red, janela de 90 dias = orange, até 1 ano = yellow.
  NX.tomDias = function (d) {
    if (d == null) return 'muted';
    if (d < 0) return 'red';
    if (d <= 90) return 'orange';
    if (d <= 365) return 'yellow';
    return 'muted';
  };
  NX.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  };

  /* ───────── consultas ───────── */
  NX.op = function (nome) {
    for (var i = 0; i < w.NX_OPERACOES.length; i++) if (w.NX_OPERACOES[i].nome === nome) return w.NX_OPERACOES[i];
    return { nome: nome, curto: String(nome || '').replace(/^Opera[çc][ãa]o\s+/i, ''), cor: '#7c828e' };
  };
  NX.soma = function (lista) { return (lista || []).reduce(function (s, r) { return s + (r.valor || 0); }, 0); };
  NX.da = function (fila) { return w.NX_DADOS.filter(function (r) { return r.fila === fila; }); };
  // Agrupa preservando a ordem de aparição: [{ chave, itens, valor }].
  NX.agrupar = function (lista, fn) {
    var m = {}, out = [];
    (lista || []).forEach(function (r) {
      var k = fn(r);
      if (!(k in m)) { m[k] = { chave: k, itens: [], valor: 0 }; out.push(m[k]); }
      m[k].itens.push(r); m[k].valor += r.valor || 0;
    });
    return out;
  };
  // Cópia profunda: use quando a proposta altera registros (adiar, tratar...) sem mexer nos dados compartilhados.
  NX.copia = function () { return JSON.parse(JSON.stringify(w.NX_DADOS)); };
  NX.adiamentoVencido = function (r) { return !!(r.adiada && NX.dias(r.adiada.ate) <= 0); };

  /* ───────── regras de exibição compartilhadas pelas três propostas (derivadas só dos campos acima) ───────── */
  // Kinds cuja data NÃO é prazo ("não antes de" ou data do evento): nunca vão para "vencido" nem para "cedo venceu".
  NX.semPrazo = function (r) { return /Penhora antiga|Ciclo encerrado|Interrompida via IDPJ|Parcelamento vigente|Ainda impossível/.test(r.fase || ''); };
  // Ordinária não ajuizada com mais de 90 dias pela frente: o motor ainda não cria linha para ela; entra por derivação (decisão 3).
  NX.derivada = function (r) { return r.natureza === 'ordinaria' && !r.processo && r.consumadaHa == null && !r.tratada && r.diasRestantes != null && r.diasRestantes > 90; };
  // "Cedo venceu, tarde não": a data cedo passou, a tarde (tese da União) ainda não ou não existe. Ainda se salva.
  NX.tese = function (r) {
    return r.natureza !== 'decadencia' && !NX.semPrazo(r) && r.consumadaHa == null && !r.tratada && r.termoCedo != null &&
      r.diasRestantes != null && r.diasRestantes <= 0 && (!r.termoTarde || NX.dias(r.termoTarde) > 0);
  };
  // Ordem dentro desse bloco: pela data tarde (a mais próxima primeiro); sem data tarde por último.
  NX.chaveTese = function (r) { return r.termoTarde ? NX.dias(r.termoTarde) : 1e9; };
  // Lembrete de 60 dias do "aguardando reconhecimento" já vencido.
  NX.lembreteVencido = function (r) { return !!(r.tratada && r.tratada.tipo === 'aguardando_reconhecimento' && r.silenciadaAte && NX.dias(r.silenciadaAte) <= 0); };

  /* ───────── apresentação ───────── */
  // Cor da linha (trilho e prazo): red vencido · orange janela de 90 dias · yellow resto da fila · blue vigiar · green tratada · gray registro.
  NX.tom = function (r) {
    switch (r.fila) {
      case 'agir': return NX.tomDias(r.diasRestantes) === 'muted' ? 'yellow' : NX.tomDias(r.diasRestantes);
      case 'conferir': case 'adiada': return 'orange';
      case 'vigiar': return 'blue';
      case 'tratada': return 'green';
      default: return 'gray';
    }
  };
  // Coluna da direita da linha: { principal, tom, linhas[] }.
  NX.quando = function (r) {
    var cedo = r.termoCedo, tarde = r.termoTarde, ate = tarde || cedo;
    if (r.tratada) return { principal: 'tratada', tom: 'green', linhas: r.tratada.desde ? ['desde ' + NX.fmtData(r.tratada.desde)] : [] };
    if (r.adiada && r.fila === 'adiada') return { principal: 'volta ' + NX.fmtDataCurta(r.adiada.ate), tom: 'orange', linhas: ['adiada: ' + r.adiada.motivo.toLowerCase()] };
    if (r.consumadaHa != null && (r.fila === 'conferir' || r.fila === 'registro')) {
      return { principal: 'consumada há ' + NX.fmtDuracao(r.consumadaHa), tom: r.fila === 'conferir' ? 'red' : 'muted', linhas: [NX.fmtData(ate)] };
    }
    if (r.silenciadaAte && (r.fila === 'vigiar' || r.fila === 'impossivel')) {
      return { principal: 'silenciada', tom: 'muted', linhas: ['volta em ' + NX.fmtData(r.silenciadaAte)] };
    }
    if (NX.tese(r)) {
      var dt = tarde ? NX.dias(tarde) : null;
      return { principal: dt != null ? 'tarde ' + NX.fmtDias(dt) : 'tarde sem termo', tom: 'red',
        linhas: [dt != null ? 'tarde ' + NX.fmtData(tarde) : 'sem data da tarde', 'cedo venceu ' + NX.fmtDias(r.diasRestantes)] };
    }
    var linhas = [];
    if (cedo && tarde && cedo !== tarde) linhas = ['cedo ' + NX.fmtData(cedo), 'tarde ' + NX.fmtData(tarde)];
    else if (cedo && tarde) linhas = ['termo ' + NX.fmtData(cedo)];
    else if (cedo) linhas = ['cedo ' + NX.fmtData(cedo), 'tarde sem termo'];
    else if (tarde) linhas = ['tarde ' + NX.fmtData(tarde)];
    if (r.diasRestantes == null) return { principal: cedo || tarde ? 'sem contagem' : 'sem data', tom: 'muted', linhas: linhas };
    return { principal: NX.fmtDias(r.diasRestantes), tom: NX.tomDias(r.diasRestantes), linhas: linhas };
  };

  NX.chipsHTML = function (r) {
    var R = NX.ROTULOS, h = '';
    h += '<span class="nx-chip ' + r.natureza + '">' + R.natureza[r.natureza] + '</span>';
    h += '<span class="nx-chip ' + r.certeza + ' nx-tip" tabindex="0" data-tip="' + NX.esc(R.certezaDica[r.certeza]) + '">' + R.certeza[r.certeza] + '</span>';
    if (r.fase) h += '<span class="nx-chip situacao' + (r.divergencia ? ' t-red' : '') + '">' + NX.esc(r.fase) + '</span>';
    if (NX.derivada(r)) h += '<span class="nx-chip situacao nx-tip" tabindex="0" data-tip="Ordinária não ajuizada, com mais de 90 dias pela frente. O cálculo atual só cria aviso a partir de 90 dias; aqui ela aparece por escolha. Adiar não vale para ela.">Fora dos 90 dias</span>';
    if (r.abrangidaPor) h += '<span class="nx-chip abrangida nx-tip" tabindex="0" data-tip="Execução abrangida por incidente: a constrição no incidente vale como penhora."><b>IDPJ</b> ' + NX.esc(r.abrangidaPor.replace(/^IDPJ\s*/, '')) + '</span>';
    if (r.adiada) {
      var venc = NX.adiamentoVencido(r);
      h += '<span class="nx-chip adiada' + (venc ? ' t-red' : '') + '">' + (venc ? 'Adiamento venceu em ' : 'Adiada até ') + NX.fmtDataCurta(r.adiada.ate) + ' · ' + NX.esc(r.adiada.motivo) + '</span>';
    }
    if (r.tratada) h += '<span class="nx-chip tratada">' + NX.esc(r.tratada.rotulo) + '</span>';
    if (NX.lembreteVencido(r)) h += '<span class="nx-chip t-red sm">Lembrete venceu em ' + NX.fmtDataCurta(r.silenciadaAte) + '</span>';
    if (r.silenciadaAte && !r.tratada && r.fila !== 'adiada') h += '<span class="nx-chip silenciada">Silenciada até ' + NX.fmtDataCurta(r.silenciadaAte) + '</span>';
    return h;
  };

  // Régua de tempo. opts: { mini: bool, legenda: bool (padrão: true fora do mini) }
  NX.reguaHTML = function (r, opts) {
    opts = opts || {};
    var g = r.regua;
    if (!g) return '';
    var a = NX.parse(g.inicio), b = NX.parse(g.fim), span = Math.max(1, b - a);
    var pct = function (iso) { return Math.max(0, Math.min(100, (NX.parse(iso) - a) / span * 100)); };
    var n2 = function (x) { return Math.round(x * 100) / 100; };
    var R = NX.ROTULOS, h = '', tipos = {}, legenda = [];
    h += '<div class="nx-ruler' + (opts.mini ? ' mini' : '') + '" role="img" aria-label="Régua do prazo de ' + NX.esc(r.cda) + '"><div class="nx-ruler-track">';
    g.segmentos.forEach(function (s) {
      var l = pct(s.de), wd = Math.max(0.6, pct(s.ate) - l);
      tipos['seg:' + s.tipo] = 1;
      h += '<span class="nx-seg ' + s.tipo + '" style="left:' + n2(l) + '%;width:' + n2(wd) + '%" title="' + NX.esc((s.rotulo || R.segmento[s.tipo]) + ': ' + NX.fmtData(s.de) + ' a ' + NX.fmtData(s.ate)) + '"></span>';
    });
    if (r.termoCedo && r.termoTarde && r.termoCedo !== r.termoTarde) {
      var bl = pct(r.termoCedo), bw = Math.max(0.8, pct(r.termoTarde) - bl);
      tipos.faixa = 1;
      h += '<span class="nx-band" style="left:' + n2(bl) + '%;width:' + n2(bw) + '%" title="' + NX.esc('Faixa: cedo ' + NX.fmtData(r.termoCedo) + ' · tarde ' + NX.fmtData(r.termoTarde)) + '"></span>';
    }
    g.marcas.forEach(function (m) {
      var l = pct(m.data);
      tipos['marca:' + m.tipo] = 1;
      h += '<span class="nx-mark ' + m.tipo + (m.tipo === 'hoje' && l > 86 ? ' end' : '') + '" style="left:' + n2(l) + '%" title="' + NX.esc((m.rotulo || R.marca[m.tipo]) + ': ' + NX.fmtData(m.data)) + '"></span>';
    });
    h += '</div>';
    if (!opts.mini) {
      var resumo = r.termoCedo && r.termoTarde && r.termoCedo !== r.termoTarde ? 'cedo ' + NX.fmtData(r.termoCedo) + ' · tarde ' + NX.fmtData(r.termoTarde)
        : (r.termoCedo || r.termoTarde) ? 'termo ' + NX.fmtData(r.termoCedo || r.termoTarde) : '';
      h += '<div class="nx-ruler-ends"><span>' + NX.fmtData(g.inicio) + '</span><span class="nx-ruler-sum">' + resumo + '</span><span>' + NX.fmtData(g.fim) + '</span></div>';
      if (opts.legenda !== false) {
        ['correndo', 'suspensao', 'pausa', 'aguardando'].forEach(function (t) { if (tipos['seg:' + t]) legenda.push('<span><i class="nx-key seg ' + t + '"></i>' + R.segmento[t] + '</span>'); });
        if (tipos.faixa) legenda.push('<span><i class="nx-key faixa"></i>Faixa cedo–tarde</span>');
        g.marcas.forEach(function (m) {
          var t = m.tipo === 'hoje' ? 'hoje' : (m.rotulo || R.marca[m.tipo]) + ' ' + NX.fmtData(m.data);
          legenda.push('<span><i class="nx-key ' + m.tipo + '"></i>' + NX.esc(t) + '</span>');
        });
        h += '<div class="nx-ruler-legend">' + legenda.join('') + '</div>';
      }
    }
    return h + '</div>';
  };

  // Linha de CDA. opts: { regua: bool (mini, padrão true), sel: bool (marcada), selecionavel: bool (mostra checkbox), dense, cols, aberta, acoes: bool (padrão true) }
  NX.linhaHTML = function (r, opts) {
    opts = opts || {};
    var tom = NX.tom(r), q = NX.quando(r), op = NX.op(r.operacao);
    var venc = r.fila === 'agir' && r.diasRestantes != null && r.diasRestantes < 0;
    var quieta = r.fila !== 'agir' && r.fila !== 'conferir';
    var cls = 'nx-row nx-c-' + tom + (venc ? ' is-venc' : '') + ((venc || (r.fila === 'agir' && tom === 'orange')) ? ' is-strong' : '') + (quieta ? ' is-quiet' : '') +
      (NX.tese(r) ? ' is-tese' : '') + (opts.dense ? ' dense' : '') + (opts.cols ? ' cols' : '') + (opts.sel ? ' is-selected' : '') + (opts.aberta ? ' is-open' : '');
    var h = '<article class="' + cls + '" data-id="' + r.id + '" data-fila="' + r.fila + '"><div class="nx-row-main"><div class="nx-row-id">';
    if (opts.selecionavel) h += '<input type="checkbox" class="nx-checkbox" data-sel aria-label="Selecionar ' + NX.esc(r.cda) + '"' + (opts.sel ? ' checked' : '') + '>';
    h += '<span class="nx-cda">' + r.cda + '</span>' + NX.chipsHTML(r) + '</div>';
    h += '<div class="nx-row-who"><span class="nx-devedor">' + NX.esc(r.devedor) + '</span>' +
      '<span class="nx-op"><i class="nx-sq" style="--c:' + op.cor + '"></i><span class="nx-ell">' + NX.esc(op.curto) + '</span></span>' +
      (r.processo ? '<span class="nx-proc">' + r.processo + '</span>' : '<span class="nx-muted">sem processo</span>') + '</div>';
    h += '<p class="nx-row-why">' + NX.esc(r.situacao) + '</p>';
    if (opts.regua !== false && r.regua) h += NX.reguaHTML(r, { mini: true });
    h += '</div><div class="nx-row-side"><span class="nx-when ' + q.tom + '">' + NX.esc(q.principal) + '</span>';
    q.linhas.forEach(function (l) { h += '<span class="nx-date">' + NX.esc(l) + '</span>'; });
    h += '<span class="nx-val">' + NX.fmtMoeda(r.valor) + '</span></div>';
    if (opts.acoes !== false) {
      h += '<div class="nx-row-acts">';
      if (r.acao && (r.fila === 'agir' || r.fila === 'conferir' || r.fila === 'adiada')) {
        h += '<button type="button" class="nx-btn sm' + (r.fila === 'adiada' ? '' : ' primary') + '" data-acao="exec" data-id="' + r.id + '"' + (r.acao.umClique ? ' title="Um clique: grava na hora"' : '') + '>' + NX.esc(r.acao.rotulo) + '</button>';
      }
      h += '<button type="button" class="nx-btn sm" data-acao="abrir" data-id="' + r.id + '">Abrir</button>';
      if ((r.fila === 'agir' || r.fila === 'conferir') && !NX.derivada(r)) h += '<button type="button" class="nx-btn sm quiet" data-acao="adiar" data-id="' + r.id + '">Adiar…</button>';
      h += '</div>';
    }
    return h + '</article>';
  };

  // Grupo colapsável. opts: { titulo (HTML), n (texto ou número), valor, avisos: [HTML], corpo (HTML), colapsado, flat, id }
  NX.grupoHTML = function (o) {
    var n = typeof o.n === 'number' ? o.n + (o.n === 1 ? ' CDA' : ' CDAs') : (o.n || '');
    var h = '<section class="nx-group' + (o.colapsado ? ' is-collapsed' : '') + (o.flat ? ' flat' : '') + '"' + (o.id ? ' id="' + o.id + '"' : '') + '>';
    h += '<button type="button" class="nx-group-h" data-toggle aria-expanded="' + (o.colapsado ? 'false' : 'true') + '"><span class="nx-chev"></span><span class="nx-group-title">' + o.titulo + '</span>' +
      (n ? '<span class="nx-group-n">' + n + '</span>' : '') + (o.valor != null ? '<span class="nx-group-sum">' + NX.fmtMoeda(o.valor) + '</span>' : '') + '</button>';
    if (o.avisos && o.avisos.length) h += '<div class="nx-group-notes">' + o.avisos.map(function (a) { return '<div class="nx-notice">' + a + '</div>'; }).join('') + '</div>';
    return h + '<div class="nx-group-body">' + (o.corpo || '') + '</div></section>';
  };
})(window);
