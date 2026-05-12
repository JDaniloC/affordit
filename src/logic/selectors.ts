// ─────────────────────────────────────────────────────────────────────────────
// Pipeline do veredito (entry único: `calcularResultadoCenario`)
//
//   simularLogica          → veredito base (aprovado/juntar/negado) + debug
//        │
//        ├── calcFluxoCaixa, calcStatusPatrimonio, calcCustoComJuros
//        ├── validarPassivoAltoValor    (só se tipoCompra === 'passivoAltoValor')
//        ├── calcImpactoMetaFinanceira  (só se metaValor > 0)
//        ├── calcScoreSaude
//        └── calcRiscoPatrimonio        → tier (verde/amarelo/laranja/vermelho)
//                                           com motivos[]
//        ▼
//   compoeVeredito(veredito, risco)    → REBAIXA o veredito se o tier exigir.
//                                          Nunca promove. (Ciclo 0/A/G:
//                                          default "ainda não".)
//
// Campos `Cenario.inflacaoAnual` e `Cenario.taxaDepreciacaoAnual` NÃO entram
// no pipeline — são display-only, consumidos por InflacaoCard/DepreciacaoCard
// em CenariosPage como contexto educativo.
// ─────────────────────────────────────────────────────────────────────────────

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
import { somaCompromissos } from '../utils/compromissos'
import { somaGastos } from '../utils/gastos'

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
  const totalGastos = somaGastos(perfil)

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

  const totalCompromissos = somaCompromissos(perfil)

  const veredito = simularLogica({
    renda: perfil.renda,
    custo: totalGastos,
    patrimonio: perfil.patrimonio,
    reservaMeses: perfil.reservaMeses,
    itemValor: cenario.itemValor,
    itemNome: cenario.itemNome || 'Item',
    ferramenta,
    envelopes: perfil.envelopes,
    parcelas: cenario.parcelas,
    parcelasExistentes: totalCompromissos,
  })

  const fluxo = calcFluxoCaixa(
    cenario.itemValor,
    veredito.debug.sobraLazerMensal,
    cenario.parcelas,
  )

  const statusPatrimonio = calcStatusPatrimonio(
    perfil.patrimonio,
    totalGastos,
    cenario.itemValor,
  )

  const passivoResult =
    cenario.tipoCompra === 'passivoAltoValor'
      ? validarPassivoAltoValor({
          patrimonio: perfil.patrimonio,
          renda: perfil.renda,
          custo: totalGastos,
          entrada: cenario.entradaValor,
          parcela: parcelaEfetiva,
          manutencao: cenario.manutencaoMensal,
          despesaSubstituida: cenario.despesaSubstituida,
          baldeLazer: veredito.debug.sobraLazerMensal,
          baldeInvestimento: baldeInvestimentoR,
          reservaMeses: perfil.reservaMeses,
        })
      : null

  const score = calcScoreSaude(
    perfil.renda,
    totalGastos,
    perfil.patrimonio,
    perfil.reservaMeses,
    totalCompromissos,
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

  const reservaAlvo = totalGastos * perfil.reservaMeses
  const patrimonioPosCompra =
    cenario.parcelas <= 1
      ? perfil.patrimonio - cenario.itemValor
      : perfil.patrimonio - cenario.entradaValor
  const dtiPos =
    perfil.renda > 0
      ? (totalCompromissos + parcelaEfetiva) / perfil.renda
      : 0

  const risco = calcRiscoPatrimonio({
    patrimonio: perfil.patrimonio,
    valorCompra: cenario.itemValor,
    tipoCompra: cenario.tipoCompra,
    parcelasExistentes: totalCompromissos,
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
