export interface Envelope {
  id: number
  nome: string
  pct: number
}

export type Criterio = 'fluxo' | 'patrimonio' | 'roi'

export type TipoCompra = 'lazer' | 'ferramenta' | 'passivoAltoValor'

// Meta do planejador (Ciclo F) — NÃO MUDAR
export interface Meta {
  id: number
  nome: string
  valor: number
}

export interface Compromisso {
  id: number
  nome: string
  parcela: number
  prazo?: number          // meses restantes; undefined = recorrência
  prazoTotal?: number     // total de parcelas (habilita barra de progresso)
  taxa?: number           // % a.m.
}

export interface PerfilFinanceiro {
  renda: number
  custo: number
  parcelasExistentes: number
  envelopes: Envelope[]
  patrimonio: number
  reservaMeses: number
  rendimentoAnual: number
  metaValor: number
  compromissos: Compromisso[]
}

export interface Cenario {
  id: string
  nome: string
  itemNome: string
  itemValor: number
  tipoCompra: TipoCompra
  parcelas: number
  taxaJuros: number
  manutencaoMensal: number
  entradaValor: number
  despesaSubstituida: number
  criadoEm: number
  atualizadoEm: number
  /**
   * P2.8 — Taxa de inflação anual do item (% a.a.).
   * Quando > 0, o resultado mostra quanto o item custará no momento
   * em que o usuário terá o dinheiro para comprá-lo à vista.
   * Default 0 (sem inflação aplicada).
   */
  inflacaoAnual: number
  /**
   * Taxa de depreciação anual do item (% a.a.).
   * Quando > 0, o resultado mostra quanto o item valerá após a compra
   * em horizontes típicos (1 / 3 / 5 anos). Útil para carros, eletrônicos,
   * gadgets e outros bens não-imóveis que perdem valor com o tempo.
   * Default 0 (sem depreciação aplicada).
   */
  taxaDepreciacaoAnual: number
}

export interface AppState {
  perfil: PerfilFinanceiro
  cenarios: Cenario[]
  metas: Meta[]
  cenarioAtivoId: string | null
  onboardingConcluido: boolean
}

// Helpers de fábrica
export const PERFIL_VAZIO: PerfilFinanceiro = {
  renda: 0,
  custo: 0,
  parcelasExistentes: 0,
  envelopes: [],
  patrimonio: 0,
  reservaMeses: 6,
  rendimentoAnual: 0,
  metaValor: 0,
  compromissos: [],
}

export const APP_STATE_VAZIO: AppState = {
  perfil: PERFIL_VAZIO,
  cenarios: [],
  metas: [],
  cenarioAtivoId: null,
  onboardingConcluido: false,
}
