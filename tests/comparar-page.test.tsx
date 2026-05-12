import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import CompararPage from '../src/pages/CompararPage'
import { APP_STATE_VAZIO, Cenario } from '../src/types'

const perfil = {
  ...APP_STATE_VAZIO.perfil,
  renda: 5000,
  patrimonio: 10000,
  reservaMeses: 6,
  envelopes: [{ id: 1, nome: 'Inv', pct: 10 }],
}

const cenA: Cenario = {
  id: 'a', nome: 'Aaa', itemNome: 'Item A', itemValor: 1000,
  tipoCompra: 'lazer', parcelas: 1, taxaJuros: 0,
  manutencaoMensal: 0, entradaValor: 0, despesaSubstituida: 0,
  criadoEm: 1, atualizadoEm: 1,
  inflacaoAnual: 0,
  taxaDepreciacaoAnual: 0,
}
const cenB: Cenario = { ...cenA, id: 'b', nome: 'Bbb', itemNome: 'Item B', itemValor: 5000, parcelas: 12, taxaJuros: 1.5 }
const cenC: Cenario = { ...cenA, id: 'c', nome: 'Ccc', itemNome: 'Item C', itemValor: 50000 } // muito caro → veredito provavelmente diferente

describe('CompararPage', () => {
  it('renderiza estado vazio quando não há cenários', () => {
    render(<CompararPage perfil={perfil} cenarios={[]} />)
    expect(screen.getByText(/ainda não tem cenários/i)).toBeTruthy()
  })

  it('renderiza KPIs com total e custo somado', () => {
    render(<CompararPage perfil={perfil} cenarios={[cenA, cenB]} />)
    // Total = 2 — find kpi-label "Total" then its sibling <strong>
    const totalLabel = screen.getByText('Total')
    expect(totalLabel.nextSibling?.textContent).toBe('2')
  })

  it('alterna seleção via checkbox e atualiza KPI label', () => {
    render(<CompararPage perfil={perfil} cenarios={[cenA, cenB, cenC]} />)
    const checkboxA = screen.getByLabelText('Selecionar Aaa')
    fireEvent.click(checkboxA)
    // Após selecionar 1, KPI label vira "Selecionados"
    expect(screen.getByText('Selecionados')).toBeTruthy()
  })

  it('mostra botão "Limpar seleção" quando há seleção e o usa para limpar', () => {
    render(<CompararPage perfil={perfil} cenarios={[cenA, cenB]} />)
    fireEvent.click(screen.getByLabelText('Selecionar Aaa'))
    const btn = screen.getByText('Limpar seleção')
    fireEvent.click(btn)
    expect(screen.queryByText('Limpar seleção')).toBeNull()
    expect(screen.getByText('Total')).toBeTruthy()
  })

  it('filtra tabela quando há seleção', () => {
    render(<CompararPage perfil={perfil} cenarios={[cenA, cenB, cenC]} />)
    fireEvent.click(screen.getByLabelText('Selecionar Bbb'))
    // Apenas linha B deve aparecer
    expect(screen.queryByText('Aaa')).toBeNull()
    expect(screen.getByText('Bbb')).toBeTruthy()
    expect(screen.queryByText('Ccc')).toBeNull()
  })

  it('ordena por valor ascending ao clicar no header', () => {
    render(<CompararPage perfil={perfil} cenarios={[cenC, cenA, cenB]} />)
    fireEvent.click(screen.getByText(/^Valor/))
    const linhas = screen.getAllByRole('row').slice(1) // pula header
    // Esperado: A (1000), B (5000), C (50000)
    expect(within(linhas[0]).getByText('Aaa')).toBeTruthy()
    expect(within(linhas[1]).getByText('Bbb')).toBeTruthy()
    expect(within(linhas[2]).getByText('Ccc')).toBeTruthy()
  })

  it('inverte direção ao clicar duas vezes no mesmo header', () => {
    render(<CompararPage perfil={perfil} cenarios={[cenA, cenB]} />)
    const header = screen.getByText(/^Valor/)
    fireEvent.click(header) // asc
    fireEvent.click(header) // desc
    const linhas = screen.getAllByRole('row').slice(1)
    expect(within(linhas[0]).getByText('Bbb')).toBeTruthy()
    expect(within(linhas[1]).getByText('Aaa')).toBeTruthy()
  })

  it('mostra indicador de sort (↑/↓) na coluna ativa', () => {
    render(<CompararPage perfil={perfil} cenarios={[cenA, cenB]} />)
    fireEvent.click(screen.getByText(/^Valor/))
    expect(screen.getByText(/Valor ↑/)).toBeTruthy()
  })
})
