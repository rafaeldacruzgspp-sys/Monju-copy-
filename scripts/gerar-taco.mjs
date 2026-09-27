// Gera src/data/taco.json a partir dos CSVs da TACO 4ª edição (NEPA/Unicamp, 2011).
// Fonte dos CSVs: https://github.com/raulfdm/taco-api (references/csv, licença MIT).
// Uso: node scripts/gerar-taco.mjs
import fs from 'node:fs';

function lerCsv(caminho) {
  const [cabecalho, ...linhas] = fs.readFileSync(caminho, 'utf8').trim().split(/\r?\n/);
  const campos = cabecalho.split(',');
  return linhas.map((linha) => {
    const valores = [];
    let atual = '';
    let aspas = false;
    for (const c of linha) {
      if (c === '"') aspas = !aspas;
      else if (c === ',' && !aspas) {
        valores.push(atual);
        atual = '';
      } else atual += c;
    }
    valores.push(atual);
    return Object.fromEntries(campos.map((c, i) => [c, valores[i]]));
  });
}

const num = (v) => {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : 0; // "NA", "Tr" e vazio → 0
};

const categorias = new Map(lerCsv('scripts/taco/categories.csv').map((c) => [c.id, c.name]));
const nutrientes = new Map(lerCsv('scripts/taco/nutrients.csv').map((n) => [n.foodId, n]));

const alimentos = lerCsv('scripts/taco/food.csv').map((f) => {
  const n = nutrientes.get(f.id) ?? {};
  return {
    id: Number(f.id),
    nome: f.name,
    categoria: categorias.get(f.categoryId),
    kcal: num(n.kcal),
    proteina: num(n.protein),
    gordura: num(n.lipids),
    carboidrato: num(n.carbohydrates),
    fibra: num(n.dietaryFiber),
  };
});

fs.writeFileSync('src/data/taco.json', JSON.stringify(alimentos));
console.log(`${alimentos.length} alimentos gravados em src/data/taco.json`);
