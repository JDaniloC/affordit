import React from 'react'
import { Criterio } from '../types'
import {
  SimularResult,
  FluxoCaixaResult,
  StatusPatrimonioResult,
} from '../logic/index'

interface Props {
  resultado: SimularResult | null
  criterio: Criterio
  fluxo: FluxoCaixaResult
  patrim: StatusPatrimonioResult
  roiOk: boolean
  ferramenta: boolean
  sobraLazerMensal: number
  itemValor: number
  itemNome: string
  patrimonio: number
}

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

const ICONES: Record<string, string> = {
  'Compra Aprovada': '✅',
  'Aprovado com Ressalvas': '⚠️',
  Negado: '🚫',
}

const TIPO_CLASS: Record<string, string> = {
  aprovado: 'ok',
  negado: 'block',
}

function prazoLabel(itemValor: number, patrimonio: number, sobraLazerMensal: number): string {
  if (patrimonio >= itemValor) return 'Já tem o valor em caixa ✓'
  if (sobraLazerMensal <= 0) return 'Sem sobra de lazer para poupar'
  const meses = Math.ceil(itemValor / sobraLazerMensal)
  if (meses === 1) return '1 mês para juntar'
  if (meses < 12) return `${meses} meses para juntar`
  const anos = Math.floor(meses / 12)
  const resto = meses % 12
  const anosStr = `${anos} ${anos === 1 ? 'ano' : 'anos'}`
  return resto === 0
    ? `${anosStr} para juntar`
    : `${anosStr} e ${resto} ${resto === 1 ? 'mês' : 'meses'} para juntar`
}

export default function ResultadoLive({
  resultado,
  criterio,
  fluxo,
  patrim,
  roiOk,
  ferramenta,
  sobraLazerMensal,
  itemValor,
  itemNome,
  patrimonio,
}: Props) {
  if (!resultado) {
    return (
      <div className="chart-panel-inner resultado-live-empty">
        <div className="resultado-live-placeholder">
          <span className="resultado-live-placeholder-icon">📊</span>
          <p>Preencha renda e valor do item para ver o resultado aqui.</p>
        </div>
      </div>
    )
  }

  const { veredito } = resultado
  const tipoClass = TIPO_CLASS[veredito.tipo] ?? 'neutral'
  const progresso =
    itemValor > 0 ? Math.min(100, Math.round((patrimonio / itemValor) * 100)) : 100
  const prazo = prazoLabel(itemValor, patrimonio, sobraLazerMensal)
  const jaTemCash = patrimonio >= itemValor

  // Criterio summary line
  let criterioLine: React.ReactNode = null
  if (criterio === 'fluxo') {
    criterioLine = (
      <div className={`rl-badge ${fluxo.parcelaCabe ? 'ok' : 'warn'}`}>
        {fluxo.parcelaCabe
          ? `Parcela ${fmt(fluxo.parcelaValor)} cabe no lazer`
          : `Parcela ${fmt(fluxo.parcelaValor)} excede o lazer (${fmt(sobraLazerMensal)})`}
      </div>
    )
  } else if (criterio === 'patrimonio') {
    const cores: Record<string, string> = { green: 'ok', yellow: 'warn', red: 'block' }
    const labels: Record<string, string> = { green: '🟢 Verde', yellow: '🟡 Amarelo', red: '🔴 Vermelho' }
    criterioLine = (
      <>
        <div className={`rl-badge ${cores[patrim.statusAtual]}`}>
          Reserva: {labels[patrim.statusAtual]}
        </div>
        {patrim.alertaDegracao && (
          <div className="rl-badge warn">
            ⚠ Vai para {labels[patrim.statusAposCompra]} após a compra
          </div>
        )}
      </>
    )
  } else if (criterio === 'roi') {
    criterioLine = (
      <div className={`rl-badge ${roiOk ? 'ok' : ferramenta ? 'block' : 'warn'}`}>
        {roiOk
          ? 'ROI aprovado — ferramenta gera retorno'
          : ferramenta
          ? 'Reserva em RED — risco alto para ROI'
          : 'Marque como ferramenta para ativar ROI'}
      </div>
    )
  }

  return (
    <div className="chart-panel-inner">
      <div className="chart-title">Resultado ao vivo</div>

      {/* Verdict */}
      <div className={`rl-veredito rl-veredito-${tipoClass}`}>
        <span className="rl-icone">{ICONES[veredito.titulo] || '💡'}</span>
        <div>
          <div className="rl-titulo">{veredito.titulo}</div>
          {veredito.subtitulo && <div className="rl-subtitulo">{veredito.subtitulo}</div>}
        </div>
      </div>

      {/* Savings timeline */}
      <div className="rl-prazo-block">
        <div className="rl-prazo-label">{prazo}</div>
        {!jaTemCash && sobraLazerMensal > 0 && (
          <div className="rl-prazo-equacao">
            {fmt(sobraLazerMensal)}/mês × {Math.ceil(itemValor / sobraLazerMensal)} ={' '}
            {fmt(itemValor)}
          </div>
        )}
        <div className="rl-progress-bar">
          <div className="rl-progress-fill" style={{ width: `${progresso}%` }} />
        </div>
        <div className="rl-progress-labels">
          <span>Guardado: {fmt(Math.min(patrimonio, itemValor))}</span>
          <span>Meta: {fmt(itemValor)}</span>
        </div>
      </div>

      {/* Strategy line */}
      <div className="rl-criterio-block">{criterioLine}</div>

      <p className="rl-hint">
        Mude o número de parcelas ao lado — o resultado atualiza aqui.
      </p>
    </div>
  )
}
