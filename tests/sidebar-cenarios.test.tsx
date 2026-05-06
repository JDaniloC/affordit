import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SidebarCenarios from '../src/components/SidebarCenarios'
import { APP_STATE_VAZIO, Cenario } from '../src/types'

const perfil = { ...APP_STATE_VAZIO.perfil, renda: 5000 }

const baseCenario: Cenario = {
  id: 'c1', nome: 'Geladeira', itemNome: 'Geladeira', itemValor: 3000,
  tipoCompra: 'lazer', parcelas: 1, taxaJuros: 0,
  manutencaoMensal: 0, entradaValor: 0, despesaSubstituida: 0,
  criadoEm: 1, atualizadoEm: 1,
  inflacaoAnual: 0,
}

const propsBase = {
  perfil,
  cenarios: [baseCenario],
  cenarioAtivoId: 'c1',
  onSelecionar: vi.fn(),
  onCriarVazio: vi.fn(),
  onDuplicar: vi.fn(),
  onExcluir: vi.fn(),
}

describe('SidebarCenarios', () => {
  it('renderiza lista de cenários', () => {
    render(<SidebarCenarios {...propsBase} />)
    expect(screen.getByText('Geladeira')).toBeTruthy()
  })

  it('marca cenário ativo com aria-current', () => {
    render(<SidebarCenarios {...propsBase} />)
    const btn = screen.getByText('Geladeira').closest('button')!
    expect(btn.getAttribute('aria-current')).toBe('true')
  })

  it('chama onSelecionar ao clicar em outro cenário', () => {
    const onSelecionar = vi.fn()
    const cenarios: Cenario[] = [
      baseCenario,
      { ...baseCenario, id: 'c2', nome: 'Notebook', atualizadoEm: 2 },
    ]
    render(<SidebarCenarios {...propsBase} cenarios={cenarios} onSelecionar={onSelecionar} />)
    fireEvent.click(screen.getByText('Notebook'))
    expect(onSelecionar).toHaveBeenCalledWith('c2')
  })

  it('abre menu ao clicar em "+ Novo cenário"', () => {
    render(<SidebarCenarios {...propsBase} />)
    fireEvent.click(screen.getByText('+ Novo cenário'))
    expect(screen.getByText('Cenário vazio')).toBeTruthy()
    expect(screen.getByText('Duplicar atual')).toBeTruthy()
  })

  it('chama onCriarVazio ao escolher "Cenário vazio"', () => {
    const onCriarVazio = vi.fn()
    render(<SidebarCenarios {...propsBase} onCriarVazio={onCriarVazio} />)
    fireEvent.click(screen.getByText('+ Novo cenário'))
    fireEvent.click(screen.getByText('Cenário vazio'))
    expect(onCriarVazio).toHaveBeenCalled()
  })

  it('chama onExcluir após confirmação', () => {
    const onExcluir = vi.fn()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<SidebarCenarios {...propsBase} onExcluir={onExcluir} />)
    fireEvent.click(screen.getByLabelText('Excluir cenário Geladeira'))
    expect(onExcluir).toHaveBeenCalledWith('c1')
  })

  it('NÃO chama onExcluir quando confirmação é cancelada', () => {
    const onExcluir = vi.fn()
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<SidebarCenarios {...propsBase} onExcluir={onExcluir} />)
    fireEvent.click(screen.getByLabelText('Excluir cenário Geladeira'))
    expect(onExcluir).not.toHaveBeenCalled()
  })

  it('ordena cenários por atualizadoEm desc', () => {
    const cenarios: Cenario[] = [
      { ...baseCenario, id: 'c1', nome: 'Antigo', atualizadoEm: 1 },
      { ...baseCenario, id: 'c2', nome: 'Novo', atualizadoEm: 99 },
    ]
    render(<SidebarCenarios {...propsBase} cenarios={cenarios} />)
    const items = screen.getAllByRole('button', { name: /Antigo|Novo/ })
    // Primeiro botão deve ser "Novo" (mais recente)
    expect(items[0].textContent).toContain('Novo')
  })
})
