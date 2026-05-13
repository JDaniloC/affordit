import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import EventosSobraResumo from '../src/components/EventosSobraResumo'

describe('EventosSobraResumo', () => {
  it('não renderiza nada quando lista vazia', () => {
    const { container } = render(<EventosSobraResumo eventos={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renderiza intro + 1 linha por evento + rodapé', () => {
    render(
      <EventosSobraResumo
        eventos={[
          { mes: 8, deltaSobra: 300, nome: 'Cartão' },
          { mes: 24, deltaSobra: 200, nome: 'Moto' },
        ]}
      />,
    )
    expect(screen.getByText(/sua sobra mensal aumenta/i)).toBeTruthy()
    expect(screen.getByText(/300/)).toBeTruthy()
    expect(screen.getByText(/200/)).toBeTruthy()
    expect(screen.getByText(/cartão termina/i)).toBeTruthy()
    expect(screen.getByText(/moto termina/i)).toBeTruthy()
    expect(screen.getByText(/algumas metas viram possíveis antes/i)).toBeTruthy()
  })

  it('omite "(<nome> termina)" quando nome ausente', () => {
    render(
      <EventosSobraResumo
        eventos={[{ mes: 8, deltaSobra: 300 }]}
      />,
    )
    expect(screen.queryByText(/termina/i)).toBeNull()
  })

  it('ordena eventos por mês ascendente', () => {
    render(
      <EventosSobraResumo
        eventos={[
          { mes: 24, deltaSobra: 200, nome: 'Moto' },
          { mes: 8, deltaSobra: 300, nome: 'Cartão' },
        ]}
      />,
    )
    const items = screen.getAllByRole('listitem')
    expect(items.length).toBe(2)
    expect(items[0].textContent).toMatch(/cartão/i)
    expect(items[1].textContent).toMatch(/moto/i)
  })
})
