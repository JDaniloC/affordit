import { describe, it, expect } from 'vitest'
import { compromissosToEventos } from '../src/utils/compromissos'
import type { Compromisso } from '../src/types'

describe('compromissosToEventos', () => {
  it('retorna lista vazia quando não há compromissos', () => {
    expect(compromissosToEventos([])).toEqual([])
  })

  it('ignora compromissos sem prazo (recorrentes)', () => {
    const cs: Compromisso[] = [
      { id: 1, nome: 'Netflix', parcela: 40 },
      { id: 2, nome: 'Plano', parcela: 200 },
    ]
    expect(compromissosToEventos(cs)).toEqual([])
  })

  it('ignora compromissos com prazo = 0', () => {
    const cs: Compromisso[] = [
      { id: 1, nome: 'Acabou', parcela: 100, prazo: 0 },
    ]
    expect(compromissosToEventos(cs)).toEqual([])
  })

  it('mapeia compromissos com prazo > 0 para eventos', () => {
    const cs: Compromisso[] = [
      { id: 1, nome: 'Cartão', parcela: 300, prazo: 8 },
      { id: 2, nome: 'Moto', parcela: 200, prazo: 24, prazoTotal: 36, taxa: 1.99 },
    ]
    expect(compromissosToEventos(cs)).toEqual([
      { mes: 8, deltaSobra: 300, nome: 'Cartão' },
      { mes: 24, deltaSobra: 200, nome: 'Moto' },
    ])
  })

  it('mistura: ignora recorrentes, inclui finitos', () => {
    const cs: Compromisso[] = [
      { id: 1, nome: 'Netflix', parcela: 40 },
      { id: 2, nome: 'Cartão', parcela: 300, prazo: 8 },
      { id: 3, nome: 'Plano', parcela: 200 },
    ]
    expect(compromissosToEventos(cs)).toEqual([
      { mes: 8, deltaSobra: 300, nome: 'Cartão' },
    ])
  })

  it('clampa parcela negativa em 0 no deltaSobra', () => {
    const cs: Compromisso[] = [
      { id: 1, nome: 'X', parcela: -100, prazo: 6 },
    ]
    expect(compromissosToEventos(cs)).toEqual([
      { mes: 6, deltaSobra: 0, nome: 'X' },
    ])
  })
})
