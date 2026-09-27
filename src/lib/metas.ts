// Junta perfil, pesos e preferências nas metas do dia (seção 4 da especificação da Fase 2).
import { diffDias, hojeISO, idadeAtual, ritmoNecessario, somarDias } from './calculos';
import { maisRecente, type Perfil, type PreferenciasDieta, type RegistroPeso } from './db';
import { macros, metaAgua, metaCalorias, recalibrar, type Macros, type MetaCalorias } from './nutricao';

export interface MetasDoDia extends Macros {
  calorias: MetaCalorias;
  aguaMl: number;
  pesoAtual: number;
}

export function metasDoDia(perfil: Perfil, pesos: RegistroPeso[], pref: PreferenciasDieta | null, hoje = hojeISO()): MetasDoDia {
  const pesoAtual = maisRecente(pesos)?.kg ?? perfil.pesoInicialKg;
  const fimPrazo = somarDias(perfil.metaDefinidaEm, perfil.prazoSemanas * 7);
  const semanasRestantes = Math.max(1, Math.ceil(diffDias(hoje, fimPrazo) / 7));
  const calorias = metaCalorias({
    sexo: perfil.sexo,
    pesoKg: pesoAtual,
    alturaCm: perfil.alturaCm,
    idade: idadeAtual(perfil.idade, perfil.idadeInformadaEm, hoje),
    nivel: perfil.nivelAtividade,
    ritmoNecessario: Math.max(0, ritmoNecessario(pesoAtual, perfil.metaKg, semanasRestantes)),
    ajuste: pref?.ajusteKcal ?? 0,
  });
  return {
    ...macros(calorias.meta, pesoAtual, perfil.alturaCm),
    calorias,
    aguaMl: metaAgua(pesoAtual, pref?.metaAguaManualMl),
    pesoAtual,
  };
}

/** Segunda-feira da semana de `iso`. */
export function segundaDaSemana(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = domingo
  return somarDias(iso, -((dow + 6) % 7));
}

/**
 * Verifica se é hora de recalibrar (seção 4.3). Devolve o novo ajuste ou null.
 * Usa os pesos dos últimos 21 dias posteriores à última recalibração, cobrindo ≥ 14 dias.
 */
export function verificarRecalibracao(pesos: RegistroPeso[], pref: PreferenciasDieta, deficit: number, hoje = hojeISO()): number | null {
  if (pref.ultimaRecalibracao && diffDias(pref.ultimaRecalibracao, hoje) < 7) return null;
  const desde = somarDias(hoje, -21);
  const inicio = pref.ultimaRecalibracao && pref.ultimaRecalibracao > desde ? pref.ultimaRecalibracao : desde;
  const pontos = pesos.filter((p) => p.data >= inicio && p.data <= hoje).map((p) => ({ dia: diffDias(inicio, p.data), kg: p.kg }));
  return recalibrar({ pontos, deficit, ajusteAtual: pref.ajusteKcal });
}
