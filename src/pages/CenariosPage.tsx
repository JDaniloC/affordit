import React, { useState, useEffect } from 'react'
import { Cenario, AppState, TipoCompra, Meta } from '../types'
import { calcularResultadoCenario } from '../logic/selectors'
import { calcRoiAprovacao, selectCriterioAuto, calcCustoComJuros } from '../logic/index'
import SonhoSection from '../components/SonhoSection'
import EstrategiaSection from '../components/EstrategiaSection'
import ResultadoSection from '../components/ResultadoSection'
import SidebarCenarios from '../components/SidebarCenarios'
import StepperNav from '../components/StepperNav'

const CENARIO_STEP_LABELS = ['Item', 'Estratégia', 'Resultado']

interface Props {
  perfil: AppState['perfil']
  cenario: Cenario | null
  cenarios: Cenario[]
  cenarioAtivoId: string | null
  metas: Meta[]
  onCenarioChange: (patch: Partial<Cenario>) => void
  onSelecionarCenario: (id: string) => void
  onCriarVazio: () => void
  onDuplicar: () => void
  onExcluir: (id: string) => void
  onAdicionarItemAFila: () => void
  onAbrirPlanejador: () => void
  sidebarAberta?: boolean
  onFecharSidebar?: () => void
}

export default function CenariosPage(props: Props) {
  const [cenarioStep, setCenarioStep] = useState<1 | 2 | 3>(1)

  // Reset step when active scenario changes
  useEffect(() => {
    setCenarioStep(1)
  }, [props.cenarioAtivoId])

  if (props.cenarios.length === 0) {
    return (
      <div className="page-cenarios page-cenarios-empty">
        <header className="page-header"><h1>Cenários</h1></header>
        <div className="empty-state-cta">
          <p>Você ainda não tem cenários ativos.</p>
          <button type="button" className="btn-primary" onClick={props.onCriarVazio}>
            Criar primeiro cenário
          </button>
        </div>
      </div>
    )
  }

  const { perfil, cenario } = props
  if (!cenario) return null // raro: cenarios > 0 mas ativo null — useEffect reconcilia em App.tsx

  const r = calcularResultadoCenario(perfil, cenario)
  const ferramenta = cenario.tipoCompra === 'ferramenta'
  const roiOk = calcRoiAprovacao(r.statusPatrimonio.statusAtual, ferramenta)
  const criterio = selectCriterioAuto(perfil.patrimonio, cenario.itemValor)
  const custoFinanciamentoLive =
    cenario.taxaJuros > 0 && cenario.parcelas > 1
      ? calcCustoComJuros(cenario.itemValor, cenario.parcelas, cenario.taxaJuros)
      : null

  function goNext() {
    setCenarioStep(s => Math.min(3, s + 1) as 1 | 2 | 3)
  }

  function goBack() {
    setCenarioStep(s => Math.max(1, s - 1) as 1 | 2 | 3)
  }

  return (
    <div className="page-cenarios page-cenarios-with-sidebar">
      <SidebarCenarios
        perfil={perfil}
        cenarios={props.cenarios}
        cenarioAtivoId={props.cenarioAtivoId}
        onSelecionar={props.onSelecionarCenario}
        onCriarVazio={props.onCriarVazio}
        onDuplicar={props.onDuplicar}
        onExcluir={props.onExcluir}
        aberta={props.sidebarAberta}
        onFechar={props.onFecharSidebar}
      />

      <div className="page-cenarios-main cenarios-stepper-main">
        <header className="page-header">
          <h1>{cenario.nome || 'Cenário'}</h1>
          <p className="subtitle">
            {cenarioStep === 1 && 'Defina o item que deseja comprar.'}
            {cenarioStep === 2 && 'Configure parcelas e juros.'}
            {cenarioStep === 3 && 'Resultado atualizado em tempo real.'}
          </p>
        </header>

        <div className="cenarios-stepper-nav">
          <StepperNav currentStep={cenarioStep} labels={CENARIO_STEP_LABELS} />
        </div>

        {cenarioStep === 1 && (
          <SonhoSection
            itemNome={cenario.itemNome}
            onItemNomeChange={v => props.onCenarioChange({
              itemNome: v,
              nome: v.trim() || 'Cenário sem nome',
            })}
            itemValor={cenario.itemValor}
            onItemValorChange={v => props.onCenarioChange({ itemValor: v })}
            tipoCompra={cenario.tipoCompra}
            onTipoCompraChange={(v: TipoCompra) => props.onCenarioChange({ tipoCompra: v })}
            manutencaoMensal={cenario.manutencaoMensal}
            onManutencaoMensalChange={v => props.onCenarioChange({ manutencaoMensal: v })}
            entradaValor={cenario.entradaValor}
            onEntradaValorChange={v => props.onCenarioChange({ entradaValor: v })}
            despesaSubstituida={cenario.despesaSubstituida}
            onDespesaSubstituida={v => props.onCenarioChange({ despesaSubstituida: v })}
          />
        )}

        {cenarioStep === 2 && (
          <EstrategiaSection
            criterioAuto={criterio}
            patrimonio={perfil.patrimonio}
            itemValor={cenario.itemValor}
            parcelas={cenario.parcelas}
            onParcelasChange={v => props.onCenarioChange({ parcelas: v })}
            taxaJuros={cenario.taxaJuros}
            onTaxaJurosChange={v => props.onCenarioChange({ taxaJuros: v })}
            custoFinanciamento={custoFinanciamentoLive}
          />
        )}

        {cenarioStep === 3 && (
          cenario.itemValor > 0 && perfil.renda > 0 ? (
            <ResultadoSection
              resultado={r.veredito}
              criterio={criterio}
              fluxo={r.fluxo}
              patrim={r.statusPatrimonio}
              roiOk={roiOk}
              ferramenta={ferramenta}
              renda={perfil.renda}
              custo={perfil.custo}
              patrimonio={perfil.patrimonio}
              itemValor={cenario.itemValor}
              itemNome={cenario.itemNome.trim() || 'Item'}
              parcelas={cenario.parcelas}
              metaValor={perfil.metaValor}
              metaResult={r.metaResult}
              tipoCompra={cenario.tipoCompra}
              taxaJuros={cenario.taxaJuros}
              custoFinanciamento={r.custoFinanciamento}
              passivoResult={r.passivoResult}
              manutencaoMensal={cenario.manutencaoMensal}
              entradaValor={cenario.entradaValor}
              despesaSubstituida={cenario.despesaSubstituida}
              parcelasExistentes={perfil.parcelasExistentes}
              rendimentoAnual={perfil.rendimentoAnual}
              scoreSaude={r.score}
              risco={r.risco}
              metas={props.metas}
              onAdicionarItemAFila={props.onAdicionarItemAFila}
              onAbrirPlanejador={props.onAbrirPlanejador}
            />
          ) : (
            <div className="resultado-placeholder">
              <p>Preencha <strong>renda</strong> no <em>Perfil</em> e o <strong>valor do item</strong> para ver o resultado em tempo real.</p>
            </div>
          )
        )}

        <div className="cenarios-stepper-actions">
          {cenarioStep > 1 && (
            <button type="button" className="btn-secondary" onClick={goBack}>
              ← Anterior
            </button>
          )}
          {cenarioStep < 3 && (
            <button type="button" className="btn-primary" onClick={goNext} style={{ width: 'auto', marginBottom: 0 }}>
              Próximo →
            </button>
          )}
          {cenarioStep === 3 && (
            <button type="button" className="btn-secondary" onClick={goBack}>
              ← Voltar a editar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
