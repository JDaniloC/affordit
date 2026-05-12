import type { Compromisso } from '../types'
import { formatPrazoTermino } from '../utils/compromissos'

interface Props {
  compromisso: Compromisso
  onEditar: (id: number) => void
  onExcluir: (id: number) => void
}

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function CompromissoCard({ compromisso, onEditar, onExcluir }: Props) {
  const { id, nome, parcela, prazo, prazoTotal, taxa } = compromisso
  const temPrazo = typeof prazo === 'number'
  const temBarra = temPrazo && typeof prazoTotal === 'number' && prazoTotal >= prazo
  const pagas = temBarra ? prazoTotal - prazo : 0

  return (
    <div className="compromisso-card card">
      <div className="compromisso-card-header">
        <strong className="compromisso-nome">{nome}</strong>
        <span className="compromisso-parcela">{fmt(parcela)}/mês</span>
      </div>

      {temBarra && (
        <div className="compromisso-progresso">
          <progress
            role="progressbar"
            value={pagas}
            max={prazoTotal}
            aria-label={`${pagas} de ${prazoTotal} parcelas pagas`}
          />
          <span className="compromisso-progresso-label">
            {pagas}/{prazoTotal} parcelas pagas
          </span>
        </div>
      )}

      <div className="compromisso-card-meta">
        {temPrazo ? (
          <span className="compromisso-badge">
            Termina em {formatPrazoTermino(prazo)}
          </span>
        ) : (
          <span className="compromisso-badge compromisso-badge--recorrente" title="Recorrência sem fim">
            ∞ recorrente
          </span>
        )}
        {typeof taxa === 'number' && taxa > 0 && (
          <span className="compromisso-badge compromisso-badge--taxa">
            {taxa.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}% a.m.
          </span>
        )}
      </div>

      <div className="compromisso-card-actions">
        <button type="button" className="btn-link" onClick={() => onEditar(id)}>
          Editar
        </button>
        <button type="button" className="btn-link btn-link--danger" onClick={() => onExcluir(id)}>
          Excluir
        </button>
      </div>
    </div>
  )
}
