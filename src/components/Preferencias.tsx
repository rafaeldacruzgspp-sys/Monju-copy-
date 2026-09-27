import { motion } from 'motion/react';
import { useState } from 'react';
import { ALIMENTOS, CATEGORIAS } from '../data/alimentos';
import { db, type PreferenciasDieta } from '../lib/db';
import { Botao } from './ui';

const OPCOES_REFEICOES = [3, 4, 5, 6] as const;

/** Mini-entrevista de preferências (seção 3.2). Usada na primeira abertura e para editar. */
export function FormPreferencias({
  atual,
  aoSalvar,
  aoErro,
}: {
  atual: PreferenciasDieta | null;
  aoSalvar: () => void;
  aoErro: (m: string) => void;
}) {
  const [passo, setPasso] = useState(0);
  const [refeicoes, setRefeicoes] = useState<3 | 4 | 5 | 6>(atual?.refeicoesPorDia ?? 4);
  const [naoCome, setNaoCome] = useState<string[]>(atual?.naoCome ?? []);
  const [favoritos, setFavoritos] = useState<string[]>(atual?.favoritos ?? []);

  const alternar = (lista: string[], set: (l: string[]) => void, outra: string[], setOutra: (l: string[]) => void, id: string) => {
    if (lista.includes(id)) set(lista.filter((x) => x !== id));
    else {
      set([...lista, id]);
      if (outra.includes(id)) setOutra(outra.filter((x) => x !== id));
    }
  };

  async function salvar() {
    try {
      await db.preferencias.put({
        id: 1,
        refeicoesPorDia: refeicoes,
        naoCome,
        favoritos,
        ajusteKcal: atual?.ajusteKcal ?? 0,
        metaAguaManualMl: atual?.metaAguaManualMl,
        ultimaRecalibracao: atual?.ultimaRecalibracao,
      });
      aoSalvar();
    } catch {
      aoErro('Não foi possível salvar. Tente novamente.');
    }
  }

  const modo = passo === 1 ? 'nao' : 'fav';
  return (
    <div className="coluna">
      {passo === 0 && (
        <>
          <h2 className="onb-pergunta" style={{ fontSize: 24 }}>
            Quantas refeições você faz por dia?
          </h2>
          <p className="onb-ajuda" style={{ marginBottom: 8 }}>
            Com GLP-1, refeições menores e mais frequentes costumam ser mais bem toleradas.
          </p>
          <div className="chips" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {OPCOES_REFEICOES.map((n) => (
              <motion.button key={n} type="button" whileTap={{ scale: 0.9 }} className={`chip ${refeicoes === n ? 'ativa' : ''}`} onClick={() => setRefeicoes(n)}>
                {n}
              </motion.button>
            ))}
          </div>
        </>
      )}
      {passo > 0 && (
        <>
          <h2 className="onb-pergunta" style={{ fontSize: 24 }}>
            {passo === 1 ? 'O que você não come?' : 'Quais são seus favoritos?'}
          </h2>
          <p className="onb-ajuda" style={{ marginBottom: 8 }}>
            {passo === 1 ? 'Toque para marcar ✕. Esses alimentos nunca entram no plano.' : 'Toque para marcar ★. Eles aparecem com mais frequência.'}
          </p>
          {CATEGORIAS.filter((c) => c.id !== 'outros').map((c) => (
            <div key={c.id}>
              <div className="card-rotulo" style={{ marginTop: 6 }}>
                {c.emoji} {c.nome}
              </div>
              <div className="tags">
                {ALIMENTOS.filter((a) => a.categoria === c.id && a.papeis.length > 0).map((a) => {
                  const marcadoNao = naoCome.includes(a.id);
                  const marcadoFav = favoritos.includes(a.id);
                  const ativo = modo === 'nao' ? marcadoNao : marcadoFav;
                  return (
                    <motion.button
                      key={a.id}
                      type="button"
                      whileTap={{ scale: 0.92 }}
                      className={`tag ${ativo ? (modo === 'nao' ? 'tag-nao' : 'tag-fav') : ''} ${modo === 'fav' && marcadoNao ? 'tag-off' : ''}`}
                      disabled={modo === 'fav' && marcadoNao}
                      aria-pressed={ativo}
                      onClick={() =>
                        modo === 'nao'
                          ? alternar(naoCome, setNaoCome, favoritos, setFavoritos, a.id)
                          : alternar(favoritos, setFavoritos, naoCome, setNaoCome, a.id)
                      }
                    >
                      {ativo ? (modo === 'nao' ? '✕ ' : '★ ') : ''}
                      {a.nome}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}
      <div className="grade-2" style={{ marginTop: 8 }}>
        <Botao className="secundario" disabled={passo === 0} onClick={() => setPasso((p) => p - 1)}>
          Voltar
        </Botao>
        <Botao onClick={() => (passo < 2 ? setPasso((p) => p + 1) : salvar())}>{passo < 2 ? 'Continuar' : 'Salvar'}</Botao>
      </div>
    </div>
  );
}
