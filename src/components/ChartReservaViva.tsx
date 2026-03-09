import React from 'react'
import { Envelope } from '../types'
import { calcLazerPct, calcStatusReserva } from '../logic/index'

interface Props {
  renda: number
  custo: number
  patrimonio: number
  reservaMeses: number
  envelopes: Envelope[]
}

const CUSTO_COLOR = '#ef4444'
const LAZER_COLOR = '#10b981'
const ENVELOPE_COLOR = '#7c3aed'

const STATUS_COLOR: Record<string, string> = {
  perigo: '#ef4444',
  atencao: '#f59e0b',
  seguranca: '#10b981',
}

const STATUS_LABEL: Record<string, string> = {
  perigo: 'Perigo',
  atencao: 'Atenção',
  seguranca: 'Segurança',
}

function fmt(n: number) {
  return n.toFixed(1) + '%'
}

export default function ChartReservaViva({
  renda,
  custo,
  patrimonio,
  reservaMeses,
  envelopes,
}: Props) {
  if (renda <= 0) {
    return (
      <div className="chart-panel-inner">
        <div className="chart-title">Distribuição & Reserva</div>
        <div className="chart-placeholder">Informe sua renda para ver a distribuição.</div>
      </div>
    )
  }

  const lazerPct = calcLazerPct(renda, custo, envelopes)
  const custoPct = Math.min(100, (custo / renda) * 100)
  const envelopesPct = envelopes.reduce((s, e) => s + (e.pct || 0), 0)
  // cap so they sum to 100
  const totalUsed = custoPct + envelopesPct
  const lazerDisplay = Math.max(0, 100 - totalUsed)

  const reservaAlvo = custo * reservaMeses
  const status = calcStatusReserva(patrimonio, reservaAlvo)
  const termPct = reservaAlvo > 0 ? Math.min(100, (patrimonio / reservaAlvo) * 100) : 100
  const statusColor = STATUS_COLOR[status]

  return (
    <div className="chart-panel-inner">
      <div className="chart-title">Distribuição & Reserva</div>

      {/* Stacked bar */}
      <div style={{ marginBottom: 16 }}>
        <div className="chart-bar-label">Distribuição da renda</div>
        <div className="chart-stacked-bar">
          {custoPct > 0 && (
            <div
              className="chart-stacked-seg"
              style={{ width: fmt(custoPct), background: CUSTO_COLOR }}
              title={`Custo de vida ${fmt(custoPct)}`}
            />
          )}
          {envelopesPct > 0 && (
            <div
              className="chart-stacked-seg"
              style={{ width: fmt(Math.min(envelopesPct, 100 - custoPct)), background: ENVELOPE_COLOR }}
              title={`Envelopes ${fmt(envelopesPct)}`}
            />
          )}
          {lazerDisplay > 0 && (
            <div
              className="chart-stacked-seg"
              style={{ width: fmt(lazerDisplay), background: LAZER_COLOR }}
              title={`Lazer ${fmt(lazerDisplay)}`}
            />
          )}
        </div>
        <div className="chart-stacked-legend">
          {custoPct > 0 && (
            <span>
              <span className="chart-legend-dot" style={{ background: CUSTO_COLOR }} />
              Custo {fmt(custoPct)}
            </span>
          )}
          {envelopesPct > 0 && (
            <span>
              <span className="chart-legend-dot" style={{ background: ENVELOPE_COLOR }} />
              Env. {fmt(envelopesPct)}
            </span>
          )}
          <span>
            <span className="chart-legend-dot" style={{ background: LAZER_COLOR }} />
            Lazer {fmt(lazerPct)}
          </span>
        </div>
      </div>

      {/* Reserve thermometer */}
      <div style={{ marginTop: 8 }}>
        <div className="chart-bar-label">
          Reserva de emergência —{' '}
          <span style={{ color: statusColor, fontWeight: 700 }}>{STATUS_LABEL[status]}</span>
        </div>
        <div className="chart-therm-bar">
          <div
            className="chart-therm-fill"
            style={{ width: fmt(termPct), background: statusColor }}
          />
        </div>
        <div className="chart-therm-labels">
          <span>
            R$ {patrimonio.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
          </span>
          <span>
            Meta: R$ {reservaAlvo.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="chart-therm-sublabel">
          {reservaMeses} {reservaMeses === 1 ? 'mês' : 'meses'} de custo de vida
        </div>
      </div>
    </div>
  )
}
