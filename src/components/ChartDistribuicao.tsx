import React from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Envelope } from '../types'
import { calcLazerPct } from '../logic/index'

interface Props {
  renda: number
  custo: number
  envelopes: Envelope[]
}

const ENVELOPE_COLORS = ['#7c3aed', '#0ea5e9', '#f59e0b', '#ec4899', '#14b8a6', '#f97316']
const CUSTO_COLOR = '#ef4444'
const LAZER_COLOR = '#10b981'

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

interface Fatia {
  nome: string
  valor: number
  pct: number
  color: string
}

export default function ChartDistribuicao({ renda, custo, envelopes }: Props) {
  const lazerPct = calcLazerPct(renda, custo, envelopes)
  const custoPct = renda > 0 ? Math.min(100, (custo / renda) * 100) : 0

  const fatias: Fatia[] = []

  if (custoPct > 0) {
    fatias.push({ nome: 'Custo de vida', valor: custo, pct: custoPct, color: CUSTO_COLOR })
  }

  envelopes.forEach((env, i) => {
    if (env.pct > 0) {
      fatias.push({
        nome: env.nome || `Envelope ${i + 1}`,
        valor: (env.pct / 100) * renda,
        pct: env.pct,
        color: ENVELOPE_COLORS[i % ENVELOPE_COLORS.length],
      })
    }
  })

  const lazerValor = Math.max(0, (lazerPct / 100) * renda)
  fatias.push({ nome: 'Lazer / Compras', valor: lazerValor, pct: Math.max(0, lazerPct), color: LAZER_COLOR })

  const total = renda > 0 ? renda : 1
  const pieData = fatias.length > 0
    ? fatias
    : [{ nome: 'Lazer', valor: 1, pct: 100, color: LAZER_COLOR }]

  if (renda <= 0) {
    return (
      <div className="chart-panel-inner">
        <div className="chart-title">Distribuição do orçamento</div>
        <div className="dist-placeholder">
          <p>Informe sua renda para ver a distribuição.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="chart-panel-inner">
      <div className="chart-title">Distribuição do orçamento</div>

      {/* Pie chart — proportions */}
      <div className="dist-pie-wrap">
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="pct"
              cx="50%"
              cy="50%"
              innerRadius={42}
              outerRadius={68}
              paddingAngle={2}
              startAngle={90}
              endAngle={-270}
            >
              {pieData.map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const f = payload[0].payload as Fatia
                return (
                  <div className="chart-tooltip">
                    <div className="chart-tooltip-label">{f.nome}</div>
                    <div style={{ color: f.color, fontWeight: 700 }}>
                      {f.pct.toFixed(1)}% · {fmtBRL(f.valor)}
                    </div>
                  </div>
                )
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="dist-pie-center" style={{ color: LAZER_COLOR }}>
          {lazerPct.toFixed(1)}%<br />
          <span>lazer</span>
        </div>
      </div>

      {/* BRL bar breakdown */}
      <div className="dist-bar">
        {fatias.map((f, i) => (
          <div
            key={i}
            className="dist-bar-segment"
            style={{ width: `${(f.valor / total) * 100}%`, background: f.color }}
            title={`${f.nome}: ${fmtBRL(f.valor)}`}
          />
        ))}
      </div>

      {/* Per-row BRL values */}
      <div className="dist-rows">
        {fatias.map((f, i) => (
          <div key={i} className="dist-row">
            <div className="dist-row-header">
              <span className="dist-row-dot" style={{ background: f.color }} />
              <span className="dist-row-nome">{f.nome}</span>
              <span className="dist-row-pct" style={{ color: f.color }}>{f.pct.toFixed(1)}%</span>
              <span className="dist-row-valor" style={{ color: f.color }}>{fmtBRL(f.valor)}</span>
            </div>
            <div className="dist-row-bar-track">
              <div
                className="dist-row-bar-fill"
                style={{ width: `${(f.valor / total) * 100}%`, background: f.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
