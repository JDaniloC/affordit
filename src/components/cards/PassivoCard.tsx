import React from 'react'
import type { TipoCompra } from '../../types'
import type { ValidarPassivoAltoValorResult } from '../../logic/index'
import RegraItem from './RegraItem'
import { fmt } from './_format'

interface Props {
  tipoCompra: TipoCompra
  passivoResult: ValidarPassivoAltoValorResult | null
  renda: number
  custo: number
  reservaMeses: number
  itemValor: number
  parcelas: number
  manutencaoMensal: number
  entradaValor: number
  despesaSubstituida: number
}

export default function PassivoCard({
  tipoCompra,
  passivoResult,
  renda,
  custo,
  reservaMeses,
  itemValor,
  parcelas,
  manutencaoMensal,
  entradaValor,
  despesaSubstituida,
}: Props) {
  if (tipoCompra !== 'passivoAltoValor' || !passivoResult) return null

  return (
    <div className="passivo-card">
      <div className="passivo-card-titulo">🏠 Análise: Passivo de Alto Valor</div>
      <div className="regras-lista">
        <RegraItem
          ok={passivoResult.passouEntrada}
          label="Entrada preserva a reserva"
          desc={
            passivoResult.passouEntrada
              ? `Após a entrada de ${fmt(entradaValor)}, você mantém pelo menos ${reservaMeses} ${reservaMeses === 1 ? 'mês' : 'meses'} de custo de vida na reserva.`
              : `A entrada de ${fmt(entradaValor)} reduziria sua reserva abaixo de ${reservaMeses} ${reservaMeses === 1 ? 'mês' : 'meses'} de custo (${fmt(custo * reservaMeses)}). Risco alto.`
          }
        />
        <RegraItem
          ok={passivoResult.passouDTI}
          label="Custo mensal comportável"
          desc={
            passivoResult.passouDTI
              ? `Parcela + manutenção (${fmt((itemValor / parcelas) + manutencaoMensal)}) cabe no orçamento após descontar despesas substituídas.`
              : `Parcela + manutenção ${despesaSubstituida > 0 ? `menos despesa substituída de ${fmt(despesaSubstituida)}` : ''} excede o que sobra no orçamento. Compromete o lazer e os investimentos.`
          }
        />
        <RegraItem
          ok={passivoResult.passouMargem}
          label="Margem de manobra ≥ 5% da renda"
          desc={
            passivoResult.passouMargem
              ? `Após o novo custo fixo, sua sobra mensal é suficiente para imprevistos.`
              : `Com o novo compromisso, sobra menos de 5% da renda (${fmt(renda * 0.05)}/mês). Qualquer imprevisto compromete o orçamento.`
          }
        />
      </div>
      {despesaSubstituida > 0 && (
        <p className="passivo-card-nota">
          Custo efetivo considerado: parcela + manutenção − despesa substituída (aluguel/Uber atual
          de {fmt(despesaSubstituida)}/mês).
        </p>
      )}
    </div>
  )
}
