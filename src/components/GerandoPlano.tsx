import { animate, motion, useMotionValue, useMotionValueEvent, useTransform } from 'motion/react';
import { useEffect, useState } from 'react';

const ETAPAS: [number, string][] = [
  [0, 'Calculando seu gasto energético (Mifflin-St Jeor)'],
  [18, 'Definindo a meta de calorias (diretriz AHA/ACC/TOS)'],
  [36, 'Priorizando proteína para preservar músculo no GLP-1'],
  [54, 'Escolhendo alimentos que você gosta'],
  [72, 'Encaixando o docinho do dia nas calorias'],
  [88, 'Equilibrando as porções e a lista de compras'],
];

/** Tela de "montando o plano" com barra de 0 a 100%. Chama `aoConcluir` ao chegar em 100%. */
export function GerandoPlano({ nome, sexo, aoConcluir }: { nome: string; sexo: 'F' | 'M'; aoConcluir: () => void }) {
  const progresso = useMotionValue(0);
  const largura = useTransform(progresso, (v) => `${v}%`);
  const [pct, setPct] = useState(0);
  useMotionValueEvent(progresso, 'change', (v) => setPct(Math.round(v)));

  useEffect(() => {
    const c = animate(progresso, 100, { duration: 3.4, ease: [0.4, 0, 0.2, 1], onComplete: () => setTimeout(aoConcluir, 350) });
    return () => c.stop();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const etapaAtual = ETAPAS.filter(([limite]) => pct >= limite).length - 1;

  return (
    <motion.div className="gerando" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="status" aria-live="polite">
      <motion.div className="gerando-caixa" initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }}>
        <motion.div className="gerando-icone" animate={{ rotate: [0, -8, 8, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}>
          🥗
        </motion.div>
        <h2>Montando o plano adaptado {nome ? `${sexo === 'F' ? 'da' : 'do'} ${nome}` : 'para você'}</h2>
        <p className="suave">Seguindo artigos científicos modernos</p>
        <div className="gerando-pct">{pct}%</div>
        <div className="barra gerando-barra">
          <motion.div style={{ width: largura }} />
        </div>
        <ul className="gerando-etapas">
          {ETAPAS.map(([, texto], i) => (
            <motion.li key={texto} initial={{ opacity: 0.35 }} animate={{ opacity: i <= etapaAtual ? 1 : 0.35 }}>
              <span className={`gerando-marca ${i < etapaAtual || pct === 100 ? 'ok' : i === etapaAtual ? 'agora' : ''}`}>{i < etapaAtual || pct === 100 ? '✓' : ''}</span>
              {texto}
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  );
}
