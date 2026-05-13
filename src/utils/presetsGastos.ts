type GastoSemId =
  | { nome: string; tipo: 'valor'; valor: number }
  | { nome: string; tipo: 'pct'; pct: number }

export interface PresetGastos {
  id: string
  label: string
  descricao: string
  itens: GastoSemId[]
}

/**
 * Presets de gastos para reduzir fricção do "não sei meu custo de vida".
 * Itens são adicionados à lista com IDs gerados pelo caller (sequencial).
 *
 * Valores absolutos (não pct) porque são mais concretos para a persona
 * de baixa renda — ver project_publico_alvo.md.
 */
export const PRESETS_GASTOS: PresetGastos[] = [
  {
    id: 'basicos',
    label: 'Carregar exemplo de gastos básicos',
    descricao: 'Valores típicos para renda de R$ 1.000 a R$ 2.000 — ajuste conforme sua realidade.',
    itens: [
      { nome: 'Aluguel', tipo: 'valor', valor: 600 },
      { nome: 'Mercado', tipo: 'valor', valor: 400 },
      { nome: 'Transporte', tipo: 'valor', valor: 200 },
      { nome: 'Conta de luz', tipo: 'valor', valor: 100 },
      { nome: 'Internet/celular', tipo: 'valor', valor: 80 },
      { nome: 'Gás', tipo: 'valor', valor: 50 },
    ],
  },
]
