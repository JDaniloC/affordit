import type { NivelSaude } from '../logic/index'

export interface NivelVisual {
  label: string
  color: string
  bg: string
  border: string
}

export const NIVEL_VISUAL: Record<NivelSaude, NivelVisual> = {
  boa: {
    label: 'Boa',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.07)',
    border: 'rgba(16,185,129,0.25)',
  },
  regular: {
    label: 'Regular',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.07)',
    border: 'rgba(245,158,11,0.25)',
  },
  atencao: {
    label: 'Atenção',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.07)',
    border: 'rgba(239,68,68,0.25)',
  },
}
