# Monju Pessoal — Especificação da Fase 2 (Dieta, Diário e Água)

Data: 2026-09-27
Status: aguardando revisão
Base: Fase 1 (`2026-09-27-monju-pessoal-fase1-design.md`), já publicada.

## 1. Objetivo

Acrescentar ao app, sem API paga e 100% no aparelho:

1. **Plano alimentar da semana** gerado por regras, com lista de compras.
2. **Diário alimentar** (o que comeu), independente do plano.
3. **Água**: meta diária e registro por garrafas.
4. **Início reorganizado** com calorias do dia, água e peso em destaque.

Fora do escopo: receitas, fotos de comida, leitura de código de barras, micronutrientes,
restrições (sem lactose, vegetariano etc. — cobertas por "alimentos que não como"),
atalho "comi o planejado" (diário e plano são totalmente separados, por decisão do usuário).

## 2. Navegação

Barra inferior com 5 abas: **Início · Aplicações · Peso · Dieta · Perfil**.
A aba Dieta tem um seletor segmentado no topo: **Plano · Diário · Água**.

## 3. Telas

### 3.1 Início (reorganizado)

Ordem dos blocos:

1. Saudação + semanas de tratamento (como na Fase 1).
2. **Calorias de hoje** (alimentado pelo Diário): consumido / meta (kcal) com barra; proteína
   consumida / meta (g) com barra; botão "+ Comida" (abre o formulário do Diário).
3. **Água**: progresso de hoje (ml / meta), botões **+500 ml · +1,5 L · +2 L** e tabela
   compacta dos **últimos 7 dias** (dia, total, ✓ quando bateu a meta).
4. **Peso**: cartão da Fase 1 (peso atual, perda, progresso, meta) com botão
   **"Atualizar peso"** em destaque.
5. Cartão da próxima dose (compacto) e alertas de meta/prazo da Fase 1.

### 3.2 Preferências (mini-entrevista)

Mostrada na primeira vez que a aba Dieta é aberta; editável depois pelo Perfil e pelo botão
"Preferências" na aba Dieta.

1. **Refeições por dia**: 3, 4, 5 ou 6.
2. **Alimentos que não como**: lista enxuta por categoria; tocar marca ✕.
3. **Favoritos**: mesma lista; tocar marca ★ (um item não pode ser ✕ e ★ ao mesmo tempo).

### 3.3 Plano da semana

- Cabeçalho com **metas do dia**: calorias, proteína (g), água (L).
- Abas **seg … dom** da semana atual (segunda a domingo).
- Cada dia lista as refeições (nome, horário sugerido, kcal e proteína da refeição) e seus
  itens: alimento, gramas e medida caseira (ex.: "120 g · 1 filé médio").
- Botão **"trocar"** em cada item: substitui por outro alimento permitido do mesmo grupo,
  recalculando as gramas para manter as calorias e a proteína do item.
- Botão **"Gerar nova semana"** (com confirmação) refaz os 7 dias.
- O plano é gerado automaticamente na primeira abertura após as preferências e ao começar
  uma nova semana sem plano; mudar as preferências oferece "Gerar de novo com as novas
  preferências?".
- **Lista de compras**: soma os itens dos 7 dias por alimento (gramas totais convertidas para
  unidade amigável quando existir, ex.: "~1,2 kg" ou "12 ovos"), agrupada por categoria, com
  checkbox que persiste. Itens "à vontade" (salada) aparecem sem quantidade.

### 3.4 Diário

- Seletor de dia com setas ‹ › (padrão: hoje; sem dias futuros).
- Resumo do dia: kcal e proteína consumidas × metas (barras).
- Categorias: **Proteína · Carboidrato · Salada/Legumes · Frutas · Laticínios · Gorduras ·
  Outros**. Tocar na categoria abre a lista enxuta daquela categoria + campo de busca na TACO
  completa.
- Ao escolher o alimento: campo **gramas** (com sugestão da porção padrão e da medida caseira);
  mostra kcal e proteína calculadas ao vivo; salvar.
- Lista de registros do dia agrupada por categoria; tocar para editar gramas ou excluir.

### 3.5 Água

- Meta do dia e copo/garrafa animado que enche conforme o total.
- Botões **+500 ml · +1,5 L · +2 L** e **"Desfazer último"**.
- Lista dos registros de hoje (hora, quantidade) com excluir.
- Tabela dos últimos 7 dias.
- Meta ajustável manualmente (campo no topo, com "Voltar ao cálculo automático").

## 4. Cálculos (módulo puro `src/lib/nutricao.ts`, com testes)

### 4.1 Gasto energético

- **Mifflin-St Jeor** (kcal/dia), com idade atual, altura (cm) e peso atual (kg):
  - Homens: `10·peso + 6,25·altura − 5·idade + 5`
  - Mulheres: `10·peso + 6,25·altura − 5·idade − 161`
- **Gasto total** = TMB × fator de atividade: sedentário 1,2 · leve 1,375 · moderado 1,55 ·
  intenso 1,725. (Fatores padrão de uso com a equação; sem artigo específico levantado.)

### 4.2 Meta de calorias

- Déficit (diretriz AHA/ACC/TOS [14]): **500 kcal/dia** por padrão; **750 kcal/dia** quando o
  ritmo necessário para a meta/prazo (Fase 1, 4.2, com as semanas restantes) for
  > 0,5 kg/semana.
- `meta = gasto total − déficit + ajuste de recalibração`, arredondada para 10 kcal.
- **Piso**: 1.200 kcal (F) / 1.500 kcal (M) [14]. A meta nunca fica abaixo do piso; quando o
  piso é aplicado, a tela mostra "meta limitada ao mínimo seguro".
- Recalculada a cada novo registro de peso ou mudança de perfil.

### 4.3 Recalibração semanal

Regra simplificada, motivada pela adaptação do gasto energético durante a perda de peso [8]:

- Só roda com ≥ 2 semanas de registros de peso desde a última recalibração e no máximo uma vez
  a cada 7 dias.
- `perda real/semana` = regressão linear simples dos pesos das últimas 2 semanas.
- `perda esperada/semana` = déficit × 7 ÷ 7.700 (aproximação usada só para comparar).
- Real < 50% do esperado → ajuste −100 kcal. Real > 1,0 kg/semana → ajuste +100 kcal.
- Ajuste acumulado limitado a ±300 kcal; a meta final continua respeitando o piso.
- A tela do Plano mostra a última recalibração ("Ajustamos sua meta em −100 kcal em 04/10").

### 4.4 Proteína e demais nutrientes

- **Peso de referência** = min(peso atual, 25 × altura²) (peso no IMC 25).
- **Proteína** = 1,4 g × peso de referência (meio da faixa 1,2–1,6 g/kg [11]), arredondada.
- **Gordura** = 27% das calorias ÷ 9 (g). **Carboidrato** = restante ÷ 4 (g).

### 4.5 Água

- `meta = 35 ml × peso atual`, arredondada para múltiplos de 50 ml (escolha do usuário; regra
  popular sem fonte científica sólida encontrada). "Sobre os cálculos" mostra, para comparação,
  a ingestão adequada da EFSA: 2,0 L (mulheres) / 2,5 L (homens) de água total, incluindo a
  dos alimentos [15].
- Meta manual, se definida, substitui o cálculo.

### 4.6 Diário

`kcal = kcal_100g × gramas ÷ 100`; idem proteína, gordura e carboidrato. O registro guarda os
valores calculados no momento (mudanças futuras na tabela não alteram o histórico).

## 5. Gerador do plano (módulo puro `src/lib/plano.ts`, com testes)

Determinístico dado uma semente (a semente muda em "Gerar nova semana").

### 5.1 Distribuição por refeição (% das calorias e da proteína do dia)

| Refeições | Distribuição |
|---|---|
| 3 | Café 30 · Almoço 40 · Jantar 30 |
| 4 | Café 25 · Almoço 35 · Lanche 10 · Jantar 30 |
| 5 | Café 20 · Lanche 10 · Almoço 35 · Lanche 10 · Jantar 25 |
| 6 | Café 20 · Lanche 10 · Almoço 30 · Lanche 10 · Jantar 20 · Ceia 10 |

### 5.2 Moldes

| Refeição | Itens |
|---|---|
| Café da manhã | 1 proteína de café **ou** laticínio + 1 carboidrato de café + 1 fruta |
| Almoço | 1 proteína + 1 carboidrato + 1 leguminosa + salada à vontade + 1 gordura (azeite) |
| Jantar | 1 proteína + 1 carboidrato + salada à vontade + 1 gordura (azeite) |
| Lanche | 1 fruta + 1 laticínio |
| Ceia | 1 laticínio |

Cada alimento da lista enxuta tem papéis permitidos (ex.: ovo = proteína de café e de almoço;
pão integral = carboidrato de café).

### 5.3 Escolha e porções

1. Remove alimentos marcados ✕. Se um papel ficar sem opções, o item é omitido e a refeição
   mostra um aviso ("sem opções de proteína — revise suas preferências").
2. Sorteio ponderado: favoritos têm peso 3, demais peso 1; evita o mesmo alimento no mesmo
   papel em dias consecutivos quando houver alternativa.
3. Porções, nesta ordem:
   - itens de porção fixa (fruta, laticínio, leguminosa, azeite, salada) usam a porção padrão;
   - a **proteína** é dimensionada para cobrir a proteína que falta na refeição;
   - o **carboidrato** completa as calorias que faltam na refeição;
   - arredondamento a múltiplos de 10 g (ovos e unidades: unidades inteiras) e limites
     mínimo/máximo por alimento (ex.: arroz 50–250 g).
4. "Trocar" usa o mesmo sorteio (excluindo o item atual) e recalcula a porção pelo mesmo papel.

## 6. Base de alimentos

- **TACO 4ª edição (NEPA/Unicamp, 2011)**: 597 alimentos com kcal, proteína, lipídios,
  carboidratos e fibra por 100 g, obtidos da versão em CSV do projeto `taco-api` (licença MIT)
  e convertidos em `src/data/taco.json` por um script (`scripts/gerar-taco.mjs`) versionado.
- **Lista enxuta** (`src/data/alimentos.ts`), ~80 itens: nome amigável, id TACO, categoria do
  diário, papéis no plano, porção padrão, limites e medida caseira (ex.: "1 colher de sopa =
  25 g"). Itens preparados usam a versão cozida da TACO.
- Busca no diário: sem diferenciar acentos e maiúsculas, sobre o nome TACO e o nome amigável.

## 7. Dados (IndexedDB, versão 2 do banco)

```ts
interface Preferencias {        // tabela "preferencias", id = 1
  id: 1;
  refeicoesPorDia: 3 | 4 | 5 | 6;
  naoCome: string[];            // ids da lista enxuta
  favoritos: string[];
  metaAguaManualMl?: number;
  ajusteKcal: number;           // recalibração acumulada (−300..300)
  ultimaRecalibracao?: string;  // ISO
}

interface PlanoSemana {         // tabela "planos", chave = segunda-feira ISO
  inicio: string;
  semente: number;
  geradoEm: string;
  dias: { refeicoes: { nome: string; itens: { alimentoId: string; gramas: number; aVontade?: boolean }[] }[] }[];
  comprados: string[];          // alimentoIds marcados na lista de compras
}

interface RegistroDiario {      // tabela "diario"
  id?: number;
  data: string;
  categoria: CategoriaDiario;
  alimentoId: string;           // id da lista enxuta ou "taco:<id>"
  nome: string;
  gramas: number;
  kcal: number; proteina: number; gordura: number; carboidrato: number;
}

interface RegistroAgua {        // tabela "agua"
  id?: number;
  data: string;
  hora: string;                 // HH:mm
  ml: number;
}
```

- **Backup versão 2** inclui as novas tabelas; a importação continua aceitando a versão 1
  (tabelas novas ficam vazias).
- "Apagar todos os dados" também limpa as novas tabelas.

## 8. Validações

| Campo | Regra |
|---|---|
| Gramas (diário) | 1–2.000 g, inteiro |
| Meta manual de água | 500–6.000 ml |
| Refeições por dia | 3 a 6 |
| Data do diário | não pode estar no futuro |

## 9. Erros e testes

- Mesmo tratamento da Fase 1 (aviso "Não foi possível salvar", sem perder o que foi digitado).
- **Testes automatizados**: Mifflin-St Jeor (exemplos conferidos à mão), déficit e piso,
  recalibração (casos abaixo/acima/limites), proteína e peso de referência, água, soma do
  diário, gerador do plano (determinismo por semente, respeita ✕, favoritos mais frequentes,
  metas diárias dentro de ±10% de calorias e ≥ 90% da proteína quando houver opções, sem dias
  seguidos repetidos quando possível), lista de compras (somas), backup v1→v2.
- **Teste de ponta a ponta** no navegador com tamanho de iPhone: preferências, plano, trocar
  item, lista de compras, diário, água, Início.

## 10. "Sobre os cálculos" (acréscimos)

Seções novas: gasto energético e fatores de atividade, meta de calorias e piso, recalibração,
proteína e peso de referência, água (35 ml/kg e referência EFSA), plano e TACO.
Referências novas:

14. Jensen, M. D., et al. (2014). 2013 AHA/ACC/TOS Guideline for the Management of Overweight and Obesity in Adults. *Circulation*, 129(25 Suppl 2). https://doi.org/10.1161/01.cir.0000437739.71477.ee (possui correção publicada: https://doi.org/10.1161/cir.0000000000000070)
15. EFSA Panel on Dietetic Products, Nutrition and Allergies (2010). Scientific Opinion on Dietary Reference Values for water. *EFSA Journal*, 8(3), 1459. https://doi.org/10.2903/j.efsa.2010.1459
16. NEPA/UNICAMP (2011). Tabela Brasileira de Composição de Alimentos (TACO), 4ª edição revisada e ampliada.

Os números [8] e [11] referem-se às referências da especificação da Fase 1.
