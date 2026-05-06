import { describe, it, expect } from 'vitest'
import { calcValorDepreciado } from '../src/logic/index.ts'

describe('calcValorDepreciado', () => {
  it('retorna o próprio valor quando taxa é zero', () => {
    expect(calcValorDepreciado(50_000, 0, 12)).toBe(50_000)
    expect(calcValorDepreciado(50_000, 0, 0)).toBe(50_000)
  })

  it('retorna o próprio valor quando meses é zero', () => {
    expect(calcValorDepreciado(50_000, 15, 0)).toBe(50_000)
  })

  it('retorna o próprio valor quando taxa é negativa (defensivo)', () => {
    expect(calcValorDepreciado(50_000, -5, 12)).toBe(50_000)
  })

  it('aplica depreciação em 1 ano (carro novo perde 15%)', () => {
    expect(calcValorDepreciado(50_000, 15, 12)).toBeCloseTo(42_500, 0)
  })

  it('aplica regime composto inverso em 2 anos', () => {
    // 50000 * 0.85^2 = 36125
    expect(calcValorDepreciado(50_000, 15, 24)).toBeCloseTo(36_125, 0)
  })

  it('aplica fração de ano corretamente (meio ano a 20%)', () => {
    // 50000 * 0.8^0.5 ≈ 44721
    expect(calcValorDepreciado(50_000, 20, 6)).toBeCloseTo(44_721, 0)
  })

  it('depreciação alta — eletrônico em 3 anos a 30%', () => {
    // 5000 * 0.7^3 = 1715
    expect(calcValorDepreciado(5_000, 30, 36)).toBeCloseTo(1_715, 0)
  })

  it('clampa taxa em 100% e zera o valor', () => {
    // Taxa 100% → multiplica por (1 - 1)^x = 0
    expect(calcValorDepreciado(50_000, 100, 12)).toBe(0)
  })

  it('clampa taxa absurda (> 100%) e zera, sem produzir negativo', () => {
    expect(calcValorDepreciado(50_000, 150, 12)).toBe(0)
  })

  it('é função pura — chamadas idênticas retornam mesmo resultado', () => {
    const r1 = calcValorDepreciado(80_000, 12, 36)
    const r2 = calcValorDepreciado(80_000, 12, 36)
    expect(r1).toBe(r2)
  })
})
