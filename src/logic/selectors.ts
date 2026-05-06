import {
  simularLogica,
  calcFluxoCaixa,
  calcStatusPatrimonio,
  calcImpactoMetaFinanceira,
  calcCustoComJuros,
  validarPassivoAltoValor,
  calcScoreSaude,
  calcRiscoPatrimonio,
  compoeVeredito,
  SimularResult,
  FluxoCaixaResult,
  StatusPatrimonioResult,
  MetaFinanceiraResult,
  CustoFinanciamentoResult,
  ValidarPassivoAltoValorResult,
  ScoreSaudeResult,
  RiscoPatrimonio,
} from './index'
import { PerfilFinanceiro, Cenario } from '../types'

export interface ResultadoCenario {
  veredito: SimularResult
  fluxo: FluxoCaixaResult
  statusPatrimonio: StatusPatrimonioResult
  custoFinanciamento: CustoFinanciamentoResult | null
  passivoResult: ValidarPassivoAltoValorResult | null
  score: ScoreSaudeResult
  risco: RiscoPatrimonio
  metaResult: MetaFinanceiraResult | null
  // Derivados úteis para a UI
  parcelaEfetiva: number
  sobraLazerMensal: number
  rendimentoMensalEfetivo: number
}

export function calcularResultadoCenario(
  perfil: PerfilFinanceiro,
  cenario: Cenario,
): ResultadoCenario {
  const ferramenta = cenario.tipoCompra === 'ferramenta'

  // P2.7 — custo efetivo aplica a redução hipotética uniformemente em toda a árvore
  // de cálculo. Quando reducaoHipotetica = 0 (default), o comportamento é idêntico ao anterior.
  const custoEfetivo = Math.max(0, perfil.custo - perfil.reducaoHipotetica)

  const baldeInvestimentoR = perfil.envelopes.reduce(
    (sum, e) => sum + (e.pct / 100) * perfil.renda,
    0,
  )

  const custoFinanciamento =
    cenario.taxaJuros > 0 && cenario.parcelas > 1
      ? calcCustoComJuros(cenario.itemValor, cenario.parcelas, cenario.taxaJuros)
      : null

  const parcelaEfetiva = custoFinanciamento
    ? custoFinanciamento.parcelaValor
    : cenario.parcelas > 1
      ? cenario.itemValor / cenario.parcelas
      : cenario.itemValor

  const rendimentoMensalEfetivo =
    perfil.rendimentoAnual > 0
      ? (Math.pow(1 + perfil.rendimentoAnual / 100, 1 / 12) - 1) * 100
      : 0

  const veredito = simularLogica({
    renda: perfil.renda,
    custo: custoEfetivo,
    patrimonio: perfil.patrimonio,
    reservaMeses: perfil.reservaMeses,
    itemValor: cenario.itemValor,
    itemNome: cenario.itemNome || 'Item',
    ferramenta,
    envelopes: perfil.envelopes,
    parcelas: cenario.parcelas,
    parcelasExistentes: perfil.parcelasExistentes,
  })

  const fluxo = calcFluxoCaixa(
    cenario.itemValor,
    veredito.debug.sobraLazerMensal,
    cenario.parcelas,
  )

  const statusPatrimonio = calcStatusPatrimonio(
    perfil.patrimonio,
    custoEfetivo,
    cenario.itemValor,
  )

  const passivoResult =
    cenario.tipoCompra === 'passivoAltoValor'
      ? validarPassivoAltoValor({
          patrimonio: perfil.patrimonio,
          renda: perfil.renda,
          custo: custoEfetivo,
          entrada: cenario.entradaValor,
          parcela: parcelaEfetiva,
          manutencao: cenario.manutencaoMensal,
          despesaSubstituida: cenario.despesaSubstituida,
          baldeLazer: veredito.debug.sobraLazerMensal,
          baldeInvestimento: baldeInvestimentoR,
        })
      : null

  const score = calcScoreSaude(
    perfil.renda,
    custoEfetivo,
    perfil.patrimonio,
    perfil.reservaMeses,
    perfil.parcelasExistentes,
    perfil.envelopes,
  )

  const metaResult =
    perfil.metaValor > 0
      ? calcImpactoMetaFinanceira(
          perfil.patrimonio,
          veredito.debug.sobraLazerMensal,
          cenario.itemValor,
          cenario.parcelas,
          perfil.metaValor,
          rendimentoMensalEfetivo,
        )
      : null

  const reservaAlvo = custoEfetivo * perfil.reservaMeses
  const patrimonioPosCompra =
    cenario.parcelas <= 1
      ? perfil.patrimonio - cenario.itemValor
      : perfil.patrimonio - cenario.entradaValor
  const dtiPos =
    perfil.renda > 0
      ? (perfil.parcelasExistentes + parcelaEfetiva) / perfil.renda
      : 0

  const risco = calcRiscoPatrimonio({
    patrimonio: perfil.patrimonio,
    valorCompra: cenario.itemValor,
    tipoCompra: cenario.tipoCompra,
    parcelasExistentes: perfil.parcelasExistentes,
    parcelaNova: parcelaEfetiva,
    sobraLazerMensal: veredito.debug.sobraLazerMensal,
    dtiPos,
    atrasoMetaMeses: metaResult?.atrasoMeses ?? null,
    reservaAlvo,
    patrimonioPosCompra,
  })

  const vereditoComposto = compoeVeredito(veredito.veredito, risco)
  const vereditoFinal: SimularResult =
    vereditoComposto === veredito.veredito
      ? veredito
      : { ...veredito, veredito: vereditoComposto }

  return {
    veredito: vereditoFinal,
    fluxo,
    statusPatrimonio,
    custoFinanciamento,
    passivoResult,
    score,
    risco,
    metaResult,
    parcelaEfetiva,
    sobraLazerMensal: veredito.debug.sobraLazerMensal,
    rendimentoMensalEfetivo,
  }
}
