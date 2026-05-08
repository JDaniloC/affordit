import React from 'react'
import type { ScoreSaudeResult, NivelSaude } from '../../logic/index'

interface Props {
  scoreSaude: ScoreSaudeResult
}

const NIVEL_CONFIG: Record<NivelSaude, { label: string; color: string }> = {
  boa: { label: 'Boa', color: '#10b981' },
  regular: { label: 'Regular', color: '#f59e0b' },
  atencao: { label: 'Atenção', color: '#ef4444' },
}

export default function ScoreCard({ scoreSaude }: Props) {
  const cfg = NIVEL_CONFIG[scoreSaude.nivel]
  return (
    <div className="saude-resultado-card" style={{ borderColor: cfg.color + '44' }}>
      <div className="saude-resultado-header">
        <span className="saude-resultado-titulo">Saúde Financeira</span>
        <span className="saude-resultado-nivel" style={{ color: cfg.color }}>
          {cfg.label} — {scoreSaude.pontuacao}/100
        </span>
      </div>
      <div className="saude-resultado-barra-bg">
        <div
          className="saude-resultado-barra-fill"
          style={{ width: `${scoreSaude.pontuacao}%`, background: cfg.color }}
        />
      </div>
    </div>
  )
}
