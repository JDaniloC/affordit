// src/components/SidebarCenarios.tsx
import React, { useState } from 'react'
import { Cenario, AppState } from '../types'
import { calcularResultadoCenario } from '../logic/selectors'
import VereditoBadge from './VereditoBadge'

interface Props {
  perfil: AppState['perfil']
  cenarios: Cenario[]
  cenarioAtivoId: string | null
  onSelecionar: (id: string) => void
  onCriarVazio: () => void
  onDuplicar: () => void
  onExcluir: (id: string) => void
  aberta?: boolean
  onFechar?: () => void
}

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

export default function SidebarCenarios(props: Props) {
  const [menuAberto, setMenuAberto] = useState(false)
  const { aberta = false, onFechar } = props

  const ordenados = [...props.cenarios].sort((a, b) => b.atualizadoEm - a.atualizadoEm)

  return (
    <>
      {aberta && (
        <div className="sidebar-overlay" onClick={onFechar} aria-hidden="true" />
      )}
      <aside className={`sidebar-cenarios${aberta ? ' is-open' : ''}`} aria-label="Lista de cenários">
      <div className="sidebar-header">
        <span className="sidebar-label">Meus cenários</span>
      </div>

      <ul className="sidebar-list">
        {ordenados.map(c => {
          const r = calcularResultadoCenario(props.perfil, c)
          const isAtivo = c.id === props.cenarioAtivoId
          return (
            <li key={c.id} className={`sidebar-item ${isAtivo ? 'is-active' : ''}`}>
              <button
                type="button"
                className="sidebar-item-button"
                onClick={() => { props.onSelecionar(c.id); onFechar?.() }}
                aria-current={isAtivo ? 'true' : undefined}
              >
                <span className="sidebar-item-name">{c.nome}</span>
                <span className="sidebar-item-meta">
                  {fmt(c.itemValor)} · {c.parcelas}x
                </span>
              </button>
              <VereditoBadge veredito={r.veredito.veredito} size="sm" />
              <button
                type="button"
                className="sidebar-item-delete"
                onClick={(e) => {
                  e.stopPropagation()
                  if (window.confirm(`Excluir "${c.nome}"?`)) props.onExcluir(c.id)
                }}
                aria-label={`Excluir cenário ${c.nome}`}
                title="Excluir"
              >
                ×
              </button>
            </li>
          )
        })}
      </ul>

      <div className="sidebar-novo">
        <button
          type="button"
          className="sidebar-novo-button"
          onClick={() => setMenuAberto(v => !v)}
          aria-haspopup="menu"
          aria-expanded={menuAberto}
        >
          + Novo cenário
        </button>
        {menuAberto && (
          <div className="sidebar-novo-menu" role="menu">
            <button
              type="button"
              role="menuitem"
              onClick={() => { setMenuAberto(false); props.onCriarVazio() }}
            >
              Cenário vazio
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => { setMenuAberto(false); props.onDuplicar() }}
              disabled={!props.cenarioAtivoId}
            >
              Duplicar atual
            </button>
          </div>
        )}
      </div>
    </aside>
    </>
  )
}
