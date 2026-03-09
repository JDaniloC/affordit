import React from 'react'
import { Criterio } from '../types'
import NumericInput from './NumericInput'

interface Props {
  criterio: Criterio
  onCriterioChange: (v: Criterio) => void
  parcelas: number
  onParcelasChange: (v: number) => void
}

export default function EstrategiaSection({
  criterio,
  onCriterioChange,
  parcelas,
  onParcelasChange,
}: Props) {
  return (
    <section className="card" id="section-estrategia">
      <h2>4. Estratégia de Análise</h2>
      <p className="section-desc">
        Escolha como o simulador vai avaliar sua compra. Cada estratégia prioriza um aspecto
        diferente da sua saúde financeira.
      </p>

      <div id="criterios-grid">
        <label className="criterio-card" htmlFor="criterio-fluxo">
          <input
            type="radio"
            name="criterio"
            id="criterio-fluxo"
            value="fluxo"
            checked={criterio === 'fluxo'}
            onChange={() => onCriterioChange('fluxo')}
          />
          <div className="criterio-inner">
            <div className="criterio-header">
              <span className="criterio-icon">💸</span>
              <div>
                <div className="criterio-titulo">Fluxo de Caixa</div>
                <div className="criterio-subtitulo">O item cabe no seu salário?</div>
              </div>
              <span className="criterio-check"></span>
            </div>
            <p className="criterio-desc">
              Verifica se o valor (ou parcela) cabe 100% no seu balde de lazer mensal, sem depender
              de reservas ou patrimônio acumulado.
            </p>
            <p className="criterio-quando">
              <strong>Ideal para:</strong> quem ainda está construindo sua reserva e quer manter o
              orçamento equilibrado mês a mês.
            </p>
          </div>
        </label>

        <label className="criterio-card" htmlFor="criterio-patrimonio">
          <input
            type="radio"
            name="criterio"
            id="criterio-patrimonio"
            value="patrimonio"
            checked={criterio === 'patrimonio'}
            onChange={() => onCriterioChange('patrimonio')}
          />
          <div className="criterio-inner">
            <div className="criterio-header">
              <span className="criterio-icon">🏦</span>
              <div>
                <div className="criterio-titulo">Patrimônio</div>
                <div className="criterio-subtitulo">A compra coloca sua segurança em risco?</div>
              </div>
              <span className="criterio-check"></span>
            </div>
            <p className="criterio-desc">
              Analisa o impacto no seu colchão financeiro. Termômetro: 🔴 RED (&lt;6 meses), 🟡
              YELLOW (6–12 meses), 🟢 GREEN (≥12 meses). Inclui a{' '}
              <strong>Regra do 1%</strong>: compras abaixo de 1% do patrimônio são risco zero.
            </p>
            <p className="criterio-quando">
              <strong>Ideal para:</strong> quem tem patrimônio acumulado e quer garantir que um
              desejo momentâneo não destrua anos de acumulação.
            </p>
          </div>
        </label>

        <label className="criterio-card" htmlFor="criterio-roi">
          <input
            type="radio"
            name="criterio"
            id="criterio-roi"
            value="roi"
            checked={criterio === 'roi'}
            onChange={() => onCriterioChange('roi')}
          />
          <div className="criterio-inner">
            <div className="criterio-header">
              <span className="criterio-icon">🚀</span>
              <div>
                <div className="criterio-titulo">ROI Profissional</div>
                <div className="criterio-subtitulo">O item pode aumentar sua renda?</div>
              </div>
              <span className="criterio-check"></span>
            </div>
            <p className="criterio-desc">
              Para ferramentas de trabalho, o retorno esperado entra na conta. Permite a compra
              mesmo em estado YELLOW (reserva entre 6 e 12 meses), diferenciando "gasto" de
              "investimento em infraestrutura humana".
            </p>
            <p className="criterio-quando">
              <strong>Ideal para:</strong> notebooks, equipamentos, cursos — qualquer item com
              potencial comprovado de aumentar sua renda ou produtividade.
            </p>
          </div>
        </label>
      </div>

      {criterio === 'fluxo' && (
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
