import type { PerfilFinanceiro } from '../types'

export function somaCompromissos(perfil: PerfilFinanceiro): number {
  return perfil.compromissos.reduce((s, c) => s + Math.max(0, c.parcela), 0)
}

export function formatPrazoTermino(prazoMeses: number): string {
  if (prazoMeses === 0) return 'este mês'
  const data = new Date()
  data.setMonth(data.getMonth() + prazoMeses)
  return data.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}
