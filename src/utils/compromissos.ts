import type { PerfilFinanceiro, Compromisso } from '../types'

export function somaCompromissos(perfil: PerfilFinanceiro): number {
  return perfil.compromissos.reduce((s, c) => s + Math.max(0, c.parcela), 0)
}

export function formatPrazoTermino(prazoMeses: number): string {
  if (prazoMeses === 0) return 'este mês'
  const data = new Date()
  data.setMonth(data.getMonth() + prazoMeses)
  return data.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}

export interface EventoSobra {
  mes: number          // meses a partir de "agora"; > 0
  deltaSobra: number   // R$/mês adicionado permanentemente a partir de mes
  nome?: string        // só para UI; motor ignora
}

export function compromissosToEventos(compromissos: Compromisso[]): EventoSobra[] {
  return compromissos
    .filter((c): c is Compromisso & { prazo: number } =>
      typeof c.prazo === 'number' && c.prazo > 0,
    )
    .map(c => ({
      mes: c.prazo,
      deltaSobra: Math.max(0, c.parcela),
      nome: c.nome,
    }))
}
