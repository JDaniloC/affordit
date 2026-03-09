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

interface ChartEntry {
  name: string
  value: number
  color: string
}

function fmt(n: number) {
  return n.toFixed(1) + '%'
}

export default function ChartDistribuicao({ renda, custo, envelopes }: Props) {
  const lazerPct = calcLazerPct(renda, custo, envelopes)
  const custoPct = renda > 0 ? Math.min(100, (custo / renda) * 100) : 0

  const data: ChartEntry[] = []

  if (renda > 0 && custoPct > 0) {
    data.push({ name: 'Custo de vida', value: Math.round(custoPct * 10) / 10, color: CUSTO_COLOR })
  }

  envelopes.forEach((env, i) => {
    if (env.pct > 0) {
      data.push({
        name: env.nome || `Envelope ${i + 1}`,
        value: env.pct,
        color: ENVELOPE_COLORS[i % ENVELOPE_COLORS.length],
      })
    }
  })

  const lazerVal = Math.max(0, Math.round(lazerPct * 10) / 10)
  data.push({ name: 'Lazer', value: lazerVal, color: LAZER_COLOR })

  // If all zero, show placeholder green circle
  const total = data.reduce((s, d) => s + d.value, 0)
  const chartData = total > 0 ? data : [{ name: 'Lazer', value: 100, color: LAZER_COLOR }]

  return (
    <div className="chart-panel-inner">
      <div className="chart-title">Distribuição do orçamento</div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
          >
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const item = payload[0].payload as ChartEntry
              return (
                <div className="chart-tooltip">
                  <div className="chart-tooltip-label">{item.name}</div>
                  <div style={{ color: item.color, fontWeight: 700 }}>{fmt(item.value)}</div>
                </div>
              )
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label overlay */}
      <div className="donut-center">
        <span style={{ color: LAZER_COLOR, fontWeight: 700 }}>
          Lazer: {fmt(lazerVal > 0 ? lazerVal : total > 0 ? 0 : 100)}
        </span>
      </div>
      {/* Legend */}
      <div className="chart-legend">
        {chartData.map((entry, i) => (
          <div key={i} className="chart-legend-item">
            <span className="chart-legend-dot" style={{ background: entry.color }} />
            <span className="chart-legend-name">{entry.name}</span>
            <span className="chart-legend-val">{fmt(entry.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
