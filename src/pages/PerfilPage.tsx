import React from 'react'
import { Envelope } from '../types'
import { ScoreSaudeResult } from '../logic/index'
import ConfigSection from '../components/ConfigSection'
import RealidadeSection from '../components/RealidadeSection'

interface Props {
  renda: number
  onRendaChange: (v: number) => void
  custo: number
  onCustoChange: (v: number) => void
  envelopes: Envelope[]
  onEnvelopesChange: React.Dispatch<React.SetStateAction<Envelope[]>>
  parcelasExistentes: number
  onParcelasExistentesChange: (v: number) => void
  patrimonio: number
  onPatrimonioChange: (v: number) => void
  reservaMeses: number
  onReservaMesesChange: (v: number) => void
  metaValor: number
  onMetaValorChange: (v: number) => void
  rendimentoAnual: number
  onRendimentoAnualChange: (v: number) => void
  reducaoHipotetica: number
  onReducaoHipoteticaChange: (v: number) => void
  sobraLazerMensal: number
  scoreSaude: ScoreSaudeResult
  onRefazerSetup: () => void
}

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

export default function PerfilPage(props: Props) {
  // Regra 50/30/20: custo de vida fixo deve idealmente ser ≤ 50% da renda
  const custoSobreRenda = props.renda > 0 ? props.custo / props.renda : 0
  const aviso503020 = props.renda > 0 && custoSobreRenda > 0.5

  return (
    <div className="page-perfil">
      <header className="page-header">
        <h1>Perfil financeiro</h1>
        <p className="subtitle">
          Sua situação financeira atual. Mudanças aqui afetam todos os cenários em tempo real.
        </p>
      </header>

      <section className="page-section">
        <ConfigSection
          renda={props.renda}
          onRendaChange={props.onRendaChange}
          custo={props.custo}
          onCustoChange={props.onCustoChange}
          envelopes={props.envelopes}
          onEnvelopesChange={props.onEnvelopesChange}
          parcelasExistentes={props.parcelasExistentes}
          onParcelasExistentesChange={props.onParcelasExistentesChange}
        />
        {aviso503020 && (
          <div className="banner-aviso" role="alert">
            <strong>⚠ Custo de vida acima de 50% da renda</strong>
            <p style={{ marginTop: 6 }}>
              Seu custo fixo é <strong>{fmt(props.custo)}</strong> ({(custoSobreRenda * 100).toFixed(0)}% de {fmt(props.renda)}).
              A regra <strong>50/30/20</strong> sugere ≤ 50% para necessidades, deixando 30% para desejos
              e 20% para poupança e investimentos. Acima disso fica difícil acumular reserva e poupar
              para metas.
            </p>
          </div>
        )}
      </section>

      <section className="page-section">
        <RealidadeSection
          patrimonio={props.patrimonio}
          onPatrimonioChange={props.onPatrimonioChange}
          reservaMeses={props.reservaMeses}
          onReservaMesesChange={props.onReservaMesesChange}
          metaValor={props.metaValor}
          onMetaValorChange={props.onMetaValorChange}
          rendimentoAnual={props.rendimentoAnual}
          onRendimentoAnualChange={props.onRendimentoAnualChange}
          scoreSaude={props.scoreSaude}
        />
      </section>

      {props.renda > 0 && props.custo > 0 && (
        <section className="page-section">
          <div className="card simulador-corte">
            <h2>E se eu cortasse um pouco do gasto fixo?</h2>
            <p className="hint" style={{ marginBottom: 16 }}>
              Use o slider para visualizar o impacto de reduzir custos. O número não altera seu
              custo real — todos os cálculos do app rodam como se o corte estivesse aplicado.
            </p>

            <div className="slider-field">
              <label>
                Cortar <strong>{fmt(props.reducaoHipotetica)}</strong> por mês
                {props.reducaoHipotetica > 0 && (
                  <> ({((props.reducaoHipotetica / props.custo) * 100).toFixed(0)}% do custo fixo)</>
                )}
              </label>
              <input
                type="range"
                min={0}
                max={Math.round(props.custo)}
                step={Math.max(10, Math.round(props.custo / 100))}
                value={Math.min(props.reducaoHipotetica, props.custo)}
                onChange={e => props.onReducaoHipoteticaChange(Number(e.target.value))}
                aria-label="Redução hipotética de custo de vida"
              />
            </div>

            {props.reducaoHipotetica > 0 && (
              <div className="banner-aviso" style={{ marginTop: 12, background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.3)', color: 'var(--success)' }} role="status">
                <strong>🌱 Cortando {fmt(props.reducaoHipotetica)}/mês:</strong>
                <p style={{ marginTop: 6, color: 'var(--text)' }}>
                  Sua sobra de lazer passa para <strong>{fmt(props.sobraLazerMensal)}</strong> por mês —
                  isso é <strong>{fmt(props.reducaoHipotetica * 12)}/ano</strong> a mais para
                  metas, reservas e investimentos. O resultado dos cenários, prazos da fila do
                  planejador e atrasos das metas refletem essa redução em tempo real.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      <footer className="page-footer">
        <button type="button" className="btn-secondary" onClick={props.onRefazerSetup}>
          Refazer setup guiado
        </button>
      </footer>
    </div>
  )
}
