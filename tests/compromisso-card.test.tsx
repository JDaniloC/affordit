import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CompromissoCard from '../src/components/CompromissoCard'

describe('CompromissoCard', () => {
  it('mostra nome e parcela formatada em BRL', () => {
    render(
      <CompromissoCard
        compromisso={{ id: 1, nome: 'Netflix', parcela: 40 }}
        onEditar={() => {}}
        onExcluir={() => {}}
      />,
    )
    expect(screen.getByText('Netflix')).toBeTruthy()
    expect(screen.getByText(/R\$\s*40/)).toBeTruthy()
  })

  it('mostra badge ∞ quando não há prazo', () => {
    render(
      <CompromissoCard
        compromisso={{ id: 1, nome: 'Net', parcela: 90 }}
        onEditar={() => {}} onExcluir={() => {}}
      />,
    )
    expect(screen.getByText(/∞/)).toBeTruthy()
  })

  it('mostra "termina em <mês>/<ano>" quando há prazo', () => {
    render(
      <CompromissoCard
        compromisso={{ id: 1, nome: 'Cartão', parcela: 300, prazo: 8 }}
        onEditar={() => {}} onExcluir={() => {}}
      />,
    )
    expect(screen.getByText(/termina em/i)).toBeTruthy()
  })

  it('mostra barra de progresso quando prazo + prazoTotal', () => {
    render(
      <CompromissoCard
        compromisso={{ id: 1, nome: 'Moto', parcela: 200, prazo: 4, prazoTotal: 24 }}
        onEditar={() => {}} onExcluir={() => {}}
      />,
    )
    expect(screen.getByText(/20\/24 parcelas pagas/i)).toBeTruthy()
    expect(screen.getByRole('progressbar')).toBeTruthy()
  })

  it('mostra taxa quando preenchida', () => {
    render(
      <CompromissoCard
        compromisso={{ id: 1, nome: 'M', parcela: 200, prazo: 24, taxa: 1.99 }}
        onEditar={() => {}} onExcluir={() => {}}
      />,
    )
    expect(screen.getByText(/1[.,]99% a\.m\./)).toBeTruthy()
  })

  it('chama onEditar e onExcluir nos botões', () => {
    const onEditar = vi.fn()
    const onExcluir = vi.fn()
    render(
      <CompromissoCard
        compromisso={{ id: 5, nome: 'X', parcela: 100 }}
        onEditar={onEditar} onExcluir={onExcluir}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /editar/i }))
    fireEvent.click(screen.getByRole('button', { name: /excluir/i }))
    expect(onEditar).toHaveBeenCalledWith(5)
    expect(onExcluir).toHaveBeenCalledWith(5)
  })
})
