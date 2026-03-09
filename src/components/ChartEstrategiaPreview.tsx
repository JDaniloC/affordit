import React from 'react'
import { Criterio } from '../types'
import { FluxoCaixaResult, StatusPatrimonioResult } from '../logic/index'

interface Props {
  criterio: Criterio
  fluxo: FluxoCaixaResult
  patrim: StatusPatrimonioResult
  roiOk: boolean
  ferramenta: boolean
  sobraLazerMensal: number
}

function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

const PATRIM_LABEL: Record<string, string> = { green: 'Verde', yellow: 'Amarelo', red: 'Vermelho' }
const PATRIM_COLOR: Record<string, string> = {
  green: '#10b981',
  yellow: '#f59e0b',
  red: '#ef4444',
}

export default function ChartEstrategiaPreview({
  criterio,
  fluxo,
  patrim,
  roiOk,
  ferramenta,
  sobraLazerMensal,
}: Props) {
  const cards: {
    id: Criterio
    icon: string
    label: string
    content: React.ReactNode
  }[] = [
    {
      id: 'fluxo',
      icon: '💸',
      label: 'Fluxo',
      content: (
        <>
          <div
            className="estrategia-mini-status"
            style={{ color: fluxo.parcelaCabe ? '#10b981' : '#f59e0b' }}
          >
            {fluxo.parcelaCabe ? 'Parcela cabe' : 'Precisa juntar'}
          </div>
          {fluxo.delay !== null && (
            <div className="estrategia-mini-detail">
              {fluxo.delay === 0 ? 'Disponível agora' : `${fluxo.delay} mês(es) de espera`}
            </div>
          )}
          {sobraLazerMensal > 0 && (
            <div className="estrategia-mini-detail">
              Parcela: {fmtBRL(fluxo.parcelaValor)} / Lazer: {fmtBRL(sobraLazerMensal)}
            </div>
          )}
        </>
      ),
    },
    {
      id: 'patrimonio',
      icon: '🏦',
      label: 'Patrimônio',
      content: (
        <>
          <div
            className="estrategia-mini-status"
            style={{ color: PATRIM_COLOR[patrim.statusAtual] }}
          >
            {PATRIM_LABEL[patrim.statusAtual]}
          </div>
          {patrim.alertaDegracao && (
            <div className="estrategia-mini-detail" style={{ color: '#f59e0b' }}>
              ⚠ Degradação: {PATRIM_LABEL[patrim.statusAposCompra]}
            </div>
          )}
          {!patrim.alertaDegracao && (
            <div className="estrategia-mini-detail">Sem degradação</div>
          )}
        </>
      ),
    },
    {
      id: 'roi',
      icon: '🚀',
      label: 'ROI',
      content: (
        <>
          <div
            className="estrategia-mini-status"
            style={{ color: roiOk ? '#10b981' : '#ef4444' }}
          >
            {roiOk ? 'Aprovado' : 'Negado'}
          </div>
          <div className="estrategia-mini-detail">
            {!ferramenta
              ? 'Não é ferramenta'
              : roiOk
              ? 'Patrimônio ok para ROI'
              : 'Patrimônio insuficiente'}
          </div>
        </>
      ),
    },
  ]

  return (
    <div className="chart-panel-inner">
      <div className="chart-title">Prévia das estratégias</div>
      <div className="estrategia-mini-grid">
        {cards.map((card) => (
          <div
            key={card.id}
            className={`estrategia-mini-card${criterio === card.id ? ' active' : ''}`}
          >
            <div className="estrategia-mini-header">
              <span>{card.icon}</span>
              <span className="estrategia-mini-label">{card.label}</span>
            </div>
            <div className="estrategia-mini-body">{card.content}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
