import { useEffect, useState } from 'react';
import { fmt, hojeISO } from '../lib/calculos';
import { db, type Aplicacao, type RegistroPeso } from '../lib/db';
import { lerNumero, validar } from '../lib/validacao';
import { Botao, Campo, Folha } from './ui';

async function salvarComAviso(acao: () => Promise<unknown>, aoErro: (m: string) => void): Promise<boolean> {
  try {
    await acao();
    return true;
  } catch {
    aoErro('Não foi possível salvar. Tente novamente.');
    return false;
  }
}

export function FormAplicacao({
  aberta,
  aoFechar,
  editando,
  ultimaDose,
  aoErro,
}: {
  aberta: boolean;
  aoFechar: () => void;
  editando?: Aplicacao;
  ultimaDose?: number;
  aoErro: (m: string) => void;
}) {
  const hoje = hojeISO();
  const [data, setData] = useState(hoje);
  const [dose, setDose] = useState('');
  const [obs, setObs] = useState('');
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);

  useEffect(() => {
    if (!aberta) return;
    setData(editando?.data ?? hoje);
    setDose(editando ? fmt(editando.doseMg, editando.doseMg % 1 ? 1 : 0) : ultimaDose ? fmt(ultimaDose, ultimaDose % 1 ? 1 : 0) : '');
    setObs(editando?.observacao ?? '');
    setConfirmarExclusao(false);
  }, [aberta, editando, ultimaDose, hoje]);

  const erroData = validar.data(data, hoje);
  const erroDose = validar.dose(lerNumero(dose));

  async function salvar() {
    const registro: Aplicacao = { data, doseMg: lerNumero(dose), observacao: obs.trim() || undefined };
    const ok = await salvarComAviso(
      () => (editando?.id ? db.aplicacoes.put({ ...registro, id: editando.id }) : db.aplicacoes.add(registro)),
      aoErro,
    );
    if (ok) aoFechar();
  }

  async function excluir() {
    if (!editando?.id) return;
    const ok = await salvarComAviso(() => db.aplicacoes.delete(editando.id!), aoErro);
    if (ok) aoFechar();
  }

  return (
    <Folha aberta={aberta} aoFechar={aoFechar} titulo={editando ? 'Editar aplicação' : 'Nova aplicação'}>
      <div className="coluna">
        <Campo rotulo="Data" tipo="date" max={hoje} valor={data} onChange={setData} erro={erroData} />
        <Campo rotulo="Dose" sufixo="mg" tipo="decimal" placeholder="Ex.: 2,5" valor={dose} onChange={setDose} erro={erroDose} />
        <Campo rotulo="Observação (opcional)" multilinha placeholder="Sintomas, fome, como se sentiu…" valor={obs} onChange={setObs} />
        <Botao disabled={!!erroData || !!erroDose} onClick={salvar}>
          Salvar
        </Botao>
        {editando && (
          <Botao className="perigo" onClick={() => (confirmarExclusao ? excluir() : setConfirmarExclusao(true))}>
            {confirmarExclusao ? 'Toque de novo para excluir' : 'Excluir'}
          </Botao>
        )}
      </div>
    </Folha>
  );
}

export function FormPeso({
  aberta,
  aoFechar,
  editando,
  aoErro,
}: {
  aberta: boolean;
  aoFechar: () => void;
  editando?: RegistroPeso;
  aoErro: (m: string) => void;
}) {
  const hoje = hojeISO();
  const [data, setData] = useState(hoje);
  const [kg, setKg] = useState('');
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);

  useEffect(() => {
    if (!aberta) return;
    setData(editando?.data ?? hoje);
    setKg(editando ? fmt(editando.kg) : '');
    setConfirmarExclusao(false);
  }, [aberta, editando, hoje]);

  const erroData = validar.data(data, hoje);
  const erroKg = validar.peso(lerNumero(kg));

  async function salvar() {
    const registro: RegistroPeso = { data, kg: lerNumero(kg) };
    const ok = await salvarComAviso(
      () => (editando?.id ? db.pesos.put({ ...registro, id: editando.id }) : db.pesos.add(registro)),
      aoErro,
    );
    if (ok) aoFechar();
  }

  async function excluir() {
    if (!editando?.id) return;
    const ok = await salvarComAviso(() => db.pesos.delete(editando.id!), aoErro);
    if (ok) aoFechar();
  }

  return (
    <Folha aberta={aberta} aoFechar={aoFechar} titulo={editando ? 'Editar peso' : 'Novo peso'}>
      <div className="coluna">
        <Campo rotulo="Data" tipo="date" max={hoje} valor={data} onChange={setData} erro={erroData} />
        <Campo rotulo="Peso" sufixo="kg" tipo="decimal" placeholder="Ex.: 88,4" valor={kg} onChange={setKg} erro={erroKg} />
        <Botao disabled={!!erroData || !!erroKg} onClick={salvar}>
          Salvar
        </Botao>
        {editando && (
          <Botao className="perigo" onClick={() => (confirmarExclusao ? excluir() : setConfirmarExclusao(true))}>
            {confirmarExclusao ? 'Toque de novo para excluir' : 'Excluir'}
          </Botao>
        )}
      </div>
    </Folha>
  );
}
