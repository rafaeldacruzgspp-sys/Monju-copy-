import { useRef, useState } from 'react';
import { AlertaRitmo, CartaoEstudos, SeletorPrazo } from '../components/PrazoInfo';
import { Botao, Card, Campo, Icone, SeloImc } from '../components/ui';
import { apagarTudo, exportarBackup, importarBackup } from '../lib/backup';
import { fmt, hojeISO, idadeAtual } from '../lib/calculos';
import { db, maisRecente, type NivelAtividade, type Sexo } from '../lib/db';
import { lerNumero, validar } from '../lib/validacao';
import { NIVEIS, Opcoes } from './Entrevista';
import type { Dados } from '../App';

const num = (n: number, casas = 1) => fmt(n, n % 1 ? casas : 0);

export function Perfil({ dados, aoErro, abrirSobre }: { dados: Dados; aoErro: (m: string) => void; abrirSobre: () => void }) {
  const { perfil } = dados;
  const hoje = hojeISO();
  const atual = maisRecente(dados.pesos)?.kg ?? perfil.pesoInicialKg;

  const [nome, setNome] = useState(perfil.nome);
  const [sexo, setSexo] = useState<Sexo>(perfil.sexo);
  const [idade, setIdade] = useState(String(idadeAtual(perfil.idade, perfil.idadeInformadaEm, hoje)));
  const [altura, setAltura] = useState(num(perfil.alturaCm));
  const [pesoInicial, setPesoInicial] = useState(num(perfil.pesoInicialKg));
  const [inicio, setInicio] = useState(perfil.inicioTratamento);
  const [atividade, setAtividade] = useState<NivelAtividade>(perfil.nivelAtividade);
  const [meta, setMeta] = useState(num(perfil.metaKg));
  const [prazo, setPrazo] = useState(perfil.prazoSemanas);
  const [intervalo, setIntervalo] = useState(String(perfil.intervaloDoseDias));
  const [salvo, setSalvo] = useState(false);
  const [confirmarApagar, setConfirmarApagar] = useState(0);
  const [confirmarImportar, setConfirmarImportar] = useState<string | null>(null);
  const arquivoRef = useRef<HTMLInputElement>(null);

  const erros = {
    nome: validar.nome(nome),
    idade: validar.idade(lerNumero(idade)),
    altura: validar.altura(lerNumero(altura)),
    pesoInicial: validar.peso(lerNumero(pesoInicial)),
    inicio: validar.data(inicio, hoje),
    meta: validar.meta(lerNumero(meta), atual),
    intervalo: validar.intervalo(lerNumero(intervalo)),
  };
  const temErro = Object.values(erros).some(Boolean);

  async function salvar() {
    const idadeN = lerNumero(idade);
    const metaN = lerNumero(meta);
    const idadeMudou = idadeN !== idadeAtual(perfil.idade, perfil.idadeInformadaEm, hoje);
    const metaMudou = metaN !== perfil.metaKg || prazo !== perfil.prazoSemanas;
    try {
      await db.perfil.put({
        ...perfil,
        nome: nome.trim(),
        sexo,
        idade: idadeMudou ? idadeN : perfil.idade,
        idadeInformadaEm: idadeMudou ? hoje : perfil.idadeInformadaEm,
        alturaCm: lerNumero(altura),
        pesoInicialKg: lerNumero(pesoInicial),
        inicioTratamento: inicio,
        nivelAtividade: atividade,
        metaKg: metaN,
        prazoSemanas: prazo,
        metaDefinidaEm: metaMudou ? hoje : perfil.metaDefinidaEm,
        intervaloDoseDias: lerNumero(intervalo),
      });
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2000);
    } catch {
      aoErro('Não foi possível salvar. Tente novamente.');
    }
  }

  async function aoEscolherArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;
    setConfirmarImportar(await arquivo.text());
  }

  async function importar() {
    if (!confirmarImportar) return;
    try {
      await importarBackup(confirmarImportar);
    } catch (err) {
      aoErro((err as Error).message === 'Arquivo de backup inválido' ? 'Arquivo de backup inválido' : 'Não foi possível importar. Tente novamente.');
    }
    setConfirmarImportar(null);
  }

  return (
    <div className="tela">
      <h1 className="titulo-tela">Perfil</h1>

      <Card>
        <div className="card-rotulo">Meta</div>
        <div className="coluna">
          <Campo rotulo="Meta de peso" sufixo="kg" tipo="decimal" valor={meta} onChange={setMeta} erro={erros.meta} />
          {!erros.meta && !erros.altura && (
            <div className="linha" style={{ flexWrap: 'wrap', gap: 8 }}>
              <span className="suave">Na meta:</span>
              <SeloImc pesoKg={lerNumero(meta)} alturaCm={lerNumero(altura)} />
            </div>
          )}
          <div className="campo">
            <label>Prazo (semanas)</label>
            <SeletorPrazo valor={prazo} onChange={setPrazo} />
          </div>
          {!erros.meta && (
            <AlertaRitmo
              atualKg={atual}
              metaKg={lerNumero(meta)}
              semanas={prazo}
              aoUsarPrazo={setPrazo}
              aoUsarMeta={(kg) => setMeta(num(kg))}
            />
          )}
          <CartaoEstudos />
        </div>
      </Card>

      <Card atraso={0.05}>
        <div className="card-rotulo">Seus dados</div>
        <div className="coluna">
          <Campo rotulo="Nome" valor={nome} onChange={setNome} erro={erros.nome} />
          <div className="campo">
            <label>Sexo</label>
            <Opcoes valor={sexo} onChange={(v) => setSexo(v as Sexo)} opcoes={[{ valor: 'F', titulo: 'Feminino' }, { valor: 'M', titulo: 'Masculino' }]} />
          </div>
          <Campo rotulo="Idade" sufixo="anos" tipo="numeric" valor={idade} onChange={setIdade} erro={erros.idade} />
          <Campo rotulo="Altura" sufixo="cm" tipo="numeric" valor={altura} onChange={setAltura} erro={erros.altura} />
          <Campo rotulo="Peso quando começou" sufixo="kg" tipo="decimal" valor={pesoInicial} onChange={setPesoInicial} erro={erros.pesoInicial} />
          <Campo rotulo="Início do tratamento" tipo="date" max={hoje} valor={inicio} onChange={setInicio} erro={erros.inicio} />
          <div className="campo">
            <label>Nível de atividade física</label>
            <Opcoes valor={atividade} onChange={(v) => setAtividade(v as NivelAtividade)} opcoes={NIVEIS} />
          </div>
          <Campo rotulo="Intervalo entre doses" sufixo="dias" tipo="numeric" valor={intervalo} onChange={setIntervalo} erro={erros.intervalo} />
        </div>
      </Card>

      <div style={{ position: 'sticky', bottom: 'calc(var(--nav-altura) + env(safe-area-inset-bottom) + 12px)', zIndex: 5, marginBottom: 14 }}>
        <Botao disabled={temErro} onClick={salvar}>
          {salvo ? 'Salvo ✓' : 'Salvar alterações'}
        </Botao>
      </div>

      <Card atraso={0.1}>
        <div className="card-rotulo">Backup</div>
        <p className="suave" style={{ marginTop: 0 }}>
          Seus dados ficam só neste aparelho. Exporte um backup de vez em quando para não perder nada ao trocar de celular.
        </p>
        <div className="coluna">
          <Botao className="secundario" onClick={() => exportarBackup().catch(() => aoErro('Não foi possível exportar.'))}>
            Exportar backup
          </Botao>
          {confirmarImportar ? (
            <div className="aviso alerta">
              <strong>Substituir todos os dados?</strong>
              Os dados atuais deste aparelho serão trocados pelos do arquivo.
              <div className="grade-2" style={{ marginTop: 12 }}>
                <Botao className="secundario pequeno" style={{ width: '100%' }} onClick={() => setConfirmarImportar(null)}>
                  Cancelar
                </Botao>
                <Botao className="perigo pequeno" style={{ width: '100%' }} onClick={importar}>
                  Substituir
                </Botao>
              </div>
            </div>
          ) : (
            <Botao className="secundario" onClick={() => arquivoRef.current?.click()}>
              Importar backup
            </Botao>
          )}
          <input ref={arquivoRef} type="file" accept="application/json,.json" hidden onChange={aoEscolherArquivo} />
        </div>
      </Card>

      <Card atraso={0.15}>
        <button className="item" style={{ width: '100%', background: 'none', border: 0, textAlign: 'left' }} onClick={abrirSobre}>
          <div className="item-icone">{Icone.livro}</div>
          <div className="item-corpo">
            <strong>Sobre os cálculos</strong>
            <small>Fórmulas e referências científicas</small>
          </div>
        </button>
      </Card>

      <Botao
        className="perigo"
        onClick={() => {
          if (confirmarApagar >= 1) apagarTudo().catch(() => aoErro('Não foi possível apagar.'));
          else setConfirmarApagar(1);
        }}
      >
        {confirmarApagar ? 'Tem certeza? Toque de novo para apagar tudo' : 'Apagar todos os dados'}
      </Botao>
    </div>
  );
}
