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
  scoreSaude: ScoreSaudeResult
  onRefazerSetup: () => void
}

export default function PerfilPage(props: Props) {
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
