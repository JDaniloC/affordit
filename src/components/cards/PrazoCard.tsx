import React from 'react'
import { fmt, fmtMeses } from './_format'

interface Props {
  itemValor: number
  itemNome: string
  sobraLazerMensal: number
  patrimonio: number
}

export default function PrazoCard({
  itemValor,
  itemNome,
  sobraLazerMensal,
  patrimonio,
}: Props) {
  const jaTemCash = patrimonio >= itemValor
  const meses = sobraLazerMensal > 0 ? Math.ceil(itemValor / sobraLazerMensal) : null
  const progresso = itemValor > 0 ? Math.min(100, (patrimonio / itemValor) * 100) : 100
  const variant = jaTemCash ? 'ok' : meses === null ? 'block' : 'neutral'

  const prazoNumero = jaTemCash ? 'Você já tem!' : meses === null ? 'Sem sobra' : fmtMeses(meses)
  const ctxMsg = jaTemCash
    ? `Seu dinheiro guardado (${fmt(patrimonio)}) já cobre ${itemNome || 'o item'}.`
    : meses === null
    ? 'Não sobra dinheiro no mês para juntar. Revise seus gastos.'
    : `Guardando ${fmt(sobraLazerMensal)} por mês, você chega lá em ${fmtMeses(meses)}.`

  return (
    <div className={`prazo-card prazo-${variant}`}>
      <div className="prazo-top">
        <div className="prazo-left">
          <div className="prazo-label">Tempo para juntar</div>
          <div className="prazo-numero">{prazoNumero}</div>
          <div className="prazo-equacao">{ctxMsg}</div>
        </div>
        <div className="prazo-meta">
          <div className="prazo-meta-valor">{fmt(itemValor)}</div>
          <div className="prazo-meta-label">{itemNome || 'item'}</div>
        </div>
      </div>
      <div className="prazo-progress-wrap">
        <div className="prazo-progress-bar">
          <div className="prazo-progress-fill" style={{ width: `${progresso}%` }} />
        </div>
        <div className="prazo-progress-labels">
          <span>Guardado: {fmt(Math.min(patrimonio, itemValor))}</span>
          {!jaTemCash && <span>Falta: {fmt(itemValor - patrimonio)}</span>}
          {jaTemCash && <span className="prazo-ok-label">Valor disponível ✓</span>}
        </div>
      </div>
    </div>
  )
}
