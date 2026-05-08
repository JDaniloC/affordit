import React from 'react'
import { Criterio, TipoCompra } from '../types'
import type { Meta } from '../types'
import {
  SimularResult,
  FluxoCaixaResult,
  StatusPatrimonioResult,
  MetaFinanceiraResult,
  CustoFinanciamentoResult,
  ValidarPassivoAltoValorResult,
  ScoreSaudeResult,
  RiscoPatrimonio,
} from '../logic/index'
import GraficoPatrimonio from './GraficoPatrimonio'
import GraficoMeta from './GraficoMeta'
import VereditoCard from './cards/VereditoCard'
import FilaMetasCard from './cards/FilaMetasCard'
import RegrasCard from './cards/RegrasCard'
import PrazoCard from './cards/PrazoCard'
import CaminhoCard from './cards/CaminhoCard'
import JurosCard from './cards/JurosCard'
import PassivoCard from './cards/PassivoCard'
import ScoreCard from './cards/ScoreCard'
import { fmt, fmtMeses } from './cards/_format'

interface Props {
  resultado: SimularResult
  criterio: Criterio
  fluxo: FluxoCaixaResult
  patrim: StatusPatrimonioResult
  ferramenta: boolean
  renda: number
  custo: number
  reservaMeses: number
  patrimonio: number
  itemValor: number
  itemNome: string
  parcelas: number
  metaValor: number
  metaResult: MetaFinanceiraResult | null
  tipoCompra: TipoCompra
  taxaJuros: number
  custoFinanciamento: CustoFinanciamentoResult | null
  passivoResult: ValidarPassivoAltoValorResult | null
  manutencaoMensal: number
  entradaValor: number
  despesaSubstituida: number
  parcelasExistentes: number
  rendimentoAnual: number
  scoreSaude: ScoreSaudeResult
  risco: RiscoPatrimonio
  metas: Meta[]
  onAdicionarItemAFila?: () => void
  onAbrirPlanejador?: () => void
  onRefazer?: () => void
}

export default function ResultadoSection({
  resultado,
  fluxo,
  renda,
  custo,
  reservaMeses,
  patrimonio,
  itemValor,
  itemNome,
  parcelas,
  metaValor,
  metaResult,
  tipoCompra,
  taxaJuros,
  custoFinanciamento,
  passivoResult,
  manutencaoMensal,
  entradaValor,
  despesaSubstituida,
  parcelasExistentes,
  rendimentoAnual,
  scoreSaude,
  risco,
  metas,
  onAdicionarItemAFila,
  onAbrirPlanejador,
  onRefazer,
}: Props) {
  const { veredito, debug } = resultado
  const { reservaAlvo, sobraLazerMensal, disponivel, dentro1pct, parcelaValor, parcelaCabe } = debug

  const isNegado = veredito.tipo === 'negado'

  const proximoPasso = (() => {
    if (veredito.tipo === 'aprovado') {
      if (patrimonio >= itemValor)
        return `Você já tem o dinheiro disponível. Pode comprar ${itemNome || 'o item'} agora, sem comprometer sua reserva. Parabéns pela disciplina! 🎉`
      if (sobraLazerMensal > 0) {
        const meses = Math.ceil(itemValor / sobraLazerMensal)
        return `Guarde ${fmt(sobraLazerMensal)} por mês. Em ${fmtMeses(meses)} você terá o suficiente para comprar ${itemNome || 'o item'} sem criar dívidas.`
      }
    }
    if (veredito.tipo === 'juntar') {
      return `Você pode comprar parcelado, mas fique atento: a parcela de ${fmt(fluxo.parcelaValor)} precisa caber no orçamento todo mês. Não use a reserva de emergência para isso — ela é para imprevistos, não para compras.`
    }
    return null
  })()

  return (
    <section className="card" id="section-resultado">
      <VereditoCard veredito={veredito} risco={risco} />

      <FilaMetasCard
        metas={metas}
        itemNome={itemNome}
        itemValor={itemValor}
        patrimonio={patrimonio}
        reservaAlvo={reservaAlvo}
        sobraLazerMensal={sobraLazerMensal}
        onAdicionarItemAFila={onAdicionarItemAFila}
        onAbrirPlanejador={onAbrirPlanejador}
      />

      <RegrasCard
        patrimonio={patrimonio}
        reservaAlvo={reservaAlvo}
        dentro1pct={dentro1pct}
        disponivel={disponivel}
        itemValor={itemValor}
        parcelas={parcelas}
        parcelaCabe={parcelaCabe}
        parcelaValor={parcelaValor}
        sobraLazerMensal={sobraLazerMensal}
      />

      {!isNegado && (
        <PrazoCard
          itemValor={itemValor}
          itemNome={itemNome}
          sobraLazerMensal={sobraLazerMensal}
          patrimonio={patrimonio}
        />
      )}

      {isNegado && (
        <CaminhoCard
          patrimonio={patrimonio}
          reservaAlvo={reservaAlvo}
          sobraLazerMensal={sobraLazerMensal}
          itemValor={itemValor}
          itemNome={itemNome}
        />
      )}

      {sobraLazerMensal > 0 && (
        <GraficoPatrimonio
          patrimonioInicial={patrimonio}
          sobraLazerMensal={sobraLazerMensal}
          itemValor={itemValor}
          itemNome={itemNome}
          parcelas={parcelas}
          reservaAlvo={reservaAlvo}
          rendimentoAnual={rendimentoAnual}
        />
      )}

      {metaValor > 0 &&
        metaResult &&
        !metaResult.metaJaAtingida &&
        metaResult.mesesSemCompra !== null && (
          <GraficoMeta
            patrimonio={patrimonio}
            sobraLazerMensal={sobraLazerMensal}
            itemValor={itemValor}
            itemNome={itemNome}
            parcelas={parcelas}
            metaValor={metaValor}
            metaResult={metaResult}
            rendimentoAnual={rendimentoAnual}
          />
        )}

      {proximoPasso && (
        <div className="proximo-passo-box">
          <div className="proximo-passo-label">👉 O que fazer agora</div>
          <div className="proximo-passo-texto">{proximoPasso}</div>
        </div>
      )}

      <JurosCard
        custoFinanciamento={custoFinanciamento}
        taxaJuros={taxaJuros}
        parcelas={parcelas}
        itemValor={itemValor}
      />

      <PassivoCard
        tipoCompra={tipoCompra}
        passivoResult={passivoResult}
        renda={renda}
        custo={custo}
        reservaMeses={reservaMeses}
        itemValor={itemValor}
        parcelas={parcelas}
        manutencaoMensal={manutencaoMensal}
        entradaValor={entradaValor}
        despesaSubstituida={despesaSubstituida}
      />

      {parcelasExistentes > 0 && (
        <div className="parcelas-existentes-notice">
          <strong>ℹ️ Parcelas em andamento:</strong> {fmt(parcelasExistentes)}/mês descontados do
          balde de lazer nesta simulação.
        </div>
      )}

      <ScoreCard scoreSaude={scoreSaude} />

      {onRefazer && (
        <button
          className="btn-secondary"
          onClick={onRefazer}
          style={{ marginTop: 8, width: '100%' }}
        >
          Refazer Simulação
        </button>
      )}
    </section>
  )
}
