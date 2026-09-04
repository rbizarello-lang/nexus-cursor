/**
 * Utilitários de documentos (CPF/CNPJ) e resolução de pessoas.
 * Sem dependências de UI / React.
 */

/**
 * Retorna apenas os dígitos de uma string (ou string vazia).
 */
export function digitsOnly(s) {
  return String(s || '').replace(/\D/g, '');
}

/**
 * Normaliza o nome de uma pessoa física ou jurídica para comparação:
 * caixa alta, sem acentos, sem pontuação, sem sufixos societários comuns (LTDA, S/A, ME, EPP, EIRELI...).
 */
export function normalizePersonName(s) {
  if (!s) return '';
  let n = String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

  // Remove pontuação
  n = n.replace(/[^A-Z0-9\s]/g, ' ');

  // Normaliza espaços
  n = n.replace(/\s+/g, ' ').trim();

  // Remove sufixos societários comuns repetidamente do final
  const suffixRegex = /\s+(LTDA|LIMITADA|S\s*A|SOCIEDADE ANONIMA|EIRELI|ME|MICROEMPRESA|EPP|EMPRESA DE PEQUENO PORTE|SS|SOCIEDADE SIMPLES|EIR)$/i;
  let prev = '';
  while (prev !== n) {
    prev = n;
    n = n.replace(suffixRegex, '').trim();
  }

  return n;
}

/**
 * Retorna os primeiros 8 dígitos (raiz do CNPJ) se tiver pelo menos 8 dígitos.
 */
export function cnpjRaiz(digits) {
  const d = digitsOnly(digits);
  return d.length >= 8 ? d.slice(0, 8) : d;
}

/**
 * Verifica se dois documentos são compatíveis (referem-se ao mesmo CPF/CNPJ):
 * - Correspondência exata de dígitos
 * - CPF: 11 vs 11 dígitos apenas (NUNCA prefix match)
 * - CNPJ: 14 vs 14 exato; 12 (sem DV) vs 14 se o 14 começa com o 12; 8 (raiz) vs 12/14 se começa com a raiz.
 * - Duas filiais de 14 dígitos (mesma raiz, finais diferentes como /0001 vs /0002) NÃO são compatíveis.
 */
export function docsCompatible(a, b) {
  const da = digitsOnly(a);
  const db = digitsOnly(b);

  if (!da || !db) return false;
  if (da === db) return true;

  // Se algum for CPF (11 dígitos), só aceita igualdade exata (já testada acima)
  if (da.length === 11 || db.length === 11) {
    return false;
  }

  // Se ambos forem CNPJs completos de 14 dígitos e diferentes -> filiais ou empresas distintas
  if (da.length === 14 && db.length === 14) {
    return false;
  }

  // Ordena por comprimento (menor, maior)
  const [shortDoc, longDoc] = da.length <= db.length ? [da, db] : [db, da];

  // 12 vs 14: base + filial sem DV
  if (shortDoc.length === 12 && longDoc.length === 14) {
    return longDoc.startsWith(shortDoc);
  }

  // 8 (raiz) vs 12 ou 14
  if (shortDoc.length === 8 && (longDoc.length === 12 || longDoc.length === 14)) {
    return longDoc.startsWith(shortDoc);
  }

  return false;
}

/**
 * Retorna o documento mais completo (com maior número de dígitos).
 * Se os dígitos forem de igual tamanho, mantém o existente (preservando formatação).
 */
export function preferCompleteDoc(existing, incoming) {
  const dExisting = digitsOnly(existing);
  const dIncoming = digitsOnly(incoming);

  if (!dExisting && !dIncoming) return existing || incoming || '';
  if (!dExisting) return incoming || '';
  if (!dIncoming) return existing || '';

  if (dIncoming.length > dExisting.length) {
    return incoming;
  }
  return existing;
}

/**
 * Localiza pessoa na lista `people` compatível com o CPF/CNPJ (e nome quando ambíguo):
 * 1. Filtra por operationId (se fornecido)
 * 2. Correspondência exata por dígitos
 * 3. Se incoming for parcial (8 ou 12 dígitos):
 *    - se 1 candidato compatível -> retorna a pessoa
 *    - se múltiplos (mesma raiz) -> tenta desambiguar pelo nome normalizado; se ambíguo, retorna null
 * 4. Se incoming for 14 dígitos e existir cadastro com raiz de 8 dígitos:
 *    - casa apenas se for único na operação ou se o nome bater
 */
export function findPersonByDoc(people, { operationId, cpfCnpj, name } = {}) {
  if (!Array.isArray(people)) return null;
  const inDigits = digitsOnly(cpfCnpj);
  if (!inDigits) return null;

  const candidates = operationId
    ? people.filter(p => p && p.operationId === operationId)
    : people.filter(Boolean);

  // 1. Correspondência exata
  const exact = candidates.find(p => digitsOnly(p.cpfCnpj) === inDigits);
  if (exact) return exact;

  // 2. Busca por compatibilidade
  const compatible = candidates.filter(p => docsCompatible(inDigits, p.cpfCnpj));
  if (compatible.length === 0) return null;

  const normTargetName = normalizePersonName(name);

  // Se incoming é parcial (8 ou 12 dígitos)
  if (inDigits.length === 8 || inDigits.length === 12) {
    if (compatible.length === 1) {
      return compatible[0];
    }
    // Múltiplos candidatos (ex: filiais já cadastradas): tenta desambiguar pelo nome
    if (normTargetName) {
      const nameMatches = compatible.filter(p => normalizePersonName(p.name) === normTargetName);
      if (nameMatches.length === 1) {
        return nameMatches[0];
      }
    }
    // Ambíguo: não funde filiais silenciosamente
    return null;
  }

  // Se incoming é 14 dígitos e existe registro parcial (ex: raiz de 8 dígitos)
  if (inDigits.length === 14) {
    if (compatible.length === 1) {
      return compatible[0];
    }
    if (normTargetName) {
      const nameMatches = compatible.filter(p => normalizePersonName(p.name) === normTargetName);
      if (nameMatches.length === 1) {
        return nameMatches[0];
      }
    }
    return null;
  }

  return null;
}

/**
 * Formata CPF (11) ou CNPJ (8 raiz / 12 sem DV / 14 completo).
 * Outros tamanhos: devolve o texto original (ou vazio).
 */
export function formatCpfCnpj(s) {
  const d = digitsOnly(s);
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  if (d.length === 12) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})/, '$1.$2.$3/$4');
  if (d.length === 8) return d.replace(/(\d{2})(\d{3})(\d{3})/, '$1.$2.$3');
  return s ? String(s) : '';
}

/**
 * Retorna patch da pessoa se o documento de entrada for mais completo
 * ou se o cadastro puder ser formatado (XX.XXX.XXX/XXXX-XX).
 * Sem ganho: devolve o próprio objeto, inalterado.
 */
export function mergePersonDoc(person, incomingCpfCnpj) {
  if (!person) return person;
  const preferred = preferCompleteDoc(person.cpfCnpj, incomingCpfCnpj);
  const formatted = formatCpfCnpj(preferred) || preferred;
  if (formatted !== person.cpfCnpj) {
    return { ...person, cpfCnpj: formatted };
  }
  return person;
}
