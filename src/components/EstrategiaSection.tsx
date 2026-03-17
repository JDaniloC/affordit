import React from 'react'
import NumericInput from './NumericInput'

interface Props {
  criterioAuto: 'fluxo' | 'patrimonio'
  patrimonio: number
  itemValor: number
  parcelas: number
  onParcelasChange: (v: number) => void
}

export default function EstrategiaSection({
  criterioAuto,
  patrimonio,
  itemValor,
  parcelas,
  onParcelasChange,
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
    </section>
  )
}
