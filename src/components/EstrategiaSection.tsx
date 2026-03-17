import React from 'react'
import NumericInput from './NumericInput'
import { CustoFinanciamentoResult } from '../logic/index'

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface Props {
  criterioAuto: 'fluxo' | 'patrimonio'
  patrimonio: number
  itemValor: number
  parcelas: number
  onParcelasChange: (v: number) => void
  taxaJuros: number
  onTaxaJurosChange: (v: number) => void
  custoFinanciamento: CustoFinanciamentoResult | null
}

export default function EstrategiaSection({
  criterioAuto,
  patrimonio,
  itemValor,
  parcelas,
  onParcelasChange,
  taxaJuros,
  onTaxaJurosChange,
  custoFinanciamento,
}: Props) {
  const pctDoPatrimonio =
    patrimonio > 0 ? ((itemValor / patrimonio) * 100).toFixed(1) : null

  return (
    <section className="card" id="section-estrategia">
      <h2>4. Estratégia de Análise</h2>
      <p className="section-desc">
        A estratégia é determinada automaticamente com base no seu patrimônio e no valor do item.
      </p>

      <div id="criterios-grid">
        {criterioAuto === 'patrimonio' ? (
          <div className="criterio-card criterio-card-auto">
            <div className="criterio-inner">
              <div className="criterio-header">
                <span className="criterio-icon">🏦</span>
                <div>
                  <div className="criterio-titulo">Patrimônio — Regra do 1%</div>
                  <div className="criterio-subtitulo">Compra considerada risco zero</div>
                </div>
                <span className="criterio-check criterio-check-auto">✓</span>
              </div>
              <p className="criterio-desc">
                O item representa{' '}
                <strong>{pctDoPatrimonio ? `${pctDoPatrimonio}%` : 'menos de 1%'}</strong> do seu
                patrimônio — dentro da <strong>Regra do 1%</strong>. Essa compra não compromete
                sua segurança financeira.
              </p>
            </div>
          </div>
        ) : (
          <div className="criterio-card criterio-card-auto">
            <div className="criterio-inner">
              <div className="criterio-header">
                <span className="criterio-icon">💸</span>
                <div>
                  <div className="criterio-titulo">Fluxo de Caixa</div>
                  <div className="criterio-subtitulo">O item cabe no seu salário?</div>
                </div>
                <span className="criterio-check criterio-check-auto">✓</span>
              </div>
              <p className="criterio-desc">
                {pctDoPatrimonio
                  ? `O item representa ${pctDoPatrimonio}% do patrimônio (acima de 1%). `
                  : patrimonio === 0
                  ? 'Você ainda não tem patrimônio acumulado. '
                  : ''}
                A análise segue o <strong>fluxo de caixa</strong>: o valor deve caber no seu
                balde de lazer mensal.
              </p>
            </div>
          </div>
        )}
      </div>

      {criterioAuto === 'fluxo' && (
        <div id="parcelas-field" className="field" style={{ marginTop: '20px' }}>
          <label htmlFor="parcelas">
            Número de parcelas <span className="hint-inline">(para análise de fluxo)</span>
          </label>
          <div className="input-group">
            <NumericInput
              id="parcelas"
              value={parcelas}
              onChange={(v) => onParcelasChange(Math.max(1, Math.round(v)))}
              min={1}
              step={1}
              placeholder="1"
              defaultValue={1}
            />
            <span className="unit">x</span>
          </div>
        </div>
      )}

      {criterioAuto === 'fluxo' && parcelas > 1 && (
        <div className="field" style={{ marginTop: '12px' }}>
          <label htmlFor="taxa-juros">
            Taxa de juros mensal <span className="hint-inline">(opcional — 0 = sem juros)</span>
          </label>
          <div className="input-group">
            <NumericInput
              id="taxa-juros"
              value={taxaJuros}
              onChange={onTaxaJurosChange}
              min={0}
              step={0.1}
              placeholder="0"
            />
            <span className="unit">% a.m.</span>
          </div>
          <p className="field-hint">
            Taxa do financiamento ou cartão. Com juros, o item custa mais do que o preço de etiqueta.
          </p>

          {custoFinanciamento && custoFinanciamento.totalJuros > 0 && (
            <div className="juros-preview">
              <div className="juros-preview-linha">
                <span>Parcela com juros:</span>
                <strong>{fmt(custoFinanciamento.parcelaValor)}/mês</strong>
              </div>
              <div className="juros-preview-linha">
                <span>Total pago:</span>
                <strong>{fmt(custoFinanciamento.totalPago)}</strong>
              </div>
              <div className="juros-preview-linha juros-preview-destaque">
                <span>Juros totais:</span>
                <strong>+{fmt(custoFinanciamento.totalJuros)}</strong>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
