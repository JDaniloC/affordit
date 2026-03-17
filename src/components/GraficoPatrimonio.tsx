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
import { calcImpactoCompraNoPatrimonio, calcMesQueAtingeMeta } from '../logic/index'

interface Props {
  patrimonioInicial: number
  sobraLazerMensal: number
  itemValor: number
  itemNome: string
  parcelas: number
  reservaAlvo: number
  rendimentoAnual?: number
}

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

const fmtShort = (v: number) => {
  if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `R$${(v / 1_000).toFixed(0)}k`
  return `R$${v.toFixed(0)}`
}

export default function GraficoPatrimonio({
  patrimonioInicial,
  sobraLazerMensal,
  itemValor,
  itemNome,
  parcelas,
  reservaAlvo,
  rendimentoAnual = 0,
}: Props) {
  const MESES = 36

  // Converte % a.a. para % a.m. pelo regime composto: i_m = (1 + i_a)^(1/12) - 1
  const taxaMensalEfetiva = rendimentoAnual > 0
    ? (Math.pow(1 + rendimentoAnual / 100, 1 / 12) - 1) * 100
    : 0

  const { semCompra, comCompra } = useMemo(
    () =>
      calcImpactoCompraNoPatrimonio(
        patrimonioInicial,
        sobraLazerMensal,
        MESES,
        itemValor,
        Math.max(1, parcelas),
        taxaMensalEfetiva,
      ),
    [patrimonioInicial, sobraLazerMensal, itemValor, parcelas, taxaMensalEfetiva],
  )

  const data = useMemo(
    () =>
      Array.from({ length: MESES }, (_, i) => ({
        mes: i + 1,
        label: i + 1 === 12 ? '1 ano' : i + 1 === 24 ? '2 anos' : i + 1 === 36 ? '3 anos' : `M${i + 1}`,
        semCompra: Math.round(semCompra[i]),
        comCompra: Math.round(comCompra[i]),
      })),
    [semCompra, comCompra],
  )

  // Month (1-based) when each line first reaches the item value; null if never within 36m
  const mesMeta = calcMesQueAtingeMeta(semCompra, itemValor)
  const mesMetaComCompra = calcMesQueAtingeMeta(comCompra, itemValor)

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="chart-tooltip">
        <div className="chart-tooltip-label">Mês {label}</div>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="chart-tooltip-row" style={{ color: p.color }}>
            <span>{p.name}:</span>
            <strong>{fmt(p.value)}</strong>
          </div>
        ))}
        {payload.length === 2 && (
          <div className="chart-tooltip-diff">
            Impacto: {fmt(payload[0].value - payload[1].value)}
          </div>
        )}
      </div>
    )
  }

  const tickStyle = { fill: '#64748b', fontSize: 11 }

  return (
    <div className="grafico-card">
      <div className="grafico-header">
        <div>
          <div className="grafico-titulo">Projeção de Patrimônio</div>
          <div className="grafico-subtitulo">
            Próximos 36 meses — com e sem a compra de {itemNome || 'o item'}
            {rendimentoAnual > 0 && ` · rendimento ${rendimentoAnual}% a.a.`}
          </div>
        </div>
        {mesMeta !== null && (
          <div className="grafico-badge">
            <div className="grafico-badge-num">{mesMeta}m</div>
            <div className="grafico-badge-label">para ter o valor</div>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="gradSem" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradCom" x1="0" y1="0" x2="0" y2="1">
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
            tickFormatter={(v) => (v % 12 === 0 ? `${v / 12}a` : v % 6 === 0 ? `${v}m` : '')}
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

          {/* Reference: item value */}
          {itemValor > 0 && (
            <ReferenceLine
              y={itemValor}
              stroke="rgba(245,158,11,0.5)"
              strokeDasharray="4 4"
              label={{
                value: `${fmtShort(itemValor)} (valor do item)`,
                position: 'insideTopRight',
                fill: '#f59e0b',
                fontSize: 10,
              }}
            />
          )}

          {/* Reference: reserva alvo */}
          {reservaAlvo > 0 && reservaAlvo !== itemValor && (
            <ReferenceLine
              y={reservaAlvo}
              stroke="rgba(99,102,241,0.4)"
              strokeDasharray="4 4"
              label={{
                value: `${fmtShort(reservaAlvo)} (reserva)`,
                position: 'insideTopRight',
                fill: '#818cf8',
                fontSize: 10,
              }}
            />
          )}

          <Area
            type="monotone"
            dataKey="semCompra"
            name="Sem compra"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#gradSem)"
            dot={false}
            activeDot={{ r: 4, fill: '#10b981' }}
          />
          <Area
            type="monotone"
            dataKey="comCompra"
            name="Com compra"
            stroke="#7c3aed"
            strokeWidth={2}
            fill="url(#gradCom)"
            dot={false}
            activeDot={{ r: 4, fill: '#7c3aed' }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {mesMeta !== null && mesMetaComCompra !== null && mesMetaComCompra !== mesMeta && (
        <div className="grafico-impacto">
          <span>
            Sem compra: valor disponível no <strong>mês {mesMeta}</strong>
          </span>
          <span className="grafico-impacto-sep">·</span>
          <span>
            Com compra: no <strong>mês {mesMetaComCompra}</strong>
          </span>
          <span className="grafico-impacto-sep">·</span>
          <span className="grafico-impacto-atraso">
            +{mesMetaComCompra - mesMeta} meses de atraso
          </span>
        </div>
      )}
      {mesMeta !== null && mesMetaComCompra === null && (
        <div className="grafico-impacto">
          <span>
            Sem compra: valor no <strong>mês {mesMeta}</strong>
          </span>
          <span className="grafico-impacto-sep">·</span>
          <span className="grafico-impacto-atraso">
            Com compra: não atinge o valor em 36 meses
          </span>
        </div>
      )}
    </div>
  )
}
