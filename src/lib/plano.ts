// Gerador do plano da semana (seção 5 da especificação da Fase 2). Funções puras e determinísticas.
import { ALIMENTOS, CATEGORIAS, type Alimento, type CategoriaDiario, type Papel } from '../data/alimentos';
import { alimentoOuErro, nutrientesDe, por100g } from './taco';

export type TipoVaga = 'proteina' | 'carbo' | 'fixo' | 'salada';

export interface ItemPlano {
  alimentoId: string;
  gramas: number;
  tipo: TipoVaga;
  aVontade?: boolean;
}

export interface RefeicaoPlano {
  nome: string;
  horario: string;
  itens: ItemPlano[];
  /** Papel sem nenhum alimento permitido. */
  faltando?: string[];
}

export interface DiaPlano {
  refeicoes: RefeicaoPlano[];
}

type TipoRefeicao = 'cafe' | 'almoco' | 'lanche' | 'jantar' | 'ceia';

type Vaga =
  | { tipo: 'proteina'; papeis: Papel[]; rotulo: string }
  | { tipo: 'carbo'; papeis: Papel[]; rotulo: string }
  | { tipo: 'fixo'; papeis: Papel[]; rotulo: string }
  | { tipo: 'salada'; papeis: Papel[]; rotulo: string };

const MOLDES: Record<TipoRefeicao, Vaga[]> = {
  cafe: [
    { tipo: 'proteina', papeis: ['proteinaCafe', 'laticinio'], rotulo: 'proteína' },
    { tipo: 'carbo', papeis: ['carboCafe'], rotulo: 'carboidrato' },
    { tipo: 'fixo', papeis: ['fruta'], rotulo: 'fruta' },
    { tipo: 'fixo', papeis: ['bebida'], rotulo: 'bebida' },
  ],
  almoco: [
    { tipo: 'proteina', papeis: ['proteina'], rotulo: 'proteína' },
    { tipo: 'carbo', papeis: ['carbo'], rotulo: 'carboidrato' },
    { tipo: 'fixo', papeis: ['leguminosa'], rotulo: 'leguminosa' },
    { tipo: 'salada', papeis: ['salada'], rotulo: 'salada' },
    { tipo: 'fixo', papeis: ['gordura'], rotulo: 'gordura' },
  ],
  jantar: [
    { tipo: 'proteina', papeis: ['proteina'], rotulo: 'proteína' },
    { tipo: 'carbo', papeis: ['carbo'], rotulo: 'carboidrato' },
    { tipo: 'salada', papeis: ['salada'], rotulo: 'salada' },
    { tipo: 'fixo', papeis: ['gordura'], rotulo: 'gordura' },
  ],
  lanche: [
    { tipo: 'fixo', papeis: ['fruta'], rotulo: 'fruta' },
    { tipo: 'proteina', papeis: ['laticinio'], rotulo: 'laticínio' },
  ],
  ceia: [{ tipo: 'proteina', papeis: ['laticinio'], rotulo: 'laticínio' }],
};

/** Docinho do dia: porção fixa, compensada no restante do dia. */
const VAGA_DOCE: Vaga = { tipo: 'fixo', papeis: ['doce'], rotulo: 'docinho' };

/** O docinho vai no lanche da tarde; sem lanche, vira sobremesa do almoço. */
function indiceDoce(slots: Slot[]): number {
  const lanche = slots.findIndex((x) => x.nome === 'Lanche da tarde');
  return lanche >= 0 ? lanche : slots.findIndex((x) => x.tipo === 'almoco');
}

function vagasDoSlot(slots: Slot[], si: number): Vaga[] {
  const base = MOLDES[slots[si].tipo];
  return si === indiceDoce(slots) ? [...base, VAGA_DOCE] : base;
}

interface Slot {
  tipo: TipoRefeicao;
  nome: string;
  horario: string;
  fracao: number;
}

const s = (tipo: TipoRefeicao, nome: string, horario: string, pct: number): Slot => ({ tipo, nome, horario, fracao: pct / 100 });

export const DISTRIBUICAO: Record<3 | 4 | 5 | 6, Slot[]> = {
  3: [s('cafe', 'Café da manhã', '07:30', 30), s('almoco', 'Almoço', '12:30', 40), s('jantar', 'Jantar', '19:30', 30)],
  4: [s('cafe', 'Café da manhã', '07:30', 25), s('almoco', 'Almoço', '12:30', 35), s('lanche', 'Lanche da tarde', '16:00', 10), s('jantar', 'Jantar', '19:30', 30)],
  5: [
    s('cafe', 'Café da manhã', '07:30', 20),
    s('lanche', 'Lanche da manhã', '10:00', 10),
    s('almoco', 'Almoço', '12:30', 35),
    s('lanche', 'Lanche da tarde', '16:00', 10),
    s('jantar', 'Jantar', '19:30', 25),
  ],
  6: [
    s('cafe', 'Café da manhã', '07:30', 20),
    s('lanche', 'Lanche da manhã', '10:00', 10),
    s('almoco', 'Almoço', '12:30', 30),
    s('lanche', 'Lanche da tarde', '16:00', 10),
    s('jantar', 'Jantar', '19:00', 20),
    s('ceia', 'Ceia', '21:30', 10),
  ],
};

/** Versão do gerador. 2 = bebida no café + docinho do dia. */
export const VERSAO_GERADOR = 2;

/** Peso de sorteio de um favorito em relação a um alimento comum. */
export const PESO_FAVORITO = 6;

// ---------- Aleatoriedade determinística ----------

export function mulberry32(semente: number): () => number {
  let t = semente >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Preferencias {
  refeicoesPorDia: 3 | 4 | 5 | 6;
  naoCome: string[];
  favoritos: string[];
}

function candidatos(papeis: Papel[], pref: Preferencias, excluir?: string): Alimento[] {
  const nao = new Set(pref.naoCome);
  return ALIMENTOS.filter((a) => !nao.has(a.id) && a.id !== excluir && a.papeis.some((p) => papeis.includes(p)));
}

function sortear(lista: Alimento[], pref: Preferencias, rnd: () => number, evitar: string[] = []): Alimento | undefined {
  const filtrada = lista.filter((a) => !evitar.includes(a.id));
  const opcoes = filtrada.length > 0 ? filtrada : lista;
  if (opcoes.length === 0) return undefined;
  const fav = new Set(pref.favoritos);
  const pesos = opcoes.map((a) => (fav.has(a.id) ? PESO_FAVORITO : 1));
  let r = rnd() * pesos.reduce((x, y) => x + y, 0);
  for (let i = 0; i < opcoes.length; i++) {
    r -= pesos[i];
    if (r < 0) return opcoes[i];
  }
  return opcoes[opcoes.length - 1];
}

// ---------- Porções ----------

export function arredondarPorcao(a: Alimento, gramas: number): number {
  const lim = Math.min(a.max, Math.max(a.min, gramas));
  if (a.unidade) {
    const passo = a.unidade.g;
    const n = Math.max(1, Math.round(lim / passo));
    return Math.min(Math.floor(a.max / passo) * passo, n * passo) || passo;
  }
  const passo = a.max <= 60 ? 5 : 10;
  return Math.min(a.max, Math.max(a.min, Math.round(lim / passo) * passo));
}

function montarRefeicao(
  slot: Slot,
  vagas: Vaga[],
  alvo: { kcal: number; proteina: number },
  escolhas: Map<Vaga, Alimento | undefined>,
): RefeicaoPlano {
  const itens: ItemPlano[] = [];
  const faltando: string[] = [];
  const kcalAlvo = alvo.kcal * slot.fracao;
  const protAlvo = alvo.proteina * slot.fracao;
  let kcal = 0;
  let prot = 0;

  // 1) itens de porção fixa e salada
  for (const v of vagas) {
    const a = escolhas.get(v);
    if (!a) {
      if (v !== VAGA_DOCE) faltando.push(v.rotulo); // sem docinho é escolha, não falta
      continue;
    }
    if (v.tipo === 'fixo' || v.tipo === 'salada') {
      const n = nutrientesDe(a.id, a.porcao);
      kcal += n.kcal;
      prot += n.proteina;
    }
  }
  const vProt = vagas.find((v) => v.tipo === 'proteina');
  const vCarbo = vagas.find((v) => v.tipo === 'carbo');
  const aProt = vProt && escolhas.get(vProt);
  const aCarbo = vCarbo && escolhas.get(vCarbo);

  // 2) proteína cobre o que falta de proteína (desconta a estimativa do carboidrato na 2ª passada)
  let gProt = 0;
  let gCarbo = 0;
  for (let passada = 0; passada < 2; passada++) {
    const protCarbo = aCarbo ? (por100g(aCarbo.id).proteina * gCarbo) / 100 : 0;
    if (aProt) {
      const p100 = por100g(aProt.id).proteina;
      gProt = arredondarPorcao(aProt, p100 > 0 ? ((protAlvo - prot - protCarbo) / p100) * 100 : aProt.porcao);
    }
    // 3) carboidrato completa as calorias
    if (aCarbo) {
      const kcalProt = aProt ? (por100g(aProt.id).kcal * gProt) / 100 : 0;
      const k100 = por100g(aCarbo.id).kcal;
      gCarbo = arredondarPorcao(aCarbo, ((kcalAlvo - kcal - kcalProt) / k100) * 100);
    }
  }

  for (const v of vagas) {
    const a = escolhas.get(v);
    if (!a) continue;
    if (v.tipo === 'proteina') itens.push({ alimentoId: a.id, gramas: gProt, tipo: 'proteina' });
    else if (v.tipo === 'carbo') itens.push({ alimentoId: a.id, gramas: gCarbo, tipo: 'carbo' });
    else if (v.tipo === 'salada') itens.push({ alimentoId: a.id, gramas: a.porcao, tipo: 'salada', aVontade: true });
    else itens.push({ alimentoId: a.id, gramas: a.porcao, tipo: 'fixo' });
  }
  return { nome: slot.nome, horario: slot.horario, itens, ...(faltando.length ? { faltando } : {}) };
}

// ---------- Equilíbrio do dia ----------

function passo(a: Alimento): number {
  return a.unidade ? a.unidade.g : a.max <= 60 ? 5 : 10;
}

/**
 * Ajusta as porções do dia, um passo por vez, até a proteína chegar a ≥ 95% da meta e as
 * calorias ficarem a ±3% (ou até os limites de cada alimento).
 */
export function equilibrarDia(dia: DiaPlano, metas: MetasPlano): DiaPlano {
  const refeicoes = dia.refeicoes.map((r) => ({ ...r, itens: r.itens.map((i) => ({ ...i })) }));
  const itens = refeicoes.flatMap((r) => r.itens).filter((i) => !i.aVontade);
  const total = () => totaisDia({ refeicoes });
  const mudar = (i: ItemPlano, sinal: 1 | -1) => {
    const a = alimentoOuErro(i.alimentoId);
    const novo = i.gramas + sinal * passo(a);
    if (novo < a.min || novo > a.max) return false;
    i.gramas = novo;
    return true;
  };
  const densidadeProt = (i: ItemPlano) => por100g(i.alimentoId).proteina / Math.max(1, por100g(i.alimentoId).kcal);

  for (let guarda = 0; guarda < 400; guarda++) {
    const t = total();
    if (t.proteina < metas.proteina * 0.95) {
      // mais proteína no item mais "proteico por caloria" que ainda pode crescer
      const alvo = itens
        .filter((i) => i.tipo === 'proteina')
        .sort((x, y) => densidadeProt(y) - densidadeProt(x))
        .find((i) => mudar(i, 1));
      if (alvo) continue;
    }
    const diff = metas.kcal - t.kcal;
    if (Math.abs(diff) <= metas.kcal * 0.03) break;
    if (diff > 0) {
      const ordem: TipoVaga[] = ['carbo', 'fixo', 'proteina'];
      const ok = ordem.some((tipo) => itens.filter((i) => i.tipo === tipo).sort((x, y) => x.gramas - y.gramas).some((i) => mudar(i, 1)));
      if (!ok) break;
    } else {
      const ordem: TipoVaga[] = ['carbo', 'fixo'];
      let ok = ordem.some((tipo) => itens.filter((i) => i.tipo === tipo).sort((x, y) => y.gramas - x.gramas).some((i) => mudar(i, -1)));
      if (!ok && t.proteina > metas.proteina)
        ok = itens
          .filter((i) => i.tipo === 'proteina')
          .sort((x, y) => densidadeProt(x) - densidadeProt(y))
          .some((i) => mudar(i, -1));
      if (!ok) break;
    }
  }
  return { refeicoes };
}

export interface MetasPlano {
  kcal: number;
  proteina: number;
}

export function gerarSemana(metas: MetasPlano, pref: Preferencias, semente: number): DiaPlano[] {
  const rnd = mulberry32(semente);
  const slots = DISTRIBUICAO[pref.refeicoesPorDia];
  const ontem = new Map<string, string>(); // chave slot+vaga → alimento do dia anterior
  const dias: DiaPlano[] = [];
  for (let d = 0; d < 7; d++) {
    const hoje = new Set<string>(); // evita o mesmo alimento duas vezes no mesmo dia
    const refeicoes = slots.map((slot, si) => {
      const escolhas = new Map<Vaga, Alimento | undefined>();
      const vagas = vagasDoSlot(slots, si);
      vagas.forEach((v, vi) => {
        const chave = `${si}:${vi}`;
        const evitar = [...hoje, ...(ontem.has(chave) ? [ontem.get(chave)!] : [])];
        const a = sortear(candidatos(v.papeis, pref), pref, rnd, evitar);
        if (a && v.tipo !== 'fixo') hoje.add(a.id);
        escolhas.set(v, a);
        if (a) ontem.set(chave, a.id);
      });
      return montarRefeicao(slot, vagas, metas, escolhas);
    });
    dias.push(equilibrarDia({ refeicoes }, metas));
  }
  return dias;
}

/** Troca um item por outro do mesmo papel e recalcula as porções da refeição. */
export function trocarItem(
  dia: DiaPlano,
  indiceRefeicao: number,
  indiceItem: number,
  metas: MetasPlano,
  pref: Preferencias,
  semente: number,
): DiaPlano {
  const slots = DISTRIBUICAO[pref.refeicoesPorDia];
  const slot = slots[indiceRefeicao];
  const ref = dia.refeicoes[indiceRefeicao];
  const vagas = vagasDoSlot(slots, indiceRefeicao);
  // Associa cada vaga do molde ao item atual pelo tipo (os itens seguem a ordem do molde).
  const escolhas = new Map<Vaga, Alimento | undefined>();
  const restantes = [...ref.itens];
  let vagaTrocada: Vaga | undefined;
  for (const v of vagas) {
    const idx = restantes.findIndex((i) => i.tipo === v.tipo && alimentoOuErro(i.alimentoId).papeis.some((p) => v.papeis.includes(p)));
    if (idx < 0) {
      escolhas.set(v, undefined);
      continue;
    }
    const item = restantes.splice(idx, 1)[0];
    escolhas.set(v, alimentoOuErro(item.alimentoId));
    if (item === ref.itens[indiceItem]) vagaTrocada = v;
  }
  if (vagaTrocada) {
    const atual = escolhas.get(vagaTrocada);
    const doDia = dia.refeicoes.flatMap((r) => r.itens.map((i) => i.alimentoId));
    const novo = sortear(candidatos(vagaTrocada.papeis, pref, atual?.id), pref, mulberry32(semente), doDia);
    if (novo) escolhas.set(vagaTrocada, novo);
  }
  const refeicoes = [...dia.refeicoes];
  refeicoes[indiceRefeicao] = montarRefeicao(slot, vagas, metas, escolhas);
  return equilibrarDia({ refeicoes }, metas);
}

export function totaisDia(dia: DiaPlano): { kcal: number; proteina: number } {
  let kcal = 0;
  let proteina = 0;
  for (const r of dia.refeicoes)
    for (const i of r.itens) {
      const n = nutrientesDe(i.alimentoId, i.gramas);
      kcal += n.kcal;
      proteina += n.proteina;
    }
  return { kcal: Math.round(kcal), proteina: Math.round(proteina) };
}

export interface ItemCompra {
  alimentoId: string;
  gramas: number;
  aVontade: boolean;
  categoria: CategoriaDiario;
}

export function listaDeCompras(dias: DiaPlano[]): { categoria: string; itens: ItemCompra[] }[] {
  const soma = new Map<string, ItemCompra>();
  for (const d of dias)
    for (const r of d.refeicoes)
      for (const i of r.itens) {
        const a = alimentoOuErro(i.alimentoId);
        const atual = soma.get(i.alimentoId) ?? { alimentoId: i.alimentoId, gramas: 0, aVontade: !!i.aVontade, categoria: a.categoria };
        atual.gramas += i.gramas;
        soma.set(i.alimentoId, atual);
      }
  return CATEGORIAS.map((c) => ({
    categoria: c.nome,
    itens: [...soma.values()].filter((i) => i.categoria === c.id).sort((x, y) => alimentoOuErro(x.alimentoId).nome.localeCompare(alimentoOuErro(y.alimentoId).nome)),
  })).filter((g) => g.itens.length > 0);
}

/** "~1,2 kg", "450 g" ou "12 ovos". */
export function quantidadeCompra(i: ItemCompra): string {
  const a = alimentoOuErro(i.alimentoId);
  if (a.unidade) {
    const n = Math.ceil(i.gramas / a.unidade.g);
    return `${n} ${n === 1 ? a.unidade.nome : a.unidade.plural}`;
  }
  if (i.gramas >= 1000) return `~${(Math.ceil(i.gramas / 100) / 10).toLocaleString('pt-BR')} kg`;
  return `${Math.ceil(i.gramas / 10) * 10} g`;
}
