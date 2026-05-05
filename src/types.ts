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

// ============================================================
// V1 — esquema legado, usado apenas pela migração
// ============================================================
export interface AppStateV1 {
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
  tipoCompra: TipoCompra
  manutencaoMensal: number
  entradaValor: number
  despesaSubstituida: number
  taxaJuros: number
  parcelasExistentes: number
  rendimentoAnual: number
  metas: Meta[]
}

// ============================================================
// V2 — esquema novo
// ============================================================
export interface PerfilFinanceiro {
  renda: number
  custo: number
  parcelasExistentes: number
  envelopes: Envelope[]
  patrimonio: number
  reservaMeses: number
  rendimentoAnual: number
  metaValor: number
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
}

export const APP_STATE_VAZIO: AppState = {
  perfil: PERFIL_VAZIO,
  cenarios: [],
  metas: [],
  cenarioAtivoId: null,
  onboardingConcluido: false,
}
