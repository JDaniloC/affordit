import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GastosList from '../src/components/GastosList'

describe('GastosList', () => {
  it('mostra "nenhum gasto" quando lista vazia', () => {
    render(<GastosList gastos={[]} renda={5000} onChange={() => {}} />)
    expect(screen.getByText(/nenhum gasto cadastrado/i)).toBeTruthy()
  })

  it('soma gastos (valor + pct) e mostra % da renda', () => {
    render(
      <GastosList
        gastos={[
          { id: 1, nome: 'Aluguel', tipo: 'valor', valor: 1500 },
          { id: 2, nome: 'Mercado', tipo: 'pct', pct: 12 },  // 600
        ]}
        renda={5000}
        onChange={() => {}}
      />,
    )
    expect(screen.getByText(/R\$\s*2\.100/)).toBeTruthy()
    expect(screen.getByText(/42%\s*da\s*renda/i)).toBeTruthy()
  })

  it('omite % da renda quando renda = 0', () => {
    render(
      <GastosList
        gastos={[{ id: 1, nome: 'A', tipo: 'valor', valor: 300 }]}
        renda={0}
        onChange={() => {}}
      />,
    )
    expect(screen.queryByText(/% da renda/i)).toBeNull()
  })

  it('clicar em adicionar abre o form inline', () => {
    render(<GastosList gastos={[]} renda={5000} onChange={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /adicionar gasto/i }))
    expect(screen.getByLabelText(/nome/i)).toBeTruthy()
  })

  it('salvar novo item tipo:valor chama onChange', () => {
    const onChange = vi.fn()
    const { container } = render(<GastosList gastos={[]} renda={5000} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /adicionar gasto/i }))
    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: 'Aluguel' } })
    fireEvent.change(screen.getByLabelText(/valor mensal/i), { target: { value: '1500' } })
    fireEvent.submit(container.querySelector('form')!)
    expect(onChange).toHaveBeenCalledWith([
      { id: 1, nome: 'Aluguel', tipo: 'valor', valor: 1500 },
    ])
  })

  it('salvar novo item tipo:pct chama onChange', () => {
    const onChange = vi.fn()
    const { container } = render(<GastosList gastos={[]} renda={5000} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /adicionar gasto/i }))
    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: 'Mercado' } })
    fireEvent.click(screen.getByLabelText(/% da renda/i))
    fireEvent.change(screen.getByLabelText(/percentual/i), { target: { value: '12' } })
    fireEvent.submit(container.querySelector('form')!)
    expect(onChange).toHaveBeenCalledWith([
      { id: 1, nome: 'Mercado', tipo: 'pct', pct: 12 },
    ])
  })

  it('id do novo item é max + 1', () => {
    const onChange = vi.fn()
    const { container } = render(
      <GastosList
        gastos={[
          { id: 5, nome: 'A', tipo: 'valor', valor: 100 },
          { id: 7, nome: 'B', tipo: 'valor', valor: 100 },
        ]}
        renda={5000}
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /adicionar gasto/i }))
    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: 'C' } })
    fireEvent.change(screen.getByLabelText(/valor mensal/i), { target: { value: '50' } })
    fireEvent.submit(container.querySelector('form')!)
    expect(onChange).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ id: 8, nome: 'C', tipo: 'valor', valor: 50 }),
    ]))
  })

  it('excluir remove o item', () => {
    const onChange = vi.fn()
    render(
      <GastosList
        gastos={[
          { id: 1, nome: 'A', tipo: 'valor', valor: 100 },
          { id: 2, nome: 'B', tipo: 'valor', valor: 200 },
        ]}
        renda={5000}
        onChange={onChange}
      />,
    )
    const excluirA = screen.getAllByRole('button', { name: /excluir/i })[0]
    fireEvent.click(excluirA)
    expect(onChange).toHaveBeenCalledWith([{ id: 2, nome: 'B', tipo: 'valor', valor: 200 }])
  })

  it('clicar em editar enquanto adiciona fecha o form de adicionar', () => {
    render(
      <GastosList
        gastos={[{ id: 1, nome: 'A', tipo: 'valor', valor: 100 }]}
        renda={5000}
        onChange={() => {}}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /adicionar gasto/i }))
    expect(screen.getAllByLabelText(/nome/i).length).toBe(1)
    fireEvent.click(screen.getByRole('button', { name: /editar/i }))
    expect(screen.getAllByLabelText(/nome/i).length).toBe(1)
    expect((screen.getByLabelText(/nome/i) as HTMLInputElement).value).toBe('A')
  })

  it('clicar em adicionar enquanto edita fecha o form de edição', () => {
    render(
      <GastosList
        gastos={[{ id: 1, nome: 'A', tipo: 'valor', valor: 100 }]}
        renda={5000}
        onChange={() => {}}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /editar/i }))
    expect((screen.getByLabelText(/nome/i) as HTMLInputElement).value).toBe('A')
    fireEvent.click(screen.getByRole('button', { name: /adicionar gasto/i }))
    expect((screen.getByLabelText(/nome/i) as HTMLInputElement).value).toBe('')
  })
})
