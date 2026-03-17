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
} from 'recharts'
import {
  MetaFinanceiraResult,
  calcImpactoCompraNoPatrimonio,
  calcMesQueAtingeMeta,
} from '../logic/index'

interface Props {
  patrimonio: number
  sobraLazerMensal: number
  itemValor: number
  itemNome: string
  parcelas: number
  metaValor: number
  metaResult: MetaFinanceiraResult
  rendimentoAnual?: number
}

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

const fmtShort = (v: number) => {
  if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `R$${(v / 1_000).toFixed(0)}k`
  return `R$${v.toFixed(0)}`
}

function fmtMeses(m: number): string {
  if (m < 12) return `${m} ${m === 1 ? 'mês' : 'meses'}`
  const anos = Math.floor(m / 12)
  const resto = m % 12
  const anosStr = `${anos} ${anos === 1 ? 'ano' : 'anos'}`
  return resto === 0 ? anosStr : `${anosStr} e ${resto} ${resto === 1 ? 'mês' : 'meses'}`
}

export default function GraficoMeta({
  patrimonio,
  sobraLazerMensal,
  itemValor,
  itemNome,
  parcelas,
  metaValor,
  metaResult,
  rendimentoAnual = 0,
}: Props) {

  // Converte % a.a. para % a.m. pelo regime composto
  const taxaMensalEfetiva = rendimentoAnual > 0
    ? (Math.pow(1 + rendimentoAnual / 100, 1 / 12) - 1) * 100
    : 0
  const { mesesSemCompra, mesesComCompra, atrasoMeses, metaJaAtingida } = metaResult

  // Dynamic horizon: show enough months for both trajectories to reach the goal
  const horizonte = useMemo(() => {
    if (metaJaAtingida) return 24
    const referencia = mesesComCompra ?? mesesSemCompra
    if (referencia === null) return 120
    return Math.min(Math.ceil(referencia * 1.25) + 6, 240)
  }, [metaJaAtingida, mesesComCompra, mesesSemCompra])

  const { semCompra, comCompra } = useMemo(
    () =>
      calcImpactoCompraNoPatrimonio(
        patrimonio,
        sobraLazerMensal,
        horizonte,
        itemValor,
        Math.max(1, parcelas),
        taxaMensalEfetiva,
      ),
    [patrimonio, sobraLazerMensal, horizonte, itemValor, parcelas, taxaMensalEfetiva],
  )

  const data = useMemo(
    () =>
      Array.from({ length: horizonte }, (_, i) => ({
        mes: i + 1,
        semCompra: Math.round(semCompra[i]),
        comCompra: Math.round(comCompra[i]),
      })),
    [semCompra, comCompra, horizonte],
  )

  const mesSemCompraAtingeMeta = calcMesQueAtingeMeta(semCompra, metaValor)
  const mesComCompraAtingeMeta = calcMesQueAtingeMeta(comCompra, metaValor)

  const tickStyle = { fill: '#64748b', fontSize: 11 }

  const xTickFormatter = (v: number) => {
    if (horizonte <= 24) return v % 3 === 0 ? `${v}m` : ''
    if (horizonte <= 60) return v % 12 === 0 ? `${v / 12}a` : v % 6 === 0 ? `${v}m` : ''
    return v % 12 === 0 ? `${v / 12}a` : ''
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    const anos = Math.floor(label / 12)
    const meses = label % 12
    const tempoLabel =
      anos > 0 ? `${anos}a ${meses > 0 ? `${meses}m` : ''}`.trim() : `${label}m`
    return (
      <div className="chart-tooltip">
        <div className="chart-tooltip-label">{tempoLabel}</div>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="chart-tooltip-row" style={{ color: p.color }}>
            <span>{p.name}:</span>
            <strong>{fmt(p.value)}</strong>
          </div>
        ))}
        <div className="chart-tooltip-row" style={{ color: '#f59e0b', fontSize: 11 }}>
          <span>Meta:</span>
          <strong>{fmt(metaValor)}</strong>
        </div>
      </div>
    )
  }

  return (
    <div className="grafico-card">
      <div className="grafico-header">
        <div>
          <div className="grafico-titulo">Impacto na sua meta</div>
          <div className="grafico-subtitulo">
            Quanto tempo para chegar em {fmtShort(metaValor)} — com e sem {itemNome || 'a compra'}
            {rendimentoAnual > 0 && ` · rendimento ${rendimentoAnual}% a.a.`}
          </div>
        </div>
        {atrasoMeses !== null && atrasoMeses > 0 && (
          <div className="grafico-badge" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)' }}>
            <div className="grafico-badge-num" style={{ color: '#ef4444' }}>+{atrasoMeses}m</div>
            <div className="grafico-badge-label">de atraso</div>
          </div>
        )}
        {(atrasoMeses === null || atrasoMeses === 0) && mesesSemCompra !== null && (
          <div className="grafico-badge">
            <div className="grafico-badge-num" style={{ color: '#10b981' }}>0m</div>
            <div className="grafico-badge-label">de atraso</div>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="gradMetaSem" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradMetaCom" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />

          <XAxis
            dataKey="mes"
            tick={tickStyle}
            tickLine={false}
            axisLine={false}
            tickFormatter={xTickFormatter}
            interval={0}
          />
          <YAxis
            tick={tickStyle}
            tickLine={false}
            axisLine={false}
            tickFormatter={fmtShort}
            width={52}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            formatter={(value) => (
              <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>
            )}
          />

          {/* Meta reference line */}
          <ReferenceLine
            y={metaValor}
            stroke="rgba(245,158,11,0.6)"
            strokeDasharray="4 4"
            label={{
              value: `Meta: ${fmtShort(metaValor)}`,
              position: 'insideTopRight',
              fill: '#f59e0b',
              fontSize: 10,
            }}
          />

          {/* Vertical marker: sem compra crosses meta */}
          {mesSemCompraAtingeMeta !== null && (
            <ReferenceLine
              x={mesSemCompraAtingeMeta}
              stroke="rgba(16,185,129,0.4)"
              strokeDasharray="3 3"
              label={{
                value: `${mesSemCompraAtingeMeta}m`,
                position: 'top',
                fill: '#10b981',
                fontSize: 10,
              }}
            />
          )}

          {/* Vertical marker: com compra crosses meta (only if different) */}
          {mesComCompraAtingeMeta !== null &&
            mesComCompraAtingeMeta !== mesSemCompraAtingeMeta && (
              <ReferenceLine
                x={mesComCompraAtingeMeta}
                stroke="rgba(124,58,237,0.4)"
                strokeDasharray="3 3"
                label={{
                  value: `${mesComCompraAtingeMeta}m`,
                  position: 'top',
                  fill: '#a78bfa',
                  fontSize: 10,
                }}
              />
            )}

          <Area
            type="monotone"
            dataKey="semCompra"
            name="Sem comprar"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#gradMetaSem)"
            dot={false}
            activeDot={{ r: 4, fill: '#10b981' }}
          />
          <Area
            type="monotone"
            dataKey="comCompra"
            name={`Comprando ${itemNome || 'o item'}`}
            stroke="#7c3aed"
            strokeWidth={2}
            fill="url(#gradMetaCom)"
            dot={false}
            activeDot={{ r: 4, fill: '#7c3aed' }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Summary row */}
      <div className="grafico-impacto">
        {mesSemCompraAtingeMeta !== null && (
          <span>
            Sem comprar: meta em <strong>{fmtMeses(mesSemCompraAtingeMeta)}</strong>
          </span>
        )}
        {mesSemCompraAtingeMeta !== null && mesComCompraAtingeMeta !== null && (
          <span className="grafico-impacto-sep">·</span>
        )}
        {mesComCompraAtingeMeta !== null ? (
          <span>
            Comprando: meta em <strong>{fmtMeses(mesComCompraAtingeMeta)}</strong>
          </span>
        ) : (
          mesesSemCompra !== null && (
            <span className="grafico-impacto-atraso">
              Comprando: meta não atingida no horizonte
            </span>
          )
        )}
        {atrasoMeses !== null && atrasoMeses > 0 && (
          <>
            <span className="grafico-impacto-sep">·</span>
            <span className="grafico-impacto-atraso">
              +{fmtMeses(atrasoMeses)} de atraso
            </span>
          </>
        )}
      </div>
    </div>
  )
}
