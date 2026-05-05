import { describe, it, expect } from 'vitest'
import { calcRiscoPatrimonio, compoeVeredito, simularLogica } from '../src/logic/index.ts'
import type { Veredito } from '../src/logic/index.ts'

const baseParams = {
  patrimonio: 100_000,
  valorCompra: 1_000,
  tipoCompra: 'lazer' as const,
  parcelasExistentes: 0,
  parcelaNova: 0,
  sobraLazerMensal: 1_000,
  dtiPos: 0,
  atrasoMetaMeses: null,
  reservaAlvo: 18_000,
  patrimonioPosCompra: 99_000,
}

describe('calcRiscoPatrimonio — régua base por tipo (matriz B)', () => {
  it('lazer com <5% do patrimônio: verde, sem motivos', () => {
    const r = calcRiscoPatrimonio({ ...baseParams, valorCompra: 1_000, patrimonioPosCompra: 99_000 })
    expect(r.tier).toBe('verde')
    expect(r.motivos).toEqual([])
  })

  it('lazer com 10% do patrimônio: amarelo + chip pct_patrimonio', () => {
    const r = calcRiscoPatrimonio({ ...baseParams, valorCompra: 10_000, patrimonioPosCompra: 90_000 })
    expect(r.tier).toBe('amarelo')
    expect(r.motivos).toContainEqual({ tipo: 'pct_patrimonio', pct: 0.1 })
  })

  it('lazer com 20% do patrimônio: vermelho + chip pct_patrimonio', () => {
    const r = calcRiscoPatrimonio({ ...baseParams, valorCompra: 20_000, patrimonioPosCompra: 80_000 })
    expect(r.tier).toBe('vermelho')
    expect(r.motivos).toContainEqual({ tipo: 'pct_patrimonio', pct: 0.2 })
  })

  it('ferramenta com 8% do patrimônio: verde (faixa mais permissiva)', () => {
    const r = calcRiscoPatrimonio({ ...baseParams, tipoCompra: 'ferramenta', valorCompra: 8_000, patrimonioPosCompra: 92_000 })
    expect(r.tier).toBe('verde')
  })

  it('ferramenta com 20% do patrimônio: amarelo', () => {
    const r = calcRiscoPatrimonio({ ...baseParams, tipoCompra: 'ferramenta', valorCompra: 20_000, patrimonioPosCompra: 80_000 })
    expect(r.tier).toBe('amarelo')
  })

  it('ferramenta com 30% do patrimônio: vermelho', () => {
    const r = calcRiscoPatrimonio({ ...baseParams, tipoCompra: 'ferramenta', valorCompra: 30_000, patrimonioPosCompra: 70_000 })
    expect(r.tier).toBe('vermelho')
  })
})

describe('calcRiscoPatrimonio — edge cases de patrimônio', () => {
  it('patrimônio zero + lazer: vermelho (proteção)', () => {
    const r = calcRiscoPatrimonio({
      ...baseParams,
      patrimonio: 0,
      valorCompra: 500,
      reservaAlvo: 18_000,
      patrimonioPosCompra: -500,
    })
    expect(r.tier).toBe('vermelho')
  })

  it('patrimônio < reservaAlvo: vermelho mesmo para lazer pequeno', () => {
    const r = calcRiscoPatrimonio({
      ...baseParams,
      patrimonio: 5_000,
      valorCompra: 100,
      reservaAlvo: 18_000,
      patrimonioPosCompra: 4_900,
    })
    expect(r.tier).toBe('vermelho')
  })
})

describe('calcRiscoPatrimonio — gatilhos de rebaixamento (cap 1 tier)', () => {
  it('parcelas existentes + lazer rebaixa verde para amarelo', () => {
    const r = calcRiscoPatrimonio({
      ...baseParams,
      valorCompra: 1_000,
      parcelasExistentes: 200,
      patrimonioPosCompra: 99_000,
    })
    expect(r.tier).toBe('amarelo')
    expect(r.motivos).toContainEqual({ tipo: 'lazer_com_parcelas' })
  })

  it('parcela nova consome >50% da sobra de lazer rebaixa 1 tier', () => {
    const r = calcRiscoPatrimonio({
      ...baseParams,
      valorCompra: 1_000,
      parcelaNova: 600,
      sobraLazerMensal: 1_000,
      patrimonioPosCompra: 99_000,
    })
    expect(r.tier).toBe('amarelo')
    expect(r.motivos).toContainEqual({ tipo: 'parcela_consome_lazer', pct: 0.6 })
  })

  it('patrimônio pós-compra abaixo da reserva força vermelho', () => {
    const r = calcRiscoPatrimonio({
      ...baseParams,
      patrimonio: 20_000,
      valorCompra: 5_000,
      reservaAlvo: 18_000,
      patrimonioPosCompra: 15_000,
    })
    expect(r.tier).toBe('vermelho')
    expect(r.motivos).toContainEqual({ tipo: 'reserva_abaixo_alvo' })
  })

  it('DTI pós > 30% rebaixa 1 tier', () => {
    const r = calcRiscoPatrimonio({
      ...baseParams,
      valorCompra: 1_000,
      dtiPos: 0.35,
      patrimonioPosCompra: 99_000,
    })
    expect(r.tier).toBe('amarelo')
    expect(r.motivos).toContainEqual({ tipo: 'dti_alto', pct: 0.35 })
  })

  it('atraso de meta entre 6 e 12 meses rebaixa 1 tier', () => {
    const r = calcRiscoPatrimonio({
      ...baseParams,
      valorCompra: 1_000,
      atrasoMetaMeses: 9,
      patrimonioPosCompra: 99_000,
    })
    expect(r.tier).toBe('amarelo')
    expect(r.motivos).toContainEqual({ tipo: 'atraso_meta', meses: 9 })
  })

  it('atraso de meta > 12 meses força vermelho', () => {
    const r = calcRiscoPatrimonio({
      ...baseParams,
      valorCompra: 1_000,
      atrasoMetaMeses: 14,
      patrimonioPosCompra: 99_000,
    })
    expect(r.tier).toBe('vermelho')
    expect(r.motivos).toContainEqual({ tipo: 'atraso_meta', meses: 14 })
  })

  it('atraso de meta ≤ 6 meses gera chip mas NÃO rebaixa', () => {
    const r = calcRiscoPatrimonio({
      ...baseParams,
      valorCompra: 1_000,
      atrasoMetaMeses: 4,
      patrimonioPosCompra: 99_000,
    })
    expect(r.tier).toBe('verde')
    expect(r.motivos).toContainEqual({ tipo: 'atraso_meta', meses: 4 })
  })

  it('cap: 3 gatilhos amarelos simultâneos rebaixam apenas 1 tier, mas todos os chips aparecem', () => {
    const r = calcRiscoPatrimonio({
      ...baseParams,
      valorCompra: 1_000,
      parcelasExistentes: 200,
      parcelaNova: 600,
      sobraLazerMensal: 1_000,
      dtiPos: 0.35,
      patrimonioPosCompra: 99_000,
    })
    expect(r.tier).toBe('amarelo')
    expect(r.motivos).toContainEqual({ tipo: 'lazer_com_parcelas' })
    expect(r.motivos).toContainEqual({ tipo: 'parcela_consome_lazer', pct: 0.6 })
    expect(r.motivos).toContainEqual({ tipo: 'dti_alto', pct: 0.35 })
  })

  it('gatilho vermelho ignora cap mesmo com base verde', () => {
    const r = calcRiscoPatrimonio({
      ...baseParams,
      valorCompra: 1_000,
      atrasoMetaMeses: 14,
      parcelaNova: 600,
      patrimonioPosCompra: 99_000,
    })
    expect(r.tier).toBe('vermelho')
  })
})

describe('compoeVeredito — composição com veredito existente', () => {
  const aprovado: Veredito = { tipo: 'aprovado', titulo: 'Compra Aprovada' }
  const juntar: Veredito = { tipo: 'juntar', titulo: 'Junte mais' }
  const negado: Veredito = { tipo: 'negado', titulo: 'Negado' }

  it('verde + aprovado → aprovado (sem rebaixamento)', () => {
    const v = compoeVeredito(aprovado, { tier: 'verde', motivos: [] })
    expect(v.tipo).toBe('aprovado')
  })

  it('vermelho + aprovado → negado (rebaixa)', () => {
    const v = compoeVeredito(aprovado, { tier: 'vermelho', motivos: [{ tipo: 'reserva_abaixo_alvo' }] })
    expect(v.tipo).toBe('negado')
  })

  it('amarelo + aprovado → juntar (rebaixa)', () => {
    const v = compoeVeredito(aprovado, { tier: 'amarelo', motivos: [{ tipo: 'pct_patrimonio', pct: 0.1 }] })
    expect(v.tipo).toBe('juntar')
  })

  it('amarelo + negado → negado (não sobe)', () => {
    const v = compoeVeredito(negado, { tier: 'amarelo', motivos: [] })
    expect(v.tipo).toBe('negado')
  })

  it('verde + juntar → juntar (não sobe)', () => {
    const v = compoeVeredito(juntar, { tier: 'verde', motivos: [] })
    expect(v.tipo).toBe('juntar')
  })
})

describe('integração — cenário do cliente (patrimônio alto + lazer caro)', () => {
  it('antes da composição simularLogica diz "aprovado"; após composição vira "juntar"', () => {
    // Patrimônio R$ 300k, custo de vida R$ 3k, reserva 6 meses (alvo R$18k),
    // lazer R$ 50k (16,7% do patrimônio = vermelho na matriz B).
    const resultado = simularLogica({
      renda: 8_000,
      custo: 3_000,
      patrimonio: 300_000,
      reservaMeses: 6,
      itemValor: 50_000,
      itemNome: 'Item caro',
      ferramenta: false,
      envelopes: [],
      parcelas: 1,
      parcelasExistentes: 0,
    })
    expect(resultado.veredito.tipo).toBe('aprovado')

    const risco = calcRiscoPatrimonio({
      patrimonio: 300_000,
      valorCompra: 50_000,
      tipoCompra: 'lazer',
      parcelasExistentes: 0,
      parcelaNova: 50_000,
      sobraLazerMensal: resultado.debug.sobraLazerMensal,
      dtiPos: 0,
      atrasoMetaMeses: null,
      reservaAlvo: resultado.debug.reservaAlvo,
      patrimonioPosCompra: 250_000,
    })
    expect(risco.tier).toBe('vermelho')

    const composto = compoeVeredito(resultado.veredito, risco)
    expect(composto.tipo).toBe('negado')
    expect(risco.motivos).toContainEqual(expect.objectContaining({ tipo: 'pct_patrimonio' }))
  })

  it('cenário oposto (lazer pequeno) mantém aprovado sem chips', () => {
    const resultado = simularLogica({
      renda: 8_000,
      custo: 3_000,
      patrimonio: 300_000,
      reservaMeses: 6,
      itemValor: 2_000,
      itemNome: 'Item barato',
      ferramenta: false,
      envelopes: [],
      parcelas: 1,
      parcelasExistentes: 0,
    })
    const risco = calcRiscoPatrimonio({
      patrimonio: 300_000,
      valorCompra: 2_000,
      tipoCompra: 'lazer',
      parcelasExistentes: 0,
      parcelaNova: 2_000,
      sobraLazerMensal: resultado.debug.sobraLazerMensal,
      dtiPos: 0,
      atrasoMetaMeses: null,
      reservaAlvo: resultado.debug.reservaAlvo,
      patrimonioPosCompra: 298_000,
    })
    expect(risco.tier).toBe('verde')
    expect(risco.motivos).toEqual([])
    const composto = compoeVeredito(resultado.veredito, risco)
    expect(composto.tipo).toBe('aprovado')
  })
})
