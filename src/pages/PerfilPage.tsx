import React from 'react'
import { Envelope, Compromisso, Gasto } from '../types'
import { ScoreSaudeResult } from '../logic/index'
import { valorDoGasto } from '../utils/gastos'
import ConfigSection from '../components/ConfigSection'
import RealidadeSection from '../components/RealidadeSection'
import CompromissosList from '../components/CompromissosList'

interface Props {
  renda: number
  onRendaChange: (v: number) => void
  gastos: Gasto[]
  onGastosChange: (next: Gasto[]) => void // passed to GastosList in Task 7
  envelopes: Envelope[]
  onEnvelopesChange: React.Dispatch<React.SetStateAction<Envelope[]>>
  compromissos: Compromisso[]
  onCompromissosChange: (next: Compromisso[]) => void
  patrimonio: number
  onPatrimonioChange: (v: number) => void
  reservaMeses: number
  onReservaMesesChange: (v: number) => void
  metaValor: number
  onMetaValorChange: (v: number) => void
  rendimentoAnual: number
  onRendimentoAnualChange: (v: number) => void
  scoreSaude: ScoreSaudeResult
  onRefazerSetup: () => void
}

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

export default function PerfilPage(props: Props) {
  // Regra 50/30/20: custo de vida fixo deve idealmente ser ≤ 50% da renda
  const totalGastos = props.gastos.reduce((s, g) => s + valorDoGasto(g, props.renda), 0)
  const custoSobreRenda = props.renda > 0 ? totalGastos / props.renda : 0
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
          custo={totalGastos}
          envelopes={props.envelopes}
          onEnvelopesChange={props.onEnvelopesChange}
        />
        {aviso503020 && (
          <div className="banner-aviso" role="alert">
            <strong>⚠ Custo de vida acima de 50% da renda</strong>
            <p style={{ marginTop: 6 }}>
              Seu custo fixo é <strong>{fmt(totalGastos)}</strong> ({(custoSobreRenda * 100).toFixed(0)}% de {fmt(props.renda)}).
              A regra <strong>50/30/20</strong> sugere ≤ 50% para necessidades, deixando 30% para desejos
              e 20% para poupança e investimentos. Acima disso fica difícil acumular reserva e poupar
              para metas.
            </p>
          </div>
        )}
      </section>

      <section className="page-section" id="section-compromissos">
        <CompromissosList
          compromissos={props.compromissos}
          renda={props.renda}
          onChange={props.onCompromissosChange}
        />
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

      <footer className="page-footer">
        <button type="button" className="btn-secondary" onClick={props.onRefazerSetup}>
          Refazer setup guiado
        </button>
      </footer>
    </div>
  )
}
