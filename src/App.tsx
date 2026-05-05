import React, { useState, useEffect, useMemo } from 'react'

const logoUrl = import.meta.env.BASE_URL + 'logo.png'
import { AppState, Cenario, Envelope, Meta, TipoCompra } from './types'
import { loadAppState, saveAppState } from './state/storage'
import {
  calcLazerPct,
  selectCriterioAuto,
  calcCustoComJuros,
  calcScoreSaude,
} from './logic/index'
import { gerarId } from './utils/id'
import { formatHash } from './hooks/useHashRoute'
import AppShell from './components/AppShell'
import ConfigSection from './components/ConfigSection'
import RealidadeSection from './components/RealidadeSection'
import SonhoSection from './components/SonhoSection'
import EstrategiaSection from './components/EstrategiaSection'
import StepperNav from './components/StepperNav'
import StepperActions from './components/StepperActions'
import ChartDistribuicao from './components/ChartDistribuicao'
import ChartReservaViva from './components/ChartReservaViva'
import ChartPrazoVivo from './components/ChartPrazoVivo'
import ResumoStep4 from './components/ResumoStep4'

function cenarioVazio(): Cenario {
  const agora = Date.now()
  return {
    id: gerarId(),
    nome: 'Cenário 1',
    itemNome: '',
    itemValor: 0,
    tipoCompra: 'lazer',
    parcelas: 1,
    taxaJuros: 0,
    manutencaoMensal: 0,
    entradaValor: 0,
    despesaSubstituida: 0,
    criadoEm: agora,
    atualizadoEm: agora,
  }
}

export default function App() {
  // Estado raiz único
  const [state, setState] = useState<AppState>(() => {
    const loaded = loadAppState()
    // Auto-cria cenário rascunho apenas durante onboarding (wizard precisa de pelo menos 1)
    if (loaded.cenarios.length === 0 && !loaded.onboardingConcluido) {
      const c = cenarioVazio()
      return { ...loaded, cenarios: [c], cenarioAtivoId: c.id }
    }
    if (loaded.cenarios.length > 0 && !loaded.cenarioAtivoId) {
      return { ...loaded, cenarioAtivoId: loaded.cenarios[0].id }
    }
    return loaded
  })

  const [erro, setErro] = useState<string | null>(null)
  const [step, setStep] = useState<number>(1)
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')

  // Cenário ativo (pode ser null quando cenarios.length === 0 em shell mode)
  const cenario = useMemo<Cenario | null>(() => {
    if (state.cenarios.length === 0) return null
    const c = state.cenarios.find(c => c.id === state.cenarioAtivoId)
    return c ?? state.cenarios[0]
  }, [state.cenarios, state.cenarioAtivoId])

  // Persistência
  useEffect(() => {
    saveAppState(state)
  }, [state])

  // Reconcilia cenarioAtivoId se o cenário ativo foi removido
  useEffect(() => {
    if (state.cenarios.length === 0) return
    const found = state.cenarios.find(c => c.id === state.cenarioAtivoId)
    if (!found) {
      setState(s => ({ ...s, cenarioAtivoId: s.cenarios[0].id }))
    }
  }, [state.cenarios, state.cenarioAtivoId])

  // ========== Aliases ==========
  const renda = state.perfil.renda
  const custo = state.perfil.custo
  const patrimonio = state.perfil.patrimonio
  const reservaMeses = state.perfil.reservaMeses
  const envelopes = state.perfil.envelopes
  const parcelasExistentes = state.perfil.parcelasExistentes
  const rendimentoAnual = state.perfil.rendimentoAnual
  const metaValor = state.perfil.metaValor
  const metas = state.metas
  const itemNome = cenario?.itemNome ?? ''
  const itemValor = cenario?.itemValor ?? 0
  const tipoCompra = cenario?.tipoCompra ?? 'lazer'
  const parcelas = cenario?.parcelas ?? 1
  const taxaJuros = cenario?.taxaJuros ?? 0
  const manutencaoMensal = cenario?.manutencaoMensal ?? 0
  const entradaValor = cenario?.entradaValor ?? 0
  const despesaSubstituida = cenario?.despesaSubstituida ?? 0

  // ========== Setters ==========
  const setPerfil = (patch: Partial<AppState['perfil']>) =>
    setState(s => ({ ...s, perfil: { ...s.perfil, ...patch } }))
  const setCenario = (patch: Partial<Cenario>) =>
    setState(s => ({
      ...s,
      cenarios: s.cenarios.map(c =>
        c.id === s.cenarioAtivoId ? { ...c, ...patch, atualizadoEm: Date.now() } : c,
      ),
    }))
  const setMetas = (next: Meta[]) => setState(s => ({ ...s, metas: next }))

  const setRenda = (v: number) => setPerfil({ renda: v })
  const setCusto = (v: number) => setPerfil({ custo: v })
  const setPatrimonio = (v: number) => setPerfil({ patrimonio: v })
  const setReservaMeses = (v: number) => setPerfil({ reservaMeses: v })
  // Envelopes setter accepts both forms because ConfigSection uses
  // React.Dispatch<SetStateAction<Envelope[]>> (functional updates).
  // All other perfil setters use simple value-replace via setPerfil.
  const setEnvelopes = (v: Envelope[] | ((prev: Envelope[]) => Envelope[])) =>
    setState(s => ({
      ...s,
      perfil: {
        ...s.perfil,
        envelopes: typeof v === 'function' ? v(s.perfil.envelopes) : v,
      },
    }))
  const setParcelasExistentes = (v: number) => setPerfil({ parcelasExistentes: v })
  const setRendimentoAnual = (v: number) => setPerfil({ rendimentoAnual: v })
  const setMetaValor = (v: number) => setPerfil({ metaValor: v })
  const setItemNome = (v: string) => setCenario({ itemNome: v })
  const setItemValor = (v: number) => setCenario({ itemValor: v })
  const setTipoCompra = (v: TipoCompra) => setCenario({ tipoCompra: v })
  const setParcelas = (v: number) => setCenario({ parcelas: v })
  const setTaxaJuros = (v: number) => setCenario({ taxaJuros: v })
  const setManutencaoMensal = (v: number) => setCenario({ manutencaoMensal: v })
  const setEntradaValor = (v: number) => setCenario({ entradaValor: v })
  const setDespesaSubstituida = (v: number) => setCenario({ despesaSubstituida: v })

  const setCenarioAtivoId = (id: string) =>
    setState(s => ({ ...s, cenarioAtivoId: id }))

  const criarCenarioVazio = () => {
    const c = cenarioVazio()
    setState(s => {
      const numero = s.cenarios.length + 1
      const named: Cenario = { ...c, nome: `Cenário ${numero}` }
      return {
        ...s,
        cenarios: [...s.cenarios, named],
        cenarioAtivoId: named.id,
      }
    })
    window.location.hash = formatHash('cenarios', { id: c.id })
  }

  const duplicarCenarioAtivo = () => {
    if (!state.cenarioAtivoId) return
    const ativo = state.cenarios.find(c => c.id === state.cenarioAtivoId)
    if (!ativo) return
    const agora = Date.now()
    const novo: Cenario = {
      ...ativo,
      id: gerarId(),
      nome: `${ativo.nome} (cópia)`,
      criadoEm: agora,
      atualizadoEm: agora,
    }
    setState(s => ({
      ...s,
      cenarios: [...s.cenarios, novo],
      cenarioAtivoId: novo.id,
    }))
    window.location.hash = formatHash('cenarios', { id: novo.id })
  }

  const excluirCenario = (id: string) => {
    setState(s => {
      const cenarios = s.cenarios.filter(c => c.id !== id)
      const cenarioAtivoId =
        s.cenarioAtivoId === id
          ? (cenarios[0]?.id ?? null)
          : s.cenarioAtivoId
      return { ...s, cenarios, cenarioAtivoId }
    })
  }

  const criterioAuto = useMemo(
    () => selectCriterioAuto(patrimonio, itemValor),
    [patrimonio, itemValor],
  )

  const sobraLazerMensal = useMemo(
    () => Math.max(0, (calcLazerPct(renda, custo, envelopes) / 100) * renda - parcelasExistentes),
    [renda, custo, envelopes, parcelasExistentes],
  )

  const custoFinanciamentoLive = useMemo(
    () =>
      taxaJuros > 0 && parcelas > 1
        ? calcCustoComJuros(itemValor, parcelas, taxaJuros)
        : null,
    [itemValor, parcelas, taxaJuros],
  )

  const parcelaEfetiva = useMemo(() => {
    if (custoFinanciamentoLive) return custoFinanciamentoLive.parcelaValor
    return parcelas > 1 ? itemValor / parcelas : itemValor
  }, [custoFinanciamentoLive, itemValor, parcelas])

  const rendimentoMensalEfetivo = useMemo(
    () =>
      rendimentoAnual > 0 ? (Math.pow(1 + rendimentoAnual / 100, 1 / 12) - 1) * 100 : 0,
    [rendimentoAnual],
  )

  const scoreSaude = useMemo(
    () =>
      calcScoreSaude(renda, custo, patrimonio, reservaMeses, parcelasExistentes, envelopes),
    [renda, custo, patrimonio, reservaMeses, parcelasExistentes, envelopes],
  )

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
    setState(s => ({ ...s, onboardingConcluido: true }))
    window.location.hash = formatHash('cenarios')
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
      // DO NOT setStep(5) — shell takes over after onboardingConcluido=true
      return
    }
    setDirection('forward')
    setStep(s => s + 1)
  }

  function goBack() {
    setErro(null)
    setDirection('back')
    setStep(s => Math.max(1, s - 1))
  }

  function refazerSetup() {
    setState(s => ({ ...s, perfil: { ...s.perfil, renda: 0 }, onboardingConcluido: false }))
    setStep(1)
    window.location.hash = ''
  }

  // ----- SHELL MODE -----
  if (state.onboardingConcluido) {
    return (
      <AppShell
        state={state}
        cenario={cenario}
        setPerfil={setPerfil}
        setCenario={setCenario}
        setMetas={setMetas}
        setEnvelopes={setEnvelopes}
        scoreSaude={scoreSaude}
        sobraLazerMensal={sobraLazerMensal}
        rendimentoMensalEfetivo={rendimentoMensalEfetivo}
        setCenarioAtivoId={setCenarioAtivoId}
        criarCenarioVazio={criarCenarioVazio}
        duplicarCenarioAtivo={duplicarCenarioAtivo}
        excluirCenario={excluirCenario}
        onAdicionarItemAFila={() => {
          if (!cenario) return
          const id = state.metas.reduce((m, x) => Math.max(m, x.id), 0) + 1
          setMetas([...state.metas, { id, nome: cenario.itemNome, valor: cenario.itemValor }])
        }}
        onAbrirMetas={() => {
          window.location.hash = formatHash('metas')
        }}
        onSimularMeta={m => {
          if (!cenario) return
          setCenario({ itemNome: m.nome, itemValor: m.valor, nome: m.nome })
          window.location.hash = formatHash('cenarios', { id: cenario.id })
        }}
        onRefazerSetup={refazerSetup}
      />
    )
  }

  // ----- WIZARD MODE -----
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
        <ResumoStep4
          itemValor={itemValor}
          itemNome={itemNome || 'Item'}
          parcelas={parcelas}
          parcelaEfetiva={parcelaEfetiva}
          sobraLazerMensal={sobraLazerMensal}
          patrimonio={patrimonio}
          custoFinanciamento={custoFinanciamentoLive}
        />
      )}
    </div>
  )

  return (
    <div id="app">
      <header>
        <img src={logoUrl} alt="AffordIT" className="wizard-logo" />
        <h1>Posso Comprar?</h1>
        <p className="subtitle">
          Simule a viabilidade de uma compra com base nos seus envelopes financeiros.
        </p>
      </header>

      <StepperNav currentStep={step} />

      <main>
        <div className={`step-layout step-slide-${direction}`} key={step}>
          {chartPanel}
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
