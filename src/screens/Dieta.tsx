import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { GARRAFAS, Garrafa, Ultimos7Dias, adicionarAgua, desfazerAgua, litros, totalDoDia } from '../components/Agua';
import { BarrasCalorias, FormComida, totaisDiario } from '../components/Comida';
import { GerandoPlano } from '../components/GerandoPlano';
import { FormPreferencias } from '../components/Preferencias';
import { Botao, Campo, Card, EmojiTile, Folha, Icone } from '../components/ui';
import { CATEGORIAS, type CategoriaDiario } from '../data/alimentos';
import { fmtData, hojeISO, somarDias } from '../lib/calculos';
import { db, type RegistroDiario } from '../lib/db';
import { segundaDaSemana, type MetasDoDia } from '../lib/metas';
import { metaAgua } from '../lib/nutricao';
import { VERSAO_GERADOR, gerarSemana, listaDeCompras, quantidadeCompra, totaisDia, trocarItem, type Preferencias } from '../lib/plano';
import { categoriaDe, descreverPorcao, emojiDe, nomeDe } from '../lib/taco';
import { lerNumero, validar } from '../lib/validacao';
import type { Dados } from '../App';

type Secao = 'plano' | 'diario' | 'agua';
const SECOES: { id: Secao; nome: string }[] = [
  { id: 'plano', nome: '🗓️ Plano' },
  { id: 'diario', nome: '📒 Diário' },
  { id: 'agua', nome: '💧 Água' },
];

export function Dieta({ dados, metas, aoErro }: { dados: Dados; metas: MetasDoDia; aoErro: (m: string) => void }) {
  const [secao, setSecao] = useState<Secao>('plano');
  const [editandoPref, setEditandoPref] = useState(false);

  if (!dados.preferencias) {
    return (
      <div className="tela">
        <h1 className="titulo-tela">Dieta</h1>
        <p className="subtitulo">Antes do primeiro plano, conte um pouco sobre seus hábitos.</p>
        <Card>
          <FormPreferencias atual={null} aoSalvar={() => {}} aoErro={aoErro} />
        </Card>
      </div>
    );
  }

  return (
    <div className="tela">
      <div className="linha entre">
        <h1 className="titulo-tela">
          Sua <em>dieta</em>
        </h1>
        <Botao className="secundario pequeno" onClick={() => setEditandoPref(true)}>
          ⚙️ Preferências
        </Botao>
      </div>

      <div className="segmentos" role="tablist">
        {SECOES.map((s) => (
          <button key={s.id} role="tab" aria-selected={secao === s.id} className={secao === s.id ? 'ativa' : ''} onClick={() => setSecao(s.id)}>
            {secao === s.id && <motion.span layoutId="segmento" className="segmento-marca" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
            <span style={{ position: 'relative' }}>{s.nome}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={secao} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.16 }}>
          {secao === 'plano' && <Plano dados={dados} metas={metas} aoErro={aoErro} />}
          {secao === 'diario' && <Diario dados={dados} metas={metas} aoErro={aoErro} />}
          {secao === 'agua' && <AguaTela dados={dados} metas={metas} aoErro={aoErro} />}
        </motion.div>
      </AnimatePresence>

      <Folha aberta={editandoPref} aoFechar={() => setEditandoPref(false)} titulo="Preferências">
        <FormPreferencias atual={dados.preferencias} aoSalvar={() => setEditandoPref(false)} aoErro={aoErro} />
      </Folha>
    </div>
  );
}

// ---------- Plano ----------

const DIAS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];

const EMOJI_REFEICAO: Record<string, string> = {
  'Café da manhã': '☕',
  'Lanche da manhã': '🍎',
  Almoço: '🍽️',
  'Lanche da tarde': '🧁',
  Jantar: '🌙',
  Ceia: '🌛',
};

function Plano({ dados, metas, aoErro }: { dados: Dados; metas: MetasDoDia; aoErro: (m: string) => void }) {
  const hoje = hojeISO();
  const inicio = segundaDaSemana(hoje);
  const indiceHoje = Math.round((Date.parse(hoje) - Date.parse(inicio)) / 86_400_000);
  const [dia, setDia] = useState(indiceHoje);
  const [compras, setCompras] = useState(false);
  const [confirmarNova, setConfirmarNova] = useState(false);
  const pref = dados.preferencias!;
  const plano = dados.planos.find((p) => p.inicio === inicio);
  const prefPlano: Preferencias = { refeicoesPorDia: pref.refeicoesPorDia, naoCome: pref.naoCome, favoritos: pref.favoritos };
  const metasPlano = { kcal: metas.kcal, proteina: metas.proteina };
  const gerando = useRef(false);
  const [telaGerando, setTelaGerando] = useState(false);
  const primeiroNome = dados.perfil.nome.trim().split(/\s+/)[0];

  // Gera automaticamente quando não há plano para a semana ou as preferências mudaram.
  const assinatura = JSON.stringify(prefPlano);
  const desatualizado = !!plano?.preferencias && plano.preferencias !== assinatura;
  const geradorAntigo = !!plano && (plano.versao ?? 1) < VERSAO_GERADOR;

  async function gerar(semente = Date.now() % 2_147_483_647) {
    setTelaGerando(true);
    try {
      await db.planos.put({
        inicio,
        semente,
        geradoEm: hoje,
        dias: gerarSemana(metasPlano, prefPlano, semente),
        comprados: [],
        preferencias: assinatura,
        versao: VERSAO_GERADOR,
      });
    } catch {
      aoErro('Não foi possível salvar o plano. Tente novamente.');
    }
  }

  useEffect(() => {
    if (!plano && !gerando.current) {
      gerando.current = true;
      gerar().finally(() => (gerando.current = false));
    }
  }, [plano]); // eslint-disable-line react-hooks/exhaustive-deps

  async function trocar(ri: number, ii: number) {
    if (!plano) return;
    const dias = [...plano.dias];
    dias[dia] = trocarItem(dias[dia], ri, ii, metasPlano, prefPlano, (Date.now() + ri * 31 + ii) % 2_147_483_647);
    try {
      await db.planos.update(inicio, { dias });
    } catch {
      aoErro('Não foi possível salvar. Tente novamente.');
    }
  }

  async function marcarComprado(id: string) {
    if (!plano) return;
    const comprados = plano.comprados.includes(id) ? plano.comprados.filter((x) => x !== id) : [...plano.comprados, id];
    await db.planos.update(inicio, { comprados }).catch(() => aoErro('Não foi possível salvar.'));
  }

  const diaPlano = plano?.dias[dia];
  const totais = diaPlano ? totaisDia(diaPlano) : null;
  const ultimaRecal = pref.ultimaRecalibracao;

  return (
    <div>
      <AnimatePresence>{telaGerando && <GerandoPlano nome={primeiroNome} sexo={dados.perfil.sexo} aoConcluir={() => setTelaGerando(false)} />}</AnimatePresence>
      <Card>
        <div className="card-rotulo">🎯 Metas do dia</div>
        <div className="metas">
          <div>
            <span className="meta-emoji">🔥</span>
            <strong>{metas.kcal.toLocaleString('pt-BR')}</strong>
            <small className="suave">kcal</small>
          </div>
          <div>
            <span className="meta-emoji">💪</span>
            <strong>{metas.proteina} g</strong>
            <small className="suave">proteína</small>
          </div>
          <div>
            <span className="meta-emoji">💧</span>
            <strong>{litros(metas.aguaMl)}</strong>
            <small className="suave">água</small>
          </div>
        </div>
        {metas.calorias.limitadaAoPiso && <small className="suave">Meta limitada ao mínimo seguro.</small>}
        {ultimaRecal && pref.ajusteKcal !== 0 && (
          <small className="suave" style={{ display: 'block', marginTop: 6 }}>
            Sua meta foi recalibrada em {pref.ajusteKcal > 0 ? '+' : '−'}
            {Math.abs(pref.ajusteKcal)} kcal (última em {fmtData(ultimaRecal, { day: '2-digit', month: '2-digit' })}).
          </small>
        )}
      </Card>

      {geradorAntigo && !desatualizado && (
        <div className="info" style={{ marginBottom: 14 }}>
          <strong>Novidades no plano: café da manhã com bebida e um docinho por dia 🍫</strong>
          <Botao className="pequeno" style={{ marginTop: 8 }} onClick={() => gerar()}>
            Gerar a semana com as novidades
          </Botao>
        </div>
      )}

      {desatualizado && (
        <div className="aviso" style={{ marginBottom: 14 }}>
          <strong>Suas preferências mudaram</strong>
          <Botao className="secundario pequeno" style={{ marginTop: 8 }} onClick={() => gerar()}>
            Gerar de novo com as novas preferências
          </Botao>
        </div>
      )}

      <div className="dias" role="tablist">
        {DIAS.map((d, i) => (
          <button key={d} role="tab" aria-selected={dia === i} className={`${dia === i ? 'ativa' : ''} ${i === indiceHoje ? 'hoje' : ''}`} onClick={() => setDia(i)}>
            <span>{d}</span>
            <small>{fmtData(somarDias(inicio, i), { day: '2-digit' })}</small>
          </button>
        ))}
      </div>

      {totais && (
        <p className="suave" style={{ margin: '0 0 10px', textAlign: 'center' }}>
          Total do dia: <strong>{totais.kcal.toLocaleString('pt-BR')} kcal</strong> · <strong>{totais.proteina} g</strong> de proteína
        </p>
      )}

      <AnimatePresence mode="wait">
        <motion.div key={dia} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.16 }}>
          {diaPlano?.refeicoes.map((r, ri) => {
            const t = totaisDia({ refeicoes: [r] });
            return (
              <motion.div
                key={ri}
                className="card refeicao"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: ri * 0.05, type: 'spring', stiffness: 320, damping: 28 }}
              >
                <div className="refeicao-topo">
                  <span className="refeicao-emoji" aria-hidden="true">
                    {EMOJI_REFEICAO[r.nome] ?? '🍽️'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong>{r.nome}</strong>
                    <small className="suave">🕒 {r.horario}</small>
                  </div>
                  <div className="coluna" style={{ gap: 4, alignItems: 'flex-end' }}>
                    <span className="pill">🔥 {t.kcal} kcal</span>
                    <span className="pill">💪 {t.proteina} g</span>
                  </div>
                </div>
                {r.faltando && <small className="erro-msg">Sem opções de {r.faltando.join(', ')} — revise suas preferências.</small>}
                <ul className="lista">
                  {r.itens.map((it, ii) => (
                    <motion.li key={`${it.alimentoId}-${ii}`} layout className="item" style={{ cursor: 'default' }} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
                      <EmojiTile emoji={emojiDe(it.alimentoId)} categoria={categoriaDe(it.alimentoId)} />
                      <div className="item-corpo">
                        <strong>
                          {nomeDe(it.alimentoId)} {categoriaDe(it.alimentoId) === 'doce' && <span className="pill doce">docinho do dia</span>}
                        </strong>
                        <small>{it.aVontade ? '🥗 à vontade' : descreverPorcao(it.alimentoId, it.gramas)}</small>
                      </div>
                      <motion.button whileTap={{ scale: 0.9, rotate: 180 }} type="button" className="btn-trocar" aria-label={`Trocar ${nomeDe(it.alimentoId)}`} onClick={() => trocar(ri, ii)}>
                        ⇄
                      </motion.button>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      <div className="coluna" style={{ marginTop: 4 }}>
        <Botao className="secundario" onClick={() => setCompras(true)}>
          🛒 Lista de compras da semana
        </Botao>
        <Botao
          className={confirmarNova ? 'perigo' : 'secundario'}
          onClick={() => {
            if (confirmarNova) {
              gerar();
              setConfirmarNova(false);
            } else setConfirmarNova(true);
          }}
        >
          {confirmarNova ? 'Toque de novo para gerar outra semana' : '↻ Gerar nova semana'}
        </Botao>
      </div>

      <Folha aberta={compras} aoFechar={() => setCompras(false)} titulo="Lista de compras">
        {plano &&
          listaDeCompras(plano.dias).map((g) => (
            <div key={g.categoria} style={{ marginBottom: 12 }}>
              <div className="card-rotulo">{g.categoria}</div>
              <ul className="lista">
                {g.itens.map((i) => {
                  const ok = plano.comprados.includes(i.alimentoId);
                  return (
                    <li key={i.alimentoId} className="item" onClick={() => marcarComprado(i.alimentoId)}>
                      <motion.span className={`check ${ok ? 'ok' : ''}`} animate={{ scale: ok ? [1, 1.25, 1] : 1 }}>
                        {ok ? '✓' : ''}
                      </motion.span>
                      <EmojiTile emoji={emojiDe(i.alimentoId)} categoria={categoriaDe(i.alimentoId)} pequeno />
                      <div className="item-corpo" style={{ textDecoration: ok ? 'line-through' : undefined, opacity: ok ? 0.5 : 1 }}>
                        <strong>{nomeDe(i.alimentoId)}</strong>
                      </div>
                      <span className="suave">{i.aVontade ? 'à vontade' : quantidadeCompra(i)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
      </Folha>
    </div>
  );
}

// ---------- Diário ----------

function Diario({ dados, metas, aoErro }: { dados: Dados; metas: MetasDoDia; aoErro: (m: string) => void }) {
  const hoje = hojeISO();
  const [data, setData] = useState(hoje);
  const [form, setForm] = useState<{ categoria?: CategoriaDiario; editando?: RegistroDiario } | null>(null);
  const t = totaisDiario(dados.diario, data);
  const doDia = dados.diario.filter((r) => r.data === data);

  return (
    <div>
      <div className="linha entre" style={{ marginBottom: 12 }}>
        <button className="onb-voltar" aria-label="Dia anterior" onClick={() => setData(somarDias(data, -1))}>
          {Icone.voltar}
        </button>
        <strong>{data === hoje ? 'Hoje' : data === somarDias(hoje, -1) ? 'Ontem' : fmtData(data, { weekday: 'long', day: '2-digit', month: '2-digit' })}</strong>
        <button className="onb-voltar" aria-label="Próximo dia" disabled={data >= hoje} style={{ transform: 'scaleX(-1)', opacity: data >= hoje ? 0.3 : 1 }} onClick={() => setData(somarDias(data, 1))}>
          {Icone.voltar}
        </button>
      </div>

      <Card>
        <BarrasCalorias kcal={t.kcal} proteina={t.proteina} metaKcal={metas.kcal} metaProteina={metas.proteina} />
      </Card>

      <div className="grade-categorias">
        {CATEGORIAS.map((c) => (
          <motion.button key={c.id} whileTap={{ scale: 0.94 }} className={`categoria cat-${c.id}`} onClick={() => setForm({ categoria: c.id })}>
            <span style={{ fontSize: 26 }}>{c.emoji}</span>
            <span>{c.nome}</span>
          </motion.button>
        ))}
      </div>

      {CATEGORIAS.filter((c) => doDia.some((r) => r.categoria === c.id)).map((c) => (
        <div key={c.id} className="card">
          <div className="card-rotulo">
            {c.emoji} {c.nome}
          </div>
          <ul className="lista">
            <AnimatePresence initial={false}>
              {doDia
                .filter((r) => r.categoria === c.id)
                .map((r) => (
                  <motion.li key={r.id} layout className="item" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }} onClick={() => setForm({ editando: r })}>
                    <EmojiTile emoji={emojiDe(r.alimentoId)} categoria={r.categoria} pequeno />
                    <div className="item-corpo">
                      <strong>{r.nome}</strong>
                      <small>
                        {r.gramas} g · {Math.round(r.proteina)} g proteína
                      </small>
                    </div>
                    <span style={{ fontWeight: 700 }}>{Math.round(r.kcal)} kcal</span>
                  </motion.li>
                ))}
            </AnimatePresence>
          </ul>
        </div>
      ))}
      {doDia.length === 0 && <div className="vazio">Nada registrado neste dia. Toque numa categoria para adicionar.</div>}

      <FormComida aberta={!!form} aoFechar={() => setForm(null)} data={data} categoriaInicial={form?.categoria} editando={form?.editando} aoErro={aoErro} />
    </div>
  );
}

// ---------- Água ----------

function AguaTela({ dados, metas, aoErro }: { dados: Dados; metas: MetasDoDia; aoErro: (m: string) => void }) {
  const hoje = hojeISO();
  const total = totalDoDia(dados.agua, hoje);
  const pref = dados.preferencias!;
  const [editandoMeta, setEditandoMeta] = useState(false);
  const [meta, setMeta] = useState(String(metas.aguaMl));
  const erroMeta = validar.aguaManual(lerNumero(meta));
  const deHoje = dados.agua.filter((r) => r.data === hoje).sort((a, b) => (b.id ?? 0) - (a.id ?? 0));

  async function salvarMeta(manual: number | undefined) {
    try {
      await db.preferencias.update(1, { metaAguaManualMl: manual });
      setEditandoMeta(false);
    } catch {
      aoErro('Não foi possível salvar. Tente novamente.');
    }
  }

  return (
    <div>
      <Card>
        <div className="linha" style={{ gap: 18 }}>
          <Garrafa fracao={total / metas.aguaMl} tamanho={150} />
          <div className="coluna" style={{ flex: 1, gap: 6 }}>
            <div className="grande" style={{ fontSize: 34 }}>
              {litros(total)}
            </div>
            <span className="suave">de {litros(metas.aguaMl)} hoje</span>
            <small className="suave">{pref.metaAguaManualMl ? 'Meta manual' : `35 ml × ${metas.pesoAtual.toLocaleString('pt-BR')} kg`}</small>
            <button className="btn texto" style={{ alignSelf: 'flex-start', padding: '4px 0' }} onClick={() => { setMeta(String(metas.aguaMl)); setEditandoMeta(true); }}>
              Ajustar meta
            </button>
          </div>
        </div>
        <div className="grade-3" style={{ marginTop: 14 }}>
          {GARRAFAS.map((g) => (
            <Botao key={g.ml} className="agua" style={{ width: '100%' }} onClick={() => adicionarAgua(g.ml).catch(() => aoErro('Não foi possível salvar.'))}>
              {g.rotulo}
            </Botao>
          ))}
        </div>
        <Botao className="secundario pequeno" style={{ width: '100%', marginTop: 10 }} disabled={deHoje.length === 0} onClick={() => desfazerAgua(dados.agua).catch(() => aoErro('Não foi possível desfazer.'))}>
          Desfazer último
        </Botao>
      </Card>

      <Card>
        <div className="card-rotulo">Últimos 7 dias</div>
        <Ultimos7Dias registros={dados.agua} metaMl={metas.aguaMl} />
      </Card>

      {deHoje.length > 0 && (
        <Card>
          <div className="card-rotulo">Hoje</div>
          <ul className="lista">
            {deHoje.map((r) => (
              <li key={r.id} className="item" style={{ cursor: 'default' }}>
                <EmojiTile emoji="💧" categoria="laticinio" pequeno />
                <div className="item-corpo">
                  <strong>{litros(r.ml)}</strong>
                  <small>{r.hora}</small>
                </div>
                <button className="btn texto" onClick={() => db.agua.delete(r.id!).catch(() => aoErro('Não foi possível excluir.'))}>
                  Excluir
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Folha aberta={editandoMeta} aoFechar={() => setEditandoMeta(false)} titulo="Meta de água">
        <div className="coluna">
          <Campo rotulo="Meta diária" sufixo="ml" tipo="numeric" valor={meta} onChange={setMeta} erro={erroMeta} />
          <Botao disabled={!!erroMeta} onClick={() => salvarMeta(lerNumero(meta))}>
            Salvar
          </Botao>
          {pref.metaAguaManualMl && (
            <Botao className="secundario" onClick={() => salvarMeta(undefined)}>
              Voltar ao cálculo automático ({litros(metaAgua(metas.pesoAtual))})
            </Botao>
          )}
        </div>
      </Folha>
    </div>
  );
}
