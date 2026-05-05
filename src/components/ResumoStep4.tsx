import React from 'react'
import type { CustoFinanciamentoResult } from '../logic/index'

interface Props {
  itemValor: number
  itemNome: string
  parcelas: number
  parcelaEfetiva: number
  sobraLazerMensal: number
  patrimonio: number
  custoFinanciamento: CustoFinanciamentoResult | null
}

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

const fmtPct = (v: number) => `${(v * 100).toFixed(1)}%`

export default function ResumoStep4({
  itemValor,
  itemNome,
  parcelas,
  parcelaEfetiva,
  sobraLazerMensal,
  patrimonio,
  custoFinanciamento,
}: Props) {
  if (itemValor <= 0) {
    return (
      <div className="chart-panel-inner resultado-live-empty">
        <div className="resultado-live-placeholder">
          <span className="resultado-live-placeholder-icon">📊</span>
          <p>Preencha o valor do item para ver os números aqui.</p>
        </div>
      </div>
    )
  }

  const pctPatrimonio = patrimonio > 0 ? itemValor / patrimonio : null
  const mesesParaJuntar = sobraLazerMensal > 0 ? Math.ceil(itemValor / sobraLazerMensal) : null
  const pctParcelaLazer =
    sobraLazerMensal > 0 && parcelas > 1 ? parcelaEfetiva / sobraLazerMensal : null

  return (
    <div className="chart-panel-inner">
      <div className="chart-title">Números desta compra</div>

      <ul className="resumo-step4-lista">
        <li>
          <span className="resumo-label">Valor do item</span>
          <span className="resumo-valor">{fmt(itemValor)}</span>
        </li>

        {parcelas > 1 && (
          <li>
            <span className="resumo-label">Parcela ({parcelas}x)</span>
            <span className="resumo-valor">{fmt(parcelaEfetiva)}/mês</span>
          </li>
        )}

        {custoFinanciamento && custoFinanciamento.totalJuros > 0 && (
          <>
            <li>
              <span className="resumo-label">Total pago com juros</span>
              <span className="resumo-valor">{fmt(custoFinanciamento.totalPago)}</span>
            </li>
            <li>
              <span className="resumo-label">Juros pagos</span>
              <span className="resumo-valor">{fmt(custoFinanciamento.totalJuros)}</span>
            </li>
          </>
        )}

        <li>
          <span className="resumo-label">Sobra mensal de lazer</span>
          <span className="resumo-valor">{fmt(sobraLazerMensal)}/mês</span>
        </li>

        {pctParcelaLazer !== null && (
          <li>
            <span className="resumo-label">Parcela / sobra de lazer</span>
            <span className="resumo-valor">{fmtPct(pctParcelaLazer)}</span>
          </li>
        )}

        {pctPatrimonio !== null && (
          <li>
            <span className="resumo-label">% do patrimônio</span>
            <span className="resumo-valor">{fmtPct(pctPatrimonio)}</span>
          </li>
        )}

        {mesesParaJuntar !== null && (
          <li>
            <span className="resumo-label">Meses para juntar à vista</span>
            <span className="resumo-valor">{mesesParaJuntar}</span>
          </li>
        )}
      </ul>

      <p className="rl-hint">
        Estes são apenas os números brutos. O veredito sai na próxima tela.
      </p>
    </div>
  )
}
