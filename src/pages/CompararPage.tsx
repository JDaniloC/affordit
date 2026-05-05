import React, { useMemo, useState } from 'react'
import { Cenario, AppState } from '../types'
import { calcularResultadoCenario } from '../logic/selectors'
import VereditoBadge from '../components/VereditoBadge'

interface Props {
  perfil: AppState['perfil']
  cenarios: Cenario[]
}

type SortKey = 'nome' | 'valor' | 'parcelas' | 'parcelaEfetiva' | 'jurosTotais' | 'veredito'
type SortDir = 'asc' | 'desc'

interface LinhaComparar {
  cenario: Cenario
  parcelaEfetiva: number
  jurosTotais: number
  vereditoTipo: 'aprovado' | 'negado' | 'juntar'
  vereditoOrdem: number
  resultado: ReturnType<typeof calcularResultadoCenario>
}

const VEREDITO_ORDEM: Record<string, number> = {
  aprovado: 0,
  juntar: 1,
  negado: 2,
}

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

export default function CompararPage({ perfil, cenarios }: Props) {
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [sortKey, setSortKey] = useState<SortKey>('nome')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  // Computa todas as linhas (com derivados) uma única vez por mudança de cenarios/perfil.
  const linhas = useMemo<LinhaComparar[]>(() => {
    return cenarios.map(c => {
      const r = calcularResultadoCenario(perfil, c)
      const vereditoTipo = r.veredito.veredito.tipo
      return {
        cenario: c,
        parcelaEfetiva: r.parcelaEfetiva,
        jurosTotais: r.custoFinanciamento?.totalJuros ?? 0,
        vereditoTipo,
        vereditoOrdem: VEREDITO_ORDEM[vereditoTipo] ?? 99,
        resultado: r,
      }
    })
  }, [perfil, cenarios])

  // Filtro por seleção (se vazio, mostra todos)
  const filtradas = useMemo(() => {
    if (selecionados.size === 0) return linhas
    return linhas.filter(l => selecionados.has(l.cenario.id))
  }, [linhas, selecionados])

  // Sort estável
  const ordenadas = useMemo(() => {
    const arr = [...filtradas]
    arr.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'nome': cmp = a.cenario.nome.localeCompare(b.cenario.nome, 'pt-BR'); break
        case 'valor': cmp = a.cenario.itemValor - b.cenario.itemValor; break
        case 'parcelas': cmp = a.cenario.parcelas - b.cenario.parcelas; break
        case 'parcelaEfetiva': cmp = a.parcelaEfetiva - b.parcelaEfetiva; break
        case 'jurosTotais': cmp = a.jurosTotais - b.jurosTotais; break
        case 'veredito': cmp = a.vereditoOrdem - b.vereditoOrdem; break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [filtradas, sortKey, sortDir])

  // KPIs sobre as linhas filtradas (não as ordenadas — mesmo conteúdo)
  const kpis = useMemo(() => {
    const total = filtradas.length
    const aprovados = filtradas.filter(l => l.vereditoTipo === 'aprovado').length
    const custoTotal = filtradas.reduce((s, l) => s + l.cenario.itemValor, 0)
    return { total, aprovados, custoTotal }
  }, [filtradas])

  function alternarSelecao(id: string) {
    setSelecionados(prev => {
      const novo = new Set(prev)
      if (novo.has(id)) novo.delete(id)
      else novo.add(id)
      return novo
    })
  }

  function limparSelecao() {
    setSelecionados(new Set())
  }

  function alternarSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function indicadorSort(key: SortKey): string {
    if (sortKey !== key) return ''
    return sortDir === 'asc' ? ' ↑' : ' ↓'
  }

  if (cenarios.length === 0) {
    return (
      <div className="page-comparar">
        <header className="page-header"><h1>Comparar cenários</h1></header>
        <p className="empty-state">Você ainda não tem cenários. Crie um na aba <em>Cenários</em>.</p>
      </div>
    )
  }

  return (
    <div className="page-comparar">
      <header className="page-header">
        <h1>Comparar cenários</h1>
        <p className="subtitle">Visão paralela. Marque os cenários para focar a análise; clique nos cabeçalhos para ordenar.</p>
      </header>

      <div className="comparar-kpis">
        <div className="kpi">
          <span className="kpi-label">{selecionados.size > 0 ? 'Selecionados' : 'Total'}</span>
          <strong>{kpis.total}</strong>
        </div>
        <div className="kpi">
          <span className="kpi-label">Aprovados</span>
          <strong>{kpis.aprovados}</strong>
        </div>
        <div className="kpi">
          <span className="kpi-label">Custo total se comprasse</span>
          <strong>{fmt(kpis.custoTotal)}</strong>
        </div>
        {selecionados.size > 0 && (
          <button type="button" className="btn-secondary kpi-clear" onClick={limparSelecao}>
            Limpar seleção
          </button>
        )}
      </div>

      <table className="tabela-comparar">
        <thead>
          <tr>
            <th aria-label="Selecionar"></th>
            <th>
              <button type="button" className="th-sort" onClick={() => alternarSort('nome')}>
                Cenário{indicadorSort('nome')}
              </button>
            </th>
            <th>Item</th>
            <th>
              <button type="button" className="th-sort" onClick={() => alternarSort('valor')}>
                Valor{indicadorSort('valor')}
              </button>
            </th>
            <th>
              <button type="button" className="th-sort" onClick={() => alternarSort('parcelas')}>
                Parcelas{indicadorSort('parcelas')}
              </button>
            </th>
            <th>
              <button type="button" className="th-sort" onClick={() => alternarSort('parcelaEfetiva')}>
                Parcela R$/m{indicadorSort('parcelaEfetiva')}
              </button>
            </th>
            <th>
              <button type="button" className="th-sort" onClick={() => alternarSort('jurosTotais')}>
                Juros totais{indicadorSort('jurosTotais')}
              </button>
            </th>
            <th>
              <button type="button" className="th-sort" onClick={() => alternarSort('veredito')}>
                Veredito{indicadorSort('veredito')}
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {ordenadas.map(l => (
            <tr key={l.cenario.id} className={selecionados.has(l.cenario.id) ? 'is-selected' : ''}>
              <td>
                <input
                  type="checkbox"
                  checked={selecionados.has(l.cenario.id)}
                  onChange={() => alternarSelecao(l.cenario.id)}
                  aria-label={`Selecionar ${l.cenario.nome}`}
                />
              </td>
              <td data-label="Cenário">{l.cenario.nome}</td>
              <td data-label="Item">{l.cenario.itemNome || '—'}</td>
              <td data-label="Valor">{fmt(l.cenario.itemValor)}</td>
              <td data-label="Parcelas">{l.cenario.parcelas}x</td>
              <td data-label="Parcela R$/m">{fmt(l.parcelaEfetiva)}</td>
              <td data-label="Juros totais">{l.jurosTotais > 0 ? fmt(l.jurosTotais) : '—'}</td>
              <td data-label="Veredito"><VereditoBadge veredito={l.resultado.veredito.veredito} size="sm" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
