import { describe, it, expect } from 'vitest'
import {
  calcFluxoCaixa,
  calcStatusPatrimonio,
  calcRoiAprovacao,
} from '../src/logic/index.ts'

// ===========================================================
// ESTRATÉGIA 1: FLUXO DE CAIXA
// O item (ou parcela) deve caber 100% no balde de lazer mensal.
// delay = ceil(itemValor / sobraLazerMensal)
// ===========================================================

describe('Fluxo de Caixa — compra à vista', () => {
  it('item menor que lazer → delay 1 mês', () => {
    expect(calcFluxoCaixa(800, 1000).delay).toBe(1)
  })
  it('item exatamente igual ao lazer → delay 1 mês', () => {
    expect(calcFluxoCaixa(1000, 1000).delay).toBe(1)
  })
  it('delay arredonda para cima', () => {
    expect(calcFluxoCaixa(2000, 1000).delay).toBe(2)  // exato
    expect(calcFluxoCaixa(2001, 1000).delay).toBe(3)  // arredonda
  })
  it('lazer zero → delay null (sem divisão por zero)', () => {
    expect(calcFluxoCaixa(1000, 0).delay).toBeNull()
  })
  it('instrumento de R$8k com lazer de R$100 → 80 meses', () => {
    expect(calcFluxoCaixa(8000, 100).delay).toBe(80)
  })
})

describe('Fluxo de Caixa — compra parcelada', () => {
  it('parcela cabe: R$3k em 3x = R$1k ≤ lazer R$1.5k', () => {
    const r = calcFluxoCaixa(3000, 1500, 3)
    expect(r.parcelaValor).toBeCloseTo(1000, 2)
    expect(r.parcelaCabe).toBe(true)
  })
  it('parcela não cabe: R$3k em 2x = R$1.5k > lazer R$1k', () => {
    const r = calcFluxoCaixa(3000, 1000, 2)
    expect(r.parcelaValor).toBeCloseTo(1500, 2)
    expect(r.parcelaCabe).toBe(false)
  })
  it('parcela exatamente igual ao lazer → cabe (limite inclusivo)', () => {
    const r = calcFluxoCaixa(3000, 1000, 3)
    expect(r.parcelaCabe).toBe(true)
  })
  it('sem informar parcelas → trata como à vista (1x)', () => {
    const r1 = calcFluxoCaixa(2000, 1000)
    const r2 = calcFluxoCaixa(2000, 1000, 1)
    expect(r1.parcelaValor).toBe(r2.parcelaValor)
    expect(r1.parcelaCabe).toBe(r2.parcelaCabe)
  })
  it('12 parcelas de R$500 com lazer R$600 → cada parcela cabe', () => {
    const r = calcFluxoCaixa(6000, 600, 12)
    expect(r.parcelaValor).toBeCloseTo(500, 2)
    expect(r.parcelaCabe).toBe(true)
  })
})

// ===========================================================
// ESTRATÉGIA 2: PATRIMÔNIO (NET WORTH & SAFETY)
// GREEN  ≥ 12 meses de custo  |  YELLOW ≥ 6  |  RED < 6
// Regra do 1%: item ≤ 1% do patrimônio = risco zero
// ===========================================================

describe('Patrimônio — classificação do status atual', () => {
  it('GREEN: patrimônio = exatamente 12 × custo', () => {
    expect(calcStatusPatrimonio(24000, 2000, 0).statusAtual).toBe('green')
  })
  it('GREEN: patrimônio muito acima de 12 meses', () => {
    expect(calcStatusPatrimonio(150000, 2000, 0).statusAtual).toBe('green')
  })
  it('YELLOW: patrimônio entre 6 e 12 meses', () => {
    expect(calcStatusPatrimonio(12000, 2000, 0).statusAtual).toBe('yellow') // limite 6×
    expect(calcStatusPatrimonio(18000, 2000, 0).statusAtual).toBe('yellow')
    expect(calcStatusPatrimonio(23999, 2000, 0).statusAtual).toBe('yellow')
  })
  it('RED: patrimônio abaixo de 6 meses', () => {
    expect(calcStatusPatrimonio(11999, 2000, 0).statusAtual).toBe('red')
    expect(calcStatusPatrimonio(0, 2000, 0).statusAtual).toBe('red')
  })
})

describe('Patrimônio — impacto da compra no status', () => {
  it('compra derruba GREEN → YELLOW', () => {
    // 25k → GREEN; 25k - 5k = 20k < 24k → YELLOW
    const r = calcStatusPatrimonio(25000, 2000, 5000)
    expect(r.statusAtual).toBe('green')
    expect(r.statusAposCompra).toBe('yellow')
  })
  it('compra derruba YELLOW → RED', () => {
    // 13k → YELLOW; 13k - 2k = 11k < 12k → RED
    const r = calcStatusPatrimonio(13000, 2000, 2000)
    expect(r.statusAtual).toBe('yellow')
    expect(r.statusAposCompra).toBe('red')
  })
  it('compra derruba GREEN diretamente para RED', () => {
    const r = calcStatusPatrimonio(25000, 2000, 20000)
    expect(r.statusAtual).toBe('green')
    expect(r.statusAposCompra).toBe('red')
  })
  it('compra que não muda o status (item pequeno)', () => {
    const r = calcStatusPatrimonio(150000, 2000, 100)
    expect(r.statusAtual).toBe('green')
    expect(r.statusAposCompra).toBe('green')
  })
})

describe('Patrimônio — alerta de degradação', () => {
  it('alerta quando GREEN → YELLOW', () => {
    expect(calcStatusPatrimonio(25000, 2000, 5000).alertaDegracao).toBe(true)
  })
  it('alerta quando GREEN → RED', () => {
    expect(calcStatusPatrimonio(25000, 2000, 20000).alertaDegracao).toBe(true)
  })
  it('alerta quando YELLOW → RED', () => {
    expect(calcStatusPatrimonio(13000, 2000, 2000).alertaDegracao).toBe(true)
  })
  it('sem alerta quando status não muda', () => {
    expect(calcStatusPatrimonio(150000, 2000, 100).alertaDegracao).toBe(false)
  })
  it('sem alerta quando já estava em RED (não há degradação nova)', () => {
    const r = calcStatusPatrimonio(5000, 2000, 500)
    expect(r.statusAtual).toBe('red')
    expect(r.alertaDegracao).toBe(false)
  })
})

describe('Patrimônio — regra do 1% (risco zero)', () => {
  it('item ≤ 1% do patrimônio → dentro1pct true', () => {
    expect(calcStatusPatrimonio(150000, 2000, 1500).dentro1pct).toBe(true)
  })
  it('item exatamente 1% → limite inclusivo', () => {
    expect(calcStatusPatrimonio(100000, 2000, 1000).dentro1pct).toBe(true)
  })
  it('item acima de 1% → dentro1pct false', () => {
    expect(calcStatusPatrimonio(100000, 2000, 1001).dentro1pct).toBe(false)
  })
  it('patrimônio zero → nunca é risco zero', () => {
    expect(calcStatusPatrimonio(0, 2000, 100).dentro1pct).toBe(false)
  })
})

// ===========================================================
// ESTRATÉGIA 3: ROI PROFISSIONAL
// Ferramenta: permite compra em GREEN ou YELLOW, bloqueia em RED.
// Não-ferramenta: este critério não se aplica.
// ===========================================================

describe('ROI Profissional — ferramentas de trabalho', () => {
  it('ferramenta em GREEN → aprovado', () => {
    expect(calcRoiAprovacao('green', true)).toBe(true)
  })
  it('ferramenta em YELLOW → aprovado (alavancagem permitida)', () => {
    expect(calcRoiAprovacao('yellow', true)).toBe(true)
  })
  it('ferramenta em RED → bloqueado (risco alto demais)', () => {
    expect(calcRoiAprovacao('red', true)).toBe(false)
  })
})

describe('ROI Profissional — itens de consumo', () => {
  it('não-ferramenta em qualquer status → ROI não se aplica', () => {
    expect(calcRoiAprovacao('green', false)).toBe(false)
    expect(calcRoiAprovacao('yellow', false)).toBe(false)
    expect(calcRoiAprovacao('red', false)).toBe(false)
  })
})

describe('Integração: combinação de estratégias no mesmo cenário', () => {
  it('Tech Lead (GREEN): fluxo cabe no mês + patrimônio seguro + ROI não necessário', () => {
    // renda 15k, custo 2k, patrimônio 150k, item 3.1k, lazer ≈ 6.25k
    const fluxo = calcFluxoCaixa(3100, 6250)
    const patrim = calcStatusPatrimonio(150000, 2000, 3100)
    const roi = calcRoiAprovacao(patrim.statusAtual, false)

    expect(fluxo.delay).toBe(1)           // cabe no mês
    expect(patrim.statusAtual).toBe('green')
    expect(patrim.alertaDegracao).toBe(false)
    expect(roi).toBe(false)               // ROI não se aplica (não é ferramenta)
  })

  it('Iniciante (RED): fluxo bloqueado, ROI necessário para instrumento', () => {
    // renda 900, custo 800, patrimônio 1k, instrumento 8k, lazer ≈ 100/mês
    const fluxo = calcFluxoCaixa(8000, 100)
    const patrim = calcStatusPatrimonio(1000, 800, 8000)
    const roi = calcRoiAprovacao(patrim.statusAtual, true)

    expect(fluxo.delay).toBe(80)          // 80 meses de espera pelo fluxo
    expect(patrim.statusAtual).toBe('red')
    expect(roi).toBe(false)               // RED bloqueia mesmo com ferramenta
  })

  it('Profissional (YELLOW): ROI libera compra de ferramenta que fluxo negaria', () => {
    // renda 5k, custo 2k, patrimônio 15k (YELLOW), notebook 3k, lazer 1k/mês
    const fluxo = calcFluxoCaixa(3000, 1000)
    const patrim = calcStatusPatrimonio(15000, 2000, 3000)
    const roi = calcRoiAprovacao(patrim.statusAtual, true)

    expect(fluxo.delay).toBe(3)           // fluxo sozinho pediria 3 meses
    expect(patrim.statusAtual).toBe('yellow')
    expect(roi).toBe(true)                // ROI aprova por ser ferramenta em YELLOW
  })
})
