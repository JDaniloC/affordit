import React from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { calcImpactoCompraNoPatrimonio } from '../logic/index'

interface Props {
  itemValor: number
  itemNome: string
  patrimonio: number
  sobraLazerMensal: number
  parcelas: number
}

function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function fmtPrazo(meses: number): { principal: string; secundario: string | null } {
  if (meses <= 0) return { principal: 'Disponível!', secundario: null }
  if (meses < 12) return { principal: `${meses} ${meses === 1 ? 'mês' : 'meses'}`, secundario: null }
  const anos = Math.floor(meses / 12)
  const resto = meses % 12
  const anosStr = `${anos} ${anos === 1 ? 'ano' : 'anos'}`
  const principal = resto === 0 ? anosStr : `${anosStr} e ${resto} ${resto === 1 ? 'mês' : 'meses'}`
  return { principal, secundario: `${meses} meses` }
}

export default function ChartPrazoVivo({
  itemValor,
  itemNome,
  patrimonio,
  sobraLazerMensal,
  parcelas,
}: Props) {
  if (sobraLazerMensal <= 0) {
    return (
      <div className="chart-panel-inner">
        <div className="chart-title">Prazo para {itemNome || 'o item'}</div>
        <div className="chart-placeholder">
          Sem sobra de lazer — revise seus envelopes.
        </div>
      </div>
    )
  }

  const disponivel = patrimonio >= itemValor
  const meses = disponivel ? 0 : Math.ceil(itemValor / sobraLazerMensal)
  const progPct = itemValor > 0 ? Math.min(100, (patrimonio / itemValor) * 100) : 100

  const HORIZON = 24
  const { semCompra, comCompra } = calcImpactoCompraNoPatrimonio(
    patrimonio,
    sobraLazerMensal,
    HORIZON,
    itemValor,
    parcelas,
  )

  const chartData = semCompra.map((sc, i) => ({
    mes: i + 1,
    semCompra: Math.max(0, Math.round(sc)),
    comCompra: Math.max(0, Math.round(comCompra[i])),
  }))

  return (
    <div className="chart-panel-inner">
      <div className="chart-title">Prazo para {itemNome || 'o item'}</div>

      {/* Big number */}
      {(() => {
        const { principal, secundario } = fmtPrazo(meses)
        return (
          <>
            <div className="chart-big-number" style={{ color: disponivel ? '#10b981' : '#f59e0b' }}>
              {principal}
            </div>
            {secundario && (
              <div className="chart-prazo-sub">{secundario}</div>
            )}
          </>
        )
      })()}
      <div className="chart-formula">
        {fmtBRL(sobraLazerMensal)}/mês × {meses} = {fmtBRL(sobraLazerMensal * meses)}
      </div>

      {/* Progress bar */}
      <div className="chart-progress-wrap">
        <div className="chart-progress-bar">
          <div
            className="chart-progress-fill"
            style={{ width: `${progPct}%`, background: '#10b981' }}
          />
        </div>
        <div className="chart-progress-labels">
          <span>{fmtBRL(patrimonio)}</span>
          <span>{fmtBRL(itemValor)}</span>
        </div>
      </div>

      {/* Area chart projection */}
      <div style={{ marginTop: 12 }}>
        <div className="chart-bar-label">Projeção 24 meses</div>
        <ResponsiveContainer width="100%" height={110}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="gradSem" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradCom" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="mes"
              tick={{ fontSize: 9, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `M${v}`}
              interval={5}
            />
            <YAxis hide />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                return (
                  <div className="chart-tooltip">
                    <div className="chart-tooltip-label">Mês {label}</div>
                    {payload.map((p, i) => (
                      <div key={i} className="chart-tooltip-row">
                        <span style={{ color: p.color as string }}>{p.name}</span>
                        <span>{fmtBRL(p.value as number)}</span>
                      </div>
                    ))}
                  </div>
                )
              }}
            />
            <Area
              type="monotone"
              dataKey="semCompra"
              name="Sem compra"
              stroke="#7c3aed"
              strokeWidth={1.5}
              fill="url(#gradSem)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="comCompra"
              name="Com compra"
              stroke="#0ea5e9"
              strokeWidth={1.5}
              fill="url(#gradCom)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
