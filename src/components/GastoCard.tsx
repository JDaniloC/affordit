import type { Gasto } from '../types'
import { valorDoGasto } from '../utils/gastos'

interface Props {
  gasto: Gasto
  renda: number
  onEditar: (id: number) => void
  onExcluir: (id: number) => void
}

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function GastoCard({ gasto, renda, onEditar, onExcluir }: Props) {
  const valor = valorDoGasto(gasto, renda)

  return (
    <div className="gasto-card card">
      <div className="gasto-card-header">
        <strong className="gasto-nome">{gasto.nome}</strong>
        <span className="gasto-valor">{fmt(valor)}/mês</span>
      </div>

      <div className="gasto-card-meta">
        {gasto.tipo === 'valor' ? (
          <span className="gasto-badge">R$ fixo</span>
        ) : (
          <span className="gasto-badge gasto-badge--pct">
            {gasto.pct.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}% da renda
          </span>
        )}
      </div>

      <div className="gasto-card-actions">
        <button type="button" className="gasto-btn" onClick={() => onEditar(gasto.id)}>
          Editar
        </button>
        <button type="button" className="gasto-btn gasto-btn--danger" onClick={() => onExcluir(gasto.id)}>
          Excluir
        </button>
      </div>
    </div>
  )
}
