import React from 'react'
import { RoutePath } from '../hooks/useHashRoute'

const logoUrl = import.meta.env.BASE_URL + 'logo.png'

interface PerfilChipsData {
  renda: number
  patrimonio: number
  sobraLazerMensal: number
  scorePontuacao: number
}

interface Props {
  routeAtual: RoutePath
  onNavigate: (path: RoutePath) => void
  perfil: PerfilChipsData
  mostrarHamburger?: boolean
  onToggleSidebar?: () => void
}

const TABS: Array<{ id: RoutePath; label: string }> = [
  { id: 'perfil', label: 'Perfil' },
  { id: 'cenarios', label: 'Cenários' },
  { id: 'comparar', label: 'Comparar' },
  { id: 'metas', label: 'Metas' },
]

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

export default function Header({ routeAtual, onNavigate, perfil, mostrarHamburger, onToggleSidebar }: Props) {
  return (
    <header className="app-shell-header">
      {mostrarHamburger && onToggleSidebar && (
        <button
          type="button"
          className="app-shell-hamburger"
          onClick={onToggleSidebar}
          aria-label="Abrir menu de cenários"
        >
          ☰
        </button>
      )}
      <button
        type="button"
        className="app-shell-brand"
        onClick={() => onNavigate('perfil')}
        aria-label="Ir para Perfil"
      >
        <img src={logoUrl} alt="AffordIT" className="app-shell-logo" />
      </button>

      <nav className="app-shell-tabs" aria-label="Navegação principal">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            className={`app-shell-tab ${routeAtual === t.id ? 'is-active' : ''}`}
            onClick={() => onNavigate(t.id)}
            aria-current={routeAtual === t.id ? 'page' : undefined}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="app-shell-chips" aria-label="Resumo do perfil">
        <button
          type="button"
          className="app-shell-chip"
          onClick={() => onNavigate('perfil')}
          title="Editar renda no Perfil"
        >
          <span className="chip-label">Renda</span>
          <strong>{fmt(perfil.renda)}</strong>
        </button>
        <button
          type="button"
          className="app-shell-chip"
          onClick={() => onNavigate('perfil')}
          title="Editar patrimônio no Perfil"
        >
          <span className="chip-label">Patrim.</span>
          <strong>{fmt(perfil.patrimonio)}</strong>
        </button>
        <button
          type="button"
          className="app-shell-chip"
          onClick={() => onNavigate('perfil')}
          title="Sobra de lazer mensal"
        >
          <span className="chip-label">Sobra</span>
          <strong>{fmt(perfil.sobraLazerMensal)}</strong>
        </button>
        <button
          type="button"
          className="app-shell-chip chip-score"
          onClick={() => onNavigate('perfil')}
          title="Score de saúde financeira"
        >
          <span className="chip-label">Score</span>
          <strong>{Math.round(perfil.scorePontuacao)}</strong>
        </button>
      </div>
    </header>
  )
}
