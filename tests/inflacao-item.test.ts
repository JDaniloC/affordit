import { describe, it, expect } from 'vitest'
import { calcValorFuturoItem } from '../src/logic/index.ts'

describe('calcValorFuturoItem', () => {
  it('retorna o próprio valor quando taxa é zero', () => {
    expect(calcValorFuturoItem(1000, 0, 12)).toBe(1000)
    expect(calcValorFuturoItem(1000, 0, 0)).toBe(1000)
  })

  it('retorna o próprio valor quando meses é zero', () => {
    expect(calcValorFuturoItem(1000, 6, 0)).toBe(1000)
  })

  it('retorna o próprio valor quando taxa é negativa (defensivo)', () => {
    expect(calcValorFuturoItem(1000, -5, 12)).toBe(1000)
  })

  it('aplica taxa anual em 1 ano corretamente', () => {
    expect(calcValorFuturoItem(1000, 6, 12)).toBeCloseTo(1060, 2)
    expect(calcValorFuturoItem(1000, 10, 12)).toBeCloseTo(1100, 2)
  })

  it('aplica regime composto em 2 anos', () => {
    // 1000 * 1.06^2 = 1123.6
    expect(calcValorFuturoItem(1000, 6, 24)).toBeCloseTo(1123.6, 1)
  })

  it('aplica fração de ano corretamente (meio ano)', () => {
    // 1000 * 1.06^0.5 ≈ 1029.56
    expect(calcValorFuturoItem(1000, 6, 6)).toBeCloseTo(1029.56, 1)
  })

  it('lida com valores grandes', () => {
    // 100000 a 8% por 5 anos = 100000 * 1.08^5 ≈ 146932.81
    expect(calcValorFuturoItem(100000, 8, 60)).toBeCloseTo(146932.81, 0)
  })

  it('lida com inflação alta (15% a.a. em 3 anos)', () => {
    // 1000 * 1.15^3 = 1520.875
    expect(calcValorFuturoItem(1000, 15, 36)).toBeCloseTo(1520.88, 1)
  })

  it('é função pura — chamadas idênticas retornam mesmo resultado', () => {
    const r1 = calcValorFuturoItem(5000, 4.5, 18)
    const r2 = calcValorFuturoItem(5000, 4.5, 18)
    expect(r1).toBe(r2)
  })
})
