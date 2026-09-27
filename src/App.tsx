import { useLiveQuery } from 'dexie-react-hooks';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useRef, useState } from 'react';
import { Aviso, Icone } from './components/ui';
import { db, type Aplicacao, type Perfil as PerfilT, type RegistroPeso } from './lib/db';
import { Aplicacoes } from './screens/Aplicacoes';
import { Entrevista } from './screens/Entrevista';
import { Inicio } from './screens/Inicio';
import { Perfil } from './screens/Perfil';
import { Peso } from './screens/Peso';
import { Sobre } from './screens/Sobre';

export interface Dados {
  perfil: PerfilT;
  aplicacoes: Aplicacao[];
  pesos: RegistroPeso[];
}

type Aba = 'inicio' | 'aplicacoes' | 'peso' | 'perfil';

const ABAS: { id: Aba; rotulo: string; icone: React.ReactNode }[] = [
  { id: 'inicio', rotulo: 'Início', icone: Icone.casa },
  { id: 'aplicacoes', rotulo: 'Aplicações', icone: Icone.seringa },
  { id: 'peso', rotulo: 'Peso', icone: Icone.balanca },
  { id: 'perfil', rotulo: 'Perfil', icone: Icone.pessoa },
];

export default function App() {
  const perfil = useLiveQuery(async () => (await db.perfil.get(1)) ?? null);
  const aplicacoes = useLiveQuery(() => db.aplicacoes.toArray());
  const pesos = useLiveQuery(() => db.pesos.toArray());
  const [aba, setAba] = useState<Aba>('inicio');
  const [sobre, setSobre] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const aoErro = useCallback((m: string) => {
    setErro(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setErro(null), 4000);
  }, []);

  if (perfil === undefined || aplicacoes === undefined || pesos === undefined) return null;

  if (perfil === null) {
    return (
      <>
        <Aviso texto={erro} />
        <Entrevista />
      </>
    );
  }

  const dados: Dados = { perfil, aplicacoes, pesos };

  return (
    <>
      <Aviso texto={erro} />
      <AnimatePresence mode="wait">
        <motion.main
          key={aba}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {aba === 'inicio' && <Inicio dados={dados} aoErro={aoErro} irParaPerfil={() => setAba('perfil')} />}
          {aba === 'aplicacoes' && <Aplicacoes dados={dados} aoErro={aoErro} />}
          {aba === 'peso' && <Peso dados={dados} aoErro={aoErro} />}
          {/* A key recria o formulário quando o perfil muda por fora (ex.: importação de backup). */}
          {aba === 'perfil' && <Perfil key={JSON.stringify(perfil)} dados={dados} aoErro={aoErro} abrirSobre={() => setSobre(true)} />}
        </motion.main>
      </AnimatePresence>

      <AnimatePresence>{sobre && <Sobre aoVoltar={() => setSobre(false)} />}</AnimatePresence>

      <nav className="nav">
        <div className="nav-inner">
          {ABAS.map((a) => (
            <button
              key={a.id}
              className={aba === a.id ? 'ativa' : ''}
              aria-current={aba === a.id ? 'page' : undefined}
              onClick={() => {
                setAba(a.id);
                setSobre(false);
                window.scrollTo({ top: 0 });
              }}
            >
              {aba === a.id && <motion.span layoutId="nav-marca" className="nav-marca" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />}
              {a.icone}
              {a.rotulo}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
