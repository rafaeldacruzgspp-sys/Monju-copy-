import Dexie, { type EntityTable } from 'dexie';

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

export const db = new Dexie('monju-pessoal') as Dexie & {
  perfil: EntityTable<Perfil, 'id'>;
  aplicacoes: EntityTable<Aplicacao, 'id'>;
  pesos: EntityTable<RegistroPeso, 'id'>;
};

db.version(1).stores({
  perfil: 'id',
  aplicacoes: '++id, data',
  pesos: '++id, data',
});

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
