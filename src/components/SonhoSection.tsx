import React from 'react'
import NumericInput from './NumericInput'

interface Props {
  itemNome: string
  onItemNomeChange: (v: string) => void
  itemValor: number
  onItemValorChange: (v: number) => void
  ferramenta: boolean
  onFerramentaChange: (v: boolean) => void
}

export default function SonhoSection({
  itemNome,
  onItemNomeChange,
  itemValor,
  onItemValorChange,
  ferramenta,
  onFerramentaChange,
}: Props) {
  return (
    <section className="card" id="section-sonho">
      <h2>3. O que você quer comprar?</h2>

      <div className="field">
        <label htmlFor="item-nome">Nome do Item</label>
        <input
          type="text"
          id="item-nome"
          placeholder="Ex: Notebook, Celular, Instrumento..."
          value={itemNome}
          onChange={(e) => onItemNomeChange(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="item-valor">Valor Total</label>
        <div className="input-group">
          <span className="unit prefix">R$</span>
          <NumericInput id="item-valor" value={itemValor} onChange={onItemValorChange} placeholder="0,00" />
        </div>
      </div>

      <div className="field toggle-field">
        <label className="toggle-label" htmlFor="ferramenta-toggle">
          <span>É um investimento profissional / Ferramenta de trabalho?</span>
          <div className="toggle-wrapper">
            <input
              type="checkbox"
              id="ferramenta-toggle"
              checked={ferramenta}
              onChange={(e) => onFerramentaChange(e.target.checked)}
            />
            <span className="toggle-track"></span>
          </div>
        </label>
        <p className="hint">
          Se sim, o simulador considera o potencial de ROI e afrouxa as restrições.
        </p>
      </div>
    </section>
  )
}
