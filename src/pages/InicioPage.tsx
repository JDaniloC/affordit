import React from 'react'
import type { AppState, Cenario } from '../types'
import { calcularResultadoCenario } from '../logic/selectors'
import { selectCriterioAuto } from '../logic/index'
import NumericInput from '../components/NumericInput'
import ResultadoSection from '../components/ResultadoSection'

interface Props {
  perfil: AppState['perfil']
  cenario: Cenario | null
  metas: AppState['metas']
  onPerfilChange: (patch: Partial<AppState['perfil']>) => void
  onCenarioChange: (patch: Partial<Cenario>) => void
  onAdicionarItemAFila: () => void
  onAbrirPlanejador: () => void
  onAbrirShell: () => void
}

export default function InicioPage({
  perfil,
  cenario,
  metas,
  onPerfilChange,
  onCenarioChange,
  onAdicionarItemAFila,
  onAbrirPlanejador,
  onAbrirShell,
}: Props) {
  if (!cenario) return null

  const temItem = cenario.itemValor > 0
  const temRenda = perfil.renda > 0
  const podeMostrarVeredito = temItem && temRenda

  const r = podeMostrarVeredito ? calcularResultadoCenario(perfil, cenario) : null
  const criterio = selectCriterioAuto(perfil.patrimonio, cenario.itemValor)
  const ferramenta = cenario.tipoCompra === 'ferramenta'

  return (
    <div className="page-inicio">
      <header className="page-header">
        <h1>Posso comprar?</h1>
        <p className="subtitle">
          Diga o que quer comprar e vamos te dizer se vale a pena. Quanto mais dados você
          fornecer, mais preciso o veredito fica.
        </p>
      </header>

      <section className="card">
        <h2>1. O que você quer comprar?</h2>
        <div className="field">
          <label htmlFor="inicio-item-nome">Nome do item</label>
          <input
            id="inicio-item-nome"
            type="text"
            placeholder="Ex: Notebook, Carro, Apartamento..."
            value={cenario.itemNome}
            onChange={e => onCenarioChange({
              itemNome: e.target.value,
              nome: e.target.value.trim() || 'Cenário sem nome',
            })}
          />
        </div>
        <div className="field">
          <label htmlFor="inicio-item-valor">Valor</label>
          <div className="input-group">
            <span className="unit prefix">R$</span>
            <NumericInput
              id="inicio-item-valor"
              value={cenario.itemValor}
              onChange={v => onCenarioChange({ itemValor: v })}
              placeholder="0,00"
            />
          </div>
        </div>
      </section>

      <section className="card">
        <h2>2. Sua renda mensal</h2>
        <p className="hint" style={{ marginBottom: 12 }}>
          Sem renda não dá para responder. Os outros dados são opcionais — preencha se quiser
          afinar a resposta.
        </p>
        <div className="field">
          <label htmlFor="inicio-renda">Renda líquida mensal</label>
          <div className="input-group">
            <span className="unit prefix">R$</span>
            <NumericInput
              id="inicio-renda"
              value={perfil.renda}
              onChange={v => onPerfilChange({ renda: v })}
              placeholder="0,00"
            />
          </div>
        </div>
      </section>

      {!podeMostrarVeredito && (
        <section className="card resultado-placeholder">
          <p>
            {!temItem && !temRenda && (
              <>Preencha <strong>o que você quer comprar</strong> e <strong>sua renda</strong> para ver o veredito.</>
            )}
            {temItem && !temRenda && (
              <>Falta sua <strong>renda</strong> para o veredito.</>
            )}
            {!temItem && temRenda && (
              <>Falta o <strong>item</strong> que você quer comprar.</>
            )}
          </p>
        </section>
      )}

      {podeMostrarVeredito && r && (
        <ResultadoSection
          resultado={r.veredito}
          criterio={criterio}
          fluxo={r.fluxo}
          patrim={r.statusPatrimonio}
          ferramenta={ferramenta}
          renda={perfil.renda}
          custo={perfil.custo}
          reservaMeses={perfil.reservaMeses}
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
          metas={metas}
          onAdicionarItemAFila={onAdicionarItemAFila}
          onAbrirPlanejador={onAbrirPlanejador}
        />
      )}

      <footer className="page-footer">
        <p className="hint">
          Quer ajustar custo de vida, patrimônio, parcelas existentes ou comparar com outros itens?
        </p>
        <button type="button" className="btn-secondary" onClick={onAbrirShell}>
          Abrir simulação completa →
        </button>
      </footer>
    </div>
  )
}
