import React from 'react'
import { TipoCompra } from '../types'
import NumericInput from './NumericInput'

interface Props {
  itemNome: string
  onItemNomeChange: (v: string) => void
  itemValor: number
  onItemValorChange: (v: number) => void
  tipoCompra: TipoCompra
  onTipoCompraChange: (v: TipoCompra) => void
  manutencaoMensal: number
  onManutencaoMensalChange: (v: number) => void
  entradaValor: number
  onEntradaValorChange: (v: number) => void
  despesaSubstituida: number
  onDespesaSubstituida: (v: number) => void
}

const TIPOS: { value: TipoCompra; label: string; icon: string; hint: string }[] = [
  {
    value: 'lazer',
    label: 'Lazer / Consumo',
    icon: '🛍️',
    hint: 'Eletrônicos, roupas, viagem, hobby...',
  },
  {
    value: 'ferramenta',
    label: 'Ferramenta de Trabalho',
    icon: '🔧',
    hint: 'Notebook, equipamento, curso profissional...',
  },
  {
    value: 'passivoAltoValor',
    label: 'Passivo de Alto Valor',
    icon: '🏠',
    hint: 'Carro, moto, imóvel, equipamento caro com manutenção mensal...',
  },
]

export default function SonhoSection({
  itemNome,
  onItemNomeChange,
  itemValor,
  onItemValorChange,
  tipoCompra,
  onTipoCompraChange,
  manutencaoMensal,
  onManutencaoMensalChange,
  entradaValor,
  onEntradaValorChange,
  despesaSubstituida,
  onDespesaSubstituida,
}: Props) {
  const isPassivo = tipoCompra === 'passivoAltoValor'

  return (
    <section className="card" id="section-sonho">
      <h2>3. O que você quer comprar?</h2>

      <div className="field">
        <label htmlFor="item-nome">Nome do Item</label>
        <input
          type="text"
          id="item-nome"
          placeholder="Ex: Notebook, Celular, Carro, Apartamento..."
          value={itemNome}
          onChange={(e) => onItemNomeChange(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="item-valor">Valor Total</label>
        <div className="input-group">
          <span className="unit prefix">R$</span>
          <NumericInput id="item-valor" value={itemValor} onChange={onItemValorChange} placeholder="0,00" />
        </div>
      </div>

      <div className="field">
        <label>Tipo de compra</label>
        <div className="tipo-compra-grid">
          {TIPOS.map((t) => (
            <button
              key={t.value}
              type="button"
              className={`tipo-compra-btn${tipoCompra === t.value ? ' tipo-compra-btn--active' : ''}`}
              onClick={() => onTipoCompraChange(t.value)}
            >
              <span className="tipo-icon">{t.icon}</span>
              <span className="tipo-label">{t.label}</span>
              <span className="tipo-hint">{t.hint}</span>
            </button>
          ))}
        </div>
        {tipoCompra === 'ferramenta' && (
          <p className="hint" style={{ marginTop: 8 }}>
            O simulador considera o potencial de ROI e afrouxa as restrições para ferramentas.
          </p>
        )}
      </div>

      {isPassivo && (
        <div className="passivo-fields">
          <p className="passivo-intro">
            Passivos de alto valor têm custos mensais além da parcela. Preencha abaixo para uma análise mais realista.
          </p>

          <div className="field">
            <label htmlFor="manutencao-mensal">Custo mensal de manutenção</label>
            <div className="input-group">
              <span className="unit prefix">R$</span>
              <NumericInput
                id="manutencao-mensal"
                value={manutencaoMensal}
                onChange={onManutencaoMensalChange}
                placeholder="0,00"
              />
            </div>
            <p className="field-hint">
              IPVA/seguro prorrateado, combustível, condomínio, IPTU — quanto custa manter o bem por mês.
            </p>
          </div>

          <div className="field">
            <label htmlFor="entrada-valor">Entrada (se houver)</label>
            <div className="input-group">
              <span className="unit prefix">R$</span>
              <NumericInput
                id="entrada-valor"
                value={entradaValor}
                onChange={onEntradaValorChange}
                placeholder="0,00"
              />
            </div>
            <p className="field-hint">
              Valor pago na hora da compra. A simulação verifica se a entrada não destrói sua reserva de emergência.
            </p>
          </div>

          <div className="field">
            <label htmlFor="despesa-substituida">Despesa substituída por mês</label>
            <div className="input-group">
              <span className="unit prefix">R$</span>
              <NumericInput
                id="despesa-substituida"
                value={despesaSubstituida}
                onChange={onDespesaSubstituida}
                placeholder="0,00"
              />
            </div>
            <p className="field-hint">
              Ex: aluguel atual (se for comprar imóvel), Uber mensal (se for comprar carro). Esse valor alivia o impacto no orçamento.
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
