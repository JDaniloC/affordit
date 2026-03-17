import { describe, it, expect } from 'vitest'
import {
  calcCustoComJuros,
  validarPassivoAltoValor,
  simularLogica,
  calcProjecaoPatrimonio,
  calcImpactoCompraNoPatrimonio,
  calcScoreSaude,
} from '../src/logic/index.ts'

// ===========================================================
// P0.2 — Custo real do financiamento com juros
// ===========================================================

describe('calcCustoComJuros — custo real do financiamento', () => {
  it('sem juros (taxa = 0): total pago igual ao valor do item', () => {
    const r = calcCustoComJuros(1200, 12, 0)
    expect(r.parcelaValor).toBeCloseTo(100, 2)
    expect(r.totalJuros).toBe(0)
    expect(r.totalPago).toBe(1200)
  })

  it('à vista (parcelas = 1): sem juros mesmo com taxa informada', () => {
    const r = calcCustoComJuros(5000, 1, 2)
    expect(r.parcelaValor).toBe(5000)
    expect(r.totalJuros).toBe(0)
    expect(r.totalPago).toBe(5000)
  })

  it('12x a 2% a.m.: PMT pelo sistema Price', () => {
    // PMT = 5000 * [0.02 * 1.02^12] / [1.02^12 - 1] ≈ 472.80
    const r = calcCustoComJuros(5000, 12, 2)
    expect(r.parcelaValor).toBeCloseTo(472.80, 0)
    expect(r.totalPago).toBeCloseTo(r.parcelaValor * 12, 2)
    expect(r.totalJuros).toBeCloseTo(r.totalPago - 5000, 2)
    expect(r.totalJuros).toBeGreaterThan(0)
  })

  it('juros altos (8% a.m., 24x) podem dobrar o custo do item', () => {
    const r = calcCustoComJuros(1000, 24, 8)
    expect(r.totalPago).toBeGreaterThan(1800) // mais que 80% do item em juros
    expect(r.totalJuros).toBeGreaterThan(800)
  })

  it('taxa muito baixa (0.5% a.m., 6x): acréscimo pequeno', () => {
    const r = calcCustoComJuros(3000, 6, 0.5)
    expect(r.totalJuros).toBeGreaterThan(0)
    expect(r.totalJuros).toBeLessThan(60) // < 2% do item (3000 * 0.02 = 60)
    expect(r.parcelaValor).toBeGreaterThan(3000 / 6) // juros encarecem a parcela
  })

  it('parcelas = 0 trata como à vista (sem divisão por zero)', () => {
    const r = calcCustoComJuros(1000, 0, 2)
    expect(r.parcelaValor).toBe(1000)
    expect(r.totalJuros).toBe(0)
    expect(r.totalPago).toBe(1000)
  })
})

// ===========================================================
// P0.1 — Passivo de Alto Valor (veículo, imóvel, bem caro)
// ===========================================================

describe('validarPassivoAltoValor — checagem das 3 regras', () => {
  const base = {
    patrimonio: 120_000,
    renda: 10_000,
    custo: 4_000,
    entrada: 30_000,
    parcela: 1_500,
    manutencao: 500,
    despesaSubstituida: 0,
    baldeLazer: 2_000,
    baldeInvestimento: 1_000,
  }

  it('aprovado quando todas as três regras passam', () => {
    const r = validarPassivoAltoValor(base)
    expect(r.passouEntrada).toBe(true)
    expect(r.passouDTI).toBe(true)
    expect(r.passouMargem).toBe(true)
    expect(r.aprovado).toBe(true)
  })

  it('reprovado na entrada quando destrói reserva (< 6 meses de custo)', () => {
    // patrimônio 50000, entrada 30000 → sobra 20000 < 6*4000=24000 → falha
    const r = validarPassivoAltoValor({ ...base, patrimonio: 50_000, entrada: 30_000 })
    expect(r.passouEntrada).toBe(false)
    expect(r.aprovado).toBe(false)
  })

  it('aprovado na entrada quando sobra >= 6 meses de custo', () => {
    // patrimônio 120000, entrada 30000 → sobra 90000 >= 24000 → passa
    const r = validarPassivoAltoValor(base)
    expect(r.passouEntrada).toBe(true)
  })

  it('reprovado no DTI quando parcela + manutencao > lazer + investimento', () => {
    // 3000 + 1000 - 0 = 4000 > 2000 + 1000 = 3000 → falha
    const r = validarPassivoAltoValor({ ...base, parcela: 3_000, manutencao: 1_000 })
    expect(r.passouDTI).toBe(false)
    expect(r.aprovado).toBe(false)
  })

  it('despesa substituída (ex: aluguel atual) alivia o DTI', () => {
    // parcela 2000, manutenção 500, aluguel atual 1500
    // custo efetivo: 2000 + 500 - 1500 = 1000 ≤ 2000 + 1000 = 3000 → passa
    const r = validarPassivoAltoValor({
      ...base,
      parcela: 2_000,
      manutencao: 500,
      despesaSubstituida: 1_500,
    })
    expect(r.passouDTI).toBe(true)
  })

  it('reprovado na margem quando sobra < 5% da renda', () => {
    // renda 10000, custo 9200, parcela 500 → sobra = 300 < 500 (5%) → falha
    const r = validarPassivoAltoValor({ ...base, custo: 9_200, parcela: 500 })
    expect(r.passouMargem).toBe(false)
    expect(r.aprovado).toBe(false)
  })

  it('aprovado na margem quando sobra >= 5% da renda', () => {
    // renda 10000, custo 4000, parcela 1500 → sobra = 4500 ≥ 500 → passa
    const r = validarPassivoAltoValor(base)
    expect(r.passouMargem).toBe(true)
  })

  it('compra de imóvel substituindo aluguel: avalia custo efetivo', () => {
    // Jovem paga aluguel 2000/mês. Quer comprar imóvel: parcela 2500, condomínio 800.
    // custo efetivo = 2500 + 800 - 2000 = 1300 ≤ baldeLazer 1500 + inv 500 → passa DTI
    // patrimônio 200000, entrada 80000 → sobra 120000 ≥ 6*3500=21000 → passa entrada
    const r = validarPassivoAltoValor({
      patrimonio: 200_000,
      renda: 8_000,
      custo: 3_500,
      entrada: 80_000,
      parcela: 2_500,
      manutencao: 800,
      despesaSubstituida: 2_000,
      baldeLazer: 1_500,
      baldeInvestimento: 500,
    })
    expect(r.passouEntrada).toBe(true)
    expect(r.passouDTI).toBe(true)
    expect(r.aprovado).toBe(true)
  })
})

// ===========================================================
// P0.3 — Parcelas existentes no orçamento
// ===========================================================

describe('simularLogica — parcelas existentes reduzem sobra de lazer', () => {
  it('sem parcelasExistentes: comportamento original inalterado', () => {
    const r = simularLogica({
      renda: 5000, custo: 3000, patrimonio: 0, reservaMeses: 0,
      itemValor: 500, itemNome: 'Teste', ferramenta: false, envelopes: [],
    })
    expect(r.debug.sobraLazerMensal).toBeCloseTo(2000, 2)
    expect(r.debug.parcelasExistentes).toBe(0)
  })

  it('parcelasExistentes reduz a sobra de lazer corretamente', () => {
    // renda 5000, custo 3000 → lazer 40% = 2000; existentes 500 → sobra 1500
    const r = simularLogica({
      renda: 5000, custo: 3000, patrimonio: 0, reservaMeses: 0,
      itemValor: 500, itemNome: 'Teste', ferramenta: false, envelopes: [],
      parcelasExistentes: 500,
    })
    expect(r.debug.sobraLazerMensal).toBeCloseTo(1500, 2)
    expect(r.debug.parcelasExistentes).toBe(500)
  })

  it('parcelasExistentes podem bloquear compra que seria aprovada via ferramenta', () => {
    // sobraLazer sem existentes = 2000, item 1500 em 2x → parcela 750 ≤ 2000 → aprovado
    // com existentes 1500 → sobraLazer = 500, parcela 750 > 500 → parcelaCabe=false → negado
    const base = {
      renda: 5000, custo: 3000, patrimonio: 0, reservaMeses: 0,
      itemNome: 'TV', ferramenta: true, envelopes: [], parcelas: 2, itemValor: 1500,
    }
    const semParcelas = simularLogica(base)
    const comParcelas = simularLogica({ ...base, parcelasExistentes: 1500 })
    expect(semParcelas.debug.parcelaCabe).toBe(true)
    expect(comParcelas.debug.parcelaCabe).toBe(false)
  })

  it('sobra nunca fica negativa com parcelasExistentes maiores que lazer', () => {
    const r = simularLogica({
      renda: 5000, custo: 3000, patrimonio: 0, reservaMeses: 0,
      itemValor: 100, itemNome: 'Item', ferramenta: false, envelopes: [],
      parcelasExistentes: 9999,
    })
    expect(r.debug.sobraLazerMensal).toBe(0)
  })

  it('parcelasExistentes = 0 é igual a omitir o campo', () => {
    const r1 = simularLogica({
      renda: 5000, custo: 2000, patrimonio: 30000, reservaMeses: 6,
      itemValor: 1000, itemNome: 'Livro', ferramenta: false, envelopes: [],
    })
    const r2 = simularLogica({
      renda: 5000, custo: 2000, patrimonio: 30000, reservaMeses: 6,
      itemValor: 1000, itemNome: 'Livro', ferramenta: false, envelopes: [],
      parcelasExistentes: 0,
    })
    expect(r1.debug.sobraLazerMensal).toBe(r2.debug.sobraLazerMensal)
    expect(r1.veredito.tipo).toBe(r2.veredito.tipo)
  })
})

// ===========================================================
// P1.4 — Rendimento com juros compostos nas projeções
// ===========================================================

describe('calcProjecaoPatrimonio — crescimento com juros compostos', () => {
  it('taxa = 0: comportamento linear idêntico ao original', () => {
    const linear = calcProjecaoPatrimonio(10_000, 500, 3, 0)
    expect(linear).toEqual([10_500, 11_000, 11_500])
  })

  it('omitir taxa: comportamento linear (backward-compatible)', () => {
    const semTaxa = calcProjecaoPatrimonio(10_000, 500, 3)
    expect(semTaxa).toEqual([10_500, 11_000, 11_500])
  })

  it('taxa > 0: crescimento maior que linear após vários meses', () => {
    const linear = calcProjecaoPatrimonio(10_000, 500, 12, 0)
    const compound = calcProjecaoPatrimonio(10_000, 500, 12, 1)
    expect(compound[11]).toBeGreaterThan(linear[11])
  })

  it('taxa 1% a.m. — valor do mês 1 correto', () => {
    // Mês 1: 10000 * 1.01 + 500 = 10100 + 500 = 10600
    const r = calcProjecaoPatrimonio(10_000, 500, 1, 1)
    expect(r[0]).toBeCloseTo(10_600, 1)
  })

  it('taxa 1% a.m. — valor do mês 12 correto', () => {
    // FV = 10000 * 1.01^12 + 500 * (1.01^12 - 1) / 0.01 ≈ 17610
    const r = calcProjecaoPatrimonio(10_000, 500, 12, 1)
    expect(r[11]).toBeCloseTo(17_610, 0)
  })

  it('aporte zero com juros: só o patrimônio inicial rende', () => {
    // FV = 10000 * 1.01^3 = 10303.01
    const r = calcProjecaoPatrimonio(10_000, 0, 3, 1)
    expect(r[0]).toBeCloseTo(10_100, 1)
    expect(r[1]).toBeCloseTo(10_201, 0)
    expect(r[2]).toBeCloseTo(10_303, 0)
  })
})

describe('calcImpactoCompraNoPatrimonio — compound growth', () => {
  it('taxa = 0: resultado igual ao original', () => {
    const semTaxa = calcImpactoCompraNoPatrimonio(20_000, 1_000, 6, 5_000, 1, 0)
    const comTaxa0 = calcImpactoCompraNoPatrimonio(20_000, 1_000, 6, 5_000, 1)
    expect(semTaxa.semCompra).toEqual(comTaxa0.semCompra)
    expect(semTaxa.comCompra).toEqual(comTaxa0.comCompra)
  })

  it('taxa > 0: semCompra maior com juros compostos', () => {
    const linear = calcImpactoCompraNoPatrimonio(20_000, 1_000, 24, 5_000, 1, 0)
    const compound = calcImpactoCompraNoPatrimonio(20_000, 1_000, 24, 5_000, 1, 1)
    expect(compound.semCompra[23]).toBeGreaterThan(linear.semCompra[23])
    expect(compound.comCompra[23]).toBeGreaterThan(linear.comCompra[23])
  })

  it('compra à vista: patrimônio inicial reduzido antes de crescer', () => {
    // À vista: começa com 20000 - 5000 = 15000
    const r = calcImpactoCompraNoPatrimonio(20_000, 1_000, 1, 5_000, 1, 1)
    // Mês 1: 15000 * 1.01 + 1000 = 15150 + 1000 = 16150
    expect(r.comCompra[0]).toBeCloseTo(16_150, 0)
  })
})

// ===========================================================
// P1.5 — Score de saúde financeira
// ===========================================================

describe('calcScoreSaude — score de saúde financeira', () => {
  it('situação ideal: 100 pontos → Boa', () => {
    const r = calcScoreSaude(5_000, 2_000, 30_000, 6, 0, [])
    // reserva 30000 ≥ 12000 → seguranca → 40pts
    // custo 40% ≤ 50% → 25pts
    // lazer (5000-2000)/5000 = 60% ≥ 20% → 20pts
    // parcelas 0 → 15pts
    expect(r.pontuacao).toBe(100)
    expect(r.nivel).toBe('boa')
    expect(r.fatores.every((f) => f.ok)).toBe(true)
  })

  it('reserva em perigo: fator marcado como falha', () => {
    const r = calcScoreSaude(5_000, 2_000, 1_000, 6, 0, [])
    // 1000 < 12000/2 = 6000 → perigo → 0pts na reserva
    expect(r.fatores.find((f) => f.label === 'Reserva de emergência')?.ok).toBe(false)
    expect(r.pontuacao).toBeLessThan(100)
  })

  it('reserva em atenção: pontuação parcial', () => {
    const r = calcScoreSaude(5_000, 2_000, 8_000, 6, 0, [])
    // alvo 12000, 8000 ≥ 6000 (50%) → atenção → 20pts
    const reservaFator = r.fatores.find((f) => f.label === 'Reserva de emergência')!
    expect(reservaFator.ok).toBe(false)
    expect(reservaFator.pontos).toBe(20)
  })

  it('custo de vida > 70% da renda: fator reprovado', () => {
    const r = calcScoreSaude(5_000, 4_000, 60_000, 6, 0, [])
    // 4000/5000 = 80% > 70%
    const custoFator = r.fatores.find((f) => f.label === 'Custo de vida')!
    expect(custoFator.ok).toBe(false)
  })

  it('custo de vida entre 50-70%: pontuação parcial', () => {
    const r = calcScoreSaude(5_000, 3_000, 60_000, 6, 0, [])
    // 3000/5000 = 60% → faixa 50-70% → pontuação parcial
    const custoFator = r.fatores.find((f) => f.label === 'Custo de vida')!
    expect(custoFator.pontos).toBeGreaterThan(0)
    expect(custoFator.pontos).toBeLessThan(25)
  })

  it('parcelas existentes altas penalizam a pontuação', () => {
    const semParcelas = calcScoreSaude(5_000, 2_000, 30_000, 6, 0, [])
    const comParcelas = calcScoreSaude(5_000, 2_000, 30_000, 6, 1_200, [])
    expect(comParcelas.pontuacao).toBeLessThan(semParcelas.pontuacao)
  })

  it('tudo ruim → Atenção', () => {
    // Reserva perigo + custo altíssimo + parcelas altas
    const r = calcScoreSaude(5_000, 4_500, 100, 6, 1_000, [])
    expect(r.nivel).toBe('atencao')
  })

  it('situação intermediária → Regular', () => {
    // reserva 7000 < alvo 18000, custo 60%, lazer 40%, sem parcelas
    // reserva perigo (7000 < 9000) = 0pts; custo 60% = parcial; lazer 40% = 20; parcelas = 15
    const r = calcScoreSaude(5_000, 3_000, 7_000, 6, 0, [])
    expect(r.nivel).toBe('regular')
  })

  it('renda zero: não divide por zero', () => {
    const r = calcScoreSaude(0, 0, 0, 6, 0, [])
    expect(r.pontuacao).toBeGreaterThanOrEqual(0)
    expect(r.nivel).toBeDefined()
  })
})
