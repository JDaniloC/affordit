import type { EventoSobra } from '../utils/compromissos'
import { formatPrazoTermino } from '../utils/compromissos'

interface Props {
  eventos: EventoSobra[]
}

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

export default function EventosSobraResumo({ eventos }: Props) {
  if (eventos.length === 0) return null

  const ordenados = [...eventos].sort((a, b) => a.mes - b.mes)

  return (
    <div className="eventos-sobra">
      <p className="eventos-sobra-intro">
        Sua sobra mensal aumenta nos próximos meses:
      </p>
      <ul className="eventos-sobra-lista">
        {ordenados.map((e, idx) => (
          <li key={idx}>
            <strong>+{fmt(e.deltaSobra)}</strong> em {formatPrazoTermino(e.mes)}
            {e.nome && <> ({e.nome} termina)</>}
          </li>
        ))}
      </ul>
      <p className="eventos-sobra-rodape hint">
        Por isso algumas metas viram possíveis antes do esperado.
      </p>
    </div>
  )
}
