import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { CATEGORIAS, type CategoriaDiario } from '../data/alimentos';
import { fmt } from '../lib/calculos';
import { db, type RegistroDiario } from '../lib/db';
import { alimentoOuErro, alimentosDaCategoria, buscar, nomeDe, nutrientesDe } from '../lib/taco';
import { lerNumero, validar } from '../lib/validacao';
import { BarraProgresso, Botao, Campo, Folha } from './ui';

export function totaisDiario(registros: RegistroDiario[], data: string) {
  const doDia = registros.filter((r) => r.data === data);
  return {
    kcal: Math.round(doDia.reduce((s, r) => s + r.kcal, 0)),
    proteina: Math.round(doDia.reduce((s, r) => s + r.proteina, 0)),
  };
}

export function BarrasCalorias({ kcal, proteina, metaKcal, metaProteina }: { kcal: number; proteina: number; metaKcal: number; metaProteina: number }) {
  return (
    <div className="coluna">
      <div>
        <div className="linha entre" style={{ marginBottom: 6 }}>
          <span>
            <strong className="medio">{kcal.toLocaleString('pt-BR')}</strong> <span className="suave">/ {metaKcal.toLocaleString('pt-BR')} kcal</span>
          </span>
          <small className={kcal > metaKcal ? 'erro-msg' : 'suave'}>
            {kcal > metaKcal ? `+${(kcal - metaKcal).toLocaleString('pt-BR')} acima` : `restam ${(metaKcal - kcal).toLocaleString('pt-BR')}`}
          </small>
        </div>
        <BarraProgresso fracao={Math.min(1, kcal / metaKcal)} atraso={0.1} />
      </div>
      <div>
        <div className="linha entre" style={{ marginBottom: 6 }}>
          <span>
            <strong>{proteina} g</strong> <span className="suave">/ {metaProteina} g de proteína</span>
          </span>
          <small className="suave">{proteina >= metaProteina ? 'meta batida ✓' : `faltam ${metaProteina - proteina} g`}</small>
        </div>
        <div className="barra proteina">
          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (proteina / metaProteina) * 100)}%` }} transition={{ duration: 1, delay: 0.2 }} />
        </div>
      </div>
    </div>
  );
}

/**
 * Folha para adicionar ou editar um alimento no diário (seção 3.4).
 * Sem `editando`: escolha do alimento (categoria + busca) e depois as gramas.
 */
export function FormComida({
  aberta,
  aoFechar,
  data,
  categoriaInicial,
  editando,
  aoErro,
}: {
  aberta: boolean;
  aoFechar: () => void;
  data: string;
  categoriaInicial?: CategoriaDiario;
  editando?: RegistroDiario;
  aoErro: (m: string) => void;
}) {
  const [categoria, setCategoria] = useState<CategoriaDiario>('proteina');
  const [busca, setBusca] = useState('');
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const [gramas, setGramas] = useState('');
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);

  useEffect(() => {
    if (!aberta) return;
    setCategoria(editando?.categoria ?? categoriaInicial ?? 'proteina');
    setBusca('');
    setEscolhido(editando?.alimentoId ?? null);
    setGramas(editando ? String(editando.gramas) : '');
    setConfirmarExclusao(false);
  }, [aberta, editando, categoriaInicial]);

  const resultados = useMemo(() => (busca.trim().length >= 2 ? buscar(busca) : null), [busca]);
  const erroGramas = validar.gramas(lerNumero(gramas));
  const previa = escolhido && !erroGramas ? nutrientesDe(escolhido, lerNumero(gramas)) : null;

  function escolher(id: string) {
    setEscolhido(id);
    setGramas(id.startsWith('taco:') ? '100' : String(alimentoOuErro(id).porcao));
  }

  async function salvar() {
    if (!escolhido) return;
    const g = lerNumero(gramas);
    const n = nutrientesDe(escolhido, g);
    const cat = escolhido.startsWith('taco:') ? categoria : alimentoOuErro(escolhido).categoria;
    const registro: RegistroDiario = { data, categoria: cat, alimentoId: escolhido, nome: nomeDe(escolhido), gramas: g, ...n };
    try {
      if (editando?.id) await db.diario.put({ ...registro, id: editando.id });
      else await db.diario.add(registro);
      aoFechar();
    } catch {
      aoErro('Não foi possível salvar. Tente novamente.');
    }
  }

  async function excluir() {
    if (!editando?.id) return;
    try {
      await db.diario.delete(editando.id);
      aoFechar();
    } catch {
      aoErro('Não foi possível excluir. Tente novamente.');
    }
  }

  const medida = escolhido && !escolhido.startsWith('taco:') ? alimentoOuErro(escolhido) : null;

  return (
    <Folha aberta={aberta} aoFechar={aoFechar} titulo={editando ? 'Editar alimento' : escolhido ? 'Quanto você comeu?' : 'Adicionar alimento'}>
      <AnimatePresence mode="wait" initial={false}>
        {!escolhido ? (
          <motion.div key="escolha" className="coluna" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <input className="entrada" placeholder="Buscar alimento (ex.: frango, pão)" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar alimento" />
            {!resultados && (
              <div className="rolagem-x">
                {CATEGORIAS.map((c) => (
                  <button key={c.id} type="button" className={`tag ${categoria === c.id ? 'tag-fav' : ''}`} onClick={() => setCategoria(c.id)}>
                    {c.emoji} {c.nome}
                  </button>
                ))}
              </div>
            )}
            <ul className="lista">
              {(resultados ?? alimentosDaCategoria(categoria).map((a) => ({ alimentoId: a.id, nome: a.nome, detalhe: `${nutrientesDe(a.id, 100).kcal} kcal / 100 g` }))).map((r) => (
                <li key={r.alimentoId} className="item" onClick={() => escolher(r.alimentoId)}>
                  <div className="item-corpo">
                    <strong>{r.nome}</strong>
                    <small>{r.detalhe}</small>
                  </div>
                  <span className="suave">›</span>
                </li>
              ))}
              {resultados?.length === 0 && <div className="vazio">Nada encontrado.</div>}
            </ul>
          </motion.div>
        ) : (
          <motion.div key="gramas" className="coluna" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <div className="linha entre">
              <strong>{nomeDe(escolhido)}</strong>
              {!editando && (
                <button type="button" className="btn texto" onClick={() => setEscolhido(null)}>
                  Trocar
                </button>
              )}
            </div>
            <Campo rotulo="Quantidade" sufixo="g" tipo="numeric" valor={gramas} onChange={setGramas} erro={erroGramas} />
            {medida && (
              <div className="tags">
                {(medida.unidade ? [1, 2, 3].map((n) => ({ g: n * medida.unidade!.g, t: `${n} ${n === 1 ? medida.unidade!.nome : medida.unidade!.plural}` })) : medida.medida ? [1, 2, 3].map((n) => ({ g: n * medida.medida!.g, t: `${n}× ${medida.medida!.nome}` })) : []).map((o) => (
                  <button key={o.t} type="button" className="tag" onClick={() => setGramas(String(o.g))}>
                    {o.t} · {o.g} g
                  </button>
                ))}
              </div>
            )}
            <div className="info linha entre">
              <span>
                <strong>{previa ? previa.kcal : '–'}</strong> kcal
              </span>
              <span>
                <strong>{previa ? fmt(previa.proteina) : '–'}</strong> g proteína
              </span>
            </div>
            <Botao disabled={!!erroGramas} onClick={salvar}>
              Salvar
            </Botao>
            {editando && (
              <Botao className="perigo" onClick={() => (confirmarExclusao ? excluir() : setConfirmarExclusao(true))}>
                {confirmarExclusao ? 'Toque de novo para excluir' : 'Excluir'}
              </Botao>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Folha>
  );
}
