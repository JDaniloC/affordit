import React from 'react'
import { RoutePath } from '../hooks/useHashRoute'
import type { StatusReserva, NivelSaude } from '../logic/index'

const logoUrl = import.meta.env.BASE_URL + 'logo.png'

interface PerfilChipsData {
  renda: number
  patrimonio: number
  sobraLazerMensal: number
  scorePontuacao: number
}

export interface AlertasHeader {
  statusReserva: StatusReserva
  statusSobra: 'ok' | 'atencao' | 'critico'
  nivelScore: NivelSaude
  reservaAlvo: number
}

interface Props {
  routeAtual: RoutePath
  onNavigate: (path: RoutePath) => void
  perfil: PerfilChipsData
  alertas: AlertasHeader
  mostrarHamburger?: boolean
  onToggleSidebar?: () => void
}

const TABS: Array<{ id: RoutePath; label: string }> = [
  { id: 'inicio', label: 'Início' },
  { id: 'perfil', label: 'Perfil' },
  { id: 'cenarios', label: 'Cenários' },
  { id: 'comparar', label: 'Comparar' },
  { id: 'metas', label: 'Metas' },
]

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

function classeReserva(s: StatusReserva): string {
  if (s === 'perigo') return 'chip-alerta-critico'
  if (s === 'atencao') return 'chip-alerta-atencao'
  return ''
}

function classeSobra(s: 'ok' | 'atencao' | 'critico'): string {
  if (s === 'critico') return 'chip-alerta-critico'
  if (s === 'atencao') return 'chip-alerta-atencao'
  return ''
}

function classeScore(n: NivelSaude): string {
  if (n === 'atencao') return 'chip-score-atencao'
  if (n === 'regular') return 'chip-score-regular'
  return 'chip-score-boa'
}

function tituloReserva(s: StatusReserva, patrimonio: number, alvo: number): string {
  if (alvo === 0) return 'Editar patrimônio no Perfil'
  if (s === 'perigo')
    return `Reserva crítica: ${fmt(patrimonio)} de ${fmt(alvo)} (abaixo de 50% do alvo).`
  if (s === 'atencao')
    return `Reserva incompleta: ${fmt(patrimonio)} de ${fmt(alvo)}.`
  return `Reserva completa: ${fmt(alvo)}.`
}

function tituloSobra(s: 'ok' | 'atencao' | 'critico'): string {
  if (s === 'critico') return 'Sobra insuficiente — sem margem para poupar ou imprevistos.'
  if (s === 'atencao') return 'Sobra apertada — tente liberar mais margem.'
  return 'Sobra de lazer mensal'
}

export default function Header({ routeAtual, onNavigate, perfil, alertas, mostrarHamburger, onToggleSidebar }: Props) {
  const classChipPatrim = classeReserva(alertas.statusReserva)
  const classChipSobra = classeSobra(alertas.statusSobra)
  const classChipScore = classeScore(alertas.nivelScore)

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
          className={`app-shell-chip ${classChipPatrim}`.trim()}
          onClick={() => onNavigate('perfil')}
          title={tituloReserva(alertas.statusReserva, perfil.patrimonio, alertas.reservaAlvo)}
          aria-label={tituloReserva(alertas.statusReserva, perfil.patrimonio, alertas.reservaAlvo)}
        >
          <span className="chip-label">Patrim.</span>
          <strong>{fmt(perfil.patrimonio)}</strong>
        </button>
        <button
          type="button"
          className={`app-shell-chip ${classChipSobra}`.trim()}
          onClick={() => onNavigate('perfil')}
          title={tituloSobra(alertas.statusSobra)}
          aria-label={tituloSobra(alertas.statusSobra)}
        >
          <span className="chip-label">Sobra</span>
          <strong>{fmt(perfil.sobraLazerMensal)}</strong>
        </button>
        <button
          type="button"
          className={`app-shell-chip chip-score ${classChipScore}`}
          onClick={() => onNavigate('perfil')}
          title={`Score de saúde financeira (${alertas.nivelScore})`}
        >
          <span className="chip-label">Score</span>
          <strong>{Math.round(perfil.scorePontuacao)}</strong>
        </button>
      </div>
    </header>
  )
}
