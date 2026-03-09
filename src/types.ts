export interface Envelope {
  id: number
  nome: string
  pct: number
}

export type Criterio = 'fluxo' | 'patrimonio' | 'roi'

export interface AppState {
  envelopes: Envelope[]
  reservaMeses: number
  renda: number
  custo: number
  patrimonio: number
  itemNome: string
  itemValor: number
  ferramenta: boolean
  criterio: Criterio
  parcelas: number
}
