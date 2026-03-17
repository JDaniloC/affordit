import React from 'react'
import NumericInput from './NumericInput'

interface Props {
  patrimonio: number
  onPatrimonioChange: (v: number) => void
  reservaMeses: number
  onReservaMesesChange: (v: number) => void
  metaValor: number
  onMetaValorChange: (v: number) => void
}

export default function RealidadeSection({
  patrimonio,
  onPatrimonioChange,
  reservaMeses,
  onReservaMesesChange,
  metaValor,
  onMetaValorChange,
}: Props) {
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
    </section>
  )
}
