import { describe, it, expect } from 'vitest'
import { calcCorte5050 } from '../src/logic/index.ts'

describe('calcCorte5050 — quanto cortar do custo para ficar ≤ 50% da renda', () => {
  it('retorna null quando custo já é ≤ 50% da renda', () => {
    expect(calcCorte5050(2_000, 5_000)).toBeNull()
    expect(calcCorte5050(2_500, 5_000)).toBeNull() // exatamente 50%
  })

  it('retorna o valor a cortar quando custo > 50% da renda', () => {
    expect(calcCorte5050(3_000, 5_000)).toBe(500) // 60% → cortar 500 para chegar a 2500
    expect(calcCorte5050(4_000, 5_000)).toBe(1_500) // 80% → cortar 1500
  })

  it('retorna null quando renda é zero ou negativa (não há régua para aplicar)', () => {
    expect(calcCorte5050(1_000, 0)).toBeNull()
    expect(calcCorte5050(1_000, -100)).toBeNull()
  })

  it('retorna null quando custo é zero', () => {
    expect(calcCorte5050(0, 5_000)).toBeNull()
  })
})
