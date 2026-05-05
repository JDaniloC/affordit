import React, { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
} from 'recharts'
import { calcTrajetoriaPatrimonio, formatPrazoBR } from '../logic/index'
import type { CronogramaResult } from '../logic/index'

interface Props {
  patrimonio: number
  sobraLazerMensal: number
  rendimentoMensalEfetivo: number
  metaValor: number
  reservaAlvo: number
  cronograma: CronogramaResult
}

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

const fmtShort = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `R$${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000) return `R$${(v / 1_000).toFixed(0)}k`
  return `R$${v.toFixed(0)}`
}

const tickStyle = { fill: '#64748b', fontSize: 11 }

export default function GraficoFila({
  patrimonio,
  sobraLazerMensal,
  rendimentoMensalEfetivo,
  metaValor,
  reservaAlvo,
  cronograma,
}: Props) {
  const filaParaTrajetoria = useMemo(
    () =>
      cronograma.agendadas.map((a) => ({
        valor: a.meta.valor,
        mesQueCompleta: a.mesQueCompleta,
      })),
    [cronograma.agendadas],
  )

  const ultimaCompraMes = cronograma.agendadas.reduce(
    (max, a) => Math.max(max, a.mesQueCompleta),
    0,
  )

  // Horizonte: o suficiente para mostrar atingimento da meta ou os 12 meses
  // após a última compra. Cap em 120 meses (10 anos).
  const horizonte = useMemo(() => {
    if (sobraLazerMensal <= 0) return Math.max(24, ultimaCompraMes + 6)
    let estimativa = ultimaCompraMes + 12
    if (metaValor > 0) {
      const traj = calcTrajetoriaPatrimonio(
        patrimonio,
        sobraLazerMensal,
        rendimentoMensalEfetivo,
        120,
        filaParaTrajetoria,
      )
      const idx = traj.findIndex((v) => v >= metaValor)
      if (idx >= 0) estimativa = Math.max(estimativa, idx + 6)
      else estimativa = 120
    }
    return Math.min(120, Math.max(24, estimativa))
  }, [patrimonio, sobraLazerMensal, rendimentoMensalEfetivo, metaValor, filaParaTrajetoria, ultimaCompraMes])

  const trajSem = useMemo(
    () =>
      calcTrajetoriaPatrimonio(
        patrimonio,
        sobraLazerMensal,
        rendimentoMensalEfetivo,
        horizonte,
        [],
      ),
    [patrimonio, sobraLazerMensal, rendimentoMensalEfetivo, horizonte],
  )

  const trajCom = useMemo(
    () =>
      calcTrajetoriaPatrimonio(
        patrimonio,
        sobraLazerMensal,
        rendimentoMensalEfetivo,
        horizonte,
        filaParaTrajetoria,
      ),
    [patrimonio, sobraLazerMensal, rendimentoMensalEfetivo, horizonte, filaParaTrajetoria],
  )

  const data = useMemo(
    () =>
      // trajSem[0] é o patrimônio inicial; pular o índice 0 para começar em mês 1.
      Array.from({ length: horizonte }, (_, i) => ({
        mes: i + 1,
        semFila: Math.round(trajSem[i + 1]),
        comFila: Math.round(trajCom[i + 1]),
      })),
    [trajSem, trajCom, horizonte],
  )

  const comprasMarcadas = useMemo(
    () =>
      cronograma.agendadas
        .filter((a) => a.mesQueCompleta >= 1 && a.mesQueCompleta <= horizonte)
        .map((a) => ({
          mes: a.mesQueCompleta,
          valor: Math.round(trajCom[a.mesQueCompleta] ?? 0),
          nome: a.meta.nome,
        })),
    [cronograma.agendadas, trajCom, horizonte],
  )

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    const compraNoMes = comprasMarcadas.find((c) => c.mes === label)
    return (
      <div className="chart-tooltip">
        <div className="chart-tooltip-label">
          {label === 0 ? 'Hoje' : `Mês ${label} (${formatPrazoBR(label)})`}
        </div>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="chart-tooltip-row" style={{ color: p.color }}>
            <span>{p.name}:</span>
            <strong>{fmt(p.value)}</strong>
          </div>
        ))}
        {payload.length === 2 && (
          <div className="chart-tooltip-diff">
            Diferença: {fmt(payload[0].value - payload[1].value)}
          </div>
        )}
        {compraNoMes && (
          <div className="chart-tooltip-compra">🛒 Compra: {compraNoMes.nome}</div>
        )}
      </div>
    )
  }

  return (
    <div className="grafico-card">
      <div className="grafico-header">
        <div>
          <div className="grafico-titulo">Patrimônio ao longo do tempo</div>
          <div className="grafico-subtitulo">
            Próximos {formatPrazoBR(horizonte)} — comparando trajetória sem nenhuma compra vs. com sua fila atual
            {rendimentoMensalEfetivo > 0 && ` · rendimento ${rendimentoMensalEfetivo.toFixed(2)}% a.m.`}
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="gradFilaSem" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradFilaCom" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />

          <XAxis
            dataKey="mes"
            tick={tickStyle}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => (v % 12 === 0 ? `${v / 12}a` : v % 6 === 0 ? `${v}m` : '')}
            interval={0}
          />
          <YAxis
            tick={tickStyle}
            tickLine={false}
            axisLine={false}
            tickFormatter={fmtShort}
            width={56}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            formatter={(value) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>}
          />

          {metaValor > 0 && (
            <ReferenceLine
              y={metaValor}
              stroke="rgba(99,102,241,0.6)"
              strokeDasharray="4 4"
              label={{
                value: `${fmtShort(metaValor)} (sua meta)`,
                position: 'insideTopRight',
                fill: '#818cf8',
                fontSize: 10,
              }}
            />
          )}

          {reservaAlvo > 0 && reservaAlvo !== metaValor && (
            <ReferenceLine
              y={reservaAlvo}
              stroke="rgba(239,68,68,0.4)"
              strokeDasharray="4 4"
              label={{
                value: `${fmtShort(reservaAlvo)} (reserva)`,
                position: 'insideBottomRight',
                fill: '#f87171',
                fontSize: 10,
              }}
            />
          )}

          <Area
            type="monotone"
            dataKey="semFila"
            name="Sem nenhuma compra"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#gradFilaSem)"
            dot={false}
            activeDot={{ r: 4, fill: '#10b981' }}
          />
          <Area
            type="monotone"
            dataKey="comFila"
            name="Com sua fila"
            stroke="#f59e0b"
            strokeWidth={2}
            fill="url(#gradFilaCom)"
            dot={false}
            activeDot={{ r: 4, fill: '#f59e0b' }}
          />

          {comprasMarcadas.map((c) => (
            <ReferenceDot
              key={`${c.mes}-${c.nome}`}
              x={c.mes}
              y={c.valor}
              r={5}
              fill="#f97316"
              stroke="#fff"
              strokeWidth={1.5}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
