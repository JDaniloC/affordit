import { useState } from 'react'
import type { Compromisso } from '../types'
import NumericInput from './NumericInput'

type CompromissoData = Omit<Compromisso, 'id'>

interface Props {
  inicial?: Compromisso
  onSave: (data: CompromissoData) => void
  onCancel: () => void
}

export default function CompromissoForm({ inicial, onSave, onCancel }: Props) {
  const [nome, setNome] = useState(inicial?.nome ?? '')
  const [parcela, setParcela] = useState(inicial?.parcela ?? 0)
  const [prazo, setPrazo] = useState<number>(inicial?.prazo ?? 0)
  const [prazoTotal, setPrazoTotal] = useState<number>(inicial?.prazoTotal ?? 0)
  const [taxa, setTaxa] = useState<number>(inicial?.taxa ?? 0)

  const valido = nome.trim().length > 0 && parcela > 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valido) return // defense-in-depth: guard against programmatic submits
    const data: CompromissoData = { nome: nome.trim(), parcela }
    if (prazo > 0) data.prazo = prazo
    if (prazoTotal > 0) data.prazoTotal = prazoTotal
    if (taxa > 0) data.taxa = taxa // Note: taxa=0 is treated as "no juros declared" (not included)
    onSave(data)
  }

  return (
    <form className="compromisso-form card" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="comp-nome">Nome</label>
        <input
          id="comp-nome"
          type="text"
          placeholder="Ex: Cartão Nubank, Netflix..."
          value={nome}
          onChange={e => setNome(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="comp-parcela">Parcela mensal</label>
        <div className="input-group">
          <span className="unit prefix">R$</span>
          <NumericInput
            id="comp-parcela"
            value={parcela}
            onChange={setParcela}
            placeholder="0,00"
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="comp-prazo">
          Prazo restante <span className="hint-inline">(opcional, em meses)</span>
        </label>
        <div className="input-group">
          <NumericInput
            id="comp-prazo"
            value={prazo}
            onChange={setPrazo}
            min={0}
            step={1}
            placeholder="vazio = recorrência"
          />
          <span className="unit">meses</span>
        </div>
      </div>

      <div className="field">
        <label htmlFor="comp-prazo-total">
          Total de parcelas <span className="hint-inline">(opcional, habilita barra)</span>
        </label>
        <NumericInput
          id="comp-prazo-total"
          value={prazoTotal}
          onChange={setPrazoTotal}
          min={0}
          step={1}
          placeholder="ex: 12 (se foram 12 parcelas no total)"
        />
      </div>

      <div className="field">
        <label htmlFor="comp-taxa">
          Taxa de juros <span className="hint-inline">(opcional, % a.m.)</span>
        </label>
        <div className="input-group">
          <NumericInput
            id="comp-taxa"
            value={taxa}
            onChange={setTaxa}
            min={0}
            step={0.1}
            placeholder="0"
          />
          <span className="unit">% a.m.</span>
        </div>
      </div>

      <div className="compromisso-form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={!valido}>
          Salvar
        </button>
      </div>
    </form>
  )
}
