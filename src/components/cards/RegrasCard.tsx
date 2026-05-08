import React from 'react'
import RegraItem from './RegraItem'
import { fmt } from './_format'

interface Props {
  patrimonio: number
  reservaAlvo: number
  dentro1pct: boolean
  disponivel: number
  itemValor: number
  parcelas: number
  parcelaCabe: boolean
  parcelaValor: number
  sobraLazerMensal: number
}

export default function RegrasCard({
  patrimonio,
  reservaAlvo,
  dentro1pct,
  disponivel,
  itemValor,
  parcelas,
  parcelaCabe,
  parcelaValor,
  sobraLazerMensal,
}: Props) {
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
