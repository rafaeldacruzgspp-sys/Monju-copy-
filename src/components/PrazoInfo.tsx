import { AnimatePresence, motion } from 'motion/react';
import { PRAZO_MAX, PRAZO_MIN, RITMO_SEGURO_KG_SEMANA, avaliarPrazo, fmt } from '../lib/calculos';
import { ESTUDOS_RESUMO } from '../lib/estudos';
import { Botao } from './ui';

const PRAZOS = Array.from({ length: PRAZO_MAX - PRAZO_MIN + 1 }, (_, i) => PRAZO_MIN + i);

export function SeletorPrazo({ valor, onChange }: { valor: number; onChange: (n: number) => void }) {
  return (
    <div className="chips" role="radiogroup" aria-label="Prazo em semanas">
      {PRAZOS.map((n) => (
        <motion.button
          key={n}
          type="button"
          role="radio"
          aria-checked={valor === n}
          className={`chip ${valor === n ? 'ativa' : ''}`}
          whileTap={{ scale: 0.9 }}
          onClick={() => onChange(n)}
        >
          {n}
        </motion.button>
      ))}
    </div>
  );
}

/** Ritmo necessário, alerta de ritmo acima do seguro e sugestões (seção 4.3). */
export function AlertaRitmo({
  atualKg,
  metaKg,
  semanas,
  aoUsarPrazo,
  aoUsarMeta,
}: {
  atualKg: number;
  metaKg: number;
  semanas: number;
  aoUsarPrazo?: (n: number) => void;
  aoUsarMeta?: (kg: number) => void;
}) {
  const a = avaliarPrazo(atualKg, metaKg, semanas);
  return (
    <div className="coluna">
      <div className="linha entre">
        <span className="suave">Ritmo necessário</span>
        <span className="medio">{fmt(a.ritmo)} kg/semana</span>
      </div>
      <AnimatePresence initial={false}>
        {a.acimaDoSeguro && (
          <motion.div
            className="aviso"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
          >
            <strong>Ritmo acima do seguro</strong>
            Esse prazo exige {fmt(a.ritmo)} kg por semana, acima do ritmo considerado seguro (até{' '}
            {fmt(RITMO_SEGURO_KG_SEMANA, 0)} kg/semana).
            <div className="coluna" style={{ marginTop: 12 }}>
              {a.prazoSeguro !== null && aoUsarPrazo && (
                <Botao type="button" className="secundario pequeno" onClick={() => aoUsarPrazo(a.prazoSeguro!)}>
                  Usar prazo seguro: {a.prazoSeguro} semanas
                </Botao>
              )}
              {a.metaIntermediaria !== null && aoUsarMeta && (
                <Botao type="button" className="secundario pequeno" onClick={() => aoUsarMeta(a.metaIntermediaria!)}>
                  Usar meta intermediária: {fmt(a.metaIntermediaria)} kg
                </Botao>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CartaoEstudos() {
  return (
    <div className="info">
      <strong>O que os estudos mostram</strong>
      <ul>
        {ESTUDOS_RESUMO.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <small className="suave">Médias de estudos, não uma previsão individual.</small>
    </div>
  );
}
