import type { Gasto, PerfilFinanceiro } from '../types'

export function valorDoGasto(g: Gasto, renda: number): number {
  if (g.tipo === 'pct') return Math.max(0, (g.pct / 100) * renda)
  return Math.max(0, g.valor)
}

export function somaGastos(perfil: PerfilFinanceiro): number {
  return perfil.gastos.reduce((s, g) => s + valorDoGasto(g, perfil.renda), 0)
}
