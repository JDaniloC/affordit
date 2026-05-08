import React from 'react'
import type { ScoreSaudeResult } from '../../logic/index'
import { NIVEL_VISUAL } from '../../utils/nivelSaude'

interface Props {
  scoreSaude: ScoreSaudeResult
}

export default function ScoreCard({ scoreSaude }: Props) {
  const cfg = NIVEL_VISUAL[scoreSaude.nivel]
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
