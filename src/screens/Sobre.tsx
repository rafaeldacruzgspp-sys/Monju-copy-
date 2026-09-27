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
