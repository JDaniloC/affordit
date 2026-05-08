import React from 'react'
import type { CustoFinanciamentoResult } from '../../logic/index'
import { fmt } from './_format'

interface Props {
  custoFinanciamento: CustoFinanciamentoResult | null
  taxaJuros: number
  parcelas: number
  itemValor: number
}

export default function JurosCard({
  custoFinanciamento,
  taxaJuros,
  parcelas,
  itemValor,
}: Props) {
  if (!custoFinanciamento || custoFinanciamento.totalJuros <= 0) return null

  return (
    <div className="juros-card">
      <div className="juros-card-titulo">💸 Custo real do financiamento ({taxaJuros}% a.m.)</div>
      <div className="juros-card-linhas">
        <div className="juros-card-linha">
          <span>Parcela mensal com juros</span>
          <strong>{fmt(custoFinanciamento.parcelaValor)}/mês</strong>
        </div>
        <div className="juros-card-linha">
          <span>Total pago em {parcelas}x</span>
          <strong>{fmt(custoFinanciamento.totalPago)}</strong>
        </div>
        <div className="juros-card-linha juros-card-destaque">
          <span>Juros totais</span>
          <strong>+{fmt(custoFinanciamento.totalJuros)}</strong>
        </div>
      </div>
      <p className="juros-card-nota">
        O item de {fmt(itemValor)} custará {fmt(custoFinanciamento.totalPago)} no total —{' '}
        {((custoFinanciamento.totalJuros / itemValor) * 100).toFixed(0)}% a mais do que o preço à
        vista.
      </p>
    </div>
  )
}
