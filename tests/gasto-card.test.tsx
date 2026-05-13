import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GastoCard from '../src/components/GastoCard'

describe('GastoCard', () => {
  it('mostra nome e valor calculado em BRL para tipo:valor', () => {
    render(
      <GastoCard
        gasto={{ id: 1, nome: 'Aluguel', tipo: 'valor', valor: 1500 }}
        renda={5000}
        onEditar={() => {}}
        onExcluir={() => {}}
      />,
    )
    expect(screen.getByText('Aluguel')).toBeTruthy()
    expect(screen.getByText(/R\$\s*1\.500/)).toBeTruthy()
  })

  it('mostra badge "R$ fixo" quando tipo é valor', () => {
    render(
      <GastoCard
        gasto={{ id: 1, nome: 'A', tipo: 'valor', valor: 100 }}
        renda={5000}
        onEditar={() => {}} onExcluir={() => {}}
      />,
    )
    expect(screen.getByText(/r\$\s*fixo/i)).toBeTruthy()
  })

  it('mostra badge "X% da renda" e valor calculado quando tipo é pct', () => {
    render(
      <GastoCard
        gasto={{ id: 1, nome: 'Mercado', tipo: 'pct', pct: 12 }}
        renda={5000}
        onEditar={() => {}} onExcluir={() => {}}
      />,
    )
    // Valor calculado: 12% de 5000 = 600
    expect(screen.getByText(/R\$\s*600/)).toBeTruthy()
    expect(screen.getByText(/12%\s*da\s*renda/i)).toBeTruthy()
  })

  it('mostra R$ 0 quando renda=0 e tipo=pct', () => {
    render(
      <GastoCard
        gasto={{ id: 1, nome: 'X', tipo: 'pct', pct: 30 }}
        renda={0}
        onEditar={() => {}} onExcluir={() => {}}
      />,
    )
    expect(screen.getByText(/R\$\s*0/)).toBeTruthy()
  })

  it('chama onEditar e onExcluir nos botões', () => {
    const onEditar = vi.fn()
    const onExcluir = vi.fn()
    render(
      <GastoCard
        gasto={{ id: 5, nome: 'X', tipo: 'valor', valor: 100 }}
        renda={5000}
        onEditar={onEditar} onExcluir={onExcluir}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /editar/i }))
    fireEvent.click(screen.getByRole('button', { name: /excluir/i }))
    expect(onEditar).toHaveBeenCalledWith(5)
    expect(onExcluir).toHaveBeenCalledWith(5)
  })
})
