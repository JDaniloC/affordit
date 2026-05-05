import React, { useState, useEffect, useRef } from 'react'
import NumericInput from './NumericInput'
import type { Meta } from '../types'

interface Props {
  initial?: Meta
  onSubmit: (data: { nome: string; valor: number }) => void
  onCancel: () => void
}

export default function MetaForm({ initial, onSubmit, onCancel }: Props) {
  const [nome, setNome] = useState(initial?.nome ?? '')
  const [valor, setValor] = useState(initial?.valor ?? 0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function submit() {
    if (nome.trim() && valor > 0) {
      onSubmit({ nome: nome.trim(), valor })
    }
  }

  return (
    <div className="meta-form">
      <input
        ref={inputRef}
        type="text"
        className="meta-form-nome"
        placeholder="Ex: Notebook"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit()
          if (e.key === 'Escape') onCancel()
        }}
        aria-label="Nome da meta"
      />
      <div className="input-group meta-form-valor">
        <span className="unit prefix">R$</span>
        <NumericInput value={valor} onChange={setValor} placeholder="0,00" />
      </div>
      <button type="button" className="btn-meta-form-ok" onClick={submit} aria-label="Salvar">
        ✓
      </button>
      <button type="button" className="btn-meta-form-cancel" onClick={onCancel} aria-label="Cancelar">
        ×
      </button>
    </div>
  )
}
