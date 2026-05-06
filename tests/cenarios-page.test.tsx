import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CenariosPage from '../src/pages/CenariosPage'
import { APP_STATE_VAZIO, Cenario } from '../src/types'

const perfil = {
  ...APP_STATE_VAZIO.perfil,
  renda: 5000,
  custo: 2000,
  patrimonio: 20000,
  reservaMeses: 6,
}

const cenario: Cenario = {
  id: 'c1',
  nome: 'Notebook',
  itemNome: 'Notebook',
  itemValor: 3000,
  tipoCompra: 'lazer',
  parcelas: 1,
  taxaJuros: 0,
  manutencaoMensal: 0,
  entradaValor: 0,
  despesaSubstituida: 0,
  criadoEm: 1,
  atualizadoEm: 1,
  inflacaoAnual: 0,
}

const propsBase = {
  perfil,
  cenario,
  cenarios: [cenario],
  cenarioAtivoId: 'c1',
  metas: [],
  onCenarioChange: vi.fn(),
  onSelecionarCenario: vi.fn(),
  onCriarVazio: vi.fn(),
  onDuplicar: vi.fn(),
  onExcluir: vi.fn(),
  onAdicionarItemAFila: vi.fn(),
  onAbrirPlanejador: vi.fn(),
}

describe('CenariosPage stepper', () => {
  it('começa no Step 1 (Item) mostrando SonhoSection', () => {
    render(<CenariosPage {...propsBase} />)
    // Step 1 label visible in stepper
    expect(screen.getByText('Item')).toBeTruthy()
    // SonhoSection has "O que você quer comprar?" or similar — use "Próximo" button presence
    expect(screen.getByRole('button', { name: /próximo/i })).toBeTruthy()
    // No "Anterior" on first step
    expect(screen.queryByRole('button', { name: /anterior/i })).toBeNull()
  })

  it('avança para Step 2 (Estratégia) ao clicar em Próximo', () => {
    render(<CenariosPage {...propsBase} />)
    fireEvent.click(screen.getByRole('button', { name: /próximo/i }))
    expect(screen.getByText('Estratégia')).toBeTruthy()
    // Anterior should now appear
    expect(screen.getByRole('button', { name: /anterior/i })).toBeTruthy()
  })

  it('avança para Step 3 (Resultado) e mostra ResultadoSection', () => {
    render(<CenariosPage {...propsBase} />)
    fireEvent.click(screen.getByRole('button', { name: /próximo/i })) // step 2
    fireEvent.click(screen.getByRole('button', { name: /próximo/i })) // step 3
    expect(screen.getByText('Resultado')).toBeTruthy()
    // On step 3 there's no "Próximo" button, only "Voltar a editar"
    expect(screen.queryByRole('button', { name: /próximo/i })).toBeNull()
    expect(screen.getByRole('button', { name: /voltar a editar/i })).toBeTruthy()
  })

  it('mostra empty state quando não há cenários', () => {
    render(<CenariosPage {...propsBase} cenarios={[]} cenario={null} />)
    expect(screen.getByText(/você ainda não tem cenários/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /criar primeiro cenário/i })).toBeTruthy()
  })
})
