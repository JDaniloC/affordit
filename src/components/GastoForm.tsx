import { useState } from 'react'
import type { Gasto } from '../types'
import NumericInput from './NumericInput'

export type GastoData =
  | { nome: string; tipo: 'valor'; valor: number }
  | { nome: string; tipo: 'pct'; pct: number }

interface Props {
  inicial?: Gasto
  onSave: (data: GastoData) => void
  onCancel: () => void
}

export default function GastoForm({ inicial, onSave, onCancel }: Props) {
  const [nome, setNome] = useState(inicial?.nome ?? '')
  const [tipo, setTipo] = useState<'valor' | 'pct'>(inicial?.tipo ?? 'valor')
  const [valor, setValor] = useState<number>(
    inicial?.tipo === 'valor' ? inicial.valor : 0,
  )
  const [pct, setPct] = useState<number>(
    inicial?.tipo === 'pct' ? inicial.pct : 0,
  )

  const valido = nome.trim().length > 0 && (
    tipo === 'valor' ? valor > 0 : (pct > 0 && pct <= 100)
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valido) return // defense-in-depth: guard against programmatic submits
    if (tipo === 'valor') {
      onSave({ nome: nome.trim(), tipo: 'valor', valor })
    } else {
      onSave({ nome: nome.trim(), tipo: 'pct', pct })
    }
  }

  return (
    <form className="gasto-form card" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="gasto-nome">Nome</label>
        <input
          id="gasto-nome"
          type="text"
          placeholder="Ex: Aluguel, Mercado, Transporte..."
          value={nome}
          onChange={e => setNome(e.target.value)}
        />
      </div>

      <fieldset className="field gasto-form-toggle">
        <legend>Tipo</legend>
        <label>
          <input
            type="radio"
            name="gasto-tipo"
            checked={tipo === 'valor'}
            onChange={() => setTipo('valor')}
          />
          R$ fixo
        </label>
        <label>
          <input
            type="radio"
            name="gasto-tipo"
            checked={tipo === 'pct'}
            onChange={() => setTipo('pct')}
          />
          % da renda
        </label>
      </fieldset>

      {tipo === 'valor' ? (
        <div className="field">
          <label htmlFor="gasto-valor">Valor mensal</label>
          <div className="input-group">
            <span className="unit prefix">R$</span>
            <NumericInput
              id="gasto-valor"
              value={valor}
              onChange={setValor}
              placeholder="0,00"
            />
          </div>
        </div>
      ) : (
        <div className="field">
          <label htmlFor="gasto-pct">Percentual da renda</label>
          <div className="input-group">
            <NumericInput
              id="gasto-pct"
              value={pct}
              onChange={setPct}
              min={0}
              step={1}
              placeholder="0"
            />
            <span className="unit">%</span>
          </div>
        </div>
      )}

      <div className="gasto-form-actions">
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
