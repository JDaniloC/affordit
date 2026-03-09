import React from 'react'
import { Envelope } from '../types'
import { calcLazerPct } from '../logic/index'
import NumericInput from './NumericInput'

interface Props {
  renda: number
  onRendaChange: (v: number) => void
  envelopes: Envelope[]
  onEnvelopesChange: React.Dispatch<React.SetStateAction<Envelope[]>>
  custo: number
}

export default function ConfigSection({
  renda,
  onRendaChange,
  envelopes,
  onEnvelopesChange,
  custo,
}: Props) {
  const total = envelopes.reduce((acc, e) => acc + (e.pct || 0), 0)
  const lazer = calcLazerPct(renda, custo, envelopes)

  function addEnvelope() {
    onEnvelopesChange((prev) => {
      const maxId = prev.reduce((m, e) => Math.max(m, e.id ?? 0), 0)
      return [...prev, { id: maxId + 1, nome: '', pct: 0 }]
    })
  }

  function removeEnvelope(id: number) {
    onEnvelopesChange((prev) => prev.filter((e) => e.id !== id))
  }

  function updateEnvelopePct(id: number, value: number) {
    onEnvelopesChange((prev) => prev.map((e) => (e.id === id ? { ...e, pct: value } : e)))
  }

  function updateEnvelopeNome(id: number, value: string) {
    onEnvelopesChange((prev) => prev.map((e) => (e.id === id ? { ...e, nome: value } : e)))
  }

  return (
    <section className="card" id="section-config">
      <h2>Renda e Envelopes</h2>

      <div className="field">
        <label htmlFor="renda">Renda Líquida Mensal</label>
        <div className="input-group">
          <span className="unit prefix">R$</span>
          <NumericInput
            id="renda"
            value={renda}
            onChange={onRendaChange}
            placeholder="0,00"
          />
        </div>
      </div>

      <div className="field">
        <label>Envelopes (Buckets)</label>
        <p className="field-hint">Como você divide sua renda em categorias?</p>
        <div id="envelopes-list">
          {envelopes.map(({ id, nome, pct }) => (
            <div key={id} className="envelope-item">
              <input
                type="text"
                placeholder="Nome (ex: Dízimo)"
                value={nome}
                onChange={(e) => updateEnvelopeNome(id, e.target.value)}
              />
              <div className="input-group">
                <NumericInput
                  key={`pct-${id}`}
                  className="pct-input"
                  value={pct}
                  onChange={(v) => updateEnvelopePct(id, v)}
                  min={0}
                  step={1}
                  placeholder="0"
                />
                <span className="unit">%</span>
              </div>
              <button
                className="btn-remove-envelope"
                title="Remover"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => removeEnvelope(id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button className="btn-add-envelope" onClick={addEnvelope}>
          + Adicionar Categoria
        </button>
        <div className="envelope-summary">
          <span>
            Total alocado:{' '}
            <strong style={{ color: total > 100 ? 'var(--danger)' : 'var(--text)' }}>
              {total.toFixed(1)}%
            </strong>
          </span>
          <span className="lazer-display">
            Lazer / Compras (resto): <strong>{lazer.toFixed(1)}%</strong>
          </span>
        </div>
      </div>
    </section>
  )
}
