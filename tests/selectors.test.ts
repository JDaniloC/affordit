import { describe, it, expect } from 'vitest'
import { calcularResultadoCenario } from '../src/logic/selectors.ts'
import { PerfilFinanceiro, Cenario } from '../src/types.ts'

const perfilBase: PerfilFinanceiro = {
  renda: 5000,
  custo: 2000,
  envelopes: [{ id: 1, nome: 'Investimentos', pct: 10 }],
  patrimonio: 15000,
  reservaMeses: 6,
  rendimentoAnual: 0,
  metaValor: 0,
  compromissos: [],
  gastos: [],
}

const cenarioBase: Cenario = {
  id: 'c1',
  nome: 'Geladeira',
  itemNome: 'Geladeira',
  itemValor: 3000,
  tipoCompra: 'lazer',
  parcelas: 1,
  taxaJuros: 0,
  manutencaoMensal: 0,
  entradaValor: 0,
  despesaSubstituida: 0,
  criadoEm: 0,
  atualizadoEm: 0,
  inflacaoAnual: 0,
  taxaDepreciacaoAnual: 0,
}

describe('calcularResultadoCenario', () => {
  it('retorna estrutura completa para cenário simples à vista', () => {
    const r = calcularResultadoCenario(perfilBase, cenarioBase)
    expect(r.veredito).toBeDefined()
    expect(r.veredito.veredito.tipo).toMatch(/^(aprovado|negado|juntar)$/)
    expect(r.fluxo).toBeDefined()
    expect(r.statusPatrimonio).toBeDefined()
    expect(r.risco).toBeDefined()
    expect(r.score).toBeDefined()
    expect(r.score.pontuacao).toBeGreaterThanOrEqual(0)
    expect(r.score.pontuacao).toBeLessThanOrEqual(100)
    expect(r.custoFinanciamento).toBeNull()
    expect(r.metaResult).toBeNull() // metaValor=0
  })

  it('calcula custo de financiamento quando há juros e múltiplas parcelas', () => {
    const cenario = { ...cenarioBase, parcelas: 12, taxaJuros: 1.5 }
    const r = calcularResultadoCenario(perfilBase, cenario)
    expect(r.custoFinanciamento).not.toBeNull()
    expect(r.custoFinanciamento!.parcelaValor).toBeGreaterThan(0)
    expect(r.custoFinanciamento!.totalJuros).toBeGreaterThan(0)
  })

  it('retorna passivoResult somente quando tipoCompra é passivoAltoValor', () => {
    const lazer = calcularResultadoCenario(perfilBase, cenarioBase)
    expect(lazer.passivoResult).toBeNull()

    const passivo = calcularResultadoCenario(
      perfilBase,
      { ...cenarioBase, tipoCompra: 'passivoAltoValor', entradaValor: 5000 },
    )
    expect(passivo.passivoResult).not.toBeNull()
  })

  it('calcula metaResult quando perfil.metaValor > 0', () => {
    const perfil = { ...perfilBase, metaValor: 30000 }
    const r = calcularResultadoCenario(perfil, cenarioBase)
    expect(r.metaResult).not.toBeNull()
  })

  it('é puro — chamadas idênticas retornam mesmo resultado', () => {
    const r1 = calcularResultadoCenario(perfilBase, cenarioBase)
    const r2 = calcularResultadoCenario(perfilBase, cenarioBase)
    expect(r1).toEqual(r2)
  })
})
