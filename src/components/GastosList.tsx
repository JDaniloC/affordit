import { useState } from 'react'
import type { Gasto } from '../types'
import { valorDoGasto } from '../utils/gastos'
import GastoCard from './GastoCard'
import GastoForm from './GastoForm'

type GastoData =
  | { nome: string; tipo: 'valor'; valor: number }
  | { nome: string; tipo: 'pct'; pct: number }

interface Props {
  gastos: Gasto[]
  renda: number
  onChange: (next: Gasto[]) => void
}

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

export default function GastosList({ gastos, renda, onChange }: Props) {
  const [adicionando, setAdicionando] = useState(false)
  const [editandoId, setEditandoId] = useState<number | null>(null)

  const total = gastos.reduce((s, g) => s + valorDoGasto(g, renda), 0)
  const pctRenda = renda > 0 ? Math.round((total / renda) * 100) : 0

  function nextId(): number {
    return gastos.reduce((m, g) => Math.max(m, g.id), 0) + 1
  }

  function adicionar(data: GastoData) {
    const novoGasto: Gasto =
      data.tipo === 'valor'
        ? { id: nextId(), nome: data.nome, tipo: 'valor', valor: data.valor }
        : { id: nextId(), nome: data.nome, tipo: 'pct', pct: data.pct }
    onChange([...gastos, novoGasto])
    setAdicionando(false)
  }

  function editar(id: number, data: GastoData) {
    const gastoAtualizado: Gasto =
      data.tipo === 'valor'
        ? { id, nome: data.nome, tipo: 'valor', valor: data.valor }
        : { id, nome: data.nome, tipo: 'pct', pct: data.pct }
    onChange(gastos.map(g => (g.id === id ? gastoAtualizado : g)))
    setEditandoId(null)
  }

  function excluir(id: number) {
    onChange(gastos.filter(g => g.id !== id))
  }

  return (
    <div className="gastos-list">
      <div className="gastos-list-header">
        <h3>Gastos mensais</h3>
        {gastos.length > 0 && (
          <p className="gastos-list-totais">
            <strong>{fmt(total)}/mês</strong>
            {renda > 0 && <> • {pctRenda}% da renda comprometida</>}
          </p>
        )}
      </div>

      {gastos.length === 0 && !adicionando && (
        <p className="gastos-list-vazio hint">
          Nenhum gasto cadastrado. Liste aluguel, mercado, transporte, plano de saúde etc.
        </p>
      )}

      {gastos.map(g =>
        editandoId === g.id ? (
          <GastoForm
            key={g.id}
            inicial={g}
            onSave={data => editar(g.id, data)}
            onCancel={() => setEditandoId(null)}
          />
        ) : (
          <GastoCard
            key={g.id}
            gasto={g}
            renda={renda}
            onEditar={(id) => {
              setAdicionando(false)
              setEditandoId(id)
            }}
            onExcluir={excluir}
          />
        ),
      )}

      {adicionando ? (
        <GastoForm
          onSave={adicionar}
          onCancel={() => setAdicionando(false)}
        />
      ) : (
        <button
          type="button"
          className="btn-secondary gastos-list-add"
          onClick={() => {
            setEditandoId(null)
            setAdicionando(true)
          }}
        >
          + Adicionar gasto
        </button>
      )}
    </div>
  )
}
