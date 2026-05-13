import React, { useState, useMemo } from 'react'
import type { Meta, Compromisso } from '../types'
import {
  calcCronogramaMetas,
  calcCronogramaSaudavel,
  calcAtrasoPatrimonioPorFila,
  formatMesAbreviado,
  formatPrazoBR,
} from '../logic/index'
import { compromissosToEventos } from '../utils/compromissos'
import EventosSobraResumo from './EventosSobraResumo'
import CronogramaCard from './CronogramaCard'
import MetaForm from './MetaForm'
import GraficoFila from './GraficoFila'

interface Props {
  metas: Meta[]
  onMetasChange: (metas: Meta[]) => void
  sobraLazerMensal: number
  patrimonio: number
  reservaAlvo: number
  metaValor: number
  rendimentoMensalEfetivo: number
  compromissos: Compromisso[]
  onVoltar: () => void
  onSimularMeta: (m: Meta) => void
}

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

export default function PlanejadorView({
  metas,
  onMetasChange,
  sobraLazerMensal,
  patrimonio,
  reservaAlvo,
  metaValor,
  rendimentoMensalEfetivo,
  compromissos,
  onVoltar,
  onSimularMeta,
}: Props) {
  const [adicionando, setAdicionando] = useState(false)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [modoSaudavel, setModoSaudavel] = useState(true)
  const [pctMaxPatrimonio, setPctMaxPatrimonio] = useState(0.05)
  const [atrasoMaxPorMeta, setAtrasoMaxPorMeta] = useState(3)

  const headStart = Math.max(0, patrimonio - reservaAlvo)

  const eventosSobra = useMemo(
    () => compromissosToEventos(compromissos),
    [compromissos],
  )

  const cronogramaAtual = useMemo(
    () => calcCronogramaMetas(metas, sobraLazerMensal, headStart),
    [metas, sobraLazerMensal, headStart],
  )

  const cronogramaSaudavel = useMemo(
    () =>
      calcCronogramaSaudavel(
        metas,
        patrimonio,
        sobraLazerMensal,
        rendimentoMensalEfetivo,
        metaValor,
        pctMaxPatrimonio,
        atrasoMaxPorMeta,
        reservaAlvo,
        eventosSobra,
      ),
    [metas, patrimonio, sobraLazerMensal, rendimentoMensalEfetivo, metaValor, pctMaxPatrimonio, atrasoMaxPorMeta, reservaAlvo, eventosSobra],
  )

  const cronograma = modoSaudavel ? cronogramaSaudavel : cronogramaAtual
  const totalMetasValor = useMemo(
    () => metas.reduce((s, m) => s + Math.max(0, m.valor), 0),
    [metas],
  )

  const atrasoPatrimonio = useMemo(
    () =>
      calcAtrasoPatrimonioPorFila(
        patrimonio,
        metaValor,
        sobraLazerMensal,
        rendimentoMensalEfetivo,
        cronograma.agendadas.map((a) => ({
          id: a.meta.id,
          valor: a.meta.valor,
          mesQueCompleta: a.mesQueCompleta,
        })),
      ),
    [patrimonio, metaValor, sobraLazerMensal, rendimentoMensalEfetivo, cronograma.agendadas],
  )

  function nextId(): number {
    return metas.reduce((m, x) => Math.max(m, x.id), 0) + 1
  }

  function adicionar(data: { nome: string; valor: number }) {
    onMetasChange([...metas, { id: nextId(), ...data }])
    setAdicionando(false)
  }

  function editar(id: number, data: { nome: string; valor: number }) {
    onMetasChange(metas.map((m) => (m.id === id ? { ...m, ...data } : m)))
    setEditandoId(null)
  }

  function excluir(id: number) {
    onMetasChange(metas.filter((m) => m.id !== id))
  }

  function mover(id: number, delta: -1 | 1) {
    const idx = metas.findIndex((m) => m.id === id)
    if (idx < 0) return
    const novo = idx + delta
    if (novo < 0 || novo >= metas.length) return
    const arr = [...metas]
    ;[arr[idx], arr[novo]] = [arr[novo], arr[idx]]
    onMetasChange(arr)
  }

  const [arrastandoId, setArrastandoId] = useState<number | null>(null)
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  function startDrag(id: number, e: React.PointerEvent<HTMLElement>) {
    e.preventDefault()
    setArrastandoId(id)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  function onDragOver(e: React.PointerEvent<HTMLLIElement>, idx: number) {
    if (arrastandoId === null) return
    setHoverIdx(idx)
  }

  function endDrag() {
    if (arrastandoId === null || hoverIdx === null) {
      setArrastandoId(null)
      setHoverIdx(null)
      return
    }
    const fromIdx = metas.findIndex((m) => m.id === arrastandoId)
    if (fromIdx < 0 || fromIdx === hoverIdx) {
      setArrastandoId(null)
      setHoverIdx(null)
      return
    }
    const arr = [...metas]
    const [moved] = arr.splice(fromIdx, 1)
    arr.splice(hoverIdx, 0, moved)
    onMetasChange(arr)
    setArrastandoId(null)
    setHoverIdx(null)
  }

  const semDados = sobraLazerMensal <= 0 && headStart === 0

  return (
    <div id="app">
      <header className="result-header">
        <button className="btn-secondary result-back-btn" onClick={onVoltar}>
          ← Voltar ao simulador
        </button>
        <h1>📋 Minhas metas</h1>
      </header>

      <main>
        <div className="col-form" style={{ maxWidth: 720, margin: '0 auto' }}>
          <p className="planejador-intro">
            Cadastre o que você quer comprar e veja em que ordem e quando cada uma cabe no
            seu orçamento. As metas são salvas localmente.
          </p>

          {metas.length > 0 && !semDados && (
            <div className="modo-saudavel-controles">
              <label className="modo-saudavel-toggle">
                <input
                  type="checkbox"
                  checked={modoSaudavel}
                  onChange={(e) => setModoSaudavel(e.target.checked)}
                />
                <span>
                  <strong>🌱 Cronograma saudável</strong> — adia cada compra até ficar leve
                  para o seu patrimônio
                </span>
              </label>

              {modoSaudavel && (() => {
                const rendimentoAnualEstimado =
                  rendimentoMensalEfetivo > 0
                    ? (Math.pow(1 + rendimentoMensalEfetivo / 100, 12) - 1) * 100
                    : 0
                return rendimentoAnualEstimado > 0 ? (
                  <p className="modo-saudavel-plano-info">
                    O planejador respeita seu plano de crescimento de{' '}
                    <strong>{rendimentoAnualEstimado.toFixed(1)}% a.a.</strong> — compras vêm
                    apenas da sobra mensal acumulada, sem mexer no capital protegido.
                  </p>
                ) : (
                  <p className="modo-saudavel-plano-info modo-saudavel-plano-vazio">
                    Você ainda não definiu uma estratégia de crescimento. Sem ela, o
                    planejador permite usar todo seu patrimônio acima da reserva.{' '}
                    <a href="#/perfil">Definir agora →</a>
                  </p>
                )
              })()}

              {modoSaudavel && (
                <div className="modo-saudavel-sliders">
                  <div className="slider-field">
                    <label>
                      Cada compra deve ser no máximo{' '}
                      <strong>{(pctMaxPatrimonio * 100).toFixed(0)}%</strong> do meu patrimônio
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={50}
                      step={1}
                      value={Math.round(pctMaxPatrimonio * 100)}
                      onChange={(e) => setPctMaxPatrimonio(Number(e.target.value) / 100)}
                      aria-label="Percentual máximo do patrimônio por compra"
                    />
                  </div>

                  {metaValor > 0 && (
                    <div className="slider-field">
                      <label>
                        Cada compra pode atrasar minha meta em no máximo{' '}
                        <strong>{atrasoMaxPorMeta} {atrasoMaxPorMeta === 1 ? 'mês' : 'meses'}</strong>
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={24}
                        step={1}
                        value={atrasoMaxPorMeta}
                        onChange={(e) => setAtrasoMaxPorMeta(Number(e.target.value))}
                        aria-label="Atraso máximo por meta"
                      />
                    </div>
                  )}
                </div>
              )}

              {modoSaudavel && (
                <EventosSobraResumo eventos={eventosSobra} />
              )}
            </div>
          )}

          {semDados && (
            <div className="banner-aviso">
              <strong>Faltam dados.</strong> Volte ao simulador e preencha sua renda e custo
              de vida (Step 1) para o cronograma aparecer.{' '}
              <button type="button" className="btn-link" onClick={onVoltar}>
                Voltar ao Step 1
              </button>
            </div>
          )}

          {metas.length === 0 ? (
            <section className="card planejador-vazio">
              <p>📋 Você ainda não cadastrou metas.</p>
              <p className="hint">
                Adicione coisas que você quer comprar e o app vai te dizer em que ordem
                comprá-las e quando cada uma cabe no seu orçamento.
              </p>
              {!adicionando && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setAdicionando(true)}
                >
                  + Adicionar primeira meta
                </button>
              )}
              {adicionando && (
                <MetaForm
                  onSubmit={adicionar}
                  onCancel={() => setAdicionando(false)}
                />
              )}
            </section>
          ) : (
            <>
              {!semDados && (
                <>
                  <CronogramaCard
                    cronograma={cronograma}
                    sobraLazerMensal={sobraLazerMensal}
                    headStart={headStart}
                    totalMetasValor={totalMetasValor}
                    metaValor={metaValor}
                    atrasoTotal={atrasoPatrimonio.atrasoTotal}
                  />
                  <GraficoFila
                    patrimonio={patrimonio}
                    sobraLazerMensal={sobraLazerMensal}
                    rendimentoMensalEfetivo={rendimentoMensalEfetivo}
                    metaValor={metaValor}
                    reservaAlvo={reservaAlvo}
                    cronograma={cronograma}
                    eventosSobra={eventosSobra}
                  />
                </>
              )}

              {!semDados && metaValor > 0 && atrasoPatrimonio.atrasoTotal !== null && atrasoPatrimonio.atrasoTotal > 12 && (
                <div className="banner-aviso">
                  <strong>⚠ Esta fila tira mais de 1 ano do seu objetivo de patrimônio.</strong>{' '}
                  Cada compra à vista corrói tempo de acumulação. Considere reordenar, cortar
                  algo, ou esperar mais antes de algumas das metas.
                </div>
              )}

              {!semDados && metaValor > 0 && (
                <p className="planejador-hint-investimento">
                  💡 Suas alocações de investimento (envelopes) continuam acumulando todo mês —
                  estas compras <strong>atrasam</strong>, não param sua acumulação.
                </p>
              )}

              <section className="card">
                <h2>Fila</h2>
                <ul className="metas-lista">
                  {metas.map((m, idx) => {
                    const agendada = cronograma.agendadas.find((a) => a.meta.id === m.id)
                    const inatingivel = cronograma.metasInatingiveis.some((x) => x.id === m.id)
                    const emEdicao = editandoId === m.id

                    if (emEdicao) {
                      return (
                        <li key={m.id} className="meta-item">
                          <MetaForm
                            initial={m}
                            onSubmit={(d) => editar(m.id, d)}
                            onCancel={() => setEditandoId(null)}
                          />
                        </li>
                      )
                    }

                    return (
                      <li
                        key={m.id}
                        className={`meta-item${inatingivel ? ' meta-item--inatingivel' : ''}${arrastandoId === m.id ? ' meta-item--dragging' : ''}${hoverIdx === idx && arrastandoId !== null && arrastandoId !== m.id ? ' meta-item--hover' : ''}`}
                        onPointerMove={(e) => onDragOver(e, idx)}
                        onPointerUp={endDrag}
                      >
                        <button
                          type="button"
                          className="meta-handle"
                          onPointerDown={(e) => startDrag(m.id, e)}
                          aria-label="Arrastar para reordenar"
                        >
                          ⠿
                        </button>
                        <div className="meta-pos">{idx + 1}ª</div>
                        <div className="meta-corpo">
                          <div className="meta-nome">{m.nome}</div>
                          <div className="meta-detalhe">
                            {fmt(m.valor)}
                            {agendada && (
                              <>
                                {' • '}
                                <span className="meta-quando">
                                  Compra em {agendada.mesQueCompleta === 0
                                    ? 'agora'
                                    : `${formatPrazoBR(agendada.mesQueCompleta)} (${formatMesAbreviado(agendada.mesQueCompleta)})`}
                                </span>
                              </>
                            )}
                            {(() => {
                              const atrasoMeta = atrasoPatrimonio.atrasoPorMeta.find(
                                (a) => a.id === m.id,
                              )
                              if (!atrasoMeta || atrasoMeta.meses === null || atrasoMeta.meses <= 0) {
                                return null
                              }
                              return (
                                <div className="meta-custo-patrimonio">
                                  + {formatPrazoBR(atrasoMeta.meses)} para atingir {fmt(metaValor)}
                                </div>
                              )
                            })()}
                            {inatingivel && (
                              <span className="meta-badge-inatingivel">
                                ⚠ Inatingível com a sobra atual
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="meta-acoes">
                          <button
                            type="button"
                            onClick={() => mover(m.id, -1)}
                            disabled={idx === 0}
                            aria-label="Mover para cima"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => mover(m.id, 1)}
                            disabled={idx === metas.length - 1}
                            aria-label="Mover para baixo"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => onSimularMeta(m)}
                            aria-label="Simular esta meta"
                            title="Simular esta meta"
                          >
                            🎯
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditandoId(m.id)}
                            aria-label="Editar"
                          >
                            ✏
                          </button>
                          <button
                            type="button"
                            onClick={() => excluir(m.id)}
                            aria-label="Excluir"
                          >
                            ×
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>

                {adicionando ? (
                  <MetaForm onSubmit={adicionar} onCancel={() => setAdicionando(false)} />
                ) : (
                  <button
                    type="button"
                    className="btn-add-meta"
                    onClick={() => setAdicionando(true)}
                  >
                    + Adicionar meta
                  </button>
                )}
              </section>
            </>
          )}
        </div>
      </main>

      <footer>
        <p>Suas metas são salvas localmente no seu navegador. Nenhuma informação é enviada.</p>
      </footer>
    </div>
  )
}
