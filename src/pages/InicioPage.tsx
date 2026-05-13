import React from 'react'
import type { AppState, Cenario, TipoCompra } from '../types'
import { calcularResultadoCenario } from '../logic/selectors'
import { selectCriterioAuto, calcCustoOcultoVeiculo } from '../logic/index'
import { somaCompromissos } from '../utils/compromissos'
import { somaGastos } from '../utils/gastos'
import NumericInput from '../components/NumericInput'
import ResultadoSection from '../components/ResultadoSection'
import ChartDistribuicao from '../components/ChartDistribuicao'
import ChartPrazoVivo from '../components/ChartPrazoVivo'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

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

  const totalGastos = somaGastos(perfil)
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
        <div className="field">
          <label htmlFor="inicio-patrimonio">Patrimônio guardado <span className="hint-inline">(opcional)</span></label>
          <div className="input-group">
            <span className="unit prefix">R$</span>
            <NumericInput
              id="inicio-patrimonio"
              value={perfil.patrimonio}
              onChange={v => onPerfilChange({ patrimonio: v })}
              placeholder="0,00"
            />
          </div>
        </div>
        <div className="field inicio-compromissos-display">
          <label>Comprometimento mensal <span className="hint-inline">(opcional, gerencie no perfil)</span></label>
          {perfil.compromissos.length > 0 ? (
            <p className="hint">
              <strong>{fmt(somaCompromissos(perfil))}/mês</strong>
              {' '}({perfil.compromissos.length} {perfil.compromissos.length === 1 ? 'item' : 'itens'})
              {' '}<a href="#/perfil">gerenciar →</a>
            </p>
          ) : (
            <p className="hint">
              Nenhum compromisso cadastrado.{' '}
              <a href="#/perfil">adicionar →</a>
            </p>
          )}
        </div>
        <div className="field inicio-gastos-display">
          <label>Custo de vida <span className="hint-inline">(opcional, gerencie no perfil)</span></label>
          {perfil.gastos.length > 0 ? (
            <p className="hint">
              <strong>{fmt(totalGastos)}/mês</strong>
              {' '}({perfil.gastos.length} {perfil.gastos.length === 1 ? 'item' : 'itens'})
              {' '}<a href="#/perfil">gerenciar →</a>
            </p>
          ) : (
            <p className="hint">
              Custo de vida não informado.{' '}
              <a href="#/perfil">adicionar →</a>
            </p>
          )}
        </div>
      </section>

      {temItem && (
        <section className="card">
          <h2>3. Detalhes da compra <span className="hint-inline">(opcional)</span></h2>
          <div className="field">
            <label>Tipo de compra</label>
            <div className="tipo-compra-grid">
              {(
                [
                  { value: 'lazer', label: 'Lazer / Consumo', icon: '🛍️' },
                  { value: 'ferramenta', label: 'Ferramenta de Trabalho', icon: '🔧' },
                  { value: 'passivoAltoValor', label: 'Passivo de Alto Valor', icon: '🏠' },
                ] as Array<{ value: TipoCompra; label: string; icon: string }>
              ).map(t => (
                <button
                  key={t.value}
                  type="button"
                  className={`tipo-compra-btn${cenario.tipoCompra === t.value ? ' tipo-compra-btn--active' : ''}`}
                  onClick={() => onCenarioChange({ tipoCompra: t.value })}
                >
                  <span className="tipo-icon">{t.icon}</span>
                  <span className="tipo-label">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label htmlFor="inicio-parcelas">Quantas vezes parcelado</label>
            <div className="input-group">
              <NumericInput
                id="inicio-parcelas"
                value={cenario.parcelas}
                onChange={v => onCenarioChange({ parcelas: Math.max(1, Math.round(v)) })}
                min={1}
                step={1}
                placeholder="1"
                defaultValue={1}
              />
              <span className="unit">x</span>
            </div>
          </div>

          {cenario.parcelas > 1 && (
            <div className="field">
              <label htmlFor="inicio-juros">
                Taxa de juros mensal <span className="hint-inline">(opcional)</span>
              </label>
              <div className="input-group">
                <NumericInput
                  id="inicio-juros"
                  value={cenario.taxaJuros}
                  onChange={v => onCenarioChange({ taxaJuros: v })}
                  min={0}
                  step={0.1}
                  placeholder="0"
                />
                <span className="unit">% a.m.</span>
              </div>
            </div>
          )}

          {cenario.tipoCompra === 'passivoAltoValor' && (
            <div className="passivo-fields">
              <p className="passivo-intro">
                Passivos de alto valor têm custos mensais além da parcela.
              </p>

              <div className="field">
                <label htmlFor="inicio-manutencao">Custos mensais do bem</label>
                <div className="input-group">
                  <span className="unit prefix">R$</span>
                  <NumericInput
                    id="inicio-manutencao"
                    value={cenario.manutencaoMensal}
                    onChange={v => onCenarioChange({ manutencaoMensal: v })}
                    placeholder="0,00"
                  />
                </div>
                {cenario.itemValor > 0 && (
                  <button
                    type="button"
                    className="btn-sugerir-custo"
                    onClick={() =>
                      onCenarioChange({ manutencaoMensal: calcCustoOcultoVeiculo(cenario.itemValor) })
                    }
                  >
                    💡 Sugerir 1% do valor (R$ {calcCustoOcultoVeiculo(cenario.itemValor).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}/mês)
                  </button>
                )}
              </div>

              <div className="field">
                <label htmlFor="inicio-entrada">Entrada</label>
                <div className="input-group">
                  <span className="unit prefix">R$</span>
                  <NumericInput
                    id="inicio-entrada"
                    value={cenario.entradaValor}
                    onChange={v => onCenarioChange({ entradaValor: v })}
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="inicio-despesa-substituida">Despesa substituída por mês</label>
                <div className="input-group">
                  <span className="unit prefix">R$</span>
                  <NumericInput
                    id="inicio-despesa-substituida"
                    value={cenario.despesaSubstituida}
                    onChange={v => onCenarioChange({ despesaSubstituida: v })}
                    placeholder="0,00"
                  />
                </div>
                <p className="field-hint">
                  Aluguel atual (se for comprar imóvel), Uber mensal (se for comprar carro).
                </p>
              </div>
            </div>
          )}
        </section>
      )}

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

      {temRenda && perfil.envelopes.length > 0 && (
        <section className="card">
          <h3>Distribuição da renda</h3>
          <ChartDistribuicao renda={perfil.renda} custo={totalGastos} envelopes={perfil.envelopes} />
        </section>
      )}

      {podeMostrarVeredito && (
        <section className="card">
          <h3>Caminho até a compra</h3>
          <ChartPrazoVivo
            itemValor={cenario.itemValor}
            itemNome={cenario.itemNome.trim() || 'o item'}
            patrimonio={perfil.patrimonio}
            sobraLazerMensal={r?.sobraLazerMensal ?? 0}
            parcelas={cenario.parcelas}
          />
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
          custo={totalGastos}
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
          parcelasExistentes={somaCompromissos(perfil)}
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
          Quer ajustar custo de vida, patrimônio ou comparar com outros itens?
        </p>
        <button type="button" className="btn-secondary" onClick={onAbrirShell}>
          Abrir simulação completa →
        </button>
      </footer>
    </div>
  )
}
