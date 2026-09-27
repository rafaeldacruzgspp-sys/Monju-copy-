import { AnimatePresence, motion } from 'motion/react';
import { useState, type ReactNode } from 'react';
import { AlertaRitmo, CartaoEstudos, SeletorPrazo } from '../components/PrazoInfo';
import { Aviso, BarraProgresso, Botao, Campo, Icone, SeloImc } from '../components/ui';
import { hojeISO } from '../lib/calculos';
import { db, type NivelAtividade, type Sexo } from '../lib/db';
import { lerNumero, validar } from '../lib/validacao';

export const NIVEIS: { valor: NivelAtividade; titulo: string; descricao: string }[] = [
  { valor: 'sedentario', titulo: 'Sedentário', descricao: 'Pouca ou nenhuma atividade física' },
  { valor: 'leve', titulo: 'Leve', descricao: 'Exercício leve 1 a 3 vezes por semana' },
  { valor: 'moderado', titulo: 'Moderado', descricao: 'Exercício moderado 3 a 5 vezes por semana' },
  { valor: 'intenso', titulo: 'Intenso', descricao: 'Exercício intenso 6 a 7 vezes por semana' },
];

interface Respostas {
  nome: string;
  sexo: Sexo | '';
  idade: string;
  altura: string;
  pesoInicial: string;
  pesoAtual: string;
  inicio: string;
  atividade: NivelAtividade | '';
  meta: string;
  prazo: number;
}

const variantes = {
  entra: (dir: number) => ({ x: dir * 60, opacity: 0 }),
  centro: { x: 0, opacity: 1 },
  sai: (dir: number) => ({ x: dir * -60, opacity: 0 }),
};

export function Entrevista() {
  const hoje = hojeISO();
  const [passo, setPasso] = useState(0);
  const [dir, setDir] = useState(1);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [r, setR] = useState<Respostas>({
    nome: '',
    sexo: '',
    idade: '',
    altura: '',
    pesoInicial: '',
    pesoAtual: '',
    inicio: '',
    atividade: '',
    meta: '',
    prazo: 8,
  });
  const set = <K extends keyof Respostas>(k: K, v: Respostas[K]) => setR((x) => ({ ...x, [k]: v }));

  const altura = lerNumero(r.altura);
  const atual = lerNumero(r.pesoAtual);
  const meta = lerNumero(r.meta);

  const passos: { pergunta: string; ajuda?: string; erro: string | null; conteudo: ReactNode }[] = [
    {
      pergunta: 'Como você se chama?',
      erro: validar.nome(r.nome),
      conteudo: <Campo rotulo="Nome" valor={r.nome} onChange={(v) => set('nome', v)} erro={validar.nome(r.nome)} />,
    },
    {
      pergunta: 'Qual o seu sexo?',
      ajuda: 'Usado na fórmula de gasto calórico.',
      erro: r.sexo ? null : 'Escolha uma opção',
      conteudo: (
        <Opcoes
          valor={r.sexo}
          onChange={(v) => {
            set('sexo', v as Sexo);
            avancar();
          }}
          opcoes={[
            { valor: 'F', titulo: 'Feminino' },
            { valor: 'M', titulo: 'Masculino' },
          ]}
        />
      ),
    },
    {
      pergunta: 'Qual a sua idade?',
      erro: validar.idade(lerNumero(r.idade)),
      conteudo: (
        <Campo rotulo="Idade" sufixo="anos" tipo="numeric" valor={r.idade} onChange={(v) => set('idade', v)} erro={validar.idade(lerNumero(r.idade))} />
      ),
    },
    {
      pergunta: 'Qual a sua altura?',
      erro: validar.altura(altura),
      conteudo: (
        <Campo rotulo="Altura" sufixo="cm" tipo="numeric" placeholder="Ex.: 165" valor={r.altura} onChange={(v) => set('altura', v)} erro={validar.altura(altura)} />
      ),
    },
    {
      pergunta: 'Quanto você pesava quando começou o tratamento?',
      erro: validar.peso(lerNumero(r.pesoInicial)),
      conteudo: (
        <Campo rotulo="Peso inicial" sufixo="kg" tipo="decimal" valor={r.pesoInicial} onChange={(v) => set('pesoInicial', v)} erro={validar.peso(lerNumero(r.pesoInicial))} />
      ),
    },
    {
      pergunta: 'E quanto você pesa hoje?',
      erro: validar.peso(atual),
      conteudo: (
        <div className="coluna">
          <Campo rotulo="Peso atual" sufixo="kg" tipo="decimal" valor={r.pesoAtual} onChange={(v) => set('pesoAtual', v)} erro={validar.peso(atual)} />
          {!validar.peso(atual) && !validar.altura(altura) && <SeloImc pesoKg={atual} alturaCm={altura} />}
        </div>
      ),
    },
    {
      pergunta: 'Quando você começou o GLP-1?',
      ajuda: 'Data da primeira aplicação.',
      erro: validar.data(r.inicio, hoje),
      conteudo: <Campo rotulo="Início do tratamento" tipo="date" max={hoje} valor={r.inicio} onChange={(v) => set('inicio', v)} erro={validar.data(r.inicio, hoje)} />,
    },
    {
      pergunta: 'Qual o seu nível de atividade física?',
      erro: r.atividade ? null : 'Escolha uma opção',
      conteudo: (
        <Opcoes
          valor={r.atividade}
          onChange={(v) => {
            set('atividade', v as NivelAtividade);
            avancar();
          }}
          opcoes={NIVEIS}
        />
      ),
    },
    {
      pergunta: 'Qual a sua meta de peso?',
      erro: validar.meta(meta, atual),
      conteudo: (
        <div className="coluna">
          <Campo rotulo="Meta" sufixo="kg" tipo="decimal" valor={r.meta} onChange={(v) => set('meta', v)} erro={validar.meta(meta, atual)} />
          <div className="card" style={{ margin: 0 }}>
            <div className="coluna">
              <div>
                <div className="card-rotulo">Hoje · {r.pesoAtual} kg</div>
                <SeloImc pesoKg={atual} alturaCm={altura} />
              </div>
              <AnimatePresence>
                {!validar.meta(meta, atual) && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <div className="card-rotulo">Na meta · {r.meta} kg</div>
                    <SeloImc pesoKg={meta} alturaCm={altura} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      ),
    },
    {
      pergunta: 'Em quanto tempo quer chegar lá?',
      ajuda: 'Escolha o prazo em semanas.',
      erro: validar.prazo(r.prazo),
      conteudo: (
        <div className="coluna">
          <SeletorPrazo valor={r.prazo} onChange={(n) => set('prazo', n)} />
          <AlertaRitmo
            atualKg={atual}
            metaKg={meta}
            semanas={r.prazo}
            aoUsarPrazo={(n) => set('prazo', n)}
            aoUsarMeta={(kg) => set('meta', String(kg).replace('.', ','))}
          />
          <CartaoEstudos />
        </div>
      ),
    },
  ];

  const total = passos.length;
  const atualPasso = passos[passo];

  function avancar() {
    setDir(1);
    setPasso((p) => Math.min(p + 1, total - 1));
  }

  function voltar() {
    setDir(-1);
    setPasso((p) => Math.max(p - 1, 0));
  }

  async function concluir() {
    try {
      await db.transaction('rw', db.perfil, db.pesos, async () => {
        await db.perfil.put({
          id: 1,
          nome: r.nome.trim(),
          sexo: r.sexo as Sexo,
          idade: lerNumero(r.idade),
          idadeInformadaEm: hoje,
          alturaCm: altura,
          pesoInicialKg: lerNumero(r.pesoInicial),
          inicioTratamento: r.inicio,
          nivelAtividade: r.atividade as NivelAtividade,
          metaKg: meta,
          prazoSemanas: r.prazo,
          metaDefinidaEm: hoje,
          intervaloDoseDias: 7,
        });
        await db.pesos.add({ data: hoje, kg: atual });
      });
      navigator.storage?.persist?.().catch(() => {});
    } catch {
      setErroSalvar('Não foi possível salvar. Tente novamente.');
      setTimeout(() => setErroSalvar(null), 4000);
    }
  }

  return (
    <div className="onb">
      <Aviso texto={erroSalvar} />
      <div className="onb-topo">
        <motion.button
          className="onb-voltar"
          aria-label="Voltar"
          onClick={voltar}
          animate={{ opacity: passo === 0 ? 0 : 1 }}
          style={{ pointerEvents: passo === 0 ? 'none' : 'auto' }}
        >
          {Icone.voltar}
        </motion.button>
        <div style={{ flex: 1 }}>
          <BarraProgresso fracao={(passo + 1) / total} atraso={0} />
        </div>
        <span className="suave" style={{ fontVariantNumeric: 'tabular-nums', minWidth: 42, textAlign: 'right' }}>
          {passo + 1}/{total}
        </span>
      </div>

      <div className="onb-corpo">
        {passo === 0 && (
          <motion.div className="logo" initial={{ scale: 0.6, rotate: -10, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }} style={{ marginBottom: 24 }}>
            m
          </motion.div>
        )}
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={passo}
            custom={dir}
            variants={variantes}
            initial="entra"
            animate="centro"
            exit="sai"
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <h1 className="onb-pergunta">{atualPasso.pergunta}</h1>
            {atualPasso.ajuda && <p className="onb-ajuda">{atualPasso.ajuda}</p>}
            {!atualPasso.ajuda && <div style={{ height: 16 }} />}
            {atualPasso.conteudo}
          </motion.div>
        </AnimatePresence>
      </div>

      <Botao disabled={!!atualPasso.erro} onClick={passo === total - 1 ? concluir : avancar}>
        {passo === total - 1 ? 'Começar' : 'Continuar'}
      </Botao>
    </div>
  );
}

export function Opcoes({
  valor,
  onChange,
  opcoes,
}: {
  valor: string;
  onChange: (v: string) => void;
  opcoes: { valor: string; titulo: string; descricao?: string }[];
}) {
  return (
    <div className="opcoes" role="radiogroup">
      {opcoes.map((o) => (
        <motion.button
          key={o.valor}
          type="button"
          role="radio"
          aria-checked={valor === o.valor}
          className={`opcao ${valor === o.valor ? 'ativa' : ''}`}
          whileTap={{ scale: 0.97 }}
          onClick={() => onChange(o.valor)}
        >
          <strong>{o.titulo}</strong>
          {o.descricao && <span>{o.descricao}</span>}
        </motion.button>
      ))}
    </div>
  );
}
