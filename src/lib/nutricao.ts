// Cálculos de nutrição (seção 4 da especificação da Fase 2). Funções puras.
import { RITMO_SEGURO_KG_SEMANA } from './calculos';
import type { NivelAtividade, Sexo } from './db';

export const FATOR_ATIVIDADE: Record<NivelAtividade, number> = {
  sedentario: 1.2,
  leve: 1.375,
  moderado: 1.55,
  intenso: 1.725,
};

export const PISO_KCAL: Record<Sexo, number> = { F: 1200, M: 1500 };
export const DEFICIT_PADRAO = 500;
export const DEFICIT_ACELERADO = 750;
export const LIMITE_AJUSTE = 300;
export const PROTEINA_G_POR_KG = 1.4;
export const FRACAO_GORDURA = 0.27;
export const AGUA_ML_POR_KG = 35;

/** Taxa metabólica basal — Mifflin-St Jeor. */
export function mifflin(sexo: Sexo, pesoKg: number, alturaCm: number, idade: number): number {
  return 10 * pesoKg + 6.25 * alturaCm - 5 * idade + (sexo === 'M' ? 5 : -161);
}

export function gastoTotal(sexo: Sexo, pesoKg: number, alturaCm: number, idade: number, nivel: NivelAtividade): number {
  return mifflin(sexo, pesoKg, alturaCm, idade) * FATOR_ATIVIDADE[nivel];
}

export interface MetaCalorias {
  gasto: number;
  deficit: number;
  ajuste: number;
  meta: number;
  limitadaAoPiso: boolean;
}

/**
 * Meta diária de calorias. `ritmoNecessario` em kg/semana (Fase 1, 4.2):
 * acima de 0,5 kg/semana usa o déficit de 750 kcal.
 */
export function metaCalorias(p: {
  sexo: Sexo;
  pesoKg: number;
  alturaCm: number;
  idade: number;
  nivel: NivelAtividade;
  ritmoNecessario: number;
  ajuste: number;
}): MetaCalorias {
  const gasto = gastoTotal(p.sexo, p.pesoKg, p.alturaCm, p.idade, p.nivel);
  const deficit = p.ritmoNecessario > RITMO_SEGURO_KG_SEMANA / 2 ? DEFICIT_ACELERADO : DEFICIT_PADRAO;
  const bruta = Math.round((gasto - deficit + p.ajuste) / 10) * 10;
  const piso = PISO_KCAL[p.sexo];
  return { gasto: Math.round(gasto), deficit, ajuste: p.ajuste, meta: Math.max(piso, bruta), limitadaAoPiso: bruta < piso };
}

/** Peso de referência = menor entre o peso atual e o peso no IMC 25. */
export function pesoReferencia(pesoKg: number, alturaCm: number): number {
  const m = alturaCm / 100;
  return Math.min(pesoKg, 25 * m * m);
}

export interface Macros {
  kcal: number;
  proteina: number;
  gordura: number;
  carboidrato: number;
}

export function macros(kcal: number, pesoKg: number, alturaCm: number): Macros {
  const proteina = Math.round(PROTEINA_G_POR_KG * pesoReferencia(pesoKg, alturaCm));
  const gordura = Math.round((kcal * FRACAO_GORDURA) / 9);
  const carboidrato = Math.max(0, Math.round((kcal - proteina * 4 - gordura * 9) / 4));
  return { kcal, proteina, gordura, carboidrato };
}

export function metaAgua(pesoKg: number, manualMl?: number): number {
  if (manualMl) return manualMl;
  return Math.round((AGUA_ML_POR_KG * pesoKg) / 50) * 50;
}

// ---------- Recalibração (4.3) ----------

/** Inclinação (kg/dia) da regressão linear simples de peso × dias. */
export function inclinacao(pontos: { dia: number; kg: number }[]): number {
  const n = pontos.length;
  if (n < 2) return 0;
  const mx = pontos.reduce((s, p) => s + p.dia, 0) / n;
  const my = pontos.reduce((s, p) => s + p.kg, 0) / n;
  let num = 0;
  let den = 0;
  for (const p of pontos) {
    num += (p.dia - mx) * (p.kg - my);
    den += (p.dia - mx) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

/**
 * Novo ajuste acumulado, ou null se não houver recalibração.
 * `pontos`: pesos das últimas 2 semanas, com `dia` relativo (0..14).
 */
export function recalibrar(p: { pontos: { dia: number; kg: number }[]; deficit: number; ajusteAtual: number }): number | null {
  if (p.pontos.length < 2) return null;
  const dias = Math.max(...p.pontos.map((x) => x.dia)) - Math.min(...p.pontos.map((x) => x.dia));
  if (dias < 14) return null;
  const perdaReal = -inclinacao(p.pontos) * 7;
  const perdaEsperada = (p.deficit * 7) / 7700;
  let delta = 0;
  if (perdaReal < perdaEsperada * 0.5) delta = -100;
  else if (perdaReal > RITMO_SEGURO_KG_SEMANA) delta = 100;
  if (delta === 0) return null;
  const novo = Math.max(-LIMITE_AJUSTE, Math.min(LIMITE_AJUSTE, p.ajusteAtual + delta));
  return novo === p.ajusteAtual ? null : novo;
}
