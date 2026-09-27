import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { FormPeso } from '../components/Formularios';
import { Botao, Card, Icone } from '../components/ui';
import { fmt, fmtData } from '../lib/calculos';
import type { RegistroPeso } from '../lib/db';
import type { Dados } from '../App';

export function Peso({ dados, aoErro }: { dados: Dados; aoErro: (m: string) => void }) {
  const [aberta, setAberta] = useState(false);
  const [editando, setEditando] = useState<RegistroPeso | undefined>();
  const { perfil } = dados;

  const cronologico = [...dados.pesos].sort((a, b) => (a.data === b.data ? (a.id ?? 0) - (b.id ?? 0) : a.data.localeCompare(b.data)));
  const lista = [...cronologico].reverse();
  const pontos = cronologico.map((p) => ({ data: p.data, kg: p.kg }));
  const valores = [...pontos.map((p) => p.kg), perfil.metaKg];
  const min = Math.floor(Math.min(...valores) - 2);
  const max = Math.ceil(Math.max(...valores) + 2);

  return (
    <div className="tela">
      <div className="linha entre">
        <h1 className="titulo-tela">Peso</h1>
        <Botao
          className="pequeno"
          aria-label="Novo peso"
          onClick={() => {
            setEditando(undefined);
            setAberta(true);
          }}
        >
          {Icone.mais}
        </Botao>
      </div>

      <Card>
        <div className="card-rotulo">Evolução</div>
        {pontos.length < 2 ? (
          <div className="vazio">Registre pelo menos dois pesos para ver o gráfico.</div>
        ) : (
          <div className="grafico">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pontos} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="var(--borda)" vertical={false} />
                <XAxis
                  dataKey="data"
                  tickFormatter={(d: string) => fmtData(d, { day: '2-digit', month: '2-digit' })}
                  stroke="var(--texto-2)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                />
                <YAxis domain={[min, max]} stroke="var(--texto-2)" fontSize={12} tickLine={false} axisLine={false} width={36} />
                <Tooltip
                  formatter={(v) => [`${fmt(Number(v))} kg`, 'Peso']}
                  labelFormatter={(d) => fmtData(String(d))}
                  contentStyle={{ background: 'var(--superficie)', border: '1px solid var(--borda)', borderRadius: 12 }}
                />
                <ReferenceLine
                  y={perfil.metaKg}
                  stroke="var(--verde-forte)"
                  strokeDasharray="6 6"
                  label={{ value: `Meta ${fmt(perfil.metaKg)}`, fill: 'var(--verde-forte)', fontSize: 12, position: 'insideTopRight' }}
                />
                <Line type="monotone" dataKey="kg" stroke="var(--verde)" strokeWidth={3} dot={{ r: 3, fill: 'var(--verde)' }} activeDot={{ r: 6 }} animationDuration={900} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <div className="card">
        {lista.length === 0 ? (
          <div className="vazio">Nenhum peso registrado.</div>
        ) : (
          <ul className="lista">
            <AnimatePresence initial={false}>
              {lista.map((p, i) => {
                const anterior = lista[i + 1];
                const variacao = anterior ? p.kg - anterior.kg : null;
                return (
                  <motion.li
                    key={p.id}
                    layout
                    className="item"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0, transition: { delay: Math.min(i, 10) * 0.03 } }}
                    exit={{ opacity: 0, height: 0 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setEditando(p);
                      setAberta(true);
                    }}
                  >
                    <div className="item-icone">{Icone.balanca}</div>
                    <div className="item-corpo">
                      <strong>{fmt(p.kg)} kg</strong>
                      <small>{fmtData(p.data, { day: '2-digit', month: 'long', year: 'numeric' })}</small>
                    </div>
                    {variacao !== null && (
                      <span style={{ fontWeight: 700, color: variacao <= 0 ? 'var(--verde-forte)' : 'var(--alerta)' }}>
                        {variacao > 0 ? '+' : variacao < 0 ? '−' : ''}
                        {fmt(Math.abs(variacao))}
                      </span>
                    )}
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>

      <FormPeso aberta={aberta} aoFechar={() => setAberta(false)} editando={editando} aoErro={aoErro} />
    </div>
  );
}
