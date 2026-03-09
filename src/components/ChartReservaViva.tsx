import React from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { Envelope } from '../types'

interface Props {
  renda: number
  custo: number
  patrimonio: number
  reservaMeses: number
  envelopes: Envelope[]
}

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

const fmtK = (v: number) => {
  if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `R$${(v / 1_000).toFixed(0)}k`
  return `R$${v.toFixed(0)}`
}

function mesLabel(m: number): string {
  if (m < 12) return `${m}m`
  const a = Math.floor(m / 12)
  const r = m % 12
  return r === 0 ? `${a}a` : `${a}a${r}m`
}

interface Ponto {
  mes: number
  base: number   // portion building toward reserve (0 → reservaAlvo)
  livre: number  // portion freely above reserve
}

export default function ChartReservaViva({
  renda,
  custo,
  patrimonio,
  reservaMeses,
}: Props) {
  const aporte = renda - custo
  const reservaAlvo = custo * reservaMeses

  // --- month when reserve is first reached ---
  let mesReserva: number | null = null
  if (patrimonio >= reservaAlvo) {
    mesReserva = 0
  } else if (aporte > 0) {
    mesReserva = Math.ceil((reservaAlvo - patrimonio) / aporte)
  }

  // --- horizon: show reserve + buffer, min 24 months ---
  const horizon =
    mesReserva !== null
      ? Math.min(120, Math.max(24, mesReserva + 18))
      : Math.min(120, Math.max(24, reservaMeses * 4))

  // --- build data series ---
  const data: Ponto[] = Array.from({ length: horizon + 1 }, (_, m) => {
    const total = patrimonio + m * aporte
    return {
      mes: m,
      base: Math.min(Math.max(0, total), reservaAlvo),
      livre: Math.max(0, total - reservaAlvo),
    }
  })

  // --- X-axis ticks: ~6 labels ---
  const step = Math.ceil(horizon / 6)
  const xTicks = Array.from({ length: Math.floor(horizon / step) + 1 }, (_, i) => i * step)

  const hasGrowth = renda > 0 && aporte > 0
  const hasData = renda > 0

  return (
    <div className="chart-panel-inner">
      <div className="chart-title">Crescimento do patrimônio</div>

      {!hasData && (
        <div className="chart-placeholder">Informe renda e custo de vida para ver o gráfico.</div>
      )}

      {hasData && (
        <>
          {/* Reserve reached badge */}
          {mesReserva !== null && mesReserva > 0 && (
            <div className="reserva-badge">
              🎯 Reserva alcançada no{' '}
              <strong>mês {mesReserva}</strong>{' '}
              <span className="reserva-badge-sub">({mesLabel(mesReserva)})</span>
            </div>
          )}
          {mesReserva === 0 && (
            <div className="reserva-badge reserva-badge-ok">
              ✅ Reserva de emergência já completa
            </div>
          )}
          {mesReserva === null && (
            <div className="reserva-badge reserva-badge-warn">
              ⚠ Renda não cobre as despesas — patrimônio não cresce
            </div>
          )}

          {/* Chart */}
          <div style={{ userSelect: 'none' }}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradBase" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gradLivre" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.15} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />

                <XAxis
                  dataKey="mes"
                  ticks={xTicks}
                  tickFormatter={mesLabel}
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={fmtK}
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                />

                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    const base = (payload.find(p => p.dataKey === 'base')?.value as number) ?? 0
                    const livre = (payload.find(p => p.dataKey === 'livre')?.value as number) ?? 0
                    const total = base + livre
                    return (
                      <div className="chart-tooltip">
                        <div className="chart-tooltip-label">Mês {label} ({mesLabel(label as number)})</div>
                        <div style={{ color: '#f59e0b' }}>Reserva: {fmtBRL(base)}</div>
                        {livre > 0 && <div style={{ color: '#10b981' }}>Livre: {fmtBRL(livre)}</div>}
                        <div style={{ color: 'var(--text)', fontWeight: 700 }}>Total: {fmtBRL(total)}</div>
                      </div>
                    )
                  }}
                />

                {/* Reserve target reference line */}
                {reservaAlvo > 0 && (
                  <ReferenceLine
                    y={reservaAlvo}
                    stroke="#f59e0b"
                    strokeDasharray="5 3"
                    strokeWidth={1.5}
                    label={{
                      value: `Meta ${fmtK(reservaAlvo)}`,
                      position: 'insideTopRight',
                      fill: '#f59e0b',
                      fontSize: 10,
                    }}
                  />
                )}

                {/* Vertical line when reserve is reached */}
                {mesReserva !== null && mesReserva > 0 && mesReserva <= horizon && (
                  <ReferenceLine
                    x={mesReserva}
                    stroke="rgba(255,255,255,0.25)"
                    strokeDasharray="4 3"
                    strokeWidth={1}
                    label={{
                      value: `Mês ${mesReserva}`,
                      position: 'insideTopLeft',
                      fill: 'rgba(255,255,255,0.45)',
                      fontSize: 10,
                    }}
                  />
                )}

                {/* Building reserve (amber) */}
                <Area
                  type="monotone"
                  dataKey="base"
                  stackId="1"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="url(#gradBase)"
                  dot={false}
                  activeDot={false}
                  name="Reserva"
                />

                {/* Free money above reserve (green wave) */}
                <Area
                  type="monotone"
                  dataKey="livre"
                  stackId="1"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#gradLivre)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#10b981' }}
                  name="Dinheiro livre"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Footer stats */}
          <div className="reserva-stats">
            <div className="reserva-stat">
              <span className="reserva-stat-label">Aporte mensal</span>
              <span
                className="reserva-stat-valor"
                style={{ color: aporte >= 0 ? '#10b981' : '#ef4444' }}
              >
                {fmtBRL(aporte)}
              </span>
            </div>
            <div className="reserva-stat">
              <span className="reserva-stat-label">Meta da reserva</span>
              <span className="reserva-stat-valor" style={{ color: '#f59e0b' }}>
                {fmtBRL(reservaAlvo)}
              </span>
            </div>
            <div className="reserva-stat">
              <span className="reserva-stat-label">Patrimônio atual</span>
              <span className="reserva-stat-valor">{fmtBRL(patrimonio)}</span>
            </div>
          </div>

          {!hasGrowth && renda > 0 && (
            <p className="reserva-aviso">
              Sua renda (R${renda.toLocaleString('pt-BR')}) não cobre o custo de vida
              (R${custo.toLocaleString('pt-BR')}). Não há sobra para construir a reserva.
            </p>
          )}
        </>
      )}
    </div>
  )
}
