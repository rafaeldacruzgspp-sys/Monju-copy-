import { describe, expect, it } from 'vitest';
import { lerBackup, lerNumero, validar } from './validacao';

const perfil = {
  id: 1,
  nome: 'Ana',
  sexo: 'F',
  idade: 40,
  idadeInformadaEm: '2026-09-27',
  alturaCm: 165,
  pesoInicialKg: 95,
  inicioTratamento: '2026-08-01',
  nivelAtividade: 'leve',
  metaKg: 80,
  prazoSemanas: 12,
  metaDefinidaEm: '2026-09-27',
  intervaloDoseDias: 7,
};

const backup = {
  app: 'monju-pessoal',
  versao: 1,
  exportadoEm: '2026-09-27T10:00:00.000Z',
  perfil,
  aplicacoes: [{ id: 1, data: '2026-09-20', doseMg: 2.5 }],
  pesos: [{ id: 1, data: '2026-09-27', kg: 90 }],
};

describe('validar', () => {
  it('aceita vírgula decimal', () => {
    expect(lerNumero('90,5')).toBe(90.5);
  });
  it('peso e meta', () => {
    expect(validar.peso(90.5)).toBeNull();
    expect(validar.peso(90.55)).not.toBeNull();
    expect(validar.peso(20)).not.toBeNull();
    expect(validar.meta(90, 90)).toBe('A meta precisa ser menor que o peso atual');
    expect(validar.meta(80, 90)).toBeNull();
  });
  it('idade, prazo e data', () => {
    expect(validar.idade(17)).not.toBeNull();
    expect(validar.idade(18)).toBeNull();
    expect(validar.prazo(2)).not.toBeNull();
    expect(validar.prazo(12)).toBeNull();
    expect(validar.data('2026-09-28', '2026-09-27')).not.toBeNull();
    expect(validar.data('2026-09-27', '2026-09-27')).toBeNull();
  });
});

describe('lerBackup', () => {
  it('aceita um backup válido', () => {
    expect(lerBackup(JSON.stringify(backup)).perfil.nome).toBe('Ana');
  });
  it('rejeita JSON inválido, app errado ou dados corrompidos', () => {
    expect(() => lerBackup('{')).toThrow('Arquivo de backup inválido');
    expect(() => lerBackup(JSON.stringify({ ...backup, app: 'outro' }))).toThrow();
    expect(() => lerBackup(JSON.stringify({ ...backup, pesos: [{ data: 'x', kg: 90 }] }))).toThrow();
    expect(() => lerBackup(JSON.stringify({ ...backup, perfil: { ...perfil, sexo: 'X' } }))).toThrow();
  });
});
