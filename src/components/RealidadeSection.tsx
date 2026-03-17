import React from 'react'
import NumericInput from './NumericInput'
import { ScoreSaudeResult, NivelSaude } from '../logic/index'

interface Props {
  patrimonio: number
  onPatrimonioChange: (v: number) => void
  reservaMeses: number
  onReservaMesesChange: (v: number) => void
  metaValor: number
  onMetaValorChange: (v: number) => void
  rendimentoAnual: number
  onRendimentoAnualChange: (v: number) => void
  scoreSaude: ScoreSaudeResult
}

const NIVEL_CONFIG: Record<NivelSaude, { label: string; color: string; bg: string; border: string }> = {
  boa:     { label: 'Boa',    color: '#10b981', bg: 'rgba(16,185,129,0.07)', border: 'rgba(16,185,129,0.25)' },
  regular: { label: 'Regular', color: '#f59e0b', bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.25)' },
  atencao: { label: 'Atenção', color: '#ef4444', bg: 'rgba(239,68,68,0.07)', border: 'rgba(239,68,68,0.25)' },
}

export default function RealidadeSection({
  patrimonio,
  onPatrimonioChange,
  reservaMeses,
  onReservaMesesChange,
  metaValor,
  onMetaValorChange,
  rendimentoAnual,
  onRendimentoAnualChange,
  scoreSaude,
}: Props) {
  const cfg = NIVEL_CONFIG[scoreSaude.nivel]

  return (
    <section className="card" id="section-realidade">
      <h2>Sua Realidade Financeira</h2>

      <div className="field">
        <label htmlFor="patrimonio">Patrimônio Atual Guardado</label>
        <div className="input-group">
          <span className="unit prefix">R$</span>
          <NumericInput
            id="patrimonio"
            value={patrimonio}
            onChange={onPatrimonioChange}
            placeholder="0,00"
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="reserva-meses">Tamanho da Reserva de Emergência</label>
        <div className="input-group">
          <NumericInput
            id="reserva-meses"
            value={reservaMeses}
            onChange={(v) => onReservaMesesChange(Math.max(1, Math.round(v)))}
            min={1}
            step={1}
            placeholder="6"
            defaultValue={6}
          />
          <span className="unit">meses</span>
        </div>
      </div>

      <div className="field">
        <label htmlFor="meta-valor">
          Meta de Acumulação{' '}
          <span className="hint-inline">(opcional — ex: 100.000 em 5 anos)</span>
        </label>
        <div className="input-group">
          <span className="unit prefix">R$</span>
          <NumericInput
            id="meta-valor"
            value={metaValor}
            onChange={(v) => onMetaValorChange(Math.max(0, v))}
            placeholder="0,00"
            defaultValue={0}
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="rendimento-anual">
          Rendimento estimado da reserva{' '}
          <span className="hint-inline">(opcional — 0 = sem rendimento)</span>
        </label>
        <div className="input-group">
          <NumericInput
            id="rendimento-anual"
            value={rendimentoAnual}
            onChange={onRendimentoAnualChange}
            min={0}
            step={0.5}
            placeholder="0"
          />
          <span className="unit">% a.a.</span>
        </div>
        <p className="field-hint">
          Selic/CDI hoje está em torno de 10–13% a.a. Use 0 para calcular sem rendimento (conservador). A conversão para taxa mensal é feita automaticamente pelo regime composto.
        </p>
      </div>

      {/* Score de saúde financeira (P1.5) */}
      <div className="saude-card" style={{ background: cfg.bg, borderColor: cfg.border }}>
        <div className="saude-header">
          <div className="saude-titulo">Saúde Financeira</div>
          <div className="saude-nivel" style={{ color: cfg.color }}>{cfg.label}</div>
          <div className="saude-barra-wrap">
            <div className="saude-barra-bg">
              <div
                className="saude-barra-fill"
                style={{
                  width: `${scoreSaude.pontuacao}%`,
                  background: cfg.color,
                }}
              />
            </div>
            <span className="saude-pontuacao" style={{ color: cfg.color }}>
              {scoreSaude.pontuacao}/100
            </span>
          </div>
        </div>
        <div className="saude-fatores">
          {scoreSaude.fatores.map((f) => (
            <div key={f.label} className={`saude-fator${f.ok ? ' saude-fator-ok' : ' saude-fator-nok'}`}>
              <span className="saude-fator-icone">{f.ok ? '✅' : f.pontos > 0 ? '⚠️' : '❌'}</span>
              <div className="saude-fator-corpo">
                <div className="saude-fator-label">
                  {f.label}
                  <span className="saude-fator-pts">+{f.pontos}/{f.maxPontos}</span>
                </div>
                <div className="saude-fator-desc">{f.descricao}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
