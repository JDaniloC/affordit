import React from 'react'
import { Criterio } from '../types'
import {
  SimularResult,
  FluxoCaixaResult,
  StatusPatrimonioResult,
  MetaFinanceiraResult,
  CRITERIOS,
} from '../logic/index'
import GraficoPatrimonio from './GraficoPatrimonio'
import GraficoMeta from './GraficoMeta'

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
  metaValor: number
  metaResult: MetaFinanceiraResult | null
  onRefazer: () => void
}

const fmt = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function fmtMeses(meses: number): string {
  if (meses === 0) return 'agora mesmo'
  if (meses < 12) return `${meses} ${meses === 1 ? 'mês' : 'meses'}`
  const anos = Math.floor(meses / 12)
  const resto = meses % 12
  const anosStr = `${anos} ${anos === 1 ? 'ano' : 'anos'}`
  return resto === 0 ? anosStr : `${anosStr} e ${resto} ${resto === 1 ? 'mês' : 'meses'}`
}

// ─── Savings Timeline Card ──────────────────────────────────────────────────

function PrazoCard({
  itemValor,
  itemNome,
  sobraLazerMensal,
  patrimonio,
}: {
  itemValor: number
  itemNome: string
  sobraLazerMensal: number
  patrimonio: number
}) {
  const jaTemCash = patrimonio >= itemValor
  const meses = sobraLazerMensal > 0 ? Math.ceil(itemValor / sobraLazerMensal) : null
  const progresso = itemValor > 0 ? Math.min(100, (patrimonio / itemValor) * 100) : 100
  const variant = jaTemCash ? 'ok' : meses === null ? 'block' : 'neutral'

  const prazoNumero = jaTemCash ? 'Você já tem!' : meses === null ? 'Sem sobra' : fmtMeses(meses)
  const ctxMsg = jaTemCash
    ? `Seu dinheiro guardado (${fmt(patrimonio)}) já cobre ${itemNome || 'o item'}.`
    : meses === null
    ? 'Não sobra dinheiro no mês para juntar. Revise seus gastos.'
    : `Guardando ${fmt(sobraLazerMensal)} por mês, você chega lá em ${fmtMeses(meses)}.`

  return (
    <div className={`prazo-card prazo-${variant}`}>
      <div className="prazo-top">
        <div className="prazo-left">
          <div className="prazo-label">Tempo para juntar</div>
          <div className="prazo-numero">{prazoNumero}</div>
          <div className="prazo-equacao">{ctxMsg}</div>
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
    </div>
  )
}

// ─── Rules checklist ────────────────────────────────────────────────────────

function RegraItem({
  ok,
  label,
  desc,
}: {
  ok: boolean
  label: string
  desc: string
}) {
  return (
    <div className={`regra-item ${ok ? 'regra-ok' : 'regra-falhou'}`}>
      <div className="regra-icone">{ok ? '✅' : '❌'}</div>
      <div className="regra-texto">
        <div className="regra-label">{label}</div>
        <div className="regra-desc">{desc}</div>
      </div>
    </div>
  )
}

function RegrasCard({
  patrimonio,
  reservaAlvo,
  dentro1pct,
  disponivel,
  itemValor,
  parcelas,
  parcelaCabe,
  parcelaValor,
  sobraLazerMensal,
}: {
  patrimonio: number
  reservaAlvo: number
  dentro1pct: boolean
  disponivel: number
  itemValor: number
  parcelas: number
  parcelaCabe: boolean
  parcelaValor: number
  sobraLazerMensal: number
}) {
  const temReserva = patrimonio >= reservaAlvo
  const temDinheiro = disponivel >= itemValor

  return (
    <div className="regras-card">
      <div className="regras-titulo">Como sua situação foi avaliada</div>
      <div className="regras-lista">
        <RegraItem
          ok={temReserva}
          label="Reserva de emergência"
          desc={
            temReserva
              ? `Você tem ${fmt(patrimonio)} guardados — sua reserva está coberta.`
              : `Você ainda precisa guardar ${fmt(reservaAlvo - patrimonio)} para montar sua reserva (${fmt(reservaAlvo)}).`
          }
        />
        {dentro1pct ? (
          <RegraItem
            ok={true}
            label="Regra do 1%"
            desc={`${itemValor <= 0 ? 'O item' : fmt(itemValor)} custa menos de 1% do seu patrimônio — compra de baixo impacto.`}
          />
        ) : (
          <RegraItem
            ok={temDinheiro}
            label="Dinheiro disponível além da reserva"
            desc={
              temDinheiro
                ? `Você tem ${fmt(disponivel)} disponíveis além da reserva — cobre o valor do item.`
                : disponivel > 0
                ? `Você tem ${fmt(disponivel)} disponíveis além da reserva, mas o item custa ${fmt(itemValor)}. Faltam ${fmt(itemValor - disponivel)}.`
                : `Todo o seu patrimônio ainda está abaixo da reserva ideal (${fmt(reservaAlvo)}).`
            }
          />
        )}
        {parcelas > 1 && !dentro1pct && (
          <RegraItem
            ok={parcelaCabe}
            label="Parcela cabe no orçamento mensal"
            desc={
              parcelaCabe
                ? `A parcela de ${fmt(parcelaValor)} cabe dentro do que sobra por mês (${fmt(sobraLazerMensal)}).`
                : `A parcela de ${fmt(parcelaValor)} é maior do que sobra no mês (${fmt(sobraLazerMensal)}). Risco de apertar o orçamento.`
            }
          />
        )}
      </div>
    </div>
  )
}

// ─── Path to purchase (negado only) ─────────────────────────────────────────

function CaminhoCard({
  patrimonio,
  reservaAlvo,
  sobraLazerMensal,
  itemValor,
  itemNome,
}: {
  patrimonio: number
  reservaAlvo: number
  sobraLazerMensal: number
  itemValor: number
  itemNome: string
}) {
  const podeGuardar = sobraLazerMensal > 0

  // Phase 1: fill the reserve (if needed)
  const faltaReserva = Math.max(0, reservaAlvo - patrimonio)
  const fase1Meses = podeGuardar && faltaReserva > 0 ? Math.ceil(faltaReserva / sobraLazerMensal) : 0

  // Phase 2: save for the item beyond the reserve
  const disponivel = Math.max(0, patrimonio - reservaAlvo)
  const faltaItem = Math.max(0, itemValor - disponivel)
  const fase2Meses = podeGuardar && faltaItem > 0 ? Math.ceil(faltaItem / sobraLazerMensal) : 0

  const totalMeses = fase1Meses + fase2Meses
  const temDuasFases = fase1Meses > 0

  if (!podeGuardar) {
    return (
      <div className="caminho-card">
        <div className="caminho-titulo">🗓 Quando posso comprar?</div>
        <p className="caminho-msg">
          No momento, não sobra dinheiro para guardar. Para comprar {itemNome || 'o item'}, você
          precisa primeiro reduzir seus gastos mensais e criar uma margem de poupança.
        </p>
      </div>
    )
  }

  return (
    <div className="caminho-card">
      <div className="caminho-titulo">🗓 Quando você pode comprar?</div>

      {temDuasFases && (
        <div className="caminho-fase">
          <div className="caminho-fase-num">1</div>
          <div className="caminho-fase-corpo">
            <div className="caminho-fase-label">Montar a reserva de emergência</div>
            <div className="caminho-fase-desc">
              Faltam {fmt(faltaReserva)} para atingir {fmt(reservaAlvo)}
            </div>
            <div className="caminho-fase-prazo">⏱ {fmtMeses(fase1Meses)} guardando {fmt(sobraLazerMensal)}/mês</div>
          </div>
        </div>
      )}

      {fase2Meses > 0 && (
        <div className="caminho-fase">
          <div className="caminho-fase-num">{temDuasFases ? '2' : '1'}</div>
          <div className="caminho-fase-corpo">
            <div className="caminho-fase-label">Juntar para {itemNome || 'o item'}</div>
            <div className="caminho-fase-desc">
              {disponivel > 0 && !temDuasFases
                ? `Você já tem ${fmt(disponivel)} disponíveis. Faltam ${fmt(faltaItem)}.`
                : `Guardar ${fmt(itemValor)} além da reserva`}
            </div>
            <div className="caminho-fase-prazo">⏱ {fmtMeses(fase2Meses)} guardando {fmt(sobraLazerMensal)}/mês</div>
          </div>
        </div>
      )}

      <div className="caminho-total">
        <span className="caminho-total-label">Você pode comprar em</span>
        <span className="caminho-total-prazo">{fmtMeses(totalMeses)}</span>
        <span className="caminho-total-label">guardando {fmt(sobraLazerMensal)}/mês</span>
      </div>
    </div>
  )
}

// ─── Verdict config ────────────────────────────────────────────────────────

const VERDICT_MAP: Record<string, { titulo: string; sub: string }> = {
  aprovado: {
    titulo: 'Pode comprar! 💪',
    sub: 'Você seguiu as regras: tem reserva de emergência e dinheiro disponível.',
  },
  juntar: {
    titulo: 'Pode, mas com cuidado ⚠️',
    sub: 'É possível, mas avalie o impacto no orçamento antes de decidir.',
  },
  negado: {
    titulo: 'Ainda não é a hora 🚫',
    sub: 'Mas com disciplina, você chega lá. Veja o plano abaixo.',
  },
}

const ICONE_MAP: Record<string, string> = {
  aprovado: '✅',
  juntar: '⚠️',
  negado: '🚫',
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
  metaValor,
  metaResult,
  onRefazer,
}: Props) {
  const { veredito, debug } = resultado
  const { reservaAlvo, sobraLazerMensal, disponivel, dentro1pct, parcelaValor, parcelaCabe } = debug

  const veredictoUI = VERDICT_MAP[veredito.tipo] ?? { titulo: veredito.titulo, sub: veredito.subtitulo ?? '' }
  const icone = ICONE_MAP[veredito.tipo] ?? '💡'
  const isNegado = veredito.tipo === 'negado'
  const isJuntar = veredito.tipo === 'juntar'

  // Plain-language next step (only for aprovado/juntar — negado uses CaminhoCard)
  const proximoPasso = (() => {
    if (veredito.tipo === 'aprovado') {
      if (patrimonio >= itemValor)
        return `Você já tem o dinheiro disponível. Pode comprar ${itemNome || 'o item'} agora, sem comprometer sua reserva. Parabéns pela disciplina! 🎉`
      if (sobraLazerMensal > 0) {
        const meses = Math.ceil(itemValor / sobraLazerMensal)
        return `Guarde ${fmt(sobraLazerMensal)} por mês. Em ${fmtMeses(meses)} você terá o suficiente para comprar ${itemNome || 'o item'} sem criar dívidas.`
      }
    }
    if (veredito.tipo === 'juntar') {
      return `Você pode comprar parcelado, mas fique atento: a parcela de ${fmt(fluxo.parcelaValor)} precisa caber no orçamento todo mês. Não use a reserva de emergência para isso — ela é para imprevistos, não para compras.`
    }
    return null
  })()

  return (
    <section className="card" id="section-resultado">
      {/* ── Verdict ── */}
      <div id="veredito-principal" className={veredito.tipo}>
        <div className="veredito-icone">{icone}</div>
        <div className="veredito-titulo">{veredictoUI.titulo}</div>
        <div className="veredito-subtitulo">{veredictoUI.sub}</div>
      </div>

      {/* ── Rules checklist ── */}
      <RegrasCard
        patrimonio={patrimonio}
        reservaAlvo={reservaAlvo}
        dentro1pct={dentro1pct}
        disponivel={disponivel}
        itemValor={itemValor}
        parcelas={parcelas}
        parcelaCabe={parcelaCabe}
        parcelaValor={parcelaValor}
        sobraLazerMensal={sobraLazerMensal}
      />

      {/* ── Savings timeline (only for aprovado/juntar) ── */}
      {!isNegado && (
        <PrazoCard
          itemValor={itemValor}
          itemNome={itemNome}
          sobraLazerMensal={sobraLazerMensal}
          patrimonio={patrimonio}
        />
      )}

      {/* ── Path roadmap (only for negado) ── */}
      {isNegado && (
        <CaminhoCard
          patrimonio={patrimonio}
          reservaAlvo={reservaAlvo}
          sobraLazerMensal={sobraLazerMensal}
          itemValor={itemValor}
          itemNome={itemNome}
        />
      )}

      {/* ── Growth chart ── */}
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

      {/* ── Goal impact chart ── */}
      {metaValor > 0 &&
        metaResult &&
        !metaResult.metaJaAtingida &&
        metaResult.mesesSemCompra !== null && (
          <GraficoMeta
            patrimonio={patrimonio}
            sobraLazerMensal={sobraLazerMensal}
            itemValor={itemValor}
            itemNome={itemNome}
            parcelas={parcelas}
            metaValor={metaValor}
            metaResult={metaResult}
          />
        )}

      {/* ── Next step (aprovado/juntar only) ── */}
      {proximoPasso && (
        <div className="proximo-passo-box">
          <div className="proximo-passo-label">👉 O que fazer agora</div>
          <div className="proximo-passo-texto">{proximoPasso}</div>
        </div>
      )}

      <button
        className="btn-secondary"
        onClick={onRefazer}
        style={{ marginTop: 8, width: '100%' }}
      >
        Refazer Simulação
      </button>
    </section>
  )
}
