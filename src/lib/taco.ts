import tacoJson from '../data/taco.json';
import { ALIMENTOS, ALIMENTO_POR_ID, type Alimento, type CategoriaDiario } from '../data/alimentos';

export interface ItemTaco {
  id: number;
  nome: string;
  categoria: string;
  kcal: number;
  proteina: number;
  gordura: number;
  carboidrato: number;
  fibra: number;
}

export const TACO = tacoJson as ItemTaco[];
const TACO_POR_ID = new Map(TACO.map((t) => [t.id, t]));

export interface Nutrientes {
  kcal: number;
  proteina: number;
  gordura: number;
  carboidrato: number;
}

export function tacoPorId(id: number): ItemTaco {
  const t = TACO_POR_ID.get(id);
  if (!t) throw new Error(`Alimento TACO ${id} não encontrado`);
  return t;
}

/** Nutrientes por 100 g de um alimento da lista enxuta ("frango-peito") ou da TACO ("taco:410"). */
export function por100g(alimentoId: string): Nutrientes {
  if (!alimentoId.startsWith('taco:')) {
    const a = alimentoOuErro(alimentoId);
    if (a.rotulo) return { ...a.rotulo };
    alimentoId = `taco:${a.taco}`;
  }
  const t = tacoPorId(Number(alimentoId.slice(5)));
  return { kcal: t.kcal, proteina: t.proteina, gordura: t.gordura, carboidrato: t.carboidrato };
}

/** Os valores vêm de rótulo típico (aproximados), não da TACO. */
export function ehAproximado(alimentoId: string): boolean {
  return !alimentoId.startsWith('taco:') && !!alimentoOuErro(alimentoId).rotulo;
}

export function alimentoOuErro(id: string): Alimento {
  const a = ALIMENTO_POR_ID.get(id);
  if (!a) throw new Error(`Alimento ${id} não encontrado`);
  return a;
}

export function nomeDe(alimentoId: string): string {
  return alimentoId.startsWith('taco:') ? tacoPorId(Number(alimentoId.slice(5))).nome : alimentoOuErro(alimentoId).nome;
}

export function nutrientesDe(alimentoId: string, gramas: number): Nutrientes {
  const n = por100g(alimentoId);
  const f = gramas / 100;
  return {
    kcal: Math.round(n.kcal * f),
    proteina: Math.round(n.proteina * f * 10) / 10,
    gordura: Math.round(n.gordura * f * 10) / 10,
    carboidrato: Math.round(n.carboidrato * f * 10) / 10,
  };
}

const semAcento = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

export interface ResultadoBusca {
  alimentoId: string;
  nome: string;
  detalhe: string;
}

/** Busca na lista enxuta (primeiro) e na TACO completa. Todas as palavras precisam aparecer. */
export function buscar(texto: string, limite = 30): ResultadoBusca[] {
  const palavras = semAcento(texto).split(/\s+/).filter(Boolean);
  if (palavras.length === 0) return [];
  const bate = (nome: string) => {
    const n = semAcento(nome);
    return palavras.every((p) => n.includes(p));
  };
  const enxuta = ALIMENTOS.filter((a) => bate(a.nome)).map((a) => ({
    alimentoId: a.id,
    nome: a.nome,
    detalhe: `${por100g(a.id).kcal} kcal / 100 g${a.rotulo ? ' · valor aproximado' : ''}`,
  }));
  const usados = new Set(ALIMENTOS.filter((a) => bate(a.nome)).map((a) => a.taco));
  const taco = TACO.filter((t) => t.kcal > 0 && !usados.has(t.id) && bate(t.nome)).map((t) => ({
    alimentoId: `taco:${t.id}`,
    nome: t.nome,
    detalhe: `TACO · ${t.kcal} kcal / 100 g`,
  }));
  return [...enxuta, ...taco].slice(0, limite);
}

export function alimentosDaCategoria(c: CategoriaDiario): Alimento[] {
  return ALIMENTOS.filter((a) => a.categoria === c);
}

/** Texto amigável da quantidade: "2 ovos (100 g)" ou "120 g · 1 filé médio = 100 g". */
export function descreverPorcao(alimentoId: string, gramas: number): string {
  if (alimentoId.startsWith('taco:')) return `${gramas} g`;
  const a = alimentoOuErro(alimentoId);
  if (a.unidade) {
    const n = Math.round((gramas / a.unidade.g) * 2) / 2;
    const qtd = n % 1 ? n.toLocaleString('pt-BR') : String(n);
    const nomeUnidade = n === 1 ? a.unidade.nome : a.unidade.plural;
    return nomeUnidade.includes('ml') ? `${qtd} ${nomeUnidade}` : `${qtd} ${nomeUnidade} (${gramas} g)`;
  }
  if (a.medida) {
    const n = gramas / a.medida.g;
    if (n >= 0.75 && n <= 1.25) return `${gramas} g · ${a.medida.nome}`;
    const meio = Math.round(n * 2) / 2;
    if (n > 1 && n <= 12 && Math.abs(n - meio) <= 0.15 * meio) return `${gramas} g · ${meio.toLocaleString('pt-BR')}× ${a.medida.nome}`;
    return `${gramas} g · ${a.medida.nome} = ${a.medida.g} g`;
  }
  return `${gramas} g`;
}
