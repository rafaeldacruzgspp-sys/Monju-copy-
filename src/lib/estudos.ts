// Conteúdo científico exibido no app. Ver seção 8 da especificação.

export const ESTUDOS_RESUMO = [
  'Em ensaios clínicos, a tirzepatida (Mounjaro) 10–15 mg levou a uma perda média de cerca de 19% do peso a mais que o placebo, e a semaglutida (Ozempic/Wegovy) 2,4 mg a cerca de 13%, em tratamentos longos (até 72 semanas).',
  'A perda é maior com doses maiores.',
  'A perda é mais rápida no começo e desacelera até um platô, que no estudo SURMOUNT-1 começou, em média, entre 24 e 36 semanas, conforme a faixa de IMC.',
];

export interface Referencia {
  texto: string;
  doi: string;
}

export const REFERENCIAS: Referencia[] = [
  { texto: 'Jastreboff, A. M., et al. (2022). Tirzepatide once weekly for the treatment of obesity. NEJM, 387(3), 205–216.', doi: '10.1056/nejmoa2206038' },
  { texto: 'Müllertz, A. L. O., et al. (2024). Potent incretin-based therapy for obesity: a systematic review and meta-analysis. Obesity Reviews, 25(5).', doi: '10.1111/obr.13717' },
  { texto: 'Qin, W., et al. (2024). Efficacy and safety of once-weekly tirzepatide for weight management compared to placebo. Endocrine, 86(1), 70–84.', doi: '10.1007/s12020-024-03896-z' },
  { texto: 'Horn, D. B., et al. (2025). Time to weight plateau with tirzepatide treatment in the SURMOUNT-1 and SURMOUNT-4 clinical trials. Clinical Obesity, 15(3).', doi: '10.1111/cob.12734' },
  { texto: 'Frankenfield, D., et al. (2005). Comparison of predictive equations for resting metabolic rate in healthy nonobese and obese adults: a systematic review. J Am Diet Assoc, 105(5), 775–789.', doi: '10.1016/j.jada.2005.02.005' },
  { texto: 'Cancello, R., et al. (2018). Analysis of predictive equations for estimating resting energy expenditure in a large cohort of morbidly obese patients. Front Endocrinol, 9.', doi: '10.3389/fendo.2018.00367' },
  { texto: 'Karagün, B., & Baklaci, N. (2024). Comparative analysis of basal metabolic rate measurement methods in overweight and obese individuals. Medicine, 103(35), e39542.', doi: '10.1097/md.0000000000039542' },
  { texto: 'Hall, K. D., et al. (2011). Quantification of the effect of energy imbalance on bodyweight. The Lancet, 378(9793), 826–837.', doi: '10.1016/s0140-6736(11)60812-x' },
  { texto: 'Jiao, R., et al. (2024). Characterizing body composition modifying effects of a GLP-1 receptor-based agonist: a meta-analysis. Diabetes Obes Metab, 27(1), 259–267.', doi: '10.1111/dom.16012' },
  { texto: 'Ryan, D. H. (2025). New drugs for the treatment of obesity: do we need approaches to preserve muscle mass? Rev Endocr Metab Disord, 26(5), 805–813.', doi: '10.1007/s11154-025-09967-4' },
  { texto: 'Şimşek, H., & Uçar, A. (2026). GLP-1 receptor agonists for obesity management in older adults: a scoping review. Curr Nutr Rep, 15(1).', doi: '10.1007/s13668-026-00777-x' },
  { texto: 'Mozaffarian, D., et al. (2025). Nutritional priorities to support GLP-1 therapy for obesity: a joint Advisory. Am J Clin Nutr, 122(1), 344–367. (errata publicada em 2026)', doi: '10.1016/j.ajcnut.2025.04.023' },
  { texto: 'Al-Najim, W., et al. (2025). Unintended consequences of obesity pharmacotherapy: a nutritional approach. Nutrients, 17(11), 1934.', doi: '10.3390/nu17111934' },
];
