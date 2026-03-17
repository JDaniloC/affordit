import React, { useState, useEffect, useMemo } from 'react'
import { Envelope, Criterio, TipoCompra } from './types'
import {
  simularLogica,
  calcFluxoCaixa,
  calcStatusPatrimonio,
  calcRoiAprovacao,
  calcLazerPct,
  selectCriterioAuto,
  calcImpactoMetaFinanceira,
  calcCustoComJuros,
  validarPassivoAltoValor,
  calcScoreSaude,
  SimularResult,
  FluxoCaixaResult,
  StatusPatrimonioResult,
  MetaFinanceiraResult,
  CustoFinanciamentoResult,
  ValidarPassivoAltoValorResult,
  ScoreSaudeResult,
} from './logic/index'
import ConfigSection from './components/ConfigSection'
import RealidadeSection from './components/RealidadeSection'
import SonhoSection from './components/SonhoSection'
import EstrategiaSection from './components/EstrategiaSection'
import ResultadoSection from './components/ResultadoSection'
import StepperNav from './components/StepperNav'
import StepperActions from './components/StepperActions'
import ChartDistribuicao from './components/ChartDistribuicao'
import ChartReservaViva from './components/ChartReservaViva'
import ChartPrazoVivo from './components/ChartPrazoVivo'
import ResultadoLive from './components/ResultadoLive'

const STORAGE_KEY = 'affordit_state'

interface SimulacaoResultado {
  resultado: SimularResult
  criterio: Criterio
  fluxo: FluxoCaixaResult
  patrim: StatusPatrimonioResult
  roiOk: boolean
  ferramenta: boolean
  renda: number
  custo: number
  patrimonio: number
  itemValor: number
  itemNome: string
  parcelas: number
  metaValor: number
  metaResult: MetaFinanceiraResult | null
  // P0 features
  tipoCompra: TipoCompra
  taxaJuros: number
  custoFinanciamento: CustoFinanciamentoResult | null
  passivoResult: ValidarPassivoAltoValorResult | null
  manutencaoMensal: number
  entradaValor: number
  despesaSubstituida: number
  parcelasExistentes: number
  // P1 features
  rendimentoAnual: number
  scoreSaude: ScoreSaudeResult
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export default function App() {
  const saved = loadFromStorage()

  const [envelopes, setEnvelopes] = useState<Envelope[]>(saved?.envelopes ?? [])
  const [reservaMeses, setReservaMeses] = useState<number>(saved?.reservaMeses ?? 6)
  const [renda, setRenda] = useState<number>(saved?.renda ?? 0)
  const [custo, setCusto] = useState<number>(saved?.custo ?? 0)
  const [patrimonio, setPatrimonio] = useState<number>(saved?.patrimonio ?? 0)
  const [metaValor, setMetaValor] = useState<number>(saved?.metaValor ?? 0)
  const [itemNome, setItemNome] = useState<string>(saved?.itemNome ?? '')
  const [itemValor, setItemValor] = useState<number>(saved?.itemValor ?? 0)
  const [parcelas, setParcelas] = useState<number>(saved?.parcelas ?? 1)
  // P0 / P1 state
  const [tipoCompra, setTipoCompra] = useState<TipoCompra>(saved?.tipoCompra ?? 'lazer')
  const [manutencaoMensal, setManutencaoMensal] = useState<number>(saved?.manutencaoMensal ?? 0)
  const [entradaValor, setEntradaValor] = useState<number>(saved?.entradaValor ?? 0)
  const [despesaSubstituida, setDespesaSubstituida] = useState<number>(saved?.despesaSubstituida ?? 0)
  const [taxaJuros, setTaxaJuros] = useState<number>(saved?.taxaJuros ?? 0)
  const [parcelasExistentes, setParcelasExistentes] = useState<number>(saved?.parcelasExistentes ?? 0)
  const [rendimentoAnual, setRendimentoAnual] = useState<number>(saved?.rendimentoAnual ?? 0)
  // Derived: ferramenta boolean from tipoCompra
  const ferramenta = tipoCompra === 'ferramenta'
  const [simulacao, setSimulacao] = useState<SimulacaoResultado | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  // Stepper state
  const [step, setStep] = useState<number>(1) // 1–4 = form steps, 5 = result
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')

  // Persist state on every change
  useEffect(() => {
    const data = {
      envelopes,
      reservaMeses,
      renda,
      custo,
      patrimonio,
      metaValor,
      itemNome,
      itemValor,
      parcelas,
      tipoCompra,
      manutencaoMensal,
      entradaValor,
      despesaSubstituida,
      taxaJuros,
      parcelasExistentes,
      rendimentoAnual,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [envelopes, reservaMeses, renda, custo, patrimonio, metaValor, itemNome, itemValor, parcelas, tipoCompra, manutencaoMensal, entradaValor, despesaSubstituida, taxaJuros, parcelasExistentes, rendimentoAnual])

  // Auto-selected strategy: 1% rule → patrimônio, otherwise → fluxo
  const criterioAuto = useMemo(
    () => selectCriterioAuto(patrimonio, itemValor),
    [patrimonio, itemValor],
  )

  // Derived values for charts
  const sobraLazerMensal = useMemo(
    () => Math.max(0, (calcLazerPct(renda, custo, envelopes) / 100) * renda - parcelasExistentes),
    [renda, custo, envelopes, parcelasExistentes],
  )

  // Sum of envelope amounts in R$ (used for validarPassivoAltoValor)
  const baldeInvestimentoR = useMemo(
    () => envelopes.reduce((sum, e) => sum + (e.pct / 100) * renda, 0),
    [envelopes, renda],
  )

  // Real cost of financing with interest (P0.2)
  const custoFinanciamentoLive = useMemo(
    () => taxaJuros > 0 && parcelas > 1
      ? calcCustoComJuros(itemValor, parcelas, taxaJuros)
      : null,
    [itemValor, parcelas, taxaJuros],
  )

  // Parcela efetiva (com ou sem juros)
  const parcelaEfetiva = useMemo(() => {
    if (custoFinanciamentoLive) return custoFinanciamentoLive.parcelaValor
    return parcelas > 1 ? itemValor / parcelas : itemValor
  }, [custoFinanciamentoLive, itemValor, parcelas])

  // P1.4 — converte taxa anual (a.a.) para mensal efetiva pelo regime composto
  // Fórmula: i_mensal = (1 + i_anual)^(1/12) - 1
  const rendimentoMensalEfetivo = useMemo(
    () => rendimentoAnual > 0 ? (Math.pow(1 + rendimentoAnual / 100, 1 / 12) - 1) * 100 : 0,
    [rendimentoAnual],
  )

  // P1.5 — score de saúde financeira (live, atualiza enquanto o usuário preenche)
  const scoreSaude = useMemo(
    () => calcScoreSaude(renda, custo, patrimonio, reservaMeses, parcelasExistentes, envelopes),
    [renda, custo, patrimonio, reservaMeses, parcelasExistentes, envelopes],
  )

  const fluxoLive: FluxoCaixaResult = useMemo(
    () => calcFluxoCaixa(itemValor, sobraLazerMensal, parcelas),
    [itemValor, sobraLazerMensal, parcelas],
  )

  const patrimLive: StatusPatrimonioResult = useMemo(
    () => calcStatusPatrimonio(patrimonio, custo, itemValor),
    [patrimonio, custo, itemValor],
  )

  const roiOkLive = useMemo(
    () => calcRoiAprovacao(patrimLive.statusAtual, ferramenta),
    [patrimLive, ferramenta],
  )

  const resultadoLive = useMemo(() => {
    if (renda <= 0 || itemValor <= 0) return null
    return simularLogica({
      renda,
      custo,
      patrimonio,
      reservaMeses,
      itemValor,
      itemNome: itemNome.trim() || 'Item',
      ferramenta,
      envelopes,
      parcelas,
      parcelasExistentes,
    })
  }, [renda, custo, patrimonio, reservaMeses, itemValor, itemNome, ferramenta, envelopes, parcelas, parcelasExistentes])

  function simular() {
    if (renda <= 0) {
      setErro('Informe sua renda líquida mensal.')
      return
    }
    if (itemValor <= 0) {
      setErro('Informe o valor do item desejado.')
      return
    }
    setErro(null)

    const resultado = simularLogica({
      renda,
      custo,
      patrimonio,
      reservaMeses,
      itemValor,
      itemNome: itemNome.trim() || 'Item',
      ferramenta,
      envelopes,
      parcelas,
      parcelasExistentes,
    })

    const fluxo = calcFluxoCaixa(itemValor, resultado.debug.sobraLazerMensal, parcelas)
    const patrim = calcStatusPatrimonio(patrimonio, custo, itemValor)
    const roiOk = calcRoiAprovacao(patrim.statusAtual, ferramenta)

    const metaResult = metaValor > 0
      ? calcImpactoMetaFinanceira(patrimonio, sobraLazerMensal, itemValor, parcelas, metaValor, rendimentoMensalEfetivo)
      : null

    // P0.2 — custo com juros
    const custoFinanciamento = taxaJuros > 0 && parcelas > 1
      ? calcCustoComJuros(itemValor, parcelas, taxaJuros)
      : null

    // P0.1 — validação passivo de alto valor
    const passivoResult = tipoCompra === 'passivoAltoValor'
      ? validarPassivoAltoValor({
          patrimonio,
          renda,
          custo,
          entrada: entradaValor,
          parcela: parcelaEfetiva,
          manutencao: manutencaoMensal,
          despesaSubstituida,
          baldeLazer: sobraLazerMensal,
          baldeInvestimento: baldeInvestimentoR,
        })
      : null

    setSimulacao({
      resultado,
      criterio: criterioAuto,
      fluxo,
      patrim,
      roiOk,
      ferramenta,
      renda,
      custo,
      patrimonio,
      itemValor,
      itemNome: itemNome.trim() || 'Item',
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
    })
  }

  function goNext() {
    setErro(null)
    if (step === 1 && renda <= 0) {
      setErro('Informe sua renda líquida mensal.')
      return
    }
    if (step === 3 && itemValor <= 0) {
      setErro('Informe o valor do item desejado.')
      return
    }
    if (step === 4) {
      // validate then simulate
      if (renda <= 0) {
        setErro('Informe sua renda líquida mensal.')
        return
      }
      if (itemValor <= 0) {
        setErro('Informe o valor do item desejado.')
        return
      }
      simular()
      setDirection('forward')
      setStep(5)
      return
    }
    setDirection('forward')
    setStep((s) => s + 1)
  }

  function goBack() {
    setErro(null)
    if (step === 5) {
      setDirection('back')
      setStep(4)
      return
    }
    setDirection('back')
    setStep((s) => Math.max(1, s - 1))
  }

  function novoCalculo() {
    setSimulacao(null)
    setErro(null)
    setDirection('back')
    setStep(1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Result page
  if (step === 5 && simulacao) {
    return (
      <div id="app">
        <header className="result-header">
          <button className="btn-secondary result-back-btn" onClick={goBack}>
            ← Voltar
          </button>
          <h1>Resultado</h1>
        </header>
        <main>
          <div className="col-form" style={{ maxWidth: 660, margin: '0 auto' }}>
            <ResultadoSection
              resultado={simulacao.resultado}
              criterio={simulacao.criterio}
              fluxo={simulacao.fluxo}
              patrim={simulacao.patrim}
              roiOk={simulacao.roiOk}
              ferramenta={simulacao.ferramenta}
              renda={simulacao.renda}
              custo={simulacao.custo}
              patrimonio={simulacao.patrimonio}
              itemValor={simulacao.itemValor}
              itemNome={simulacao.itemNome}
              parcelas={simulacao.parcelas}
              metaValor={simulacao.metaValor}
              metaResult={simulacao.metaResult}
              tipoCompra={simulacao.tipoCompra}
              taxaJuros={simulacao.taxaJuros}
              custoFinanciamento={simulacao.custoFinanciamento}
              passivoResult={simulacao.passivoResult}
              manutencaoMensal={simulacao.manutencaoMensal}
              entradaValor={simulacao.entradaValor}
              despesaSubstituida={simulacao.despesaSubstituida}
              parcelasExistentes={simulacao.parcelasExistentes}
              rendimentoAnual={simulacao.rendimentoAnual}
              scoreSaude={simulacao.scoreSaude}
              onRefazer={novoCalculo}
            />
          </div>
        </main>
        <footer>
          <p>Seus dados são salvos localmente no seu navegador. Nenhuma informação é enviada.</p>
        </footer>
      </div>
    )
  }

  // Chart for current step
  const chartPanel = (
    <div className="step-chart-panel">
      {step === 1 && (
        <ChartDistribuicao renda={renda} custo={custo} envelopes={envelopes} />
      )}
      {step === 2 && (
        <ChartReservaViva
          renda={renda}
          custo={custo}
          patrimonio={patrimonio}
          reservaMeses={reservaMeses}
          envelopes={envelopes}
        />
      )}
      {step === 3 && (
        <ChartPrazoVivo
          itemValor={itemValor}
          itemNome={itemNome || 'o item'}
          patrimonio={patrimonio}
          sobraLazerMensal={sobraLazerMensal}
          parcelas={parcelas}
        />
      )}
      {step === 4 && (
        <ResultadoLive
          resultado={resultadoLive}
          criterio={criterioAuto}
          fluxo={fluxoLive}
          patrim={patrimLive}
          roiOk={roiOkLive}
          ferramenta={ferramenta}
          sobraLazerMensal={sobraLazerMensal}
          itemValor={itemValor}
          itemNome={itemNome || 'Item'}
          patrimonio={patrimonio}
        />
      )}
    </div>
  )

  return (
    <div id="app">
      <header>
        <h1>Posso Comprar?</h1>
        <p className="subtitle">
          Simule a viabilidade de uma compra com base nos seus envelopes financeiros.
        </p>
      </header>

      <StepperNav currentStep={step} />

      <main>
        <div className={`step-layout step-slide-${direction}`} key={step}>
          {/* Chart panel — order -1 on mobile (top), right on desktop */}
          {chartPanel}

          {/* Form panel */}
          <div className="step-form-panel">
            {step === 1 && (
              <ConfigSection
                renda={renda}
                onRendaChange={setRenda}
                custo={custo}
                onCustoChange={setCusto}
                envelopes={envelopes}
                onEnvelopesChange={setEnvelopes}
                parcelasExistentes={parcelasExistentes}
                onParcelasExistentesChange={setParcelasExistentes}
              />
            )}

            {step === 2 && (
              <RealidadeSection
                patrimonio={patrimonio}
                onPatrimonioChange={setPatrimonio}
                reservaMeses={reservaMeses}
                onReservaMesesChange={setReservaMeses}
                metaValor={metaValor}
                onMetaValorChange={setMetaValor}
                rendimentoAnual={rendimentoAnual}
                onRendimentoAnualChange={setRendimentoAnual}
                scoreSaude={scoreSaude}
              />
            )}

            {step === 3 && (
              <SonhoSection
                itemNome={itemNome}
                onItemNomeChange={setItemNome}
                itemValor={itemValor}
                onItemValorChange={setItemValor}
                tipoCompra={tipoCompra}
                onTipoCompraChange={setTipoCompra}
                manutencaoMensal={manutencaoMensal}
                onManutencaoMensalChange={setManutencaoMensal}
                entradaValor={entradaValor}
                onEntradaValorChange={setEntradaValor}
                despesaSubstituida={despesaSubstituida}
                onDespesaSubstituida={setDespesaSubstituida}
              />
            )}

            {step === 4 && (
              <EstrategiaSection
                criterioAuto={criterioAuto}
                patrimonio={patrimonio}
                itemValor={itemValor}
                parcelas={parcelas}
                onParcelasChange={setParcelas}
                taxaJuros={taxaJuros}
                onTaxaJurosChange={setTaxaJuros}
                custoFinanciamento={custoFinanciamentoLive}
              />
            )}

            <StepperActions step={step} onBack={goBack} onNext={goNext} erro={erro} />
          </div>
        </div>
      </main>

      <footer>
        <p>Seus dados são salvos localmente no seu navegador. Nenhuma informação é enviada.</p>
      </footer>
    </div>
  )
}
