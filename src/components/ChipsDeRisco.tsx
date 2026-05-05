import React, { useState } from 'react'
import type { ChipRisco, RiscoPatrimonio } from '../logic/index'

type Severidade = 'amarelo' | 'laranja' | 'vermelho'

interface ChipFormatado {
  texto: string
  severidade: Severidade
  icone: string
}

const SEVERIDADE_ORDEM: Record<Severidade, number> = { vermelho: 0, laranja: 1, amarelo: 2 }

function formatChipRisco(motivo: ChipRisco): ChipFormatado {
  switch (motivo.tipo) {
    case 'pct_patrimonio': {
      const pct = (motivo.pct * 100).toFixed(0)
      const sev: Severidade = motivo.pct > 0.15 ? 'vermelho' : 'amarelo'
      return { texto: `Compromete ${pct}% do seu patrimônio`, severidade: sev, icone: sev === 'vermelho' ? '🔴' : '🟡' }
    }
    case 'lazer_com_parcelas':
      return { texto: 'Lazer com parcelamento ativo', severidade: 'amarelo', icone: '🟡' }
    case 'parcela_consome_lazer': {
      const pct = (motivo.pct * 100).toFixed(0)
      return { texto: `Parcela consome ${pct}% da sua sobra de lazer`, severidade: 'amarelo', icone: '🟡' }
    }
    case 'reserva_abaixo_alvo':
      return { texto: 'Reserva de emergência ficaria abaixo do alvo', severidade: 'vermelho', icone: '🔴' }
    case 'atraso_meta': {
      let sev: Severidade = 'amarelo'
      if (motivo.meses > 12) sev = 'vermelho'
      else if (motivo.meses > 6) sev = 'laranja'
      const icone = sev === 'vermelho' ? '🔴' : sev === 'laranja' ? '🟠' : '🟡'
      const sufixo = motivo.meses === 1 ? 'mês' : 'meses'
      return { texto: `Atrasa sua meta em ${motivo.meses} ${sufixo}`, severidade: sev, icone }
    }
    case 'dti_alto': {
      const pct = (motivo.pct * 100).toFixed(0)
      return { texto: `Comprometimento de renda subiria para ${pct}%`, severidade: 'amarelo', icone: '🟡' }
    }
  }
}

interface Props {
  risco: RiscoPatrimonio
}

const MAX_VISIVEIS = 3

export default function ChipsDeRisco({ risco }: Props) {
  const [expandido, setExpandido] = useState(false)

  if (risco.motivos.length === 0) return null

  const chips = risco.motivos
    .map(formatChipRisco)
    .sort((a, b) => SEVERIDADE_ORDEM[a.severidade] - SEVERIDADE_ORDEM[b.severidade])

  const visiveis = expandido ? chips : chips.slice(0, MAX_VISIVEIS)
  const ocultos = chips.length - MAX_VISIVEIS

  return (
    <div className="chips-de-risco">
      {visiveis.map((c, i) => (
        <div key={i} className={`chip-risco chip-risco-${c.severidade}`}>
          <span className="chip-risco-icone">{c.icone}</span>
          <span className="chip-risco-texto">{c.texto}</span>
        </div>
      ))}
      {!expandido && ocultos > 0 && (
        <button
          type="button"
          className="chip-risco-expandir"
          onClick={() => setExpandido(true)}
        >
          + ver mais {ocultos} {ocultos === 1 ? 'alerta' : 'alertas'}
        </button>
      )}
    </div>
  )
}

export { formatChipRisco }
export type { ChipFormatado, Severidade }
