import { describe, expect, it } from 'vitest';
import { gastoTotal, inclinacao, macros, metaAgua, metaCalorias, mifflin, pesoReferencia, recalibrar } from './nutricao';
import { buscar, descreverPorcao, nutrientesDe } from './taco';
import { ALIMENTOS } from '../data/alimentos';
import { TACO } from './taco';

describe('Mifflin-St Jeor', () => {
  it('mulher 40 anos, 165 cm, 90 kg', () => {
    // 900 + 1031,25 − 200 − 161
    expect(mifflin('F', 90, 165, 40)).toBeCloseTo(1570.25, 2);
  });
  it('homem 35 anos, 178 cm, 104,5 kg', () => {
    // 1045 + 1112,5 − 175 + 5
    expect(mifflin('M', 104.5, 178, 35)).toBeCloseTo(1987.5, 2);
  });
  it('gasto total aplica o fator de atividade', () => {
    expect(gastoTotal('F', 90, 165, 40, 'leve')).toBeCloseTo(1570.25 * 1.375, 2);
  });
});

describe('metaCalorias', () => {
  const base = { sexo: 'M' as const, pesoKg: 104.5, alturaCm: 178, idade: 35, nivel: 'leve' as const, ajuste: 0 };
  it('déficit padrão de 500', () => {
    const m = metaCalorias({ ...base, ritmoNecessario: 0.4 });
    expect(m.deficit).toBe(500);
    expect(m.meta).toBe(Math.round((1987.5 * 1.375 - 500) / 10) * 10);
  });
  it('déficit de 750 acima de 0,5 kg/semana', () => {
    expect(metaCalorias({ ...base, ritmoNecessario: 0.8 }).deficit).toBe(750);
  });
  it('respeita o piso', () => {
    const m = metaCalorias({ sexo: 'F', pesoKg: 55, alturaCm: 150, idade: 70, nivel: 'sedentario', ritmoNecessario: 1, ajuste: -300 });
    expect(m.meta).toBe(1200);
    expect(m.limitadaAoPiso).toBe(true);
  });
});

describe('proteína, macros e água', () => {
  it('peso de referência limita ao IMC 25', () => {
    expect(pesoReferencia(104.5, 178)).toBeCloseTo(79.21, 2);
    expect(pesoReferencia(60, 178)).toBe(60);
  });
  it('macros fecham as calorias', () => {
    const m = macros(2000, 104.5, 178);
    expect(m.proteina).toBe(111);
    expect(m.gordura).toBe(60);
    expect(m.proteina * 4 + m.gordura * 9 + m.carboidrato * 4).toBeGreaterThan(1990);
  });
  it('água 35 ml/kg arredondada a 50 ml, ou manual', () => {
    expect(metaAgua(104.5)).toBe(3650);
    expect(metaAgua(104.5, 3000)).toBe(3000);
  });
});

describe('recalibração', () => {
  const pontos = (kgPorSemana: number) => [0, 7, 14].map((dia) => ({ dia, kg: 100 - (kgPorSemana * dia) / 7 }));
  it('inclinação', () => {
    expect(inclinacao(pontos(0.7)) * 7).toBeCloseTo(-0.7, 6);
  });
  it('perda abaixo da metade do esperado reduz 100 kcal', () => {
    expect(recalibrar({ pontos: pontos(0.1), deficit: 500, ajusteAtual: 0 })).toBe(-100);
  });
  it('perda acima de 1 kg/semana soma 100 kcal', () => {
    expect(recalibrar({ pontos: pontos(1.3), deficit: 500, ajusteAtual: 0 })).toBe(100);
  });
  it('perda dentro do esperado não muda', () => {
    expect(recalibrar({ pontos: pontos(0.5), deficit: 500, ajusteAtual: 0 })).toBeNull();
  });
  it('precisa de 2 semanas e respeita o limite de ±300', () => {
    expect(recalibrar({ pontos: [{ dia: 0, kg: 100 }, { dia: 7, kg: 100 }], deficit: 500, ajusteAtual: 0 })).toBeNull();
    expect(recalibrar({ pontos: pontos(0), deficit: 500, ajusteAtual: -300 })).toBeNull();
  });
});

describe('base de alimentos', () => {
  it('todo alimento da lista enxuta existe na TACO com calorias', () => {
    for (const a of ALIMENTOS) {
      const t = TACO.find((x) => x.id === a.taco);
      expect(t, a.id).toBeDefined();
      if (a.id !== 'cafe') expect(t!.kcal, a.id).toBeGreaterThan(0);
      expect(a.min <= a.porcao && a.porcao <= a.max, a.id).toBe(true);
    }
  });
  it('nutrientes por gramas', () => {
    expect(nutrientesDe('frango-peito', 150).kcal).toBe(Math.round(159 * 1.5));
    expect(nutrientesDe('taco:3', 100).kcal).toBe(128);
  });
  it('busca sem acento, lista enxuta primeiro', () => {
    const r = buscar('feijao')!;
    expect(r[0].alimentoId).toBe('feijao-carioca');
    expect(r.some((x) => x.alimentoId.startsWith('taco:'))).toBe(true);
  });
  it('descreve porções', () => {
    expect(descreverPorcao('ovo', 100)).toBe('2 ovos (100 g)');
    expect(descreverPorcao('feijao-carioca', 90)).toBe('90 g · 1 concha');
    expect(descreverPorcao('iogurte', 340)).toBe('340 g · 2× 1 pote');
    expect(descreverPorcao('batata-doce', 180)).toBe('180 g · 4,5× 1 fatia média');
    expect(descreverPorcao('morango', 150)).toBe('150 g · 1 morango = 12 g'); // acima de 12× mostra a referência
  });
});

describe('metas do dia', async () => {
  const { metasDoDia, segundaDaSemana, verificarRecalibracao } = await import('./metas');
  const perfil = {
    id: 1 as const, nome: 'R', sexo: 'M' as const, idade: 35, idadeInformadaEm: '2026-09-27', alturaCm: 178,
    pesoInicialKg: 112, inicioTratamento: '2026-08-02', nivelAtividade: 'leve' as const, metaKg: 100.5,
    prazoSemanas: 12, metaDefinidaEm: '2026-09-27', intervaloDoseDias: 7,
  };
  it('junta calorias, proteína e água', () => {
    const m = metasDoDia(perfil, [{ data: '2026-09-27', kg: 104.5 }], null, '2026-09-27');
    expect(m.pesoAtual).toBe(104.5);
    expect(m.proteina).toBe(111);
    expect(m.aguaMl).toBe(3650);
    expect(m.calorias.deficit).toBe(500); // 4 kg em 12 semanas
  });
  it('segunda-feira da semana', () => {
    expect(segundaDaSemana('2026-09-27')).toBe('2026-09-21'); // domingo
    expect(segundaDaSemana('2026-09-21')).toBe('2026-09-21');
    expect(segundaDaSemana('2026-09-30')).toBe('2026-09-28');
  });
  it('recalibra só com 14 dias de dados e 7 dias após a última', () => {
    const pref = { id: 1 as const, refeicoesPorDia: 4 as const, naoCome: [], favoritos: [], ajusteKcal: 0 };
    const estavel = [{ data: '2026-09-06', kg: 105 }, { data: '2026-09-13', kg: 105 }, { data: '2026-09-20', kg: 104.9 }];
    expect(verificarRecalibracao(estavel, pref, 500, '2026-09-20')).toBe(-100);
    expect(verificarRecalibracao(estavel, { ...pref, ultimaRecalibracao: '2026-09-15' }, 500, '2026-09-20')).toBeNull();
    expect(verificarRecalibracao(estavel.slice(1), pref, 500, '2026-09-20')).toBeNull();
  });
});
