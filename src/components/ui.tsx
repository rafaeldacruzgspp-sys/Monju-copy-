import { AnimatePresence, animate, motion, useMotionValue, useTransform, type HTMLMotionProps } from 'motion/react';
import { useEffect, useId, type ReactNode } from 'react';
import { ROTULO_FAIXA, classificarImc, fmt, imc, type FaixaImc } from '../lib/calculos';

export const mola = { type: 'spring', stiffness: 420, damping: 34 } as const;

export function Botao({ className = '', ...props }: HTMLMotionProps<'button'>) {
  return (
    <motion.button
      whileTap={props.disabled ? undefined : { scale: 0.96 }}
      transition={mola}
      className={`btn ${className}`}
      {...props}
    />
  );
}

export function Card({ children, className = '', atraso = 0 }: { children: ReactNode; className?: string; atraso?: number }) {
  return (
    <motion.div
      className={`card ${className}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...mola, delay: atraso }}
    >
      {children}
    </motion.div>
  );
}

export function Campo(props: {
  rotulo: string;
  valor: string;
  onChange: (v: string) => void;
  erro?: string | null;
  tipo?: 'text' | 'decimal' | 'numeric' | 'date';
  sufixo?: string;
  placeholder?: string;
  multilinha?: boolean;
  max?: string;
}) {
  const id = useId();
  const { tipo = 'text' } = props;
  const mostrarErro = props.erro && props.valor !== '';
  return (
    <div className="campo">
      <label htmlFor={id}>
        {props.rotulo}
        {props.sufixo ? ` (${props.sufixo})` : ''}
      </label>
      {props.multilinha ? (
        <textarea
          id={id}
          className="entrada"
          value={props.valor}
          placeholder={props.placeholder}
          onChange={(e) => props.onChange(e.target.value)}
        />
      ) : (
        <input
          id={id}
          className={`entrada ${mostrarErro ? 'erro' : ''}`}
          type={tipo === 'date' ? 'date' : 'text'}
          inputMode={tipo === 'decimal' ? 'decimal' : tipo === 'numeric' ? 'numeric' : undefined}
          value={props.valor}
          max={props.max}
          placeholder={props.placeholder}
          onChange={(e) => props.onChange(e.target.value)}
        />
      )}
      <AnimatePresence>
        {mostrarErro && (
          <motion.span
            className="erro-msg"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {props.erro}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Número que anima de um valor para outro. */
export function NumeroAnimado({ valor, casas = 1 }: { valor: number; casas?: number }) {
  const mv = useMotionValue(valor);
  const texto = useTransform(mv, (v) => fmt(v, casas));
  useEffect(() => {
    const c = animate(mv, valor, { duration: 0.8, ease: [0.22, 1, 0.36, 1] });
    return () => c.stop();
  }, [mv, valor]);
  return <motion.span>{texto}</motion.span>;
}

export function BarraProgresso({ fracao, atraso = 0.2 }: { fracao: number; atraso?: number }) {
  return (
    <div className="barra" role="progressbar" aria-valuenow={Math.round(fracao * 100)} aria-valuemin={0} aria-valuemax={100}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(fracao * 100, fracao > 0 ? 3 : 0)}%` }}
        transition={{ duration: 1, delay: atraso, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

const COR_FAIXA: Record<FaixaImc, string> = {
  magreza3: '#6a8fd6',
  magreza2: '#6a8fd6',
  magreza1: '#7fb0e0',
  eutrofia: '#3aa84c',
  sobrepeso: '#d9a520',
  obesidade1: '#e0822f',
  obesidade2: '#d8622d',
  obesidade3: '#c63f2a',
};

export function SeloImc({ pesoKg, alturaCm }: { pesoKg: number; alturaCm: number }) {
  const valor = imc(pesoKg, alturaCm);
  const faixa = classificarImc(valor);
  return (
    <span className="selo">
      <span className="ponto" style={{ background: COR_FAIXA[faixa] }} />
      IMC {fmt(valor)} · {ROTULO_FAIXA[faixa]}
    </span>
  );
}

export function Folha({
  aberta,
  aoFechar,
  titulo,
  children,
}: {
  aberta: boolean;
  aoFechar: () => void;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <AnimatePresence>
      {aberta && (
        <>
          <motion.div
            className="sheet-fundo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={aoFechar}
          />
          <motion.div
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-label={titulo}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={mola}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) aoFechar();
            }}
          >
            <div className="sheet-alca" />
            <h2>{titulo}</h2>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Mensagem temporária no topo (ex.: erro ao salvar). */
export function Aviso({ texto }: { texto: string | null }) {
  return (
    <AnimatePresence>
      {texto && (
        <motion.div
          className="aviso alerta"
          style={{ position: 'fixed', top: 'calc(env(safe-area-inset-top) + 12px)', left: 16, right: 16, zIndex: 60, maxWidth: 528, margin: '0 auto' }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          {texto}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------- Ícones ----------

const svg = (d: ReactNode) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);

export const Icone = {
  casa: svg(<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />),
  seringa: svg(
    <>
      <path d="M18 2l4 4M17 7l3-3M19 9 8.7 19.3a1 1 0 0 1-1.4 0l-2.6-2.6a1 1 0 0 1 0-1.4L15 5z" />
      <path d="M9 11l4 4M5 19l-3 3M14 4l6 6" />
    </>,
  ),
  balanca: svg(
    <>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M8 9a4 4 0 0 1 8 0M12 9l1.5-2" />
    </>,
  ),
  pessoa: svg(
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>,
  ),
  voltar: svg(<path d="M15 18l-6-6 6-6" />),
  mais: svg(<path d="M12 5v14M5 12h14" />),
  calendario: svg(
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>,
  ),
  prato: svg(
    <>
      <circle cx="12" cy="13" r="7" />
      <circle cx="12" cy="13" r="3.5" />
      <path d="M4 3v5M2.5 3v4a1.5 1.5 0 0 0 3 0V3M21 3c-1.5 1-2 3-2 5h2v13" />
    </>,
  ),
  livro: svg(<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z" />),
};

/** Ladrilho colorido com o emoji do alimento (cor pela categoria). */
export function EmojiTile({ emoji, categoria, pequeno }: { emoji: string; categoria?: string; pequeno?: boolean }) {
  return (
    <span className={`emoji-tile ${pequeno ? 'pequeno' : ''} ${categoria ? `cat-${categoria}` : ''}`} aria-hidden="true">
      {emoji}
    </span>
  );
}

/** Anel de progresso (0..1) com conteúdo no centro. */
export function Anel({ fracao, cor = 'var(--verde)', tamanho = 118, espessura = 12, children }: { fracao: number; cor?: string; tamanho?: number; espessura?: number; children?: ReactNode }) {
  const r = (tamanho - espessura) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="anel" style={{ width: tamanho, height: tamanho }}>
      <svg width={tamanho} height={tamanho} aria-hidden="true">
        <circle cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none" stroke="color-mix(in srgb, var(--texto) 8%, transparent)" strokeWidth={espessura} />
        <motion.circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={r}
          fill="none"
          stroke={cor}
          strokeWidth={espessura}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - Math.min(1, Math.max(0, fracao))) }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="anel-centro">{children}</div>
    </div>
  );
}
