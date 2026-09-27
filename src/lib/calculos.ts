// Funções puras de cálculo. Ver docs/superpowers/specs/2026-09-27-monju-pessoal-fase1-design.md, seção 4.

export const RITMO_SEGURO_KG_SEMANA = 1.0;
export const PRAZO_MIN = 3;
export const PRAZO_MAX = 12;

// ---------- Datas (ISO yyyy-mm-dd, sem fuso) ----------

export function hojeISO(agora: Date = new Date()): string {
  const y = agora.getFullYear();
  const m = String(agora.getMonth() + 1).padStart(2, '0');
  const d = String(agora.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isoParaUTC(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Dias de `de` até `ate` (positivo se `ate` for depois). */
export function diffDias(de: string, ate: string): number {
  return Math.round((isoParaUTC(ate) - isoParaUTC(de)) / 86_400_000);
}

export function somarDias(iso: string, dias: number): string {
  const t = new Date(isoParaUTC(iso) + dias * 86_400_000);
  return t.toISOString().slice(0, 10);
}

// ---------- IMC ----------

export function imc(pesoKg: number, alturaCm: number): number {
  const m = alturaCm / 100;
  return pesoKg / (m * m);
}

export type FaixaImc =
  | 'magreza3'
  | 'magreza2'
  | 'magreza1'
  | 'eutrofia'
  | 'sobrepeso'
  | 'obesidade1'
  | 'obesidade2'
  | 'obesidade3';

export const ROTULO_FAIXA: Record<FaixaImc, string> = {
  magreza3: 'Magreza grau III',
  magreza2: 'Magreza grau II',
  magreza1: 'Magreza grau I',
  eutrofia: 'Eutrofia (peso adequado)',
  sobrepeso: 'Sobrepeso (pré-obesidade)',
  obesidade1: 'Obesidade grau I',
  obesidade2: 'Obesidade grau II',
  obesidade3: 'Obesidade grau III',
};

/** Classificação da OMS. Limite inferior inclusivo, superior exclusivo. */
export function classificarImc(valor: number): FaixaImc {
  if (valor < 16) return 'magreza3';
  if (valor < 17) return 'magreza2';
  if (valor < 18.5) return 'magreza1';
  if (valor < 25) return 'eutrofia';
  if (valor < 30) return 'sobrepeso';
  if (valor < 35) return 'obesidade1';
  if (valor < 40) return 'obesidade2';
  return 'obesidade3';
}

// ---------- Ritmo e sugestões ----------

export function ritmoNecessario(atualKg: number, metaKg: number, semanas: number): number {
  return (atualKg - metaKg) / semanas;
}

export interface AvaliacaoPrazo {
  ritmo: number;
  acimaDoSeguro: boolean;
  /** Menor prazo com ritmo seguro, se couber em 3..12 semanas. */
  prazoSeguro: number | null;
  /** Meta alcançável no prazo escolhido com ritmo seguro. */
  metaIntermediaria: number | null;
}

export function avaliarPrazo(atualKg: number, metaKg: number, semanas: number): AvaliacaoPrazo {
  const ritmo = ritmoNecessario(atualKg, metaKg, semanas);
  const acimaDoSeguro = ritmo > RITMO_SEGURO_KG_SEMANA + 1e-9;
  if (!acimaDoSeguro) return { ritmo, acimaDoSeguro, prazoSeguro: null, metaIntermediaria: null };
  const minimo = Math.max(PRAZO_MIN, Math.ceil((atualKg - metaKg) / RITMO_SEGURO_KG_SEMANA - 1e-9));
  return {
    ritmo,
    acimaDoSeguro,
    prazoSeguro: minimo <= PRAZO_MAX ? minimo : null,
    metaIntermediaria: arred1(atualKg - RITMO_SEGURO_KG_SEMANA * semanas),
  };
}

// ---------- Progresso ----------

/**
 * Progresso (0..1) de `base` até `meta`. `base` é o peso inicial, ou o peso na data
 * em que a meta foi definida quando o inicial não está acima da meta.
 */
export function progresso(baseKg: number, atualKg: number, metaKg: number): number {
  const total = baseKg - metaKg;
  if (total <= 0) return atualKg <= metaKg ? 1 : 0;
  return Math.min(1, Math.max(0, (baseKg - atualKg) / total));
}

// ---------- Doses e tratamento ----------

export type EstadoDose =
  | { tipo: 'sem-registro' }
  | { tipo: 'futura'; dias: number; data: string }
  | { tipo: 'hoje'; data: string }
  | { tipo: 'atrasada'; dias: number; data: string };

export function estadoProximaDose(
  ultimaAplicacao: string | undefined,
  intervaloDias: number,
  hoje: string,
): EstadoDose {
  if (!ultimaAplicacao) return { tipo: 'sem-registro' };
  const data = somarDias(ultimaAplicacao, intervaloDias);
  const dias = diffDias(hoje, data);
  if (dias > 0) return { tipo: 'futura', dias, data };
  if (dias === 0) return { tipo: 'hoje', data };
  return { tipo: 'atrasada', dias: -dias, data };
}

export function semanasDeTratamento(inicio: string, hoje: string): number {
  return Math.max(0, Math.floor(diffDias(inicio, hoje) / 7));
}

export function idadeAtual(idade: number, informadaEm: string, hoje: string): number {
  const [y1, m1, d1] = informadaEm.split('-').map(Number);
  const [y2, m2, d2] = hoje.split('-').map(Number);
  let anos = y2 - y1;
  if (m2 < m1 || (m2 === m1 && d2 < d1)) anos -= 1;
  return idade + Math.max(0, anos);
}

// ---------- Formatação ----------

export function arred1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function fmt(n: number, casas = 1): string {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

export function fmtData(iso: string, opcoes: Intl.DateTimeFormatOptions = {}): string {
  return new Date(isoParaUTC(iso)).toLocaleDateString('pt-BR', { timeZone: 'UTC', ...opcoes });
}
