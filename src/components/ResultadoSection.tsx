import React from 'react'
import { Criterio } from '../types'
import {
  SimularResult,
  FluxoCaixaResult,
  StatusPatrimonioResult,
  CRITERIOS,
} from '../logic/index'
import GraficoPatrimonio from './GraficoPatrimonio'

interface Props {
  resultado: SimularResult
  criterio: Criterio
  fluxo: FluxoCaixaResult
  patrim: StatusPatrimonioResult
  roiOk: boolean
  ferramenta: boolean
  renda: number
  custo: number
  patrimonio: number
  itemValor: number
  itemNome: string
  parcelas: number
  onRefazer: () => void
}

const ICONES: Record<string, string> = {
  'Compra Livre': '✅',
  'Aprovado via Alavancagem': '🚀',
  Negado: '🚫',
  'Juntar Primeiro': '⏳',
  'Juntar com Calma': '💰',
}

const fmt = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// ─── Prazo Card ────────────────────────────────────────────────────────────
// Always shown. Tells the user exactly how long to save before they can buy.

function PrazoCard({
  itemValor,
  itemNome,
  sobraLazerMensal,
  patrimonio,
  vereditoTitulo,
}: {
  itemValor: number
  itemNome: string
  sobraLazerMensal: number
  patrimonio: number
  vereditoTitulo: string
}) {
  const jaTemCash = patrimonio >= itemValor
  const meses =
    sobraLazerMensal > 0 ? Math.ceil(itemValor / sobraLazerMensal) : null
  const progresso = itemValor > 0 ? Math.min(100, (patrimonio / itemValor) * 100) : 100

  // How long in human language
  const prazoLabel = (() => {
    if (jaTemCash) return 'Já tem o valor em caixa'
    if (meses === null) return 'Sem sobra de lazer'
    if (meses === 1) return '1 mês'
    if (meses < 12) return `${meses} meses`
    const anos = Math.floor(meses / 12)
    const resto = meses % 12
    return resto === 0
      ? `${anos} ${anos === 1 ? 'ano' : 'anos'}`
      : `${anos} ${anos === 1 ? 'ano' : 'anos'} e ${resto} ${resto === 1 ? 'mês' : 'meses'}`
  })()

  const variant = jaTemCash ? 'ok' : meses === null ? 'block' : meses === 1 ? 'ok' : 'neutral'

  return (
    <div className={`prazo-card prazo-${variant}`}>
      <div className="prazo-top">
        <div className="prazo-left">
          <div className="prazo-label">Tempo para juntar o valor</div>
          <div className="prazo-numero">{prazoLabel}</div>
          {!jaTemCash && meses !== null && (
            <div className="prazo-equacao">
              {fmt(sobraLazerMensal)}/mês × {meses} = {fmt(itemValor)}
            </div>
          )}
          {jaTemCash && (
            <div className="prazo-equacao">
              Seu patrimônio ({fmt(patrimonio)}) cobre o valor total
            </div>
          )}
        </div>
        <div className="prazo-meta">
          <div className="prazo-meta-valor">{fmt(itemValor)}</div>
          <div className="prazo-meta-label">{itemNome || 'item'}</div>
        </div>
      </div>

      <div className="prazo-progress-wrap">
        <div className="prazo-progress-bar">
          <div className="prazo-progress-fill" style={{ width: `${progresso}%` }} />
        </div>
        <div className="prazo-progress-labels">
          <span>Guardado: {fmt(Math.min(patrimonio, itemValor))}</span>
          {!jaTemCash && <span>Falta: {fmt(itemValor - patrimonio)}</span>}
          {jaTemCash && <span className="prazo-ok-label">Valor disponível ✓</span>}
        </div>
      </div>

      <p className="prazo-regra">
        Regra: mesmo parcelado, você precisa ter o valor total em caixa antes de se comprometer.
      </p>
    </div>
  )
}

// ─── Bloco por Critério ────────────────────────────────────────────────────

function BlocoCriterio({
  criterio,
  fluxo,
  patrim,
  roiOk,
  ferramenta,
  sobraLazerMensal,
}: {
  criterio: Criterio
  fluxo: FluxoCaixaResult
  patrim: StatusPatrimonioResult
  roiOk: boolean
  ferramenta: boolean
  sobraLazerMensal: number
}) {
  const c = CRITERIOS[criterio]

  if (criterio === 'fluxo') {
    const headerBadge =
      fluxo.delay === 1 ? (
        <span className="status-badge ok">Sustentável</span>
      ) : fluxo.delay === null ? (
        <span className="status-badge block">Sem sobra</span>
      ) : (
        <span className="status-badge warn">Requer planejamento</span>
      )

    const parcBadge = fluxo.parcelaCabe ? (
      <span className="status-badge ok">Parcela cabe</span>
    ) : (
      <span className="status-badge warn">Parcela excede o lazer</span>
    )

    return (
      <div className="criterio-resultado">
        <div className="criterio-resultado-header">
          💸 {c.titulo} {headerBadge}
        </div>
        <div className="criterio-resultado-body">
          <p>
            Balde de lazer: <strong>{fmt(sobraLazerMensal)}/mês</strong> — Parcela:{' '}
            <strong>{fmt(fluxo.parcelaValor)}</strong> {parcBadge}
          </p>
        </div>
      </div>
    )
  }

  if (criterio === 'patrimonio') {
    const statusLabel: Record<string, string> = {
      green: '🟢 GREEN',
      yellow: '🟡 YELLOW',
      red: '🔴 RED',
    }
    const alertaHtml = patrim.alertaDegracao ? (
      <div className="alerta-degradacao">
        ⚠️ Esta compra derruba sua reserva de {statusLabel[patrim.statusAtual]} para{' '}
        {statusLabel[patrim.statusAposCompra]}.
      </div>
    ) : null
    const pctBadge = patrim.dentro1pct ? (
      <span className="status-badge ok">Regra do 1% — risco zero</span>
    ) : null

    return (
      <div className="criterio-resultado">
        <div className="criterio-resultado-header">
          🏦 {c.titulo}{' '}
          <span className={`status-badge ${patrim.statusAtual}`}>
            {statusLabel[patrim.statusAtual]}
          </span>
        </div>
        <div className="criterio-resultado-body">
          <p>
            Status atual: <strong>{statusLabel[patrim.statusAtual]}</strong> → após compra:{' '}
            <strong>{statusLabel[patrim.statusAposCompra]}</strong> {pctBadge}
          </p>
          {alertaHtml}
        </div>
      </div>
    )
  }

  if (criterio === 'roi') {
    const badge = roiOk ? (
      <span className="status-badge ok">Alavancagem aprovada</span>
    ) : ferramenta ? (
      <span className="status-badge block">Reserva em RED — risco alto</span>
    ) : (
      <span className="status-badge warn">Marque como ferramenta para ativar</span>
    )
    const msg = roiOk
      ? `Ferramenta aprovada em estado ${patrim.statusAtual.toUpperCase()}. O retorno esperado justifica a aquisição.`
      : ferramenta
      ? 'Sua reserva está abaixo de 6 meses (RED). O critério de ROI não cobre esse nível de risco.'
      : 'Este critério só se aplica a itens marcados como ferramenta de trabalho.'

    return (
      <div className="criterio-resultado">
        <div className="criterio-resultado-header">
          🚀 {c.titulo} {badge}
        </div>
        <div className="criterio-resultado-body">
          <p>{msg}</p>
        </div>
      </div>
    )
  }

  return null
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function ResultadoSection({
  resultado,
  criterio,
  fluxo,
  patrim,
  roiOk,
  ferramenta,
  renda,
  custo,
  patrimonio,
  itemValor,
  itemNome,
  parcelas,
  onRefazer,
}: Props) {
  const { veredito, acoes, debug } = resultado
  const { reservaAlvo, sobraLazerMensal, statusReserva, lazerPct } = debug

  const pct = reservaAlvo > 0 ? Math.min((patrimonio / reservaAlvo) * 100, 100) : 100
  const custoVidaPct = renda > 0 ? ((custo / renda) * 100).toFixed(1) : '0.0'

  return (
    <section className="card" id="section-resultado">
      <h2>Resultado</h2>

      {/* Verdict */}
      <div id="veredito-principal" className={veredito.tipo}>
        <div className="veredito-icone">{ICONES[veredito.titulo] || '💡'}</div>
        <div className="veredito-titulo">{veredito.titulo}</div>
        <div className="veredito-subtitulo">{veredito.subtitulo || ''}</div>
      </div>

      {/* Savings timeline — always visible */}
      <PrazoCard
        itemValor={itemValor}
        itemNome={itemNome}
        sobraLazerMensal={sobraLazerMensal}
        patrimonio={patrimonio}
        vereditoTitulo={veredito.titulo}
      />

      {/* Strategy detail */}
      <div id="resultado-criterio">
        <BlocoCriterio
          criterio={criterio}
          fluxo={fluxo}
          patrim={patrim}
          roiOk={roiOk}
          ferramenta={ferramenta}
          sobraLazerMensal={sobraLazerMensal}
        />
      </div>

      {/* Growth chart */}
      {sobraLazerMensal > 0 && (
        <GraficoPatrimonio
          patrimonioInicial={patrimonio}
          sobraLazerMensal={sobraLazerMensal}
          itemValor={itemValor}
          itemNome={itemNome}
          parcelas={parcelas}
          reservaAlvo={reservaAlvo}
        />
      )}

      {/* Reserve thermometer */}
      <div className={`termometro-container status-${statusReserva}`}>
        <label>Termômetro da Reserva de Emergência</label>
        <div className="termometro-bar">
          <div id="termometro-fill" style={{ width: `${pct}%` }}></div>
        </div>
        <div className="termometro-labels">
          <span>R$ 0</span>
          <span>{fmt(patrimonio)}</span>
          <span>Meta: {fmt(reservaAlvo)}</span>
        </div>
      </div>

      {/* Action plan */}
      <div id="plano-acao" className="plano-acao">
        <h3>Plano de Ação</h3>
        {acoes.map((a, i) => (
          <p key={i}>{a}</p>
        ))}
      </div>

      {/* Calculation details */}
      <div id="detalhes-calculo" className="detalhes">
        <h3>Detalhes do Cálculo</h3>
        <div className="detalhe-grid">
          <div className="detalhe-item">
            <div className="detalhe-label">Item desejado</div>
            <div className="detalhe-valor">{itemNome || 'Item'}</div>
          </div>
          <div className="detalhe-item">
            <div className="detalhe-label">Valor do item</div>
            <div className="detalhe-valor">{fmt(itemValor)}</div>
          </div>
          <div className="detalhe-item">
            <div className="detalhe-label">Reserva alvo</div>
            <div className="detalhe-valor">{fmt(reservaAlvo)}</div>
          </div>
          <div className="detalhe-item">
            <div className="detalhe-label">Patrimônio atual</div>
            <div className="detalhe-valor">{fmt(patrimonio)}</div>
          </div>
          <div className="detalhe-item">
            <div className="detalhe-label">Custo de vida (% renda)</div>
            <div className="detalhe-valor">{custoVidaPct}%</div>
          </div>
          <div className="detalhe-item">
            <div className="detalhe-label">Balde de lazer/mês</div>
            <div className="detalhe-valor">
              {fmt(sobraLazerMensal)} ({lazerPct.toFixed(1)}%)
            </div>
          </div>
        </div>
      </div>

      <button className="btn-secondary" onClick={onRefazer}>
        Refazer Simulação
      </button>
    </section>
  )
}
