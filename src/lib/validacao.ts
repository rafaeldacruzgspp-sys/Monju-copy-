import { PRAZO_MAX, PRAZO_MIN } from './calculos';
import type { Aplicacao, Perfil, RegistroPeso } from './db';

// Regras da seção 6 da especificação. Cada função devolve a mensagem de erro ou null.

export function lerNumero(texto: string): number {
  return Number(texto.trim().replace(',', '.'));
}

function faixa(n: number, min: number, max: number, unidade: string): string | null {
  if (!Number.isFinite(n)) return 'Informe um número';
  if (n < min || n > max) return `Entre ${min} e ${max}${unidade}`;
  return null;
}

function umaCasa(n: number): boolean {
  return Math.abs(Math.round(n * 10) - n * 10) < 1e-6;
}

export const validar = {
  nome: (v: string) => (v.trim().length < 1 || v.trim().length > 40 ? 'De 1 a 40 caracteres' : null),
  idade: (n: number) => (Number.isInteger(n) ? faixa(n, 18, 100, ' anos') : 'Use um número inteiro'),
  altura: (n: number) => faixa(n, 100, 250, ' cm'),
  peso: (n: number) => faixa(n, 30, 300, ' kg') ?? (umaCasa(n) ? null : 'Use no máximo 1 casa decimal'),
  meta: (n: number, atual: number) =>
    validar.peso(n) ?? (n >= atual ? 'A meta precisa ser menor que o peso atual' : null),
  prazo: (n: number) =>
    Number.isInteger(n) && n >= PRAZO_MIN && n <= PRAZO_MAX ? null : `Entre ${PRAZO_MIN} e ${PRAZO_MAX} semanas`,
  dose: (n: number) => faixa(n, 0.1, 100, ' mg'),
  intervalo: (n: number) => (Number.isInteger(n) ? faixa(n, 1, 30, ' dias') : 'Use um número inteiro'),
  data: (iso: string, hoje: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return 'Informe uma data';
    return iso > hoje ? 'A data não pode estar no futuro' : null;
  },
};

// ---------- Backup ----------

export interface Backup {
  app: 'monju-pessoal';
  versao: 1;
  exportadoEm: string;
  perfil: Perfil;
  aplicacoes: Aplicacao[];
  pesos: RegistroPeso[];
}

const ehData = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const ehNum = (v: unknown) => typeof v === 'number' && Number.isFinite(v);

function perfilValido(p: any): p is Perfil {
  return (
    p &&
    p.id === 1 &&
    typeof p.nome === 'string' &&
    (p.sexo === 'F' || p.sexo === 'M') &&
    ['sedentario', 'leve', 'moderado', 'intenso'].includes(p.nivelAtividade) &&
    [p.idade, p.alturaCm, p.pesoInicialKg, p.metaKg, p.prazoSemanas, p.intervaloDoseDias].every(ehNum) &&
    [p.idadeInformadaEm, p.inicioTratamento, p.metaDefinidaEm].every(ehData)
  );
}

/** Valida o conteúdo de um arquivo de backup. Lança Error se for inválido. */
export function lerBackup(texto: string): Backup {
  let dados: any;
  try {
    dados = JSON.parse(texto);
  } catch {
    throw new Error('Arquivo de backup inválido');
  }
  const ok =
    dados &&
    dados.app === 'monju-pessoal' &&
    dados.versao === 1 &&
    perfilValido(dados.perfil) &&
    Array.isArray(dados.aplicacoes) &&
    dados.aplicacoes.every(
      (a: any) =>
        a && ehData(a.data) && ehNum(a.doseMg) && (a.observacao === undefined || typeof a.observacao === 'string'),
    ) &&
    Array.isArray(dados.pesos) &&
    dados.pesos.every((p: any) => p && ehData(p.data) && ehNum(p.kg));
  if (!ok) throw new Error('Arquivo de backup inválido');
  return dados as Backup;
}
