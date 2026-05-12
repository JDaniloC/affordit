import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CompromissosList from '../src/components/CompromissosList'

describe('CompromissosList', () => {
  it('mostra "nenhum compromisso" quando lista vazia', () => {
    render(<CompromissosList compromissos={[]} renda={5000} onChange={() => {}} />)
    expect(screen.getByText(/nenhum compromisso cadastrado/i)).toBeTruthy()
  })

  it('soma parcelas e mostra % da renda', () => {
    render(
      <CompromissosList
        compromissos={[
          { id: 1, nome: 'A', parcela: 300 },
          { id: 2, nome: 'B', parcela: 200 },
        ]}
        renda={5000}
        onChange={() => {}}
      />,
    )
    expect(screen.getByText(/R\$\s*500/)).toBeTruthy()
    expect(screen.getByText(/10%\s*da\s*renda/i)).toBeTruthy()
  })

  it('omite % da renda quando renda = 0', () => {
    render(
      <CompromissosList
        compromissos={[{ id: 1, nome: 'A', parcela: 300 }]}
        renda={0}
        onChange={() => {}}
      />,
    )
    expect(screen.queryByText(/% da renda/i)).toBeNull()
  })

  it('clicar em adicionar abre o form inline', () => {
    render(<CompromissosList compromissos={[]} renda={5000} onChange={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /adicionar compromisso/i }))
    expect(screen.getByLabelText(/nome/i)).toBeTruthy()
  })

  it('salvar novo item chama onChange com lista atualizada', () => {
    const onChange = vi.fn()
    render(<CompromissosList compromissos={[]} renda={5000} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /adicionar compromisso/i }))
    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: 'Netflix' } })
    fireEvent.change(screen.getByLabelText(/parcela mensal/i), { target: { value: '40' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))
    expect(onChange).toHaveBeenCalledWith([
      { id: 1, nome: 'Netflix', parcela: 40 },
    ])
  })

  it('id do novo item é maior + 1', () => {
    const onChange = vi.fn()
    render(
      <CompromissosList
        compromissos={[
          { id: 5, nome: 'A', parcela: 100 },
          { id: 7, nome: 'B', parcela: 100 },
        ]}
        renda={5000}
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /adicionar compromisso/i }))
    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: 'C' } })
    fireEvent.change(screen.getByLabelText(/parcela mensal/i), { target: { value: '50' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))
    expect(onChange).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ id: 8, nome: 'C', parcela: 50 }),
    ]))
  })

  it('excluir remove o item', () => {
    const onChange = vi.fn()
    render(
      <CompromissosList
        compromissos={[
          { id: 1, nome: 'A', parcela: 100 },
          { id: 2, nome: 'B', parcela: 200 },
        ]}
        renda={5000}
        onChange={onChange}
      />,
    )
    const excluirA = screen.getAllByRole('button', { name: /excluir/i })[0]
    fireEvent.click(excluirA)
    expect(onChange).toHaveBeenCalledWith([{ id: 2, nome: 'B', parcela: 200 }])
  })

  it('clicar em editar enquanto adiciona fecha o form de adicionar', () => {
    render(
      <CompromissosList
        compromissos={[{ id: 1, nome: 'A', parcela: 100 }]}
        renda={5000}
        onChange={() => {}}
      />,
    )
    // Abre o form de adicionar
    fireEvent.click(screen.getByRole('button', { name: /adicionar compromisso/i }))
    expect(screen.getAllByLabelText(/nome/i).length).toBe(1)

    // Clica em editar do item existente — deve fechar o form de adicionar e abrir o de editar
    fireEvent.click(screen.getByRole('button', { name: /editar/i }))
    // Apenas 1 form aberto (o de edição); o card original não está mais visível
    expect(screen.getAllByLabelText(/nome/i).length).toBe(1)
    expect((screen.getByLabelText(/nome/i) as HTMLInputElement).value).toBe('A')
  })

  it('clicar em adicionar enquanto edita fecha o form de edição', () => {
    render(
      <CompromissosList
        compromissos={[{ id: 1, nome: 'A', parcela: 100 }]}
        renda={5000}
        onChange={() => {}}
      />,
    )
    // Abre form de edição
    fireEvent.click(screen.getByRole('button', { name: /editar/i }))
    expect((screen.getByLabelText(/nome/i) as HTMLInputElement).value).toBe('A')

    // Clica em adicionar — fecha o form de edição e abre o de adicionar (vazio)
    fireEvent.click(screen.getByRole('button', { name: /adicionar compromisso/i }))
    expect(screen.getAllByLabelText(/nome/i).length).toBe(1)
    expect((screen.getByLabelText(/nome/i) as HTMLInputElement).value).toBe('')
  })
})
