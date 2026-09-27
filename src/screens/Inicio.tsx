import { motion } from 'motion/react';
import { useState } from 'react';
import { FormAplicacao, FormPeso } from '../components/Formularios';
import { BarraProgresso, Botao, Card, Icone, NumeroAnimado, SeloImc } from '../components/ui';
import {
  RITMO_SEGURO_KG_SEMANA,
  diffDias,
  estadoProximaDose,
  fmt,
  fmtData,
  hojeISO,
  progresso,
  ritmoNecessario,
  semanasDeTratamento,
  somarDias,
} from '../lib/calculos';
import { maisRecente, pesoNaData } from '../lib/db';
import type { Dados } from '../App';

export function Inicio({ dados, aoErro, irParaPerfil }: { dados: Dados; aoErro: (m: string) => void; irParaPerfil: () => void }) {
  const { perfil, aplicacoes, pesos } = dados;
  const hoje = hojeISO();
  const [form, setForm] = useState<'aplicacao' | 'peso' | null>(null);

  const ultimaAplicacao = maisRecente(aplicacoes);
  const dose = estadoProximaDose(ultimaAplicacao?.data, perfil.intervaloDoseDias, hoje);

  const atual = maisRecente(pesos)?.kg ?? perfil.pesoInicialKg;
  const base = perfil.pesoInicialKg > perfil.metaKg ? perfil.pesoInicialKg : (pesoNaData(pesos, perfil.metaDefinidaEm) ?? atual);
  const fracao = progresso(base, atual, perfil.metaKg);
  const perdido = perfil.pesoInicialKg - atual;
  const metaAtingida = atual <= perfil.metaKg;

  const fimPrazo = somarDias(perfil.metaDefinidaEm, perfil.prazoSemanas * 7);
  const diasRestantes = diffDias(hoje, fimPrazo);
  const semanasRestantes = Math.max(1, Math.ceil(diasRestantes / 7));
  const ritmo = ritmoNecessario(atual, perfil.metaKg, semanasRestantes);
  const semanas = semanasDeTratamento(perfil.inicioTratamento, hoje);

  const doseTexto = (() => {
    switch (dose.tipo) {
      case 'sem-registro':
        return { titulo: 'Registre sua primeira aplicação', detalhe: 'para acompanhar a próxima dose', cor: undefined };
      case 'futura':
        return {
          titulo: dose.dias === 1 ? 'Próxima dose amanhã' : `Próxima dose em ${dose.dias} dias`,
          detalhe: fmtData(dose.data, { weekday: 'short', day: '2-digit', month: '2-digit' }),
          cor: undefined,
        };
      case 'hoje':
        return { titulo: 'Dose hoje', detalhe: 'Não esqueça de registrar', cor: 'var(--verde-forte)' };
      case 'atrasada':
        return {
          titulo: `Dose atrasada há ${dose.dias} ${dose.dias === 1 ? 'dia' : 'dias'}`,
          detalhe: `Prevista para ${fmtData(dose.data, { day: '2-digit', month: '2-digit' })}`,
          cor: 'var(--alerta)',
        };
    }
  })();

  return (
    <div className="tela">
      <motion.h1 className="titulo-tela" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        Olá, {perfil.nome.split(' ')[0]}
      </motion.h1>
      <p className="subtitulo">
        {semanas === 0 ? 'Primeira semana de tratamento' : `${semanas} ${semanas === 1 ? 'semana' : 'semanas'} de tratamento`}
      </p>

      <motion.div className="hero" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }}>
        <div className="card-rotulo" style={{ color: 'rgb(255 255 255 / 0.8)' }}>
          Peso atual
        </div>
        <div className="linha entre" style={{ alignItems: 'flex-end' }}>
          <div className="grande">
            <NumeroAnimado valor={atual} /> <span style={{ fontSize: 20 }}>kg</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="medio">
              {perdido >= 0 ? '−' : '+'}
              <NumeroAnimado valor={Math.abs(perdido)} /> kg
            </div>
            <small className="suave">desde o início</small>
          </div>
        </div>
        <div style={{ margin: '18px 0 8px' }}>
          <BarraProgresso fracao={fracao} />
        </div>
        <div className="linha entre">
          <small className="suave">{Math.round(fracao * 100)}% do caminho</small>
          <small className="suave">Meta {fmt(perfil.metaKg)} kg</small>
        </div>
      </motion.div>

      {metaAtingida ? (
        <Card atraso={0.05}>
          <div className="medio">Meta atingida! 🎉</div>
          <p className="suave">Você chegou a {fmt(perfil.metaKg)} kg. Que tal definir uma nova meta?</p>
          <Botao className="secundario" onClick={irParaPerfil}>
            Definir nova meta
          </Botao>
        </Card>
      ) : (
        <Card atraso={0.05}>
          <div className="card-rotulo">Meta</div>
          <div className="coluna">
            <SeloImc pesoKg={atual} alturaCm={perfil.alturaCm} />
            <div className="linha entre">
              <span className="suave">
                {diasRestantes > 0 ? `Faltam ${semanasRestantes} ${semanasRestantes === 1 ? 'semana' : 'semanas'}` : 'Prazo encerrado'}
              </span>
              <span>
                <strong>{fmt(atual - perfil.metaKg)} kg</strong> <span className="suave">até a meta</span>
              </span>
            </div>
            {diasRestantes <= 0 ? (
              <div className="aviso">
                <strong>Prazo da meta encerrado</strong>
                Defina um novo prazo no Perfil.
              </div>
            ) : (
              ritmo > RITMO_SEGURO_KG_SEMANA + 1e-9 && (
                <div className="aviso">
                  <strong>Ritmo acima do seguro</strong>
                  Faltam {fmt(ritmo)} kg por semana para cumprir o prazo (seguro: até 1 kg/semana).
                </div>
              )
            )}
          </div>
        </Card>
      )}

      <Card atraso={0.1}>
        <div className="linha">
          <div className="item-icone" style={dose.tipo === 'atrasada' ? { background: 'var(--alerta-suave)', color: 'var(--alerta)' } : undefined}>
            {Icone.calendario}
          </div>
          <div className="item-corpo">
            <div className="medio" style={{ fontSize: 19, color: doseTexto.cor }}>
              {doseTexto.titulo}
            </div>
            <small className="suave">{doseTexto.detalhe}</small>
          </div>
        </div>
      </Card>

      <motion.div className="grade-2" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Botao onClick={() => setForm('aplicacao')}>
          {Icone.mais} Aplicação
        </Botao>
        <Botao onClick={() => setForm('peso')}>
          {Icone.mais} Peso
        </Botao>
      </motion.div>

      <FormAplicacao aberta={form === 'aplicacao'} aoFechar={() => setForm(null)} ultimaDose={ultimaAplicacao?.doseMg} aoErro={aoErro} />
      <FormPeso aberta={form === 'peso'} aoFechar={() => setForm(null)} aoErro={aoErro} />
    </div>
  );
}
