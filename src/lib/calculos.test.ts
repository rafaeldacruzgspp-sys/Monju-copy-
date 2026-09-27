import { describe, expect, it } from 'vitest';
import {
  avaliarPrazo,
  classificarImc,
  diffDias,
  estadoProximaDose,
  idadeAtual,
  imc,
  progresso,
  semanasDeTratamento,
  somarDias,
} from './calculos';

describe('imc', () => {
  it('calcula peso / altura²', () => {
    expect(imc(90, 165)).toBeCloseTo(33.06, 2);
  });
});

describe('classificarImc', () => {
  it.each([
    [15.99, 'magreza3'],
    [16, 'magreza2'],
    [16.99, 'magreza2'],
    [17, 'magreza1'],
    [18.49, 'magreza1'],
    [18.5, 'eutrofia'],
    [24.99, 'eutrofia'],
    [25, 'sobrepeso'],
    [29.99, 'sobrepeso'],
    [30, 'obesidade1'],
    [34.99, 'obesidade1'],
    [35, 'obesidade2'],
    [39.99, 'obesidade2'],
    [40, 'obesidade3'],
  ])('%f → %s', (valor, faixa) => {
    expect(classificarImc(valor)).toBe(faixa);
  });
});

describe('avaliarPrazo', () => {
  it('não alerta dentro do ritmo seguro', () => {
    const r = avaliarPrazo(90, 84, 6);
    expect(r.ritmo).toBe(1);
    expect(r.acimaDoSeguro).toBe(false);
    expect(r.prazoSeguro).toBeNull();
  });

  it('sugere prazo seguro e meta intermediária', () => {
    const r = avaliarPrazo(90, 80, 4);
    expect(r.acimaDoSeguro).toBe(true);
    expect(r.ritmo).toBe(2.5);
    expect(r.prazoSeguro).toBe(10);
    expect(r.metaIntermediaria).toBe(86);
  });

  it('omite prazo seguro acima de 12 semanas', () => {
    const r = avaliarPrazo(100, 80, 12);
    expect(r.prazoSeguro).toBeNull();
    expect(r.metaIntermediaria).toBe(88);
  });
});

describe('progresso', () => {
  it('fração entre base e meta', () => {
    expect(progresso(100, 90, 80)).toBe(0.5);
  });
  it('limita entre 0 e 1', () => {
    expect(progresso(100, 105, 80)).toBe(0);
    expect(progresso(100, 75, 80)).toBe(1);
  });
});

describe('datas e doses', () => {
  it('diffDias e somarDias atravessam meses', () => {
    expect(diffDias('2026-09-28', '2026-10-05')).toBe(7);
    expect(somarDias('2026-09-28', 7)).toBe('2026-10-05');
  });

  it('estado da próxima dose', () => {
    expect(estadoProximaDose(undefined, 7, '2026-09-27')).toEqual({ tipo: 'sem-registro' });
    expect(estadoProximaDose('2026-09-25', 7, '2026-09-27')).toEqual({
      tipo: 'futura',
      dias: 5,
      data: '2026-10-02',
    });
    expect(estadoProximaDose('2026-09-20', 7, '2026-09-27')).toEqual({ tipo: 'hoje', data: '2026-09-27' });
    expect(estadoProximaDose('2026-09-19', 7, '2026-09-27')).toEqual({
      tipo: 'atrasada',
      dias: 1,
      data: '2026-09-26',
    });
  });

  it('semanas de tratamento', () => {
    expect(semanasDeTratamento('2026-09-01', '2026-09-27')).toBe(3);
    expect(semanasDeTratamento('2026-10-01', '2026-09-27')).toBe(0);
  });

  it('idade atual', () => {
    expect(idadeAtual(40, '2026-09-27', '2027-09-26')).toBe(40);
    expect(idadeAtual(40, '2026-09-27', '2027-09-27')).toBe(41);
  });
});
