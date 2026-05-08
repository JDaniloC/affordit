import React from 'react'
import type { Veredito, RiscoPatrimonio } from '../../logic/index'
import ChipsDeRisco, { formatChipRisco } from '../ChipsDeRisco'

interface Props {
  veredito: Veredito
  risco: RiscoPatrimonio
}

const VERDICT_MAP: Record<string, { titulo: string; sub: string }> = {
  aprovado: {
    titulo: 'Pode comprar 💪',
    sub: 'Você seguiu as regras: tem reserva de emergência e dinheiro disponível.',
  },
  juntar: {
    titulo: 'Ainda não ⚠️',
    sub: 'É possível mais à frente — antes, destrave os pontos abaixo.',
  },
  negado: {
    titulo: 'Não comprar 🚫',
    sub: 'Mas com disciplina, você chega lá. Veja o plano abaixo.',
  },
}

const ICONE_MAP: Record<string, string> = {
  aprovado: '✅',
  juntar: '⚠️',
  negado: '🚫',
}

export default function VereditoCard({ veredito, risco }: Props) {
  const baseUI = VERDICT_MAP[veredito.tipo] ?? { titulo: veredito.titulo, sub: veredito.subtitulo ?? '' }
  const chipMaisSevero = (() => {
    if (risco.motivos.length === 0) return null
    const formatted = risco.motivos.map(formatChipRisco)
    const ordem: Record<string, number> = { vermelho: 0, laranja: 1, amarelo: 2 }
    return formatted.sort((a, b) => ordem[a.severidade] - ordem[b.severidade])[0]
  })()
  const veredictoUI =
    (veredito.tipo === 'juntar' || veredito.tipo === 'negado') && chipMaisSevero
      ? { titulo: baseUI.titulo, sub: chipMaisSevero.texto }
      : baseUI
  const icone = ICONE_MAP[veredito.tipo] ?? '💡'

  return (
    <div id="veredito-principal" className={veredito.tipo}>
      <div className="veredito-icone">{icone}</div>
      <div className="veredito-titulo">{veredictoUI.titulo}</div>
      <div className="veredito-subtitulo">{veredictoUI.sub}</div>
      <ChipsDeRisco risco={risco} />
    </div>
  )
}
