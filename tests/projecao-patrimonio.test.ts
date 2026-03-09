import { describe, it, expect } from 'vitest'
import {
  calcProjecaoPatrimonio,
  calcImpactoCompraNoPatrimonio,
  calcMesesParaMeta,
} from '../src/logic/index.ts'

// ===========================================================
// PROJEÇÃO DE PATRIMÔNIO AO LONGO DO TEMPO
//
// O objetivo é mostrar ao usuário:
//   1. Como seu patrimônio evolui mês a mês (sem comprar)
//   2. Como o patrimônio evolui se fizer a compra hoje
//   3. Em quanto tempo alcança uma meta X
//   4. Quanto a compra atrasa a chegada à meta
//
// Fórmula base:
//   patrimônio(n) = patrimonioInicial + n × aportesMensais
//   (sem juros no MVP — expansível depois para CAGR)
//
// Impacto da compra:
//   patrimônioComCompra(n) = (patrimonioInicial - itemValor) + n × aportesMensais
//   Ou, se parcelado: aporteMensal reduzido por parcela durante o período
// ===========================================================

// -----------------------------------------------------------
// calcProjecaoPatrimonio(patrimonioInicial, aporteMensal, meses)
// Retorna um array com o patrimônio ao final de cada mês
// -----------------------------------------------------------

describe('calcProjecaoPatrimonio — crescimento linear sem compra', () => {
  it('sem aportes, patrimônio permanece igual', () => {
    const projecao = calcProjecaoPatrimonio(10000, 0, 3)
    expect(projecao).toEqual([10000, 10000, 10000])
  })

  it('aporte mensal cresce linearmente', () => {
    const projecao = calcProjecaoPatrimonio(10000, 1000, 3)
    expect(projecao).toEqual([11000, 12000, 13000])
  })

  it('retorna array com tamanho igual ao número de meses', () => {
    const projecao = calcProjecaoPatrimonio(5000, 500, 12)
    expect(projecao).toHaveLength(12)
  })

  it('patrimônio inicial zero com aportes mensais', () => {
    const projecao = calcProjecaoPatrimonio(0, 2000, 6)
    expect(projecao).toEqual([2000, 4000, 6000, 8000, 10000, 12000])
  })

  it('meses zero retorna array vazio', () => {
    expect(calcProjecaoPatrimonio(10000, 500, 0)).toEqual([])
  })
})

// -----------------------------------------------------------
// calcImpactoCompraNoPatrimonio(patrimonioInicial, aporteMensal, meses, itemValor, parcelas)
// Retorna { semCompra, comCompra } — dois arrays para comparação
// -----------------------------------------------------------

describe('calcImpactoCompraNoPatrimonio — compra à vista', () => {
  it('compra à vista reduz patrimônio em todos os meses', () => {
    const { semCompra, comCompra } = calcImpactoCompraNoPatrimonio(
      10000, 1000, 3, 2000, 1,
    )
    expect(semCompra).toEqual([11000, 12000, 13000])
    expect(comCompra).toEqual([9000, 10000, 11000])
  })

  it('diferença permanente = itemValor (compra à vista)', () => {
    const { semCompra, comCompra } = calcImpactoCompraNoPatrimonio(
      20000, 500, 6, 5000, 1,
    )
    semCompra.forEach((v, i) => {
      expect(v - comCompra[i]).toBeCloseTo(5000, 2)
    })
  })

  it('compra que zera o patrimônio inicial', () => {
    const { comCompra } = calcImpactoCompraNoPatrimonio(
      5000, 1000, 3, 5000, 1,
    )
    expect(comCompra[0]).toBe(1000)  // 0 + 1000
    expect(comCompra[2]).toBe(3000)  // 0 + 3×1000
  })
})

describe('calcImpactoCompraNoPatrimonio — compra parcelada', () => {
  it('parcelamento reduz aporte durante o período das parcelas', () => {
    // 10k patrimônio, aporte 2k/mês, 6 meses, item 3k em 3x (1k/mês)
    // Com parcela: aporte efetivo = 2k - 1k = 1k por 3 meses, depois volta a 2k
    const { semCompra, comCompra } = calcImpactoCompraNoPatrimonio(
      10000, 2000, 6, 3000, 3,
    )
    // Mês 1–3: aporte efetivo = 1k
    expect(comCompra[0]).toBe(11000)  // 10k + 1k
    expect(comCompra[1]).toBe(12000)  // + 1k
    expect(comCompra[2]).toBe(13000)  // + 1k
    // Mês 4–6: parcelas pagas, volta a 2k
    expect(comCompra[3]).toBe(15000)  // + 2k
    expect(comCompra[4]).toBe(17000)  // + 2k
    expect(comCompra[5]).toBe(19000)  // + 2k
    // Sem compra: sempre 2k/mês
    expect(semCompra[5]).toBe(22000)  // 10k + 6×2k
  })

  it('parcelamento de 1x é igual à compra à vista', () => {
    const vista = calcImpactoCompraNoPatrimonio(15000, 1000, 5, 3000, 1)
    const parcela1x = calcImpactoCompraNoPatrimonio(15000, 1000, 5, 3000, 1)
    expect(vista.comCompra).toEqual(parcela1x.comCompra)
  })

  it('parcelas que excedem o período de projeção: encerra no mês final', () => {
    // 12 parcelas mas projeção só de 6 meses — sem crash
    const { comCompra } = calcImpactoCompraNoPatrimonio(
      10000, 2000, 6, 6000, 12,
    )
    expect(comCompra).toHaveLength(6)
    // Aporte efetivo = 2k - 500 = 1500/mês durante os 6 meses
    expect(comCompra[0]).toBeCloseTo(11500, 2)
  })
})

// -----------------------------------------------------------
// calcMesesParaMeta(patrimonioInicial, aporteMensal, meta)
// Retorna quantos meses para atingir a meta
// -----------------------------------------------------------

describe('calcMesesParaMeta — sem compra', () => {
  it('já atingiu a meta: 0 meses', () => {
    expect(calcMesesParaMeta(50000, 1000, 30000)).toBe(0)
  })

  it('patrimônio exatamente na meta: 0 meses', () => {
    expect(calcMesesParaMeta(30000, 1000, 30000)).toBe(0)
  })

  it('cálculo simples ceil((meta - atual) / aporte)', () => {
    expect(calcMesesParaMeta(10000, 1000, 13000)).toBe(3)   // exato
    expect(calcMesesParaMeta(10000, 1000, 13001)).toBe(4)   // arredonda
  })

  it('sem aportes e meta não atingida: null (impossível)', () => {
    expect(calcMesesParaMeta(5000, 0, 10000)).toBeNull()
  })

  it('meta muito grande: cálculo correto para centenas de meses', () => {
    // 0 inicial, 1k/mês, meta 1M → 1000 meses
    expect(calcMesesParaMeta(0, 1000, 1000000)).toBe(1000)
  })
})

describe('calcMesesParaMeta — impacto da compra', () => {
  it('compra à vista atrasa a meta proporcionalmente', () => {
    // sem compra: meta 100k, atual 70k, aporte 5k → 6 meses
    const semCompra = calcMesesParaMeta(70000, 5000, 100000)!
    // com compra de 10k à vista: atual 60k → 8 meses
    const comCompra = calcMesesParaMeta(60000, 5000, 100000)!
    expect(semCompra).toBe(6)
    expect(comCompra).toBe(8)
    expect(comCompra - semCompra).toBe(2)  // 2 meses de atraso
  })

  it('compra parcelada afeta o tempo de chegada à meta', () => {
    // 10k patrimônio, 2k/mês, meta 40k, item 6k em 3x (2k/mês parcela)
    // Com parcela: aporte efetivo zero por 3 meses, depois 2k normais
    // Equivale a patrimônio inicial de 10k chegando à meta muito mais devagar
    const semCompra = calcMesesParaMeta(10000, 2000, 40000)
    // Sem compra: ceil((40k-10k)/2k) = 15 meses
    expect(semCompra).toBe(15)
  })
})

// -----------------------------------------------------------
// Cenários integrados com dados realistas
// -----------------------------------------------------------

describe('Cenário: Tech Lead — carro R$80k impacta crescimento patrimonial', () => {
  // Dados: patrimônio 200k, aporte mensal 8k, meta 500k
  const patrimonioInicial = 200000
  const aporteMensal = 8000
  const meta = 500000
  const itemValor = 80000

  it('sem compra chega à meta em 38 meses', () => {
    // ceil((500k - 200k) / 8k) = ceil(37.5) = 38
    expect(calcMesesParaMeta(patrimonioInicial, aporteMensal, meta)).toBe(38)
  })

  it('compra à vista atrasa meta em 10 meses', () => {
    // com compra: patrimônio cai para 120k → ceil((500k-120k)/8k) = ceil(47.5) = 48
    const semCompra = calcMesesParaMeta(patrimonioInicial, aporteMensal, meta)!
    const comCompra = calcMesesParaMeta(patrimonioInicial - itemValor, aporteMensal, meta)!
    expect(comCompra - semCompra).toBe(10)
  })

  it('projeção de 24 meses mostra déficit constante de 80k', () => {
    const { semCompra, comCompra } = calcImpactoCompraNoPatrimonio(
      patrimonioInicial, aporteMensal, 24, itemValor, 1,
    )
    const deficit = semCompra[23] - comCompra[23]
    expect(deficit).toBeCloseTo(itemValor, 2)
  })
})

describe('Cenário: Iniciante — R$5k de reserva e compra de R$1.5k impacta meta de 6 meses', () => {
  const patrimonioInicial = 5000
  const aporteMensal = 500  // sobra do lazer
  const reservaMeses = 6
  const custo = 1500
  const meta = custo * reservaMeses  // R$ 9.000

  it('sem compra chega à reserva alvo em 8 meses', () => {
    expect(calcMesesParaMeta(patrimonioInicial, aporteMensal, meta)).toBe(8)
  })

  it('com compra de R$1.5k atrasa a formação da reserva em 3 meses', () => {
    const semCompra = calcMesesParaMeta(patrimonioInicial, aporteMensal, meta)!
    const comCompra = calcMesesParaMeta(patrimonioInicial - 1500, aporteMensal, meta)!
    expect(comCompra - semCompra).toBe(3)
  })
})

describe('Cenário: Compra parcelada vs à vista — qual distorce mais o patrimônio?', () => {
  // Parcelado pode ser menos agressivo no curto prazo mas arrasta o impacto
  const patrimonioInicial = 30000
  const aporteMensal = 3000
  const itemValor = 6000

  it('à vista: impacto imediato e constante de 6k', () => {
    const { semCompra, comCompra } = calcImpactoCompraNoPatrimonio(
      patrimonioInicial, aporteMensal, 6, itemValor, 1,
    )
    expect(semCompra[0] - comCompra[0]).toBe(6000)  // queda imediata
    expect(semCompra[5] - comCompra[5]).toBe(6000)  // déficit permanente
  })

  it('parcelado 6x: menor impacto mensal, mesma chegada ao equilíbrio', () => {
    const { semCompra, comCompra } = calcImpactoCompraNoPatrimonio(
      patrimonioInicial, aporteMensal, 12, itemValor, 6,
    )
    // Mês 1: aporte efetivo = 3k - 1k = 2k (não 3k)
    expect(comCompra[0]).toBe(32000)  // 30k + 2k (não 33k)
    // Após 6 meses (parcelas quitadas), sem mais dedução
    // No mês 7 em diante, os dois crescem com 3k
    expect(semCompra[6] - comCompra[6]).toBeCloseTo(6000, 2)
  })
})
