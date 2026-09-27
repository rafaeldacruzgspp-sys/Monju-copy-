import { motion } from 'motion/react';
import { CartaoEstudos } from '../components/PrazoInfo';
import { Card, Icone } from '../components/ui';
import { REFERENCIAS } from '../lib/estudos';

const FAIXAS = [
  ['< 16,0', 'Magreza grau III'],
  ['16,0 – 16,9', 'Magreza grau II'],
  ['17,0 – 18,4', 'Magreza grau I'],
  ['18,5 – 24,9', 'Eutrofia (peso adequado)'],
  ['25,0 – 29,9', 'Sobrepeso (pré-obesidade)'],
  ['30,0 – 34,9', 'Obesidade grau I'],
  ['35,0 – 39,9', 'Obesidade grau II'],
  ['≥ 40,0', 'Obesidade grau III'],
];

export function Sobre({ aoVoltar }: { aoVoltar: () => void }) {
  return (
    <motion.div
      className="tela"
      style={{ position: 'fixed', inset: 0, overflowY: 'auto', background: 'var(--fundo)', zIndex: 30, maxWidth: 'none' }}
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 380, damping: 38 }}
    >
      <div style={{ maxWidth: 528, margin: '0 auto' }}>
        <button className="onb-voltar" aria-label="Voltar" onClick={aoVoltar}>
          {Icone.voltar}
        </button>
        <h1 className="titulo-tela">Sobre os cálculos</h1>

        <div className="aviso" style={{ marginBottom: 14 }}>
          Este app não substitui acompanhamento médico e nutricional.
        </div>

        <Card>
          <div className="card-rotulo">IMC</div>
          <p style={{ marginTop: 0 }}>
            <strong>IMC = peso (kg) ÷ altura (m)²</strong>. A classificação segue a Organização Mundial da Saúde, também adotada pelo Ministério da Saúde:
          </p>
          <ul className="lista">
            {FAIXAS.map(([faixa, nome]) => (
              <li key={faixa} className="linha entre" style={{ padding: '6px 0', borderBottom: '1px solid var(--borda)' }}>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{faixa}</span>
                <span className="suave">{nome}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <div className="card-rotulo">Ritmo e prazo</div>
          <p style={{ margin: 0 }}>
            <strong>Ritmo = (peso atual − meta) ÷ semanas.</strong> Acima de 1 kg por semana o app avisa e sugere o menor prazo seguro ou uma meta intermediária
            para o prazo escolhido. Esse limite vem de diretrizes clínicas usuais.
          </p>
        </Card>

        <Card>
          <div className="card-rotulo">Progresso</div>
          <p style={{ margin: 0 }}>
            <strong>Progresso = (peso inicial − peso atual) ÷ (peso inicial − meta)</strong>, entre 0% e 100%. Se o peso inicial não estiver acima da meta, a
            conta parte do peso que você tinha quando definiu a meta.
          </p>
        </Card>

        <Card>
          <div className="card-rotulo">Próxima dose</div>
          <p style={{ margin: 0 }}>
            <strong>Próxima dose = última aplicação + intervalo</strong> (7 dias por padrão, ajustável no Perfil).
          </p>
        </Card>

        <Card>
          <div className="card-rotulo">Meta de calorias</div>
          <p style={{ marginTop: 0 }}>
            <strong>Gasto em repouso (Mifflin-St Jeor)</strong>: homens 10 × peso + 6,25 × altura − 5 × idade + 5; mulheres o mesmo − 161. A equação com
            melhor desempenho entre as testadas em pessoas com obesidade.
          </p>
          <p>
            <strong>Gasto do dia</strong> = gasto em repouso × fator de atividade (sedentário 1,2 · leve 1,375 · moderado 1,55 · intenso 1,725).
          </p>
          <p>
            <strong>Meta</strong> = gasto do dia − 500 kcal (ou − 750 kcal quando o prazo pede mais de 0,5 kg/semana), como recomenda a diretriz
            AHA/ACC/TOS. Nunca abaixo de 1.200 kcal (mulheres) ou 1.500 kcal (homens).
          </p>
          <p style={{ marginBottom: 0 }}>
            <strong>Recalibração</strong>: com 2 semanas de pesos, se a perda real for menos da metade da esperada, a meta cai 100 kcal; se passar de
            1 kg/semana, sobe 100 kcal (limite de ±300 kcal). O corpo gasta menos à medida que emagrece.
          </p>
        </Card>

        <Card>
          <div className="card-rotulo">Proteína</div>
          <p style={{ margin: 0 }}>
            <strong>1,4 g por kg de peso de referência</strong> (o menor entre o peso atual e o peso no IMC 25). A faixa de 1,2–1,6 g/kg ajuda a
            preservar músculo, que é parte importante do peso perdido com GLP-1. Gordura ≈ 27% das calorias; o restante vem de carboidratos.
          </p>
        </Card>

        <Card>
          <div className="card-rotulo">Água</div>
          <p style={{ margin: 0 }}>
            <strong>35 ml × peso atual</strong> (regra prática escolhida para o app; não encontramos uma fonte científica sólida para ela). Para
            comparação, a EFSA considera adequados 2,0 L/dia (mulheres) e 2,5 L/dia (homens) de água total, incluindo a dos alimentos.
          </p>
        </Card>

        <Card>
          <div className="card-rotulo">Plano e alimentos</div>
          <p style={{ margin: 0 }}>
            As calorias e a proteína do dia são divididas entre as refeições; a proteína é dimensionada primeiro e o carboidrato completa as
            calorias. Valores nutricionais da Tabela Brasileira de Composição de Alimentos (TACO, 4ª edição, NEPA/Unicamp, 2011).
          </p>
        </Card>

        <div style={{ marginBottom: 14 }}>
          <CartaoEstudos />
        </div>

        <Card>
          <div className="card-rotulo">Referências</div>
          <ol className="refs">
            {REFERENCIAS.map((r) => (
              <li key={r.doi}>
                {r.texto}{' '}
                <a href={`https://doi.org/${r.doi}`} target="_blank" rel="noreferrer">
                  doi:{r.doi}
                </a>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </motion.div>
  );
}
