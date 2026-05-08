import React from 'react'
import { fmt, fmtMeses } from './_format'

interface Props {
  patrimonio: number
  reservaAlvo: number
  sobraLazerMensal: number
  itemValor: number
  itemNome: string
}

export default function CaminhoCard({
  patrimonio,
  reservaAlvo,
  sobraLazerMensal,
  itemValor,
  itemNome,
}: Props) {
  const podeGuardar = sobraLazerMensal > 0

  const faltaReserva = Math.max(0, reservaAlvo - patrimonio)
  const fase1Meses = podeGuardar && faltaReserva > 0 ? Math.ceil(faltaReserva / sobraLazerMensal) : 0

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
