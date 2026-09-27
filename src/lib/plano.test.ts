import { describe, expect, it } from 'vitest';
import { ALIMENTOS } from '../data/alimentos';
import { gerarSemana, listaDeCompras, quantidadeCompra, totaisDia, trocarItem, type Preferencias } from './plano';

const metas = { kcal: 2000, proteina: 111 };
const pref: Preferencias = { refeicoesPorDia: 4, naoCome: [], favoritos: [] };

describe('gerarSemana', () => {
  it('é determinístico pela semente', () => {
    expect(gerarSemana(metas, pref, 42)).toEqual(gerarSemana(metas, pref, 42));
    expect(gerarSemana(metas, pref, 42)).not.toEqual(gerarSemana(metas, pref, 43));
  });

  it.each([3, 4, 5, 6] as const)('%i refeições: calorias em ±10%% e proteína ≥ 90%%', (n) => {
    for (const semente of [1, 2, 3, 4, 5]) {
      const semana = gerarSemana(metas, { ...pref, refeicoesPorDia: n }, semente);
      expect(semana).toHaveLength(7);
      for (const dia of semana) {
        expect(dia.refeicoes).toHaveLength(n);
        const t = totaisDia(dia);
        expect(t.kcal, `semente ${semente}`).toBeGreaterThanOrEqual(metas.kcal * 0.9);
        expect(t.kcal, `semente ${semente}`).toBeLessThanOrEqual(metas.kcal * 1.1);
        expect(t.proteina, `semente ${semente}`).toBeGreaterThanOrEqual(metas.proteina * 0.9);
      }
    }
  });

  it('funciona também com meta no piso (1.200 kcal)', () => {
    for (const dia of gerarSemana({ kcal: 1200, proteina: 80 }, pref, 7)) {
      const t = totaisDia(dia);
      expect(t.kcal).toBeLessThanOrEqual(1200 * 1.1);
      expect(t.kcal).toBeGreaterThanOrEqual(1200 * 0.9);
    }
  });

  it('nunca usa alimentos marcados como "não como"', () => {
    const naoCome = ['frango-peito', 'arroz', 'ovo', 'feijao-carioca', 'banana-prata'];
    const semana = gerarSemana(metas, { ...pref, naoCome }, 9);
    const usados = semana.flatMap((d) => d.refeicoes.flatMap((r) => r.itens.map((i) => i.alimentoId)));
    for (const id of naoCome) expect(usados).not.toContain(id);
  });

  it('favoritos aparecem mais', () => {
    const conta = (p: Preferencias) =>
      [1, 2, 3, 4, 5, 6, 7, 8]
        .flatMap((s) => gerarSemana(metas, p, s))
        .flatMap((d) => d.refeicoes.flatMap((r) => r.itens))
        .filter((i) => i.alimentoId === 'frango-peito').length;
    expect(conta({ ...pref, favoritos: ['frango-peito'] })).toBeGreaterThan(conta(pref));
  });

  it('evita repetir a mesma proteína do almoço em dias seguidos', () => {
    const semana = gerarSemana(metas, pref, 11);
    for (let d = 1; d < 7; d++) {
      expect(semana[d].refeicoes[1].itens[0].alimentoId).not.toBe(semana[d - 1].refeicoes[1].itens[0].alimentoId);
    }
  });

  it('avisa quando um papel fica sem opções', () => {
    const naoCome = ALIMENTOS.filter((a) => a.papeis.includes('leguminosa')).map((a) => a.id);
    const semana = gerarSemana(metas, { ...pref, naoCome }, 3);
    expect(semana[0].refeicoes[1].faltando).toEqual(['leguminosa']);
  });
});

describe('café e docinho', () => {
  it.each([3, 4, 5, 6] as const)('%i refeições: um docinho por dia e bebida no café', (n) => {
    const semana = gerarSemana(metas, { ...pref, refeicoesPorDia: n }, 21);
    for (const dia of semana) {
      const itens = dia.refeicoes.flatMap((r) => r.itens.map((i) => ALIMENTOS.find((a) => a.id === i.alimentoId)!));
      expect(itens.filter((a) => a.papeis.includes('doce') && a.categoria === 'doce')).toHaveLength(1);
      const cafe = dia.refeicoes[0].itens.map((i) => ALIMENTOS.find((a) => a.id === i.alimentoId)!);
      expect(cafe.some((a) => a.papeis.includes('bebida'))).toBe(true);
    }
  });
  it('o docinho cabe na meta mesmo no piso de 1.200 kcal', () => {
    for (const dia of gerarSemana({ kcal: 1200, proteina: 80 }, { ...pref, refeicoesPorDia: 3 }, 4)) {
      const t = totaisDia(dia);
      expect(t.kcal).toBeLessThanOrEqual(1200 * 1.1);
    }
  });
  it('dá para tirar os docinhos marcando "não como"', () => {
    const naoCome = ALIMENTOS.filter((a) => a.papeis.includes('doce')).map((a) => a.id);
    const semana = gerarSemana(metas, { ...pref, naoCome }, 2);
    expect(semana.flatMap((d) => d.refeicoes.flatMap((r) => r.faltando ?? []))).toEqual([]);
    expect(semana.flatMap((d) => d.refeicoes.flatMap((r) => r.itens)).some((i) => naoCome.includes(i.alimentoId))).toBe(false);
  });
});

describe('trocarItem', () => {
  it('troca por outro alimento do mesmo papel e mantém as metas', () => {
    const [dia] = gerarSemana(metas, pref, 5);
    const antes = dia.refeicoes[1].itens[0].alimentoId;
    const novo = trocarItem(dia, 1, 0, metas, pref, 99);
    const depois = novo.refeicoes[1].itens[0].alimentoId;
    expect(depois).not.toBe(antes);
    expect(ALIMENTOS.find((a) => a.id === depois)!.papeis).toContain('proteina');
    const t = totaisDia(novo);
    expect(t.kcal).toBeGreaterThanOrEqual(metas.kcal * 0.9);
    expect(t.kcal).toBeLessThanOrEqual(metas.kcal * 1.1);
  });
});

describe('lista de compras', () => {
  it('soma as quantidades da semana', () => {
    const semana = gerarSemana(metas, pref, 5);
    const total = semana.flatMap((d) => d.refeicoes.flatMap((r) => r.itens)).reduce((s, i) => s + i.gramas, 0);
    const lista = listaDeCompras(semana);
    expect(lista.flatMap((g) => g.itens).reduce((s, i) => s + i.gramas, 0)).toBe(total);
  });
  it('formata quantidades', () => {
    expect(quantidadeCompra({ alimentoId: 'ovo', gramas: 600, aVontade: false, categoria: 'proteina' })).toBe('12 ovos');
    expect(quantidadeCompra({ alimentoId: 'arroz', gramas: 1150, aVontade: false, categoria: 'carboidrato' })).toBe('~1,2 kg');
    expect(quantidadeCompra({ alimentoId: 'arroz', gramas: 441, aVontade: false, categoria: 'carboidrato' })).toBe('450 g');
  });
});
