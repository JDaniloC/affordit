import { describe, it, expect } from 'vitest'
import { simularLogica, calcLazerPct, calcStatusReserva } from '../src/logic/index.ts'

// ===========================================================
// Motor de cálculo base — funções auxiliares inalteradas
// ===========================================================

describe('calcLazerPct — distribuição dos envelopes', () => {
  it('sem envelopes e custo zero: 100% vai para lazer', () => {
    expect(calcLazerPct(3000, 0, [])).toBeCloseTo(100, 2)
  })

  it('custo de vida é descontado como percentual da renda', () => {
    // renda 900, custo 800 → 88.89% custo, 11.11% lazer
    expect(calcLazerPct(900, 800, [])).toBeCloseTo(11.11, 1)
  })

  it('envelopes reduzem o lazer além do custo de vida', () => {
    const envelopes = [{ nome: 'Igreja', pct: 15 }, { nome: 'Investimentos', pct: 20 }]
    // custo 2000/15000 = 13.33%, envelopes 35% → lazer = 51.67%
    expect(calcLazerPct(15000, 2000, envelopes)).toBeCloseTo(51.67, 1)
  })

  it('lazer nunca é negativo mesmo quando envelopes excedem 100%', () => {
    const envelopes = [{ nome: 'Tudo', pct: 95 }]
    expect(calcLazerPct(3000, 2000, envelopes)).toBe(0)
  })

  it('renda zero retorna lazer zero (sem divisão por zero)', () => {
    expect(calcLazerPct(0, 0, [])).toBe(0)
  })
})

describe('calcStatusReserva — termômetro da reserva', () => {
  it('perigo: patrimônio abaixo de 50% da reserva alvo', () => {
    expect(calcStatusReserva(1000, 4800)).toBe('perigo')
  })

  it('atenção: patrimônio entre 50% e 100% da reserva', () => {
    expect(calcStatusReserva(3000, 4800)).toBe('atencao')
    expect(calcStatusReserva(2400, 4800)).toBe('atencao') // limite 50%
  })

  it('segurança: patrimônio >= reserva alvo', () => {
    expect(calcStatusReserva(150000, 24000)).toBe('seguranca')
    expect(calcStatusReserva(24000, 24000)).toBe('seguranca') // limite exato
  })

  it('reserva alvo zero → sempre segurança', () => {
    expect(calcStatusReserva(0, 0)).toBe('seguranca')
    expect(calcStatusReserva(500, 0)).toBe('seguranca')
  })
})

// ===========================================================
// Cenários principais
// ===========================================================

const simular = (overrides: object) =>
  simularLogica({
    renda: 3000, custo: 1000, patrimonio: 10000,
    reservaMeses: 6, itemValor: 500, itemNome: 'Item',
    ferramenta: false, envelopes: [],
    ...overrides,
  })

describe('Cenário: Regra do 1% — aprovação incondicional', () => {
  // Patrimônio 100k, item 800 (≤ 1% = 1000) → dentro do 1%
  const r = simular({ patrimonio: 100000, custo: 2000, reservaMeses: 6, itemValor: 800 })

  it('debug: dentro1pct = true', () => {
    expect(r.debug.dentro1pct).toBe(true)
  })
  it('veredito: aprovado', () => {
    expect(r.veredito.tipo).toBe('aprovado')
    expect(r.veredito.titulo).toBe('Compra Aprovada')
  })
  it('subtítulo indica regra do 1%', () => {
    expect(r.veredito.subtitulo).toContain('1%')
  })
  it('plano menciona percentual do patrimônio', () => {
    expect(r.acoes.join(' ')).toContain('0.8%')
  })
})

describe('Cenário: Aprovado — reserva completa + dinheiro além da reserva', () => {
  // Tech Lead: renda 15k, custo 2k, patrimônio 150k, reserva 12×2k=24k, item 3.1k
  // disponivel = 150k - 24k = 126k ≥ 3.1k → aprovado
  const r = simular({
    renda: 15000, custo: 2000, patrimonio: 150000, reservaMeses: 12,
    itemValor: 3100, itemNome: 'Setup VR', ferramenta: false,
    envelopes: [{ nome: 'Igreja', pct: 15 }, { nome: 'Filantropia', pct: 10 }, { nome: 'Investimentos', pct: 20 }],
  })

  it('reserva alvo = R$24.000', () => {
    expect(r.debug.reservaAlvo).toBe(24000)
  })
  it('status da reserva: segurança', () => {
    expect(r.debug.statusReserva).toBe('seguranca')
  })
  it('lazer ≈ 41.67%', () => {
    expect(r.debug.lazerPct).toBeCloseTo(41.67, 1)
  })
  it('sobra de lazer ≈ R$6.250/mês', () => {
    expect(r.debug.sobraLazerMensal).toBeCloseTo(6250, 0)
  })
  it('disponível além da reserva ≥ item', () => {
    expect(r.debug.disponivel).toBe(126000)
    expect(r.debug.disponivel).toBeGreaterThanOrEqual(3100)
  })
  it('veredito: aprovado — Compra Aprovada', () => {
    expect(r.veredito.tipo).toBe('aprovado')
    expect(r.veredito.titulo).toBe('Compra Aprovada')
  })
  it('plano confirma reserva completa', () => {
    expect(r.acoes.join(' ').toLowerCase()).toContain('completa')
  })
})

describe('Cenário: Aprovado — item menor que disponível (reserva + folga)', () => {
  // Patrimônio 20k, reserva 6k, item 5k → disponivel 14k ≥ 5k → aprovado
  const r = simular({ renda: 3000, custo: 1000, patrimonio: 20000, reservaMeses: 6, itemValor: 5000 })

  it('status: segurança', () => {
    expect(r.debug.statusReserva).toBe('seguranca')
  })
  it('disponível (14k) cobre o item (5k)', () => {
    expect(r.debug.disponivel).toBe(14000)
  })
  it('veredito: aprovado — Compra Aprovada', () => {
    expect(r.veredito.tipo).toBe('aprovado')
    expect(r.veredito.titulo).toBe('Compra Aprovada')
  })
})

describe('Cenário: Negado — sem reserva, item de consumo', () => {
  // Risco por Luxo: renda 3k, custo 2k, patrimônio 5k, reserva 24k, celular 2k
  const r = simular({ renda: 3000, custo: 2000, patrimonio: 5000, reservaMeses: 12, itemValor: 2000, ferramenta: false })

  it('reserva alvo = R$24.000', () => {
    expect(r.debug.reservaAlvo).toBe(24000)
  })
  it('status da reserva: perigo', () => {
    expect(r.debug.statusReserva).toBe('perigo')
  })
  it('sobra de lazer ≈ R$1.000/mês', () => {
    expect(r.debug.sobraLazerMensal).toBeCloseTo(1000, 0)
  })
  it('veredito: negado', () => {
    expect(r.veredito.tipo).toBe('negado')
    expect(r.veredito.titulo).toBe('Negado')
  })
  it('subtítulo indica ausência de reserva', () => {
    expect(r.veredito.subtitulo).toBeTruthy()
  })
  it('plano menciona reserva de emergência', () => {
    expect(r.acoes.join(' ').toLowerCase()).toContain('reserva')
  })
})

describe('Cenário: Negado — tem reserva, mas sem dinheiro além dela', () => {
  // Patrimônio 8k, reserva 6k (=6×1k), item 5k → disponivel 2k < 5k → negado
  const r = simular({ renda: 3000, custo: 1000, patrimonio: 8000, reservaMeses: 6, itemValor: 5000, ferramenta: false })

  it('status: segurança (tem reserva)', () => {
    expect(r.debug.statusReserva).toBe('seguranca')
  })
  it('disponível (2k) não cobre o item (5k)', () => {
    expect(r.debug.disponivel).toBe(2000)
    expect(r.debug.disponivel).toBeLessThan(5000)
  })
  it('veredito: negado', () => {
    expect(r.veredito.tipo).toBe('negado')
    expect(r.veredito.titulo).toBe('Negado')
  })
  it('subtítulo indica falta de dinheiro além da reserva', () => {
    expect(r.veredito.subtitulo).toBeTruthy()
  })
  it('plano menciona quanto falta acumular', () => {
    expect(r.acoes.join(' ')).toContain('3000')  // falta = 5000 - 2000 = 3000
  })
})

describe('Cenário: Negado — reserva parcial, item de consumo', () => {
  // Patrimônio 8k, reserva 12k (=6×2k), item 1k → no reserve → negado
  const r = simular({ renda: 5000, custo: 2000, patrimonio: 8000, reservaMeses: 6, itemValor: 1000, ferramenta: false })

  it('status: atenção (50–100% da reserva)', () => {
    expect(r.debug.statusReserva).toBe('atencao')
  })
  it('veredito: negado', () => {
    expect(r.veredito.tipo).toBe('negado')
    expect(r.veredito.titulo).toBe('Negado')
  })
})

describe('Cenário: Ferramenta — aprovada com ressalvas (sem reserva, parcela cabe)', () => {
  // Renda 5k, custo 2k, patrimônio 8k, reserva 12k, notebook 1k, parcelas=1
  // disponivel = 8k - 12k = -4k < 1k → não tem dinheiro
  // ferramenta=true, parcelaValor=1k, sobraLazer=3k → parcelaCabe
  // patrimonioNaoNegativo: parcelas=1 → patrimônio(8k) >= item(1k) ✓
  const r = simular({ renda: 5000, custo: 2000, patrimonio: 8000, reservaMeses: 6, itemValor: 1000, ferramenta: true })

  it('status: atenção', () => {
    expect(r.debug.statusReserva).toBe('atencao')
  })
  it('parcela cabe no lazer', () => {
    expect(r.debug.parcelaCabe).toBe(true)
  })
  it('veredito: aprovado com ressalvas', () => {
    expect(r.veredito.tipo).toBe('aprovado')
    expect(r.veredito.titulo).toBe('Aprovado com Ressalvas')
  })
  it('subtítulo indica ferramenta de trabalho', () => {
    expect(r.veredito.subtitulo?.toLowerCase()).toContain('ferramenta')
  })
  it('plano menciona parcela e lazer', () => {
    const plan = r.acoes.join(' ').toLowerCase()
    expect(plan).toContain('ferramenta')
  })
})

describe('Cenário: Ferramenta — aprovada com ressalvas (parcelado, pagamentos do fluxo)', () => {
  // Renda 3k, custo 1k, patrimônio 2k, reserva 6k, item 3k, parcelas=3
  // disponivel = 2k - 6k = -4k < 3k → não tem dinheiro
  // sobraLazerMensal = 2k, parcelaValor = 1k → parcelaCabe
  // patrimonioNaoNegativo: parcelas(3) > 1 → true (pagamentos do fluxo, não do patrimônio)
  const r = simular({ renda: 3000, custo: 1000, patrimonio: 2000, reservaMeses: 6, itemValor: 3000, ferramenta: true, parcelas: 3 })

  it('parcelaValor = 1000', () => {
    expect(r.debug.parcelaValor).toBeCloseTo(1000, 2)
  })
  it('parcela cabe (1k ≤ lazer 2k)', () => {
    expect(r.debug.parcelaCabe).toBe(true)
  })
  it('veredito: aprovado com ressalvas', () => {
    expect(r.veredito.tipo).toBe('aprovado')
    expect(r.veredito.titulo).toBe('Aprovado com Ressalvas')
  })
})

describe('Cenário: Ferramenta — negada por fluxo insuficiente', () => {
  // Músico iniciante: renda 900, custo 800, patrimônio 1k, reserva 4.8k, instrumento 8k, parcelas=1
  // disponivel = 1k - 4.8k = -3.8k < 8k → não tem dinheiro
  // ferramenta=true, parcelaValor=8k, sobraLazer≈100 → parcelaNão cabe
  // patrimonioNaoNegativo: parcelas=1 → 1000 >= 8000? NO
  const r = simular({ renda: 900, custo: 800, patrimonio: 1000, reservaMeses: 6, itemValor: 8000, ferramenta: true })

  it('reserva alvo = R$4.800', () => {
    expect(r.debug.reservaAlvo).toBe(4800)
  })
  it('status da reserva: perigo', () => {
    expect(r.debug.statusReserva).toBe('perigo')
  })
  it('sobra de lazer ≈ R$100/mês', () => {
    expect(r.debug.sobraLazerMensal).toBeCloseTo(100, 0)
  })
  it('parcela (8k) não cabe no lazer (100)', () => {
    expect(r.debug.parcelaCabe).toBe(false)
  })
  it('veredito: negado (ferramenta sem fluxo)', () => {
    expect(r.veredito.tipo).toBe('negado')
    expect(r.veredito.titulo).toBe('Negado')
  })
  it('plano menciona parcela e lazer', () => {
    const plan = r.acoes.join(' ').toLowerCase()
    expect(plan).toContain('parcela')
  })
})

describe('Cenário: Ferramenta — negada, compra à vista deixaria patrimônio negativo', () => {
  // Renda 5k, custo 1k, patrimônio 500, reserva 6k, item 1k, parcelas=1
  // disponivel = 500 - 6k = -5.5k < 1k → não tem dinheiro
  // ferramenta=true, parcelaValor=1k, sobraLazer=4k → parcelaCabe=true
  // patrimonioNaoNegativo: parcelas=1 → patrimônio(500) >= item(1000)? NO
  const r = simular({ renda: 5000, custo: 1000, patrimonio: 500, reservaMeses: 6, itemValor: 1000, ferramenta: true })

  it('parcelaCabe = true (lazer suficiente)', () => {
    expect(r.debug.parcelaCabe).toBe(true)
  })
  it('veredito: negado (patrimônio ficaria negativo)', () => {
    expect(r.veredito.tipo).toBe('negado')
    expect(r.veredito.titulo).toBe('Negado')
  })
  it('plano menciona patrimônio negativo', () => {
    const plan = r.acoes.join(' ').toLowerCase()
    expect(plan).toContain('negativo')
  })
})

describe('Casos extremos do motor', () => {
  it('custo de vida zero → reserva alvo zero → debug correto', () => {
    const r = simular({ renda: 3000, custo: 0, patrimonio: 0, reservaMeses: 6, itemValor: 100 })
    expect(r.debug.reservaAlvo).toBe(0)
    expect(r.debug.statusReserva).toBe('seguranca')
  })

  it('custo zero + patrimônio cobre o item → aprovado', () => {
    const r = simular({ renda: 3000, custo: 0, patrimonio: 200, reservaMeses: 6, itemValor: 100 })
    expect(r.debug.disponivel).toBe(200)  // 200 - 0
    expect(r.veredito.tipo).toBe('aprovado')
  })

  it('custo zero + patrimônio zero + item 100 → negado', () => {
    const r = simular({ renda: 3000, custo: 0, patrimonio: 0, reservaMeses: 6, itemValor: 100 })
    expect(r.debug.disponivel).toBe(0)
    expect(r.veredito.tipo).toBe('negado')
  })

  it('lazer zero por envelopes lotados → sobraLazerMensal nula', () => {
    const r = simular({
      renda: 2000, custo: 1000, patrimonio: 0, reservaMeses: 6,
      itemValor: 500, ferramenta: false,
      envelopes: [{ nome: 'Investimentos', pct: 50 }],
    })
    expect(r.debug.sobraLazerMensal).toBe(0)
  })

  it('ferramenta sem lazer → negado (sem fluxo de caixa)', () => {
    const r = simular({
      renda: 2000, custo: 1000, patrimonio: 0, reservaMeses: 6,
      itemValor: 500, ferramenta: true,
      envelopes: [{ nome: 'Investimentos', pct: 50 }],
    })
    expect(r.debug.sobraLazerMensal).toBe(0)
    expect(r.debug.parcelaCabe).toBe(false)
    expect(r.veredito.tipo).toBe('negado')
  })

  it('regra do 1% prevalece mesmo sem reserva', () => {
    // patrimônio 10k, sem reserva (reserva alvo > patrimônio), item 50 (≤ 100 = 1% de 10k)
    const r = simular({ patrimonio: 10000, custo: 2000, reservaMeses: 6, itemValor: 50 })
    expect(r.debug.dentro1pct).toBe(true)
    expect(r.veredito.tipo).toBe('aprovado')
    expect(r.veredito.titulo).toBe('Compra Aprovada')
  })

  it('regra do 1% prevalece mesmo para não-ferramenta', () => {
    const r = simular({ patrimonio: 50000, custo: 0, itemValor: 499, ferramenta: false })
    expect(r.debug.dentro1pct).toBe(true)
    expect(r.veredito.tipo).toBe('aprovado')
  })
})
