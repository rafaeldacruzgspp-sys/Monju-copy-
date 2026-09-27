# Monju Pessoal — Especificação da Fase 1

Data: 2026-09-27
Status: aguardando revisão

## 1. Objetivo

App pessoal (uso próprio e da família) para acompanhar o tratamento com GLP-1
(Mounjaro, Ozempic etc.), no estilo do app Monju. A construção é dividida em duas fases:

- **Fase 1 (esta especificação):** entrevista inicial, registro de aplicações, peso/IMC/meta
  com prazo, lembrete de dose dentro do app, backup e tela "Sobre os cálculos".
- **Fase 2 (especificação futura):** montagem de dieta por motor de regras (sem API paga),
  usando a Tabela TACO e os métodos científicos listados na seção 8. A Fase 1 já coleta e
  guarda todos os dados de perfil que a Fase 2 vai usar.

Fora do escopo da Fase 1: local de aplicação/rodízio, controle de caneta, medidas corporais,
fotos, sintomas estruturados, notificações push, login/nuvem, dieta.

## 2. Decisões de plataforma

| Tema | Decisão |
|---|---|
| Plataforma | PWA (web app instalável via "Adicionar à Tela de Início") |
| Stack | React + Vite + TypeScript |
| Dados | Somente no aparelho (IndexedDB via Dexie). Sem servidor, sem login |
| Gráficos | Recharts |
| PWA/offline | vite-plugin-pwa (funciona sem internet após a primeira abertura) |
| Hospedagem | GitHub Pages, deploy automático via GitHub Actions a cada push na `main` |
| Lembretes | Somente dentro do app (sem notificação push) |
| Idioma | Português (Brasil); datas dd/mm/aaaa; números com vírgula decimal |
| Visual | Verde no estilo Monju; modo claro e escuro (segue o sistema) |

Cada pessoa da família instala no próprio celular; cada aparelho guarda um único perfil.

## 3. Telas e fluxo

### 3.1 Entrevista inicial

Mostrada apenas quando não existe perfil salvo. Uma pergunta por tela, botões grandes,
barra de progresso e botão "voltar".

1. Nome
2. Sexo (Feminino / Masculino) — necessário para a fórmula de gasto calórico da Fase 2
3. Idade (anos)
4. Altura (cm)
5. Peso quando começou o tratamento (kg)
6. Peso atual (kg)
7. Data de início do tratamento com GLP-1
8. Nível de atividade física: Sedentário / Leve / Moderado / Intenso (com uma frase
   explicando cada nível)
9. Meta de peso (kg) — mostra ao vivo:
   `Hoje: IMC 32,1 · Obesidade grau I → Meta: IMC 24,6 · Eutrofia`
10. Prazo para atingir a meta: 3, 4, 5, 6, 7, 8, 9, 10, 11 ou 12 semanas. Mostra:
    - ritmo necessário em kg/semana;
    - alerta de ritmo acima do seguro, com sugestões (ver 4.3);
    - cartão "O que os estudos mostram" (ver 4.4).

Ao concluir: o perfil é salvo e o peso atual vira o primeiro registro de peso, com a data de hoje.

### 3.2 Início (painel)

- Saudação com o nome.
- **Cartão próxima dose:** "Próxima dose em 3 dias (sex, 04/10)", "Dose hoje" ou, em
  vermelho, "Dose atrasada há 1 dia". Sem nenhuma aplicação registrada: "Registre sua
  primeira aplicação".
- **Cartão peso:** peso atual, total perdido desde o início, barra de progresso até a meta
  (%), IMC atual com classificação e prazo restante da meta.
- "X semanas de tratamento".
- Botões rápidos: **+ Aplicação** e **+ Peso**.
- Quando peso atual ≤ meta: "Meta atingida! 🎉" e botão "Definir nova meta".

### 3.3 Aplicações

- Lista em ordem cronológica decrescente: data, dose (mg), observação.
- Adicionar/editar: data (padrão hoje), dose em mg (pré-preenchida com a última usada)
  e observação livre (opcional).
- Excluir com confirmação.

### 3.4 Peso

- Gráfico de linha da evolução do peso, com linha horizontal da meta.
- Lista dos registros (data, kg, variação em relação ao registro anterior).
- Adicionar/editar (data e kg) e excluir com confirmação.

### 3.5 Perfil

- Editar todos os dados da entrevista, a meta e o prazo (redefinir a meta atualiza a data
  de definição da meta).
- Intervalo entre doses em dias (padrão 7).
- **Exportar backup:** baixa um arquivo `.json` com todos os dados.
- **Importar backup:** substitui todos os dados após confirmação.
- **Apagar todos os dados**, com confirmação dupla.
- Link para "Sobre os cálculos".

### 3.6 Sobre os cálculos

Tela estática explicando, em linguagem simples, cada fórmula usada (IMC, classificação,
ritmo, progresso) e o que os estudos mostram, com a lista de referências e os DOIs da
seção 8. Aviso fixo: "Este app não substitui acompanhamento médico e nutricional."

### 3.7 Navegação

Barra inferior com 4 abas: Início · Aplicações · Peso · Perfil.

## 4. Cálculos

Todos os cálculos ficam em funções puras, isoladas da interface, num módulo próprio
(`src/lib/calculos.ts`) e com testes automatizados.

### 4.1 IMC e classificação

`IMC = peso (kg) ÷ (altura (m))²`, exibido com 1 casa decimal.

Classificação da Organização Mundial da Saúde, também adotada pelo Ministério da Saúde:

| IMC (kg/m²) | Classificação |
|---|---|
| < 16,0 | Magreza grau III |
| 16,0 – 16,9 | Magreza grau II |
| 17,0 – 18,4 | Magreza grau I |
| 18,5 – 24,9 | Eutrofia (peso adequado) |
| 25,0 – 29,9 | Sobrepeso (pré-obesidade) |
| 30,0 – 34,9 | Obesidade grau I |
| 35,0 – 39,9 | Obesidade grau II |
| ≥ 40,0 | Obesidade grau III |

Os limites são aplicados sobre o valor não arredondado: faixa inferior inclusiva, faixa
superior exclusiva (ex.: 24,99 → Eutrofia; 25,0 → Sobrepeso).

### 4.2 Ritmo necessário

`ritmo = (peso atual − meta) ÷ semanas` (kg/semana).

### 4.3 Alerta de ritmo e sugestões

- Limite seguro: **1,0 kg/semana**. Esse limite vem de diretrizes clínicas usuais; nenhum
  artigo específico foi levantado para esse número (ver 8.4).
- Se `ritmo > 1,0`, o app mostra: "Esse prazo exige X kg por semana, acima do ritmo
  considerado seguro (até 1 kg/semana)." e sugere:
  - **Prazo seguro:** `ceil((atual − meta) ÷ 1,0)` semanas, somente se ≤ 12;
  - **Meta intermediária:** `atual − 1,0 × semanas` kg para o prazo escolhido.
- O usuário pode aplicar uma das sugestões ou manter a sua escolha (o alerta continua
  visível no painel enquanto o ritmo estiver acima do limite).

### 4.4 Cartão "O que os estudos mostram"

Texto informativo exibido na tela de prazo e na tela "Sobre os cálculos". Não é uma
previsão individual:

- Em ensaios clínicos, a tirzepatida (Mounjaro) 10–15 mg levou a uma perda média de cerca
  de 19% do peso a mais que o placebo, e a semaglutida (Ozempic/Wegovy) 2,4 mg a cerca de
  13%, em tratamentos longos (até 72 semanas) [2].
- A perda é maior com doses maiores [3].
- A perda é mais rápida no começo e desacelera até um platô, que no SURMOUNT-1 começou,
  em média, entre 24 e 36 semanas, conforme a faixa de IMC [4].

### 4.5 Progresso e perda

- `perdido = peso inicial − peso atual` (pode ser negativo se houve ganho).
- `progresso = (inicial − atual) ÷ (inicial − meta)`, limitado a 0–100%.
- Se `inicial ≤ meta`, o progresso é calculado a partir do peso atual na data em que a
  meta foi definida, e não do peso inicial.

### 4.6 Doses e tratamento

- `próxima dose = data da última aplicação + intervalo (dias)`.
- Estado: `dias = próxima dose − hoje`; `> 0` → "em N dias"; `= 0` → "Dose hoje";
  `< 0` → "Dose atrasada há N dias".
- `semanas de tratamento = floor((hoje − início) ÷ 7)`.
- Idade atual = idade informada + anos completos desde a data em que foi informada.

## 5. Dados (IndexedDB via Dexie)

```ts
type Sexo = 'F' | 'M';
type NivelAtividade = 'sedentario' | 'leve' | 'moderado' | 'intenso';

interface Perfil {            // tabela "perfil", registro único id = 1
  id: 1;
  nome: string;
  sexo: Sexo;
  idade: number;              // anos, na data idadeInformadaEm
  idadeInformadaEm: string;   // ISO yyyy-mm-dd
  alturaCm: number;
  pesoInicialKg: number;
  inicioTratamento: string;   // ISO yyyy-mm-dd
  nivelAtividade: NivelAtividade; // usado na Fase 2
  metaKg: number;
  prazoSemanas: number;       // 3..12
  metaDefinidaEm: string;     // ISO yyyy-mm-dd
  intervaloDoseDias: number;  // padrão 7
}

interface Aplicacao {         // tabela "aplicacoes"
  id?: number;
  data: string;               // ISO yyyy-mm-dd
  doseMg: number;
  observacao?: string;
}

interface RegistroPeso {      // tabela "pesos"
  id?: number;
  data: string;               // ISO yyyy-mm-dd
  kg: number;
}
```

- Peso atual = registro de peso com a data mais recente (em caso de empate, o de maior `id`).
- Formato do backup: `{ app: "monju-pessoal", versao: 1, exportadoEm, perfil, aplicacoes, pesos }`.
  A importação valida `app`, `versao` e os tipos antes de substituir qualquer dado.

## 6. Validações

| Campo | Regra |
|---|---|
| Nome | 1–40 caracteres |
| Idade | 18–100 anos |
| Altura | 100–250 cm |
| Pesos (inicial, atual, registros) | 30–300 kg, até 1 casa decimal |
| Meta | 30–300 kg e menor que o peso atual |
| Prazo | inteiro entre 3 e 12 |
| Dose | 0,1–100 mg |
| Datas | não podem estar no futuro; início do tratamento ≤ hoje |
| Intervalo de dose | 1–30 dias |

Mensagens de erro em português, exibidas junto ao campo; o botão "Continuar/Salvar" fica
desabilitado enquanto houver erro.

## 7. Tratamento de erros e testes

- Falha de leitura/escrita no IndexedDB: aviso "Não foi possível salvar. Tente novamente."
  sem perder o que foi digitado.
- Backup inválido: "Arquivo de backup inválido", sem alterar os dados atuais.
- Pedido de armazenamento persistente (`navigator.storage.persist()`) ao concluir a
  entrevista, para reduzir o risco de o navegador apagar os dados.
- **Testes automatizados (Vitest):** todas as funções de `calculos.ts` (limites das faixas
  de IMC, ritmo, sugestões, progresso, datas de dose) e a validação do backup.
- **Teste manual:** instalar no iPhone pelo link do GitHub Pages, completar a entrevista,
  registrar aplicação e peso, fechar e reabrir offline, exportar e importar o backup.

## 8. Base científica

### 8.1 Usada na Fase 1

Tela "O que os estudos mostram" e "Sobre os cálculos": referências [1]–[4].

### 8.2 Reservada para a Fase 2 (dieta)

- **Gasto energético de repouso:** equação de Mifflin-St Jeor, com recalibração pela perda
  real de peso [5][6][7].
- **Calorias ao longo do tempo:** modelo dinâmico de Hall, em versão simplificada, em vez
  da regra fixa de "7.700 kcal = 1 kg" [8].
- **Proteína:** 1,2–1,6 g/kg/dia, priorizada na montagem das refeições, pela maior perda de
  massa magra em usuários de GLP-1 [9][10][11].
- **Piso de calorias:** a dieta nunca propõe ingestão muito baixa, pelo risco de ingestão
  insuficiente no início do tratamento [13].
- **Consenso de referência:** Advisory conjunto de 2025 [12]. Tem errata publicada em 2026;
  a errata deve ser conferida antes de usar qualquer número dele.
- **Alimentos:** Tabela Brasileira de Composição de Alimentos (TACO/Unicamp).

### 8.3 Prévia da Fase 2: como a dieta é montada sem API

Motor de regras determinístico, 100% no aparelho:

1. **Gasto diário:** Mifflin-St Jeor × fator de atividade.
2. **Meta calórica:** gasto − déficit do prazo (limitado ao ritmo seguro), nunca abaixo do
   piso mínimo. Proteína definida primeiro (1,2–1,6 g/kg); o restante é dividido entre
   carboidrato e gordura.
3. **Base de alimentos:** Tabela TACO embutida (JSON), com cada alimento marcado com grupo
   (proteína, carboidrato, leguminosa, fruta, verdura, laticínio, gordura) e medida caseira.
4. **Preferências:** mini-entrevista (alimentos rejeitados, restrições, nº de refeições,
   favoritos); os alimentos rejeitados são removidos da base.
5. **Montagem:** moldes por refeição (ex.: almoço = proteína + carboidrato + leguminosa +
   verduras); calorias e proteína do dia distribuídas por refeição; alimentos escolhidos com
   rodízio para evitar repetição; porções ajustadas à meta e arredondadas para medidas caseiras.
6. **Trocar:** substitui um item por outro do mesmo grupo com calorias e proteína
   equivalentes (lista de substituições).
7. **Recalibração semanal:** compara a perda prevista com a real e ajusta as calorias,
   respeitando o piso.

### 8.4 Pendência

O limite de 1 kg/semana (4.3) vem de diretrizes clínicas usuais; uma fonte formal pode ser
levantada antes ou durante a Fase 2.

### 8.5 Referências

1. Jastreboff, A. M., et al. (2022). Tirzepatide once weekly for the treatment of obesity. *NEJM*, 387(3), 205–216. https://doi.org/10.1056/nejmoa2206038
2. Müllertz, A. L. O., et al. (2024). Potent incretin-based therapy for obesity: a systematic review and meta-analysis. *Obesity Reviews*, 25(5). https://doi.org/10.1111/obr.13717
3. Qin, W., et al. (2024). Efficacy and safety of once-weekly tirzepatide for weight management compared to placebo. *Endocrine*, 86(1), 70–84. https://doi.org/10.1007/s12020-024-03896-z
4. Horn, D. B., et al. (2025). Time to weight plateau with tirzepatide treatment in the SURMOUNT-1 and SURMOUNT-4 clinical trials. *Clinical Obesity*, 15(3). https://doi.org/10.1111/cob.12734
5. Frankenfield, D., et al. (2005). Comparison of predictive equations for resting metabolic rate in healthy nonobese and obese adults: a systematic review. *J Am Diet Assoc*, 105(5), 775–789. https://doi.org/10.1016/j.jada.2005.02.005
6. Cancello, R., et al. (2018). Analysis of predictive equations for estimating resting energy expenditure in a large cohort of morbidly obese patients. *Front Endocrinol*, 9. https://doi.org/10.3389/fendo.2018.00367
7. Karagün, B., & Baklaci, N. (2024). Comparative analysis of basal metabolic rate measurement methods in overweight and obese individuals. *Medicine*, 103(35), e39542. https://doi.org/10.1097/md.0000000000039542
8. Hall, K. D., et al. (2011). Quantification of the effect of energy imbalance on bodyweight. *The Lancet*, 378(9793), 826–837. https://doi.org/10.1016/s0140-6736(11)60812-x
9. Jiao, R., et al. (2024). Characterizing body composition modifying effects of a GLP-1 receptor-based agonist: a meta-analysis. *Diabetes Obes Metab*, 27(1), 259–267. https://doi.org/10.1111/dom.16012
10. Ryan, D. H. (2025). New drugs for the treatment of obesity: do we need approaches to preserve muscle mass? *Rev Endocr Metab Disord*, 26(5), 805–813. https://doi.org/10.1007/s11154-025-09967-4
11. Şimşek, H., & Uçar, A. (2026). GLP-1 receptor agonists for obesity management in older adults: a scoping review on the risk of sarcopenia and sarcopenic obesity. *Curr Nutr Rep*, 15(1). https://doi.org/10.1007/s13668-026-00777-x
12. Mozaffarian, D., et al. (2025). Nutritional priorities to support GLP-1 therapy for obesity: a joint Advisory. *Am J Clin Nutr*, 122(1), 344–367. https://doi.org/10.1016/j.ajcnut.2025.04.023 (errata: https://doi.org/10.1016/j.ajcnut.2026.101303)
13. Al-Najim, W., et al. (2025). Unintended consequences of obesity pharmacotherapy: a nutritional approach to ensuring better patient outcomes. *Nutrients*, 17(11), 1934. https://doi.org/10.3390/nu17111934
