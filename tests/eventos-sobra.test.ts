import { describe, it, expect } from 'vitest'
import { compromissosToEventos } from '../src/utils/compromissos'
import type { Compromisso } from '../src/types'
import { calcTrajetoriaPatrimonio } from '../src/logic/index'

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

describe('calcTrajetoriaPatrimonio com eventosSobra', () => {
  it('comportamento idêntico ao atual quando eventosSobra=[] (default)', () => {
    const trajSemEventos = calcTrajetoriaPatrimonio(
      10000, 500, 0, 12, [],
    )
    const trajComDefault = calcTrajetoriaPatrimonio(
      10000, 500, 0, 12, [],
    )
    expect(trajComDefault).toEqual(trajSemEventos)
  })

  it('aplica delta cumulativamente a partir do mes do evento', () => {
    // patrimonio inicial 0, sobra 100/mês, sem juros, sem fila, horizonte 12.
    // Sem evento: traj = [0, 100, 200, 300, ..., 1200]
    // Com evento { mes: 5, deltaSobra: 50 }: a partir de t=5, sobra é 150.
    // Trajetória esperada: [0, 100, 200, 300, 400, 550, 700, 850, 1000, 1150, 1300, 1450, 1600]
    const traj = calcTrajetoriaPatrimonio(
      0, 100, 0, 12, [],
      [{ mes: 5, deltaSobra: 50 }],
    )
    expect(traj).toEqual([0, 100, 200, 300, 400, 550, 700, 850, 1000, 1150, 1300, 1450, 1600])
  })

  it('múltiplos eventos somam deltas cumulativamente', () => {
    // sobra inicial 100. Evento mes=3 +50, mes=6 +30. Após mes 6, sobra=180.
    const traj = calcTrajetoriaPatrimonio(
      0, 100, 0, 8, [],
      [{ mes: 3, deltaSobra: 50 }, { mes: 6, deltaSobra: 30 }],
    )
    // t=0: 0
    // t=1: 100, t=2: 200
    // t=3: 350 (200 + 100 + 50)
    // t=4: 500, t=5: 650
    // t=6: 830 (650 + 100 + 50 + 30)
    // t=7: 1010, t=8: 1190
    expect(traj).toEqual([0, 100, 200, 350, 500, 650, 830, 1010, 1190])
  })

  it('eventos no mesmo mês somam ambos deltas', () => {
    const traj = calcTrajetoriaPatrimonio(
      0, 0, 0, 4, [],
      [{ mes: 2, deltaSobra: 10 }, { mes: 2, deltaSobra: 5 }],
    )
    // sobra inicial 0. mes 1: 0. mes 2 em diante: +15.
    expect(traj).toEqual([0, 0, 15, 30, 45])
  })

  it('eventos não-ordenados produzem mesma trajetória que ordenados', () => {
    const trajOrdered = calcTrajetoriaPatrimonio(
      0, 100, 0, 8, [],
      [{ mes: 3, deltaSobra: 50 }, { mes: 6, deltaSobra: 30 }],
    )
    const trajUnordered = calcTrajetoriaPatrimonio(
      0, 100, 0, 8, [],
      [{ mes: 6, deltaSobra: 30 }, { mes: 3, deltaSobra: 50 }],
    )
    expect(trajUnordered).toEqual(trajOrdered)
  })
})
