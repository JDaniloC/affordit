import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AppShell from '../src/components/AppShell'
import { APP_STATE_VAZIO, AppState, Cenario } from '../src/types'

const cenarioBase: Cenario = {
  id: 'c1',
  nome: 'Cenário 1',
  itemNome: '',
  itemValor: 0,
  tipoCompra: 'lazer',
  parcelas: 1,
  taxaJuros: 0,
  manutencaoMensal: 0,
  entradaValor: 0,
  despesaSubstituida: 0,
  criadoEm: 0,
  atualizadoEm: 0,
  inflacaoAnual: 0,
}

const stateBase: AppState = {
  ...APP_STATE_VAZIO,
  cenarios: [cenarioBase],
  cenarioAtivoId: 'c1',
  onboardingConcluido: true,
}

const propsCommon = {
  state: stateBase,
  cenario: cenarioBase as typeof cenarioBase | null,
  setPerfil: () => {},
  setCenario: () => {},
  setMetas: () => {},
  setEnvelopes: () => {},
  scoreSaude: {
    pontuacao: 70,
    nivel: 'regular' as const,
    fatores: [],
  },
  sobraLazerMensal: 100,
  rendimentoMensalEfetivo: 0,
  setCenarioAtivoId: () => {},
  criarCenarioVazio: () => {},
  duplicarCenarioAtivo: () => {},
  excluirCenario: () => {},
  onAdicionarItemAFila: () => {},
  onAbrirMetas: () => {},
  onSimularMeta: () => {},
  onRefazerSetup: () => {},
}

describe('AppShell', () => {
  beforeEach(() => {
    window.location.hash = ''
  })

  it('renderiza Perfil quando hash está vazio', () => {
    render(<AppShell {...propsCommon} />)
    expect(screen.getByRole('heading', { name: /perfil financeiro/i })).toBeTruthy()
  })

  it('renderiza Cenários quando hash é #/cenarios', async () => {
    window.location.hash = '#/cenarios'
    render(<AppShell {...propsCommon} />)
    // Cenário 1 aparece tanto na sidebar quanto no h1 — queryAllByText evita erro de múltiplos
    expect(screen.queryAllByText(/Cenário 1/).length).toBeGreaterThan(0)
  })

  it('marca tab ativa com aria-current', () => {
    window.location.hash = '#/comparar'
    render(<AppShell {...propsCommon} />)
    const compararTab = screen.getByRole('button', { name: 'Comparar' })
    expect(compararTab.getAttribute('aria-current')).toBe('page')
  })

  it('navega para outra aba ao clicar', () => {
    render(<AppShell {...propsCommon} />)
    const tab = screen.getByRole('button', { name: 'Comparar' })
    fireEvent.click(tab)
    expect(window.location.hash).toBe('#/comparar')
  })
})
