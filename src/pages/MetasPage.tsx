import React from 'react'
import { AppState, Meta } from '../types'
import PlanejadorView from '../components/PlanejadorView'

interface Props {
  perfil: AppState['perfil']
  metas: Meta[]
  onMetasChange: (metas: Meta[]) => void
  rendimentoMensalEfetivo: number
  sobraLazerMensal: number
  onNavegarParaCenario: (m: Meta) => void
  onVoltarParaCenarios: () => void
}

export default function MetasPage(props: Props) {
  const reservaAlvo = props.perfil.custo * props.perfil.reservaMeses
  return (
    <PlanejadorView
      metas={props.metas}
      onMetasChange={props.onMetasChange}
      sobraLazerMensal={props.sobraLazerMensal}
      patrimonio={props.perfil.patrimonio}
      reservaAlvo={reservaAlvo}
      metaValor={props.perfil.metaValor}
      rendimentoMensalEfetivo={props.rendimentoMensalEfetivo}
      onVoltar={props.onVoltarParaCenarios}
      onSimularMeta={props.onNavegarParaCenario}
    />
  )
}
