export interface Envelope {
  id: number
  nome: string
  pct: number
}

export type Criterio = 'fluxo' | 'patrimonio' | 'roi'

export type TipoCompra = 'lazer' | 'ferramenta' | 'passivoAltoValor'

export interface AppState {
  envelopes: Envelope[]
  reservaMeses: number
  renda: number
  custo: number
  patrimonio: number
  metaValor: number
  itemNome: string
  itemValor: number
  ferramenta: boolean
  criterio: Criterio
  parcelas: number
  // P0.1 — tipo de compra
  tipoCompra: TipoCompra
  manutencaoMensal: number    // custo mensal de manutenção (passivo)
  entradaValor: number        // entrada (passivo)
  despesaSubstituida: number  // despesa substituída, ex: aluguel atual (passivo)
  // P0.2 — juros do financiamento
  taxaJuros: number           // taxa de juros mensal em % (0 = sem juros)
  // P0.3 — parcelas existentes
  parcelasExistentes: number  // parcelas mensais já comprometidas no orçamento
  // P1.4 — rendimento da reserva / juros compostos
  rendimentoAnual: number     // taxa de rendimento anual em % a.a. (0 = sem rendimento)
}
