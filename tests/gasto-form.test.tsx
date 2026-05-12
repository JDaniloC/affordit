import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GastoForm from '../src/components/GastoForm'

describe('GastoForm', () => {
  it('renderiza campos vazios em modo criar (tipo valor por default)', () => {
    render(<GastoForm onSave={() => {}} onCancel={() => {}} />)
    expect((screen.getByLabelText(/nome/i) as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText(/r\$\s*fixo/i) as HTMLInputElement).checked).toBe(true)
    expect((screen.getByLabelText(/% da renda/i) as HTMLInputElement).checked).toBe(false)
  })

  it('preenche campos em modo editar (tipo valor)', () => {
    render(
      <GastoForm
        inicial={{ id: 1, nome: 'Aluguel', tipo: 'valor', valor: 1500 }}
        onSave={() => {}}
        onCancel={() => {}}
      />,
    )
    expect((screen.getByLabelText(/nome/i) as HTMLInputElement).value).toBe('Aluguel')
    expect((screen.getByLabelText(/r\$\s*fixo/i) as HTMLInputElement).checked).toBe(true)
  })

  it('preenche campos em modo editar (tipo pct)', () => {
    render(
      <GastoForm
        inicial={{ id: 1, nome: 'Mercado', tipo: 'pct', pct: 12 }}
        onSave={() => {}}
        onCancel={() => {}}
      />,
    )
    expect((screen.getByLabelText(/% da renda/i) as HTMLInputElement).checked).toBe(true)
  })

  it('alternar toggle muda qual input aparece', () => {
    render(<GastoForm onSave={() => {}} onCancel={() => {}} />)
    expect(screen.queryByLabelText(/valor mensal/i)).toBeTruthy()
    expect(screen.queryByLabelText(/percentual/i)).toBeNull()
    fireEvent.click(screen.getByLabelText(/% da renda/i))
    expect(screen.queryByLabelText(/valor mensal/i)).toBeNull()
    expect(screen.queryByLabelText(/percentual/i)).toBeTruthy()
  })

  it('salva item tipo:valor com nome + valor', () => {
    const onSave = vi.fn()
    const { container } = render(<GastoForm onSave={onSave} onCancel={() => {}} />)
    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: 'Aluguel' } })
    fireEvent.change(screen.getByLabelText(/valor mensal/i), { target: { value: '1500' } })
    fireEvent.submit(container.querySelector('form')!)
    expect(onSave).toHaveBeenCalledWith({ nome: 'Aluguel', tipo: 'valor', valor: 1500 })
  })

  it('salva item tipo:pct com nome + pct', () => {
    const onSave = vi.fn()
    const { container } = render(<GastoForm onSave={onSave} onCancel={() => {}} />)
    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: 'Mercado' } })
    fireEvent.click(screen.getByLabelText(/% da renda/i))
    fireEvent.change(screen.getByLabelText(/percentual/i), { target: { value: '12' } })
    fireEvent.submit(container.querySelector('form')!)
    expect(onSave).toHaveBeenCalledWith({ nome: 'Mercado', tipo: 'pct', pct: 12 })
  })

  it('bloqueia submit com nome vazio', () => {
    const onSave = vi.fn()
    render(<GastoForm onSave={onSave} onCancel={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))
    expect(onSave).not.toHaveBeenCalled()
  })

  it('bloqueia submit com valor 0 (tipo valor)', () => {
    const onSave = vi.fn()
    render(<GastoForm onSave={onSave} onCancel={() => {}} />)
    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: 'X' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))
    expect(onSave).not.toHaveBeenCalled()
  })

  it('bloqueia submit com pct 0 (tipo pct)', () => {
    const onSave = vi.fn()
    render(<GastoForm onSave={onSave} onCancel={() => {}} />)
    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: 'X' } })
    fireEvent.click(screen.getByLabelText(/% da renda/i))
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))
    expect(onSave).not.toHaveBeenCalled()
  })

  it('chama onCancel ao clicar em cancelar', () => {
    const onCancel = vi.fn()
    render(<GastoForm onSave={() => {}} onCancel={onCancel} />)
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))
    expect(onCancel).toHaveBeenCalled()
  })
})
