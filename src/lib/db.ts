import Dexie, { type EntityTable } from 'dexie';
import type { CategoriaDiario } from '../data/alimentos';
import type { DiaPlano } from './plano';

export type Sexo = 'F' | 'M';
export type NivelAtividade = 'sedentario' | 'leve' | 'moderado' | 'intenso';

export interface Perfil {
  id: 1;
  nome: string;
  sexo: Sexo;
  idade: number;
  idadeInformadaEm: string;
  alturaCm: number;
  pesoInicialKg: number;
  inicioTratamento: string;
  nivelAtividade: NivelAtividade;
  metaKg: number;
  prazoSemanas: number;
  metaDefinidaEm: string;
  intervaloDoseDias: number;
}

export interface Aplicacao {
  id?: number;
  data: string;
  doseMg: number;
  observacao?: string;
}

export interface RegistroPeso {
  id?: number;
  data: string;
  kg: number;
}

export interface PreferenciasDieta {
  id: 1;
  refeicoesPorDia: 3 | 4 | 5 | 6;
  naoCome: string[];
  favoritos: string[];
  metaAguaManualMl?: number;
  /** Recalibração acumulada (−300..300 kcal). */
  ajusteKcal: number;
  ultimaRecalibracao?: string;
}

export interface PlanoSemana {
  /** Segunda-feira da semana (ISO). */
  inicio: string;
  semente: number;
  geradoEm: string;
  dias: DiaPlano[];
  comprados: string[];
  /** Preferências usadas na geração (para avisar quando mudarem). */
  preferencias?: string;
  /** Versão do gerador que criou o plano (ausente = 1). */
  versao?: number;
}

export interface RegistroDiario {
  id?: number;
  data: string;
  categoria: CategoriaDiario;
  alimentoId: string;
  nome: string;
  gramas: number;
  kcal: number;
  proteina: number;
  gordura: number;
  carboidrato: number;
}

export interface RegistroAgua {
  id?: number;
  data: string;
  hora: string;
  ml: number;
}

export const db = new Dexie('monju-pessoal') as Dexie & {
  perfil: EntityTable<Perfil, 'id'>;
  aplicacoes: EntityTable<Aplicacao, 'id'>;
  pesos: EntityTable<RegistroPeso, 'id'>;
  preferencias: EntityTable<PreferenciasDieta, 'id'>;
  planos: EntityTable<PlanoSemana, 'inicio'>;
  diario: EntityTable<RegistroDiario, 'id'>;
  agua: EntityTable<RegistroAgua, 'id'>;
};

db.version(1).stores({
  perfil: 'id',
  aplicacoes: '++id, data',
  pesos: '++id, data',
});

db.version(2).stores({
  preferencias: 'id',
  planos: 'inicio',
  diario: '++id, data',
  agua: '++id, data',
});

export const TABELAS = () => [db.perfil, db.aplicacoes, db.pesos, db.preferencias, db.planos, db.diario, db.agua];

/** Registro mais recente por data; empate decidido pelo maior id. */
export function maisRecente<T extends { data: string; id?: number }>(lista: T[]): T | undefined {
  return lista.reduce<T | undefined>((melhor, item) => {
    if (!melhor) return item;
    if (item.data > melhor.data) return item;
    if (item.data === melhor.data && (item.id ?? 0) > (melhor.id ?? 0)) return item;
    return melhor;
  }, undefined);
}

/** Peso de referência na data em que a meta foi definida (último registro até essa data). */
export function pesoNaData(pesos: RegistroPeso[], data: string): number | undefined {
  return maisRecente(pesos.filter((p) => p.data <= data))?.kg;
}
