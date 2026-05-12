import { describe, it, expect, vi, afterEach } from 'vitest'
import { somaCompromissos, formatPrazoTermino } from '../src/utils/compromissos'
import { PerfilFinanceiro } from '../src/types'

const perfilBase: PerfilFinanceiro = {
  renda: 5000, custo: 2000, envelopes: [],
  patrimonio: 0, reservaMeses: 6, rendimentoAnual: 0, metaValor: 0,
  compromissos: [],
}

describe('somaCompromissos', () => {
  it('retorna 0 para lista vazia', () => {
    expect(somaCompromissos(perfilBase)).toBe(0)
  })

  it('soma parcelas de todos os itens', () => {
    const perfil: PerfilFinanceiro = {
      ...perfilBase,
      compromissos: [
        { id: 1, nome: 'Cartão', parcela: 300 },
        { id: 2, nome: 'Netflix', parcela: 40 },
        { id: 3, nome: 'Moto', parcela: 200, prazo: 24, prazoTotal: 36 },
      ],
    }
    expect(somaCompromissos(perfil)).toBe(540)
  })

  it('ignora parcelas negativas (clamp em 0)', () => {
    const perfil: PerfilFinanceiro = {
      ...perfilBase,
      compromissos: [
        { id: 1, nome: 'A', parcela: 100 },
        { id: 2, nome: 'B', parcela: -50 },
      ],
    }
    expect(somaCompromissos(perfil)).toBe(100)
  })
})

describe('formatPrazoTermino', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('retorna data formatada em pt-BR (mês curto / ano)', () => {
    const fixedNow = new Date('2026-05-12T00:00:00Z')
    vi.useFakeTimers()
    vi.setSystemTime(fixedNow)
    expect(formatPrazoTermino(8)).toMatch(/jan\.?(\s*(de\s+|\/\s*))?2027/i)
  })

  it('retorna "este mês" quando prazo é 0', () => {
    expect(formatPrazoTermino(0)).toBe('este mês')
  })
})
