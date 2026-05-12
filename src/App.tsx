import { useState, useEffect, useMemo } from 'react'

import { AppState, Cenario, Envelope, Meta } from './types'
import { loadAppState, saveAppState } from './state/storage'
import { tryDecodeShareFromUrl, clearShareParamFromUrl } from './state/share'
import { calcLazerPct, calcScoreSaude } from './logic/index'
import { somaCompromissos } from './utils/compromissos'
import { gerarId } from './utils/id'
import { formatHash } from './hooks/useHashRoute'
import AppShell from './components/AppShell'

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
    inflacaoAnual: 0,
    taxaDepreciacaoAnual: 0,
  }
}

export default function App() {
  // Boot: prioridade para estado compartilhado via URL, depois localStorage.
  const [bootInicial] = useState(() => {
    const compartilhado = tryDecodeShareFromUrl()
    if (compartilhado) {
      clearShareParamFromUrl()
      return { estado: compartilhado, fromShare: true }
    }
    const loaded = loadAppState()
    // Sempre garantir um cenário ativo — InicioPage edita o cenário ativo.
    if (loaded.cenarios.length === 0) {
      const c = cenarioVazio()
      return { estado: { ...loaded, cenarios: [c], cenarioAtivoId: c.id }, fromShare: false }
    }
    if (!loaded.cenarioAtivoId) {
      return { estado: { ...loaded, cenarioAtivoId: loaded.cenarios[0].id }, fromShare: false }
    }
    return { estado: loaded, fromShare: false }
  })
  const [state, setState] = useState<AppState>(bootInicial.estado)
  const [vindoDeCompartilhamento, setVindoDeCompartilhamento] = useState<boolean>(
    bootInicial.fromShare,
  )

  const cenario = useMemo<Cenario | null>(() => {
    if (state.cenarios.length === 0) return null
    const c = state.cenarios.find(c => c.id === state.cenarioAtivoId)
    return c ?? state.cenarios[0]
  }, [state.cenarios, state.cenarioAtivoId])

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

  // Envelopes setter aceita ambas as formas porque ConfigSection usa
  // React.Dispatch<SetStateAction<Envelope[]>> (functional updates).
  const setEnvelopes = (v: Envelope[] | ((prev: Envelope[]) => Envelope[])) =>
    setState(s => ({
      ...s,
      perfil: {
        ...s.perfil,
        envelopes: typeof v === 'function' ? v(s.perfil.envelopes) : v,
      },
    }))

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

  const { renda, custo, patrimonio, reservaMeses, envelopes, compromissos,
    rendimentoAnual } = state.perfil

  const totalCompromissos = useMemo(() => somaCompromissos(state.perfil), [state.perfil.compromissos])

  const sobraLazerMensal = useMemo(
    () =>
      Math.max(0, (calcLazerPct(renda, custo, envelopes) / 100) * renda - totalCompromissos),
    [renda, custo, envelopes, totalCompromissos],
  )

  const rendimentoMensalEfetivo = useMemo(
    () =>
      rendimentoAnual > 0 ? (Math.pow(1 + rendimentoAnual / 100, 1 / 12) - 1) * 100 : 0,
    [rendimentoAnual],
  )

  const scoreSaude = useMemo(
    () =>
      calcScoreSaude(renda, custo, patrimonio, reservaMeses, totalCompromissos, envelopes),
    [renda, custo, patrimonio, reservaMeses, totalCompromissos, envelopes],
  )

  // "Refazer setup" zera renda do perfil e leva o usuário para /inicio.
  // O wizard de 4 passos foi removido; agora a tela única faz onboarding.
  function refazerSetup() {
    setState(s => ({ ...s, perfil: { ...s.perfil, renda: 0 } }))
    window.location.hash = formatHash('inicio')
  }

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
      vindoDeCompartilhamento={vindoDeCompartilhamento}
      onDispensarBannerCompartilhamento={() => setVindoDeCompartilhamento(false)}
    />
  )
}
