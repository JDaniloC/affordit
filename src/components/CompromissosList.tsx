import { useState } from 'react'
import type { Compromisso } from '../types'
import CompromissoCard from './CompromissoCard'
import CompromissoForm, { type CompromissoData } from './CompromissoForm'

interface Props {
  compromissos: Compromisso[]
  renda: number
  onChange: (next: Compromisso[]) => void
}

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

export default function CompromissosList({ compromissos, renda, onChange }: Props) {
  const [adicionando, setAdicionando] = useState(false)
  const [editandoId, setEditandoId] = useState<number | null>(null)

  const total = compromissos.reduce((s, c) => s + Math.max(0, c.parcela), 0)
  const pctRenda = renda > 0 ? Math.round((total / renda) * 100) : 0

  function nextId(): number {
    return compromissos.reduce((m, c) => Math.max(m, c.id), 0) + 1
  }

  function adicionar(data: CompromissoData) {
    onChange([...compromissos, { id: nextId(), ...data }])
    setAdicionando(false)
  }

  function editar(id: number, data: CompromissoData) {
    onChange(compromissos.map(c => (c.id === id ? { id, ...data } : c)))
    setEditandoId(null)
  }

  function excluir(id: number) {
    onChange(compromissos.filter(c => c.id !== id))
  }

  return (
    <div className="compromissos-list">
      <div className="compromissos-list-header">
        <h3>Compromissos mensais</h3>
        {compromissos.length > 0 && (
          <p className="compromissos-list-totais">
            <strong>{fmt(total)}/mês</strong>
            {renda > 0 && <> • {pctRenda}% da renda comprometida</>}
          </p>
        )}
      </div>

      {compromissos.length === 0 && !adicionando && (
        <p className="compromissos-list-vazio hint">
          Nenhum compromisso cadastrado. Adicione cartão, carnê, financiamento, assinaturas etc.
        </p>
      )}

      {compromissos.map(c =>
        editandoId === c.id ? (
          <CompromissoForm
            key={c.id}
            inicial={c}
            onSave={data => editar(c.id, data)}
            onCancel={() => setEditandoId(null)}
          />
        ) : (
          <CompromissoCard
            key={c.id}
            compromisso={c}
            onEditar={(id) => {
              setAdicionando(false)
              setEditandoId(id)
            }}
            onExcluir={excluir}
          />
        ),
      )}

      {adicionando ? (
        <CompromissoForm
          onSave={adicionar}
          onCancel={() => setAdicionando(false)}
        />
      ) : (
        <button
          type="button"
          className="btn-secondary compromissos-list-add"
          onClick={() => {
            setEditandoId(null)
            setAdicionando(true)
          }}
        >
          + Adicionar compromisso
        </button>
      )}
    </div>
  )
}
