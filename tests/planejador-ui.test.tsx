import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PlanejadorView from '../src/components/PlanejadorView'
import type { Meta } from '../src/types'

type PlanejadorProps = Parameters<typeof PlanejadorView>[0]

const props = (over: Partial<PlanejadorProps> = {}): PlanejadorProps => ({
  metas: [] as Meta[],
  onMetasChange: vi.fn(),
  sobraLazerMensal: 500,
  patrimonio: 30_000,
  reservaAlvo: 18_000,
  metaValor: 0,
  rendimentoMensalEfetivo: 0,
  compromissos: [],
  onVoltar: vi.fn(),
  onSimularMeta: vi.fn(),
  ...over,
})

describe('PlanejadorView', () => {
  it('renderiza estado vazio com botão de adicionar', () => {
    render(<PlanejadorView {...props()} />)
    expect(screen.getByText(/Você ainda não cadastrou metas/i)).toBeInTheDocument()
    expect(screen.getByText(/Adicionar primeira meta/i)).toBeInTheDocument()
  })

  it('renderiza fila com 3 metas', () => {
    const metas: Meta[] = [
      { id: 1, nome: 'A', valor: 1_000 },
      { id: 2, nome: 'B', valor: 2_000 },
      { id: 3, nome: 'C', valor: 3_000 },
    ]
    render(<PlanejadorView {...props({ metas })} />)
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
    expect(screen.getByText('C')).toBeInTheDocument()
  })

  it('clicar em adicionar abre o formulário inline', async () => {
    const user = userEvent.setup()
    render(<PlanejadorView {...props()} />)
    await user.click(screen.getByText(/Adicionar primeira meta/i))
    expect(screen.getByLabelText('Nome da meta')).toBeInTheDocument()
  })

  it('mover ↑ reordena chamando onMetasChange', async () => {
    const onMetasChange = vi.fn()
    const user = userEvent.setup()
    const metas: Meta[] = [
      { id: 1, nome: 'A', valor: 1_000 },
      { id: 2, nome: 'B', valor: 2_000 },
    ]
    render(<PlanejadorView {...props({ metas, onMetasChange })} />)
    const upButtons = screen.getAllByLabelText('Mover para cima')
    await user.click(upButtons[1])
    expect(onMetasChange).toHaveBeenCalledWith([
      { id: 2, nome: 'B', valor: 2_000 },
      { id: 1, nome: 'A', valor: 1_000 },
    ])
  })

  it('excluir remove a meta da lista', async () => {
    const onMetasChange = vi.fn()
    const user = userEvent.setup()
    const metas: Meta[] = [{ id: 1, nome: 'A', valor: 1_000 }]
    render(<PlanejadorView {...props({ metas, onMetasChange })} />)
    await user.click(screen.getByLabelText('Excluir'))
    expect(onMetasChange).toHaveBeenCalledWith([])
  })

  it('botão simular chama onSimularMeta com a meta', async () => {
    const onSimularMeta = vi.fn()
    const user = userEvent.setup()
    const metas: Meta[] = [{ id: 1, nome: 'A', valor: 1_000 }]
    render(<PlanejadorView {...props({ metas, onSimularMeta })} />)
    await user.click(screen.getByLabelText('Simular esta meta'))
    expect(onSimularMeta).toHaveBeenCalledWith({ id: 1, nome: 'A', valor: 1_000 })
  })

  it('banner aparece quando sobra=0 e headStart=0', () => {
    render(
      <PlanejadorView {...props({ sobraLazerMensal: 0, patrimonio: 0, reservaAlvo: 18_000 })} />,
    )
    expect(screen.getByText(/Faltam dados/i)).toBeInTheDocument()
  })

  it('banner some quando sobra > 0', () => {
    render(<PlanejadorView {...props({ sobraLazerMensal: 500 })} />)
    expect(screen.queryByText(/Faltam dados/i)).not.toBeInTheDocument()
  })

  it('meta inatingível recebe badge', () => {
    const metas: Meta[] = [{ id: 1, nome: 'mega', valor: 10_000_000 }]
    render(<PlanejadorView {...props({ metas, sobraLazerMensal: 100 })} />)
    expect(screen.getByText(/Inatingível/i)).toBeInTheDocument()
  })

  it('botão voltar chama onVoltar', async () => {
    const onVoltar = vi.fn()
    const user = userEvent.setup()
    render(<PlanejadorView {...props({ onVoltar })} />)
    await user.click(screen.getByText(/Voltar ao simulador/i))
    expect(onVoltar).toHaveBeenCalled()
  })
})
