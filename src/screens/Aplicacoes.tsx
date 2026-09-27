import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { FormAplicacao } from '../components/Formularios';
import { Botao, EmojiTile, Icone } from '../components/ui';
import { fmt, fmtData } from '../lib/calculos';
import { maisRecente, type Aplicacao } from '../lib/db';
import type { Dados } from '../App';

export function Aplicacoes({ dados, aoErro }: { dados: Dados; aoErro: (m: string) => void }) {
  const [aberta, setAberta] = useState(false);
  const [editando, setEditando] = useState<Aplicacao | undefined>();
  const lista = [...dados.aplicacoes].sort((a, b) => (b.data === a.data ? (b.id ?? 0) - (a.id ?? 0) : b.data.localeCompare(a.data)));

  return (
    <div className="tela">
      <div className="linha entre">
        <h1 className="titulo-tela">
          Suas <em>aplicações</em>
        </h1>
        <Botao
          className="pequeno"
          aria-label="Nova aplicação"
          onClick={() => {
            setEditando(undefined);
            setAberta(true);
          }}
        >
          {Icone.mais}
        </Botao>
      </div>

      <div className="card">
        {lista.length === 0 ? (
          <div className="vazio">Nenhuma aplicação registrada ainda.</div>
        ) : (
          <ul className="lista">
            <AnimatePresence initial={false}>
              {lista.map((a, i) => (
                <motion.li
                  key={a.id}
                  layout
                  className="item"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0, transition: { delay: Math.min(i, 10) * 0.03 } }}
                  exit={{ opacity: 0, height: 0 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setEditando(a);
                    setAberta(true);
                  }}
                >
                  <EmojiTile emoji="💉" categoria="laticinio" />
                  <div className="item-corpo">
                    <strong>{fmt(a.doseMg, a.doseMg % 1 ? 1 : 0)} mg</strong>
                    <small>{a.observacao || 'Sem observações'}</small>
                  </div>
                  <span className="suave">{fmtData(a.data, { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      <FormAplicacao
        aberta={aberta}
        aoFechar={() => setAberta(false)}
        editando={editando}
        ultimaDose={maisRecente(dados.aplicacoes)?.doseMg}
        aoErro={aoErro}
      />
    </div>
  );
}
