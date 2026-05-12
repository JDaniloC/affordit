import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CompromissoForm from '../src/components/CompromissoForm'

describe('CompromissoForm', () => {
  it('renderiza campos vazios em modo criar', () => {
    render(<CompromissoForm onSave={() => {}} onCancel={() => {}} />)
    expect((screen.getByLabelText(/nome/i) as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText(/parcela mensal/i) as HTMLInputElement).value).toBe('')
  })

  it('preenche campos em modo editar', () => {
    render(
      <CompromissoForm
        inicial={{ id: 1, nome: 'Cartão', parcela: 300, prazo: 8, prazoTotal: 12, taxa: 1.5 }}
        onSave={() => {}}
        onCancel={() => {}}
      />,
    )
    expect((screen.getByLabelText(/nome/i) as HTMLInputElement).value).toBe('Cartão')
    expect((screen.getByLabelText(/parcela mensal/i) as HTMLInputElement).value).toBe('300')
    expect((screen.getByLabelText(/prazo restante/i) as HTMLInputElement).value).toBe('8')
  })

  it('chama onSave com dados do form ao submeter', () => {
    const onSave = vi.fn()
    render(<CompromissoForm onSave={onSave} onCancel={() => {}} />)
    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: 'Netflix' } })
    fireEvent.change(screen.getByLabelText(/parcela mensal/i), { target: { value: '40' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))
    expect(onSave).toHaveBeenCalledWith({ nome: 'Netflix', parcela: 40 })
  })

  it('inclui prazo, prazoTotal e taxa quando preenchidos', () => {
    const onSave = vi.fn()
    const { container } = render(<CompromissoForm onSave={onSave} onCancel={() => {}} />)
    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: 'Moto' } })
    fireEvent.change(screen.getByLabelText(/parcela mensal/i), { target: { value: '200' } })
    fireEvent.change(screen.getByLabelText(/prazo restante/i), { target: { value: '24' } })
    fireEvent.change(screen.getByLabelText(/total de parcelas/i), { target: { value: '36' } })
    fireEvent.change(screen.getByLabelText(/taxa/i), { target: { value: '1.99' } })
    fireEvent.submit(container.querySelector('form')!)
    expect(onSave).toHaveBeenCalledWith({
      nome: 'Moto', parcela: 200, prazo: 24, prazoTotal: 36, taxa: 1.99,
    })
  })

  it('bloqueia submit com nome vazio ou parcela <= 0', () => {
    const onSave = vi.fn()
    render(<CompromissoForm onSave={onSave} onCancel={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))
    expect(onSave).not.toHaveBeenCalled()
  })

  it('chama onCancel ao clicar em cancelar', () => {
    const onCancel = vi.fn()
    render(<CompromissoForm onSave={() => {}} onCancel={onCancel} />)
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))
    expect(onCancel).toHaveBeenCalled()
  })
})
