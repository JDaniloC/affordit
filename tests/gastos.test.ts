import { describe, it, expect } from 'vitest'
import { somaGastos, valorDoGasto } from '../src/utils/gastos'
import { PerfilFinanceiro } from '../src/types'

const perfilBase: PerfilFinanceiro = {
  renda: 5000, custo: 0, envelopes: [],
  patrimonio: 0, reservaMeses: 6, rendimentoAnual: 0, metaValor: 0,
  compromissos: [], gastos: [],
}

describe('valorDoGasto', () => {
  it('retorna valor literal quando tipo é valor', () => {
    expect(valorDoGasto({ id: 1, nome: 'Aluguel', tipo: 'valor', valor: 1500 }, 5000)).toBe(1500)
  })

  it('calcula pct sobre renda quando tipo é pct', () => {
    expect(valorDoGasto({ id: 1, nome: 'Mercado', tipo: 'pct', pct: 12 }, 5000)).toBe(600)
  })

  it('retorna 0 para pct quando renda = 0', () => {
    expect(valorDoGasto({ id: 1, nome: 'X', tipo: 'pct', pct: 30 }, 0)).toBe(0)
  })

  it('clampa valor negativo em 0 (defensivo)', () => {
    expect(valorDoGasto({ id: 1, nome: 'X', tipo: 'valor', valor: -100 }, 5000)).toBe(0)
  })

  it('clampa pct negativo em 0 (defensivo)', () => {
    expect(valorDoGasto({ id: 1, nome: 'X', tipo: 'pct', pct: -10 }, 5000)).toBe(0)
  })
})

describe('somaGastos', () => {
  it('retorna 0 para lista vazia', () => {
    expect(somaGastos(perfilBase)).toBe(0)
  })

  it('soma mistura de valor e pct', () => {
    const perfil: PerfilFinanceiro = {
      ...perfilBase,
      renda: 5000,
      gastos: [
        { id: 1, nome: 'Aluguel', tipo: 'valor', valor: 1500 },
        { id: 2, nome: 'Mercado', tipo: 'pct', pct: 12 },  // 600
        { id: 3, nome: 'Transporte', tipo: 'valor', valor: 350 },
      ],
    }
    expect(somaGastos(perfil)).toBe(2450)
  })

  it('items pct viram 0 quando renda = 0', () => {
    const perfil: PerfilFinanceiro = {
      ...perfilBase,
      renda: 0,
      gastos: [
        { id: 1, nome: 'A', tipo: 'valor', valor: 100 },
        { id: 2, nome: 'B', tipo: 'pct', pct: 30 },
      ],
    }
    expect(somaGastos(perfil)).toBe(100)
  })

  it('items pct recalculam quando renda muda (viva)', () => {
    const gastos: PerfilFinanceiro['gastos'] = [
      { id: 1, nome: 'A', tipo: 'pct', pct: 30 },
    ]
    expect(somaGastos({ ...perfilBase, renda: 5000, gastos })).toBe(1500)
    expect(somaGastos({ ...perfilBase, renda: 6000, gastos })).toBe(1800)
  })
})
