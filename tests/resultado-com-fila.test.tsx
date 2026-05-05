import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ResultadoSection from '../src/components/ResultadoSection'
import type { Meta } from '../src/types'
import type { SimularResult } from '../src/logic/index'

const baseResultado: SimularResult = {
  veredito: { tipo: 'aprovado', titulo: 'Aprovado' },
  acoes: [],
  debug: {
    reservaAlvo: 18_000,
    lazerPct: 30,
    sobraLazerMensal: 500,
    statusReserva: 'seguranca',
    disponivel: 12_000,
    dentro1pct: false,
    parcelaValor: 0,
    parcelaCabe: true,
    parcelasExistentes: 0,
  },
}

type RProps = Parameters<typeof ResultadoSection>[0]

const baseProps = (over: Partial<RProps> = {}): RProps => ({
  resultado: baseResultado,
  criterio: 'fluxo',
  fluxo: { delay: 10, parcelaValor: 0, parcelaCabe: true },
  patrim: {
    statusAtual: 'green',
    statusAposCompra: 'green',
    alertaDegracao: false,
    dentro1pct: false,
  },
  roiOk: false,
  ferramenta: false,
  renda: 5_000,
  custo: 3_000,
  patrimonio: 30_000,
  itemValor: 2_000,
  itemNome: 'Notebook',
  parcelas: 1,
  metaValor: 0,
  metaResult: null,
  tipoCompra: 'lazer',
  taxaJuros: 0,
  custoFinanciamento: null,
  passivoResult: null,
  manutencaoMensal: 0,
  entradaValor: 0,
  despesaSubstituida: 0,
  parcelasExistentes: 0,
  rendimentoAnual: 0,
  scoreSaude: { nivel: 'boa', pontuacao: 80, fatores: [] },
  risco: { tier: 'verde', motivos: [] },
  metas: [] as Meta[],
  onAdicionarItemAFila: vi.fn(),
  onAbrirPlanejador: vi.fn(),
  onRefazer: vi.fn(),
  ...over,
})

describe('ResultadoSection — card fila de metas', () => {
  it('sem metas[]: card não aparece', () => {
    render(<ResultadoSection {...baseProps()} />)
    expect(
      screen.queryByText(/Considerando suas metas em fila/i),
    ).not.toBeInTheDocument()
  })

  it('com metas[]: card aparece com Hipótese A e B', () => {
    const metas: Meta[] = [{ id: 1, nome: 'Outra meta', valor: 5_000 }]
    render(<ResultadoSection {...baseProps({ metas })} />)
    expect(screen.getByText(/Considerando suas metas em fila/i)).toBeInTheDocument()
    expect(screen.getByText(/Hipótese A/i)).toBeInTheDocument()
    expect(screen.getByText(/Hipótese B/i)).toBeInTheDocument()
  })

  it('item já na fila (nome+valor exatos): Hipótese B desaparece', () => {
    const metas: Meta[] = [{ id: 1, nome: 'Notebook', valor: 2_000 }]
    render(<ResultadoSection {...baseProps({ metas })} />)
    expect(screen.queryByText(/Hipótese B/i)).not.toBeInTheDocument()
  })

  it('botão "Adicionar à fila" chama callback', async () => {
    const onAdicionarItemAFila = vi.fn()
    const metas: Meta[] = [{ id: 1, nome: 'Outra', valor: 5_000 }]
    const user = userEvent.setup()
    render(<ResultadoSection {...baseProps({ metas, onAdicionarItemAFila })} />)
    await user.click(screen.getByText(/Adicionar à fila/i))
    expect(onAdicionarItemAFila).toHaveBeenCalled()
  })

  it('botão "Ver minhas metas" chama callback', async () => {
    const onAbrirPlanejador = vi.fn()
    const metas: Meta[] = [{ id: 1, nome: 'Outra', valor: 5_000 }]
    const user = userEvent.setup()
    render(<ResultadoSection {...baseProps({ metas, onAbrirPlanejador })} />)
    await user.click(screen.getByText(/Ver minhas metas/i))
    expect(onAbrirPlanejador).toHaveBeenCalled()
  })

  it('Hipótese A mostra "sem impacto" quando head start absorve item e meta', () => {
    // sobra 500/mês, head start = 30k - 18k = 12k.
    // Meta atual 5k cabe no head start (mês 0). Notebook 2k também cabe (mês 0).
    // Atraso para meta = 0 → "sem impacto".
    const metas: Meta[] = [{ id: 1, nome: 'Outra', valor: 5_000 }]
    render(<ResultadoSection {...baseProps({ metas })} />)
    expect(screen.getByText(/sem impacto/i)).toBeInTheDocument()
  })
})
