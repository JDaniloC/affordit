import React from 'react'
import type { Meta } from '../../types'
import {
  calcCronogramaMetas,
  calcMesItemAposFila,
  formatMesAbreviado,
  formatPrazoBR,
} from '../../logic/index'

interface Props {
  metas: Meta[]
  itemNome: string
  itemValor: number
  patrimonio: number
  reservaAlvo: number
  sobraLazerMensal: number
  onAdicionarItemAFila?: () => void
  onAbrirPlanejador?: () => void
}

export default function FilaMetasCard({
  metas,
  itemNome,
  itemValor,
  patrimonio,
  reservaAlvo,
  sobraLazerMensal,
  onAdicionarItemAFila,
  onAbrirPlanejador,
}: Props) {
  if (metas.length === 0) return null

  const headStart = Math.max(0, patrimonio - reservaAlvo)
  const cronogramaSemItem = calcCronogramaMetas(metas, sobraLazerMensal, headStart)
  const itemVirtual: Meta = { id: -999, nome: itemNome, valor: itemValor }
  const cronogramaComItemNoTopo = calcCronogramaMetas(
    [itemVirtual, ...metas],
    sobraLazerMensal,
    headStart,
  )
  const itemAposFila = calcMesItemAposFila(itemValor, metas, sobraLazerMensal, headStart)

  const atrasos = metas.map((m) => {
    const antes = cronogramaSemItem.agendadas.find((a) => a.meta.id === m.id)
    const depois = cronogramaComItemNoTopo.agendadas.find((a) => a.meta.id === m.id)
    if (!antes && !depois) return { meta: m, atraso: null as number | null, virouInatingivel: true }
    if (!antes) return { meta: m, atraso: null, virouInatingivel: false }
    if (!depois) return { meta: m, atraso: null, virouInatingivel: true }
    return {
      meta: m,
      atraso: depois.mesQueCompleta - antes.mesQueCompleta,
      virouInatingivel: false,
    }
  })

  const itemJaNaFila = metas.some((m) => m.nome === itemNome && m.valor === itemValor)

  return (
    <section className="card card-fila-resultado">
      <h3>📋 Considerando suas metas em fila</h3>
      <p className="card-fila-intro">
        Você tem <strong>{metas.length}</strong> meta{metas.length === 1 ? '' : 's'} cadastrada
        {metas.length === 1 ? '' : 's'} antes desta compra.
      </p>
      <p className="card-fila-aviso-otimista">
        ⚡ <strong>Estimativa otimista:</strong> esta projeção assume que toda a sobra mensal
        vai para a próxima meta da fila (FIFO), sem aplicar limites de saúde como
        Regra do 1%, atraso máximo da meta de patrimônio ou piso do plano de crescimento.
        Para a projeção realista com essas regras, abra o <strong>Planejador</strong>.
      </p>

      <div className="card-fila-hipotese">
        <h4>Hipótese A — Comprar agora (pular a fila)</h4>
        <p>"{itemNome || 'Item'}" pode ser comprado hoje, mas atrasa:</p>
        <ul className="lista-atrasos">
          {atrasos.map(({ meta, atraso, virouInatingivel }) => (
            <li key={meta.id}>
              <strong>{meta.nome}</strong>:{' '}
              {virouInatingivel
                ? 'fica inatingível'
                : atraso === null || atraso === 0
                  ? 'sem impacto'
                  : `+${formatPrazoBR(atraso)}`}
            </li>
          ))}
        </ul>
      </div>

      {!itemJaNaFila && (
        <div className="card-fila-hipotese">
          <h4>Hipótese B — Esperar a vez na fila</h4>
          {itemAposFila.mes !== null ? (
            <p>
              Esperando suas {metas.length} meta{metas.length === 1 ? '' : 's'} atua
              {metas.length === 1 ? 'l' : 'is'} terminare{metas.length === 1 ? 'm' : 'm'}, você
              poderá comprar "{itemNome || 'Item'}" em{' '}
              <strong>{formatMesAbreviado(itemAposFila.mes)}</strong> (cerca de{' '}
              {formatPrazoBR(itemAposFila.mes)}).
            </p>
          ) : (
            <p>
              Com sua sobra atual, este item somado à fila ficaria inatingível dentro do horizonte
              de planejamento.
            </p>
          )}
        </div>
      )}

      <div className="card-fila-acoes">
        {!itemJaNaFila && onAdicionarItemAFila && (
          <button type="button" className="btn-secondary" onClick={onAdicionarItemAFila}>
            + Adicionar à fila
          </button>
        )}
        {onAbrirPlanejador && (
          <button type="button" className="btn-secondary" onClick={onAbrirPlanejador}>
            📋 Ver minhas metas
          </button>
        )}
      </div>
    </section>
  )
}
