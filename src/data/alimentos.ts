// Lista enxuta de alimentos (seção 6 da especificação da Fase 2).
// Valores nutricionais vêm da TACO 4ª edição pelo id (`taco`). Produtos que não estão na TACO
// (marcas e leite líquido) usam `rotulo`: valores aproximados por 100 g/ml de rótulos típicos.

export type CategoriaDiario = 'proteina' | 'carboidrato' | 'salada' | 'fruta' | 'laticinio' | 'gordura' | 'doce' | 'outros';

export const CATEGORIAS: { id: CategoriaDiario; nome: string; emoji: string }[] = [
  { id: 'proteina', nome: 'Proteína', emoji: '🍗' },
  { id: 'carboidrato', nome: 'Carboidrato', emoji: '🍚' },
  { id: 'salada', nome: 'Salada e legumes', emoji: '🥗' },
  { id: 'fruta', nome: 'Frutas', emoji: '🍎' },
  { id: 'laticinio', nome: 'Laticínios', emoji: '🥛' },
  { id: 'gordura', nome: 'Gorduras', emoji: '🫒' },
  { id: 'doce', nome: 'Docinhos', emoji: '🍫' },
  { id: 'outros', nome: 'Outros', emoji: '🍯' },
];

/** Papéis que um alimento pode ocupar nos moldes de refeição do plano. */
export type Papel =
  | 'proteina' // almoço e jantar
  | 'proteinaCafe'
  | 'carbo' // almoço e jantar
  | 'carboCafe'
  | 'leguminosa'
  | 'fruta'
  | 'laticinio'
  | 'salada'
  | 'gordura'
  | 'bebida' // café da manhã
  | 'doce'; // docinho do dia

export interface Alimento {
  id: string;
  nome: string;
  /** Id na TACO; ausente quando os valores vêm de `rotulo`. */
  taco?: number;
  /** Valores aproximados por 100 g (ou 100 ml) de rótulos típicos, para itens fora da TACO. */
  rotulo?: { kcal: number; proteina: number; gordura: number; carboidrato: number };
  categoria: CategoriaDiario;
  papeis: Papel[];
  /** Porção padrão em gramas. */
  porcao: number;
  min: number;
  max: number;
  /** Gramas por unidade, quando o alimento é contado em unidades (ovo, pão). */
  unidade?: { g: number; nome: string; plural: string };
  /** Medida caseira de referência. */
  medida?: { g: number; nome: string };
}

const a = (x: Alimento) => x;

export const ALIMENTOS: Alimento[] = [
  // Proteínas
  a({ id: 'frango-peito', nome: 'Peito de frango grelhado', taco: 410, categoria: 'proteina', papeis: ['proteina'], porcao: 120, min: 80, max: 250, medida: { g: 100, nome: '1 filé médio' } }),
  a({ id: 'frango-coxa', nome: 'Coxa de frango sem pele cozida', taco: 398, categoria: 'proteina', papeis: ['proteina'], porcao: 120, min: 80, max: 250, medida: { g: 60, nome: '1 coxa' } }),
  a({ id: 'patinho', nome: 'Patinho grelhado', taco: 377, categoria: 'proteina', papeis: ['proteina'], porcao: 120, min: 80, max: 250, medida: { g: 100, nome: '1 bife médio' } }),
  a({ id: 'alcatra', nome: 'Alcatra grelhada', taco: 370, categoria: 'proteina', papeis: ['proteina'], porcao: 120, min: 80, max: 250, medida: { g: 100, nome: '1 bife médio' } }),
  a({ id: 'carne-moida', nome: 'Carne moída (acém) cozida', taco: 326, categoria: 'proteina', papeis: ['proteina'], porcao: 100, min: 80, max: 220, medida: { g: 25, nome: '1 colher de sopa cheia' } }),
  a({ id: 'lagarto', nome: 'Lagarto cozido', taco: 363, categoria: 'proteina', papeis: ['proteina'], porcao: 120, min: 80, max: 250, medida: { g: 30, nome: '1 fatia' } }),
  a({ id: 'musculo', nome: 'Músculo cozido', taco: 371, categoria: 'proteina', papeis: ['proteina'], porcao: 120, min: 80, max: 250, medida: { g: 30, nome: '1 pedaço' } }),
  a({ id: 'file-mignon', nome: 'Filé mignon grelhado', taco: 358, categoria: 'proteina', papeis: ['proteina'], porcao: 120, min: 80, max: 250, medida: { g: 100, nome: '1 medalhão' } }),
  a({ id: 'lombo', nome: 'Lombo de porco assado', taco: 432, categoria: 'proteina', papeis: ['proteina'], porcao: 120, min: 80, max: 250, medida: { g: 40, nome: '1 fatia' } }),
  a({ id: 'merluza', nome: 'Filé de merluza assado', taco: 301, categoria: 'proteina', papeis: ['proteina'], porcao: 150, min: 100, max: 300, medida: { g: 120, nome: '1 filé' } }),
  a({ id: 'pescada', nome: 'Filé de pescada', taco: 308, categoria: 'proteina', papeis: ['proteina'], porcao: 150, min: 100, max: 300, medida: { g: 120, nome: '1 filé' } }),
  a({ id: 'salmao', nome: 'Salmão grelhado', taco: 317, categoria: 'proteina', papeis: ['proteina'], porcao: 120, min: 80, max: 220, medida: { g: 120, nome: '1 posta' } }),
  a({ id: 'sardinha', nome: 'Sardinha assada', taco: 318, categoria: 'proteina', papeis: ['proteina'], porcao: 100, min: 60, max: 220, medida: { g: 35, nome: '1 sardinha' } }),
  a({ id: 'atum', nome: 'Atum em conserva', taco: 277, categoria: 'proteina', papeis: ['proteina'], porcao: 80, min: 60, max: 170, medida: { g: 120, nome: '1 lata drenada' } }),
  a({ id: 'camarao', nome: 'Camarão cozido', taco: 284, categoria: 'proteina', papeis: ['proteina'], porcao: 120, min: 80, max: 250, medida: { g: 10, nome: '1 camarão grande' } }),
  a({ id: 'peru', nome: 'Peru assado', taco: 425, categoria: 'proteina', papeis: ['proteina'], porcao: 120, min: 80, max: 250, medida: { g: 30, nome: '1 fatia' } }),
  a({ id: 'ovo', nome: 'Ovo cozido', taco: 488, categoria: 'proteina', papeis: ['proteina', 'proteinaCafe'], porcao: 100, min: 50, max: 200, unidade: { g: 50, nome: 'ovo', plural: 'ovos' } }),
  a({ id: 'ovo-frito', nome: 'Ovo frito', taco: 490, categoria: 'proteina', papeis: [], porcao: 50, min: 50, max: 150, unidade: { g: 50, nome: 'ovo', plural: 'ovos' } }),
  a({ id: 'presunto', nome: 'Presunto magro', taco: 439, categoria: 'proteina', papeis: ['proteinaCafe'], porcao: 30, min: 15, max: 90, medida: { g: 15, nome: '1 fatia' } }),

  // Laticínios
  a({ id: 'queijo-minas', nome: 'Queijo minas frescal', taco: 461, categoria: 'laticinio', papeis: ['proteinaCafe', 'laticinio'], porcao: 30, min: 20, max: 90, medida: { g: 30, nome: '1 fatia média' } }),
  a({ id: 'ricota', nome: 'Ricota', taco: 469, categoria: 'laticinio', papeis: ['proteinaCafe', 'laticinio'], porcao: 40, min: 20, max: 120, medida: { g: 30, nome: '1 fatia' } }),
  a({ id: 'mozarela', nome: 'Queijo muçarela', taco: 463, categoria: 'laticinio', papeis: ['proteinaCafe'], porcao: 30, min: 15, max: 75, medida: { g: 15, nome: '1 fatia' } }),
  a({ id: 'queijo-prato', nome: 'Queijo prato', taco: 467, categoria: 'laticinio', papeis: ['proteinaCafe'], porcao: 30, min: 15, max: 75, medida: { g: 15, nome: '1 fatia' } }),
  a({ id: 'queijo-meia-cura', nome: 'Queijo minas meia cura', taco: 462, categoria: 'laticinio', papeis: ['proteinaCafe'], porcao: 30, min: 15, max: 90, medida: { g: 30, nome: '1 fatia média' } }),
  a({ id: 'parmesao', nome: 'Queijo parmesão ralado', taco: 464, categoria: 'laticinio', papeis: [], porcao: 10, min: 5, max: 30, medida: { g: 5, nome: '1 colher de sopa' } }),
  a({ id: 'leite-integral', nome: 'Leite integral', rotulo: { kcal: 58, proteina: 3.0, gordura: 3.0, carboidrato: 4.6 }, categoria: 'laticinio', papeis: ['bebida', 'laticinio'], porcao: 200, min: 100, max: 300, unidade: { g: 200, nome: 'copo (200 ml)', plural: 'copos (200 ml)' } }),
  a({ id: 'leite-desnatado', nome: 'Leite desnatado', rotulo: { kcal: 35, proteina: 3.1, gordura: 0, carboidrato: 4.9 }, categoria: 'laticinio', papeis: ['bebida', 'laticinio'], porcao: 200, min: 100, max: 300, unidade: { g: 200, nome: 'copo (200 ml)', plural: 'copos (200 ml)' } }),
  a({ id: 'cafe-com-leite', nome: 'Café com leite (meio a meio)', rotulo: { kcal: 34, proteina: 1.9, gordura: 1.6, carboidrato: 3.1 }, categoria: 'laticinio', papeis: ['bebida'], porcao: 200, min: 200, max: 200, unidade: { g: 200, nome: 'xícara grande (200 ml)', plural: 'xícaras grandes (200 ml)' } }),
  a({ id: 'iogurte', nome: 'Iogurte natural', taco: 448, categoria: 'laticinio', papeis: ['laticinio'], porcao: 170, min: 100, max: 340, medida: { g: 170, nome: '1 pote' } }),
  a({ id: 'iogurte-desnatado', nome: 'Iogurte natural desnatado', taco: 449, categoria: 'laticinio', papeis: ['laticinio'], porcao: 170, min: 100, max: 340, medida: { g: 170, nome: '1 pote' } }),
  a({ id: 'leite-po', nome: 'Leite desnatado em pó', taco: 456, categoria: 'laticinio', papeis: ['laticinio'], porcao: 20, min: 10, max: 40, medida: { g: 20, nome: '2 colheres de sopa (1 copo)' } }),
  a({ id: 'requeijao', nome: 'Requeijão cremoso', taco: 468, categoria: 'laticinio', papeis: [], porcao: 15, min: 10, max: 45, medida: { g: 15, nome: '1 colher de sopa' } }),

  // Carboidratos
  a({ id: 'arroz', nome: 'Arroz branco', taco: 3, categoria: 'carboidrato', papeis: ['carbo'], porcao: 100, min: 50, max: 250, medida: { g: 25, nome: '1 colher de sopa' } }),
  a({ id: 'arroz-integral', nome: 'Arroz integral', taco: 1, categoria: 'carboidrato', papeis: ['carbo'], porcao: 100, min: 50, max: 250, medida: { g: 25, nome: '1 colher de sopa' } }),
  a({ id: 'batata', nome: 'Batata inglesa cozida', taco: 91, categoria: 'carboidrato', papeis: ['carbo'], porcao: 150, min: 80, max: 400, medida: { g: 70, nome: '1 batata média' } }),
  a({ id: 'batata-doce', nome: 'Batata-doce cozida', taco: 88, categoria: 'carboidrato', papeis: ['carbo', 'carboCafe'], porcao: 120, min: 60, max: 350, medida: { g: 40, nome: '1 fatia média' } }),
  a({ id: 'mandioca', nome: 'Mandioca cozida', taco: 129, categoria: 'carboidrato', papeis: ['carbo'], porcao: 100, min: 50, max: 250, medida: { g: 50, nome: '1 pedaço médio' } }),
  a({ id: 'batata-baroa', nome: 'Mandioquinha cozida', taco: 86, categoria: 'carboidrato', papeis: ['carbo'], porcao: 120, min: 60, max: 350, medida: { g: 60, nome: '1 unidade média' } }),
  a({ id: 'macarrao', nome: 'Macarrão (peso cru)', taco: 40, categoria: 'carboidrato', papeis: ['carbo'], porcao: 50, min: 30, max: 120, medida: { g: 80, nome: '1 prato (cru)' } }),
  a({ id: 'cuscuz', nome: 'Cuscuz de milho', taco: 533, categoria: 'carboidrato', papeis: ['carbo', 'carboCafe'], porcao: 120, min: 60, max: 300, medida: { g: 60, nome: '1 fatia' } }),
  a({ id: 'milho', nome: 'Milho verde', taco: 45, categoria: 'carboidrato', papeis: [], porcao: 50, min: 20, max: 150, medida: { g: 20, nome: '1 colher de sopa' } }),
  a({ id: 'pao-frances', nome: 'Pão francês', taco: 53, categoria: 'carboidrato', papeis: ['carboCafe'], porcao: 50, min: 25, max: 100, unidade: { g: 50, nome: 'pão', plural: 'pães' } }),
  a({ id: 'pao-integral', nome: 'Pão de forma integral', taco: 52, categoria: 'carboidrato', papeis: ['carboCafe'], porcao: 50, min: 25, max: 100, unidade: { g: 25, nome: 'fatia', plural: 'fatias' } }),
  a({ id: 'aveia', nome: 'Aveia em flocos', taco: 7, categoria: 'carboidrato', papeis: ['carboCafe'], porcao: 30, min: 15, max: 60, medida: { g: 15, nome: '1 colher de sopa' } }),
  a({ id: 'torrada', nome: 'Torrada', taco: 63, categoria: 'carboidrato', papeis: [], porcao: 20, min: 10, max: 60, medida: { g: 10, nome: '1 torrada' } }),
  a({ id: 'cream-cracker', nome: 'Biscoito cream cracker', taco: 13, categoria: 'carboidrato', papeis: [], porcao: 20, min: 6, max: 60, medida: { g: 6, nome: '1 biscoito' } }),

  // Leguminosas
  a({ id: 'feijao-carioca', nome: 'Feijão carioca', taco: 561, categoria: 'carboidrato', papeis: ['leguminosa'], porcao: 90, min: 60, max: 200, medida: { g: 90, nome: '1 concha' } }),
  a({ id: 'feijao-preto', nome: 'Feijão preto', taco: 567, categoria: 'carboidrato', papeis: ['leguminosa'], porcao: 90, min: 60, max: 200, medida: { g: 90, nome: '1 concha' } }),
  a({ id: 'lentilha', nome: 'Lentilha', taco: 577, categoria: 'carboidrato', papeis: ['leguminosa'], porcao: 90, min: 60, max: 200, medida: { g: 90, nome: '1 concha' } }),
  a({ id: 'feijao-fradinho', nome: 'Feijão fradinho', taco: 563, categoria: 'carboidrato', papeis: ['leguminosa'], porcao: 90, min: 60, max: 200, medida: { g: 90, nome: '1 concha' } }),
  a({ id: 'ervilha', nome: 'Ervilha', taco: 560, categoria: 'carboidrato', papeis: ['leguminosa'], porcao: 60, min: 30, max: 150, medida: { g: 20, nome: '1 colher de sopa' } }),

  // Frutas
  a({ id: 'banana-prata', nome: 'Banana prata', taco: 182, categoria: 'fruta', papeis: ['fruta'], porcao: 70, min: 70, max: 140, unidade: { g: 70, nome: 'banana', plural: 'bananas' } }),
  a({ id: 'banana-nanica', nome: 'Banana nanica', taco: 179, categoria: 'fruta', papeis: ['fruta'], porcao: 90, min: 90, max: 180, unidade: { g: 90, nome: 'banana', plural: 'bananas' } }),
  a({ id: 'maca', nome: 'Maçã', taco: 222, categoria: 'fruta', papeis: ['fruta'], porcao: 130, min: 130, max: 260, unidade: { g: 130, nome: 'maçã', plural: 'maçãs' } }),
  a({ id: 'pera', nome: 'Pera', taco: 243, categoria: 'fruta', papeis: ['fruta'], porcao: 130, min: 130, max: 260, unidade: { g: 130, nome: 'pera', plural: 'peras' } }),
  a({ id: 'mamao', nome: 'Mamão papaia', taco: 226, categoria: 'fruta', papeis: ['fruta'], porcao: 150, min: 100, max: 300, medida: { g: 150, nome: '½ mamão' } }),
  a({ id: 'mamao-formosa', nome: 'Mamão formosa', taco: 225, categoria: 'fruta', papeis: ['fruta'], porcao: 150, min: 100, max: 300, medida: { g: 150, nome: '1 fatia' } }),
  a({ id: 'laranja', nome: 'Laranja pera', taco: 214, categoria: 'fruta', papeis: ['fruta'], porcao: 140, min: 140, max: 280, unidade: { g: 140, nome: 'laranja', plural: 'laranjas' } }),
  a({ id: 'morango', nome: 'Morango', taco: 239, categoria: 'fruta', papeis: ['fruta'], porcao: 150, min: 100, max: 300, medida: { g: 12, nome: '1 morango' } }),
  a({ id: 'melancia', nome: 'Melancia', taco: 235, categoria: 'fruta', papeis: ['fruta'], porcao: 200, min: 150, max: 400, medida: { g: 200, nome: '1 fatia' } }),
  a({ id: 'melao', nome: 'Melão', taco: 236, categoria: 'fruta', papeis: ['fruta'], porcao: 200, min: 150, max: 400, medida: { g: 100, nome: '1 fatia' } }),
  a({ id: 'abacaxi', nome: 'Abacaxi', taco: 164, categoria: 'fruta', papeis: ['fruta'], porcao: 150, min: 75, max: 300, medida: { g: 75, nome: '1 fatia' } }),
  a({ id: 'manga', nome: 'Manga', taco: 229, categoria: 'fruta', papeis: ['fruta'], porcao: 150, min: 100, max: 300, medida: { g: 150, nome: '½ manga' } }),
  a({ id: 'uva', nome: 'Uva', taco: 256, categoria: 'fruta', papeis: ['fruta'], porcao: 100, min: 80, max: 200, medida: { g: 8, nome: '1 uva' } }),
  a({ id: 'kiwi', nome: 'Kiwi', taco: 207, categoria: 'fruta', papeis: ['fruta'], porcao: 75, min: 75, max: 225, unidade: { g: 75, nome: 'kiwi', plural: 'kiwis' } }),

  // Salada e legumes (à vontade no plano)
  a({ id: 'alface', nome: 'Alface', taco: 78, categoria: 'salada', papeis: ['salada'], porcao: 40, min: 10, max: 200, medida: { g: 10, nome: '1 folha' } }),
  a({ id: 'tomate', nome: 'Tomate', taco: 157, categoria: 'salada', papeis: ['salada'], porcao: 80, min: 20, max: 300, unidade: { g: 80, nome: 'tomate', plural: 'tomates' } }),
  a({ id: 'pepino', nome: 'Pepino', taco: 142, categoria: 'salada', papeis: ['salada'], porcao: 60, min: 20, max: 300, medida: { g: 30, nome: '5 rodelas' } }),
  a({ id: 'cenoura', nome: 'Cenoura crua', taco: 110, categoria: 'salada', papeis: ['salada'], porcao: 50, min: 10, max: 200, medida: { g: 12, nome: '1 colher de sopa ralada' } }),
  a({ id: 'brocolis', nome: 'Brócolis cozido', taco: 100, categoria: 'salada', papeis: ['salada'], porcao: 80, min: 20, max: 300, medida: { g: 20, nome: '1 ramo' } }),
  a({ id: 'couve-flor', nome: 'Couve-flor cozida', taco: 118, categoria: 'salada', papeis: ['salada'], porcao: 80, min: 20, max: 300, medida: { g: 20, nome: '1 ramo' } }),
  a({ id: 'abobrinha', nome: 'Abobrinha cozida', taco: 70, categoria: 'salada', papeis: ['salada'], porcao: 80, min: 20, max: 300, medida: { g: 30, nome: '1 colher de servir' } }),
  a({ id: 'couve', nome: 'Couve crua', taco: 115, categoria: 'salada', papeis: ['salada'], porcao: 40, min: 10, max: 200, medida: { g: 20, nome: '1 folha' } }),
  a({ id: 'repolho', nome: 'Repolho', taco: 149, categoria: 'salada', papeis: ['salada'], porcao: 50, min: 10, max: 200, medida: { g: 10, nome: '1 colher de sopa' } }),
  a({ id: 'beterraba', nome: 'Beterraba cozida', taco: 97, categoria: 'salada', papeis: ['salada'], porcao: 50, min: 10, max: 200, medida: { g: 15, nome: '1 colher de sopa' } }),
  a({ id: 'chuchu', nome: 'Chuchu cozido', taco: 112, categoria: 'salada', papeis: ['salada'], porcao: 80, min: 20, max: 300, medida: { g: 30, nome: '1 colher de servir' } }),
  a({ id: 'vagem', nome: 'Vagem', taco: 162, categoria: 'salada', papeis: ['salada'], porcao: 60, min: 20, max: 300, medida: { g: 20, nome: '1 colher de sopa' } }),
  a({ id: 'rucula', nome: 'Rúcula', taco: 152, categoria: 'salada', papeis: ['salada'], porcao: 30, min: 10, max: 150, medida: { g: 10, nome: '1 punhado' } }),
  a({ id: 'berinjela', nome: 'Berinjela cozida', taco: 95, categoria: 'salada', papeis: ['salada'], porcao: 80, min: 20, max: 300, medida: { g: 30, nome: '1 colher de servir' } }),
  a({ id: 'abobora', nome: 'Abóbora cabotiá cozida', taco: 64, categoria: 'salada', papeis: ['salada'], porcao: 80, min: 20, max: 300, medida: { g: 40, nome: '1 pedaço' } }),

  // Gorduras
  a({ id: 'azeite', nome: 'Azeite de oliva', taco: 260, categoria: 'gordura', papeis: ['gordura'], porcao: 8, min: 4, max: 16, medida: { g: 8, nome: '1 colher de sopa' } }),
  a({ id: 'manteiga', nome: 'Manteiga', taco: 261, categoria: 'gordura', papeis: [], porcao: 5, min: 5, max: 20, medida: { g: 5, nome: '1 colher de chá' } }),
  a({ id: 'castanha-para', nome: 'Castanha-do-pará', taco: 589, categoria: 'gordura', papeis: [], porcao: 10, min: 4, max: 30, medida: { g: 4, nome: '1 castanha' } }),
  a({ id: 'castanha-caju', nome: 'Castanha de caju', taco: 588, categoria: 'gordura', papeis: [], porcao: 15, min: 3, max: 40, medida: { g: 3, nome: '1 castanha' } }),
  a({ id: 'amendoim', nome: 'Amendoim torrado', taco: 558, categoria: 'gordura', papeis: [], porcao: 20, min: 10, max: 50, medida: { g: 10, nome: '1 colher de sopa' } }),
  a({ id: 'abacate', nome: 'Abacate', taco: 163, categoria: 'gordura', papeis: [], porcao: 60, min: 30, max: 200, medida: { g: 45, nome: '1 colher de sopa cheia' } }),
  a({ id: 'linhaca', nome: 'Linhaça', taco: 594, categoria: 'gordura', papeis: [], porcao: 10, min: 5, max: 30, medida: { g: 10, nome: '1 colher de sopa' } }),

  // Outros
  a({ id: 'mel', nome: 'Mel', taco: 507, categoria: 'outros', papeis: [], porcao: 10, min: 5, max: 40, medida: { g: 10, nome: '1 colher de sobremesa' } }),
  a({ id: 'cafe', nome: 'Café sem açúcar', taco: 471, categoria: 'outros', papeis: ['bebida'], porcao: 100, min: 50, max: 400, medida: { g: 50, nome: '1 xícara' } }),

  // Docinhos (um por dia no plano; porção fixa)
  a({ id: 'trento', nome: 'Trento', rotulo: { kcal: 528, proteina: 6.6, gordura: 29.4, carboidrato: 59 }, categoria: 'doce', papeis: ['doce'], porcao: 32, min: 32, max: 32, unidade: { g: 32, nome: 'unidade', plural: 'unidades' } }),
  a({ id: 'nutella-bready', nome: 'Nutella B-ready', rotulo: { kcal: 518, proteina: 8.2, gordura: 26.8, carboidrato: 59 }, categoria: 'doce', papeis: ['doce'], porcao: 22, min: 22, max: 22, unidade: { g: 22, nome: 'unidade', plural: 'unidades' } }),
  a({ id: 'bolo-pote', nome: 'Bolo de pote (porção pequena)', rotulo: { kcal: 300, proteina: 4.5, gordura: 13, carboidrato: 42 }, categoria: 'doce', papeis: ['doce'], porcao: 60, min: 60, max: 60, medida: { g: 60, nome: '⅓ de pote' } }),
  a({ id: 'brigadeiro', nome: 'Brigadeiro', rotulo: { kcal: 375, proteina: 3.5, gordura: 14, carboidrato: 60 }, categoria: 'doce', papeis: ['doce'], porcao: 20, min: 20, max: 20, unidade: { g: 20, nome: 'brigadeiro', plural: 'brigadeiros' } }),
  a({ id: 'bis', nome: 'Bis', rotulo: { kcal: 525, proteina: 6, gordura: 27, carboidrato: 64 }, categoria: 'doce', papeis: ['doce'], porcao: 13, min: 13, max: 13, medida: { g: 13, nome: '2 unidades' } }),
  a({ id: 'chocolate-leite', nome: 'Chocolate ao leite', taco: 495, categoria: 'doce', papeis: ['doce'], porcao: 25, min: 25, max: 25, medida: { g: 25, nome: '4 quadradinhos' } }),
  a({ id: 'chocolate-amargo', nome: 'Chocolate meio amargo', taco: 498, categoria: 'doce', papeis: ['doce'], porcao: 25, min: 25, max: 25, medida: { g: 25, nome: '4 quadradinhos' } }),
  a({ id: 'pacoca', nome: 'Paçoca', taco: 579, categoria: 'doce', papeis: ['doce'], porcao: 20, min: 20, max: 20, unidade: { g: 20, nome: 'paçoca', plural: 'paçocas' } }),
  a({ id: 'pe-de-moleque', nome: 'Pé-de-moleque', taco: 580, categoria: 'doce', papeis: ['doce'], porcao: 25, min: 25, max: 25, unidade: { g: 25, nome: 'unidade', plural: 'unidades' } }),
  a({ id: 'doce-de-leite', nome: 'Doce de leite', taco: 501, categoria: 'doce', papeis: ['doce'], porcao: 20, min: 20, max: 20, medida: { g: 20, nome: '1 colher de sopa' } }),
];

export const ALIMENTO_POR_ID = new Map(ALIMENTOS.map((x) => [x.id, x]));
