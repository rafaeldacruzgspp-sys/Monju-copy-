import { AnimatePresence, motion } from 'motion/react';
import { fmtData, hojeISO, somarDias } from '../lib/calculos';
import { db, type RegistroAgua } from '../lib/db';
import { Botao } from './ui';

export const GARRAFAS = [
  { ml: 500, rotulo: '+500 ml' },
  { ml: 1500, rotulo: '+1,5 L' },
  { ml: 2000, rotulo: '+2 L' },
];

export const litros = (ml: number) => `${(ml / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} L`;

export function totalDoDia(registros: RegistroAgua[], data: string): number {
  return registros.filter((r) => r.data === data).reduce((s, r) => s + r.ml, 0);
}

function horaAgora(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export async function adicionarAgua(ml: number) {
  await db.agua.add({ data: hojeISO(), hora: horaAgora(), ml });
}

export async function desfazerAgua(registros: RegistroAgua[]) {
  const hoje = hojeISO();
  const ultimo = registros.filter((r) => r.data === hoje).sort((a, b) => (b.id ?? 0) - (a.id ?? 0))[0];
  if (ultimo?.id) await db.agua.delete(ultimo.id);
}

/** Garrafa que enche conforme a fração da meta. */
export function Garrafa({ fracao, tamanho = 120 }: { fracao: number; tamanho?: number }) {
  const f = Math.min(1, fracao);
  return (
    <svg width={tamanho * 0.6} height={tamanho} viewBox="0 0 60 100" aria-hidden="true">
      <defs>
        <clipPath id="garrafa">
          <path d="M22 4h16v10c0 3 10 6 10 16v60a6 6 0 0 1-6 6H18a6 6 0 0 1-6-6V30c0-10 10-13 10-16z" />
        </clipPath>
      </defs>
      <path d="M22 4h16v10c0 3 10 6 10 16v60a6 6 0 0 1-6 6H18a6 6 0 0 1-6-6V30c0-10 10-13 10-16z" fill="var(--superficie-2)" />
      <g clipPath="url(#garrafa)">
        <motion.rect
          x="0"
          width="60"
          height="100"
          fill="#3a9bdc"
          initial={false}
          animate={{ y: 100 - f * 84 }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        />
      </g>
      <path d="M22 4h16v10c0 3 10 6 10 16v60a6 6 0 0 1-6 6H18a6 6 0 0 1-6-6V30c0-10 10-13 10-16z" fill="none" stroke="var(--borda)" strokeWidth="2" />
    </svg>
  );
}

export function BotoesAgua({ aoErro }: { aoErro: (m: string) => void }) {
  return (
    <div className="grade-3">
      {GARRAFAS.map((g) => (
        <Botao key={g.ml} className="agua pequeno" style={{ width: '100%' }} onClick={() => adicionarAgua(g.ml).catch(() => aoErro('Não foi possível salvar. Tente novamente.'))}>
          {g.rotulo}
        </Botao>
      ))}
    </div>
  );
}

export function Ultimos7Dias({ registros, metaMl }: { registros: RegistroAgua[]; metaMl: number }) {
  const hoje = hojeISO();
  const dias = Array.from({ length: 7 }, (_, i) => somarDias(hoje, i - 6));
  const max = Math.max(metaMl, ...dias.map((d) => totalDoDia(registros, d)));
  return (
    <div className="semana-agua" role="table" aria-label="Água nos últimos 7 dias">
      {dias.map((d, i) => {
        const total = totalDoDia(registros, d);
        return (
          <div key={d} className="semana-agua-dia" role="row">
            <div className="semana-agua-barra">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(total / max) * 100}%` }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 160, damping: 22 }}
                style={{ background: total >= metaMl ? 'var(--verde)' : '#3a9bdc' }}
              />
              <div className="semana-agua-meta" style={{ bottom: `${(metaMl / max) * 100}%` }} />
            </div>
            <small role="cell">{d === hoje ? 'Hoje' : fmtData(d, { weekday: 'short' }).replace('.', '')}</small>
            <small role="cell" className="suave">
              {total >= metaMl ? '✓' : litros(total).replace(' L', '')}
            </small>
          </div>
        );
      })}
    </div>
  );
}

export function ResumoAgua({ registros, metaMl, aoErro }: { registros: RegistroAgua[]; metaMl: number; aoErro: (m: string) => void }) {
  const total = totalDoDia(registros, hojeISO());
  return (
    <div className="coluna">
      <div className="linha">
        <Garrafa fracao={total / metaMl} tamanho={84} />
        <div style={{ flex: 1 }}>
          <div className="medio">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span key={total} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }} style={{ display: 'inline-block' }}>
                {litros(total)}
              </motion.span>
            </AnimatePresence>{' '}
            <span className="suave" style={{ fontSize: 16, fontWeight: 600 }}>
              de {litros(metaMl)}
            </span>
          </div>
          <small className="suave">{total >= metaMl ? 'Meta de hoje batida! 💧' : `Faltam ${litros(metaMl - total)}`}</small>
        </div>
      </div>
      <BotoesAgua aoErro={aoErro} />
      <Ultimos7Dias registros={registros} metaMl={metaMl} />
    </div>
  );
}
