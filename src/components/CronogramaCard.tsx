import React from 'react'
import type { CronogramaResult } from '../logic/index'
import { formatMesAbreviado, formatPrazoBR } from '../logic/index'

interface Props {
  cronograma: CronogramaResult
  sobraLazerMensal: number
  headStart: number
  totalMetasValor: number
  metaValor: number
  atrasoTotal: number | null
}

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

export default function CronogramaCard({
  cronograma,
  sobraLazerMensal,
  headStart,
  totalMetasValor,
  metaValor,
  atrasoTotal,
}: Props) {
  const ultima = cronograma.agendadas[cronograma.agendadas.length - 1]
  const mostraAtraso = metaValor > 0 && atrasoTotal !== null
  return (
    <div className="cronograma-card">
      <div className="cronograma-resumo">
        <div>
          <span className="cronograma-label">Sobra mensal</span>
          <strong>{fmt(sobraLazerMensal)}/mês</strong>
        </div>
        <div>
          <span className="cronograma-label">Disponível além da reserva</span>
          <strong>{fmt(headStart)}</strong>
        </div>
        <div>
          <span className="cronograma-label">Total das metas</span>
          <strong>{fmt(totalMetasValor)}</strong>
        </div>
        {ultima && (
          <div>
            <span className="cronograma-label">Última compra</span>
            <strong>
              {formatMesAbreviado(ultima.mesQueCompleta)} (em {formatPrazoBR(ultima.mesQueCompleta)})
            </strong>
          </div>
        )}
        {mostraAtraso && (
          <div>
            <span className="cronograma-label">Atraso na sua meta de {fmt(metaValor)}</span>
            <strong className={(atrasoTotal ?? 0) > 12 ? 'cronograma-atraso-alto' : ''}>
              {(atrasoTotal ?? 0) === 0
                ? 'Sem impacto'
                : `+${formatPrazoBR(atrasoTotal as number)}`}
            </strong>
          </div>
        )}
      </div>
    </div>
  )
}
