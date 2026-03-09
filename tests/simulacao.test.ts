import { describe, it, expect } from 'vitest'
import { simularLogica, calcLazerPct, calcStatusReserva } from '../src/logic/index.ts'

// ===========================================================
// Motor de cálculo base
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
// Cenários de uso completos
// ===========================================================

const simular = (overrides: object) =>
  simularLogica({
    renda: 3000, custo: 1000, patrimonio: 10000,
    reservaMeses: 6, itemValor: 500, itemNome: 'Item',
    ferramenta: false, envelopes: [],
    ...overrides,
  })

describe('Cenário: Alavancagem Profissional (reserva em perigo + ferramenta)', () => {
  // Músico iniciante: renda 900, custo 800, patrimônio 1000
  // Instrumento R$8.000 marcado como ferramenta de trabalho
  const r = simular({ renda: 900, custo: 800, patrimonio: 1000, reservaMeses: 6, itemValor: 8000, itemNome: 'Instrumento', ferramenta: true })

  it('reserva alvo = custo × meses = R$4.800', () => {
    expect(r.debug.reservaAlvo).toBe(4800)
  })
  it('status da reserva: perigo (R$1.000 < R$2.400)', () => {
    expect(r.debug.statusReserva).toBe('perigo')
  })
  it('sobra de lazer ≈ R$100/mês (11.1% de R$900)', () => {
    expect(r.debug.sobraLazerMensal).toBeCloseTo(100, 0)
  })
  it('veredito: aprovado via alavancagem', () => {
    expect(r.veredito.tipo).toBe('aprovado')
    expect(r.veredito.titulo).toBe('Aprovado via Alavancagem')
  })
  it('plano de ação menciona ROI', () => {
    expect(r.acoes.join(' ').toLowerCase()).toContain('roi')
  })
})

describe('Cenário: Risco por Luxo (reserva em perigo + consumo)', () => {
  // Renda 3k, custo 2k, patrimônio 5k — celular R$2k sem ser ferramenta
  const r = simular({ renda: 3000, custo: 2000, patrimonio: 5000, reservaMeses: 12, itemValor: 2000, itemNome: 'Celular', ferramenta: false })

  it('reserva alvo = R$24.000', () => {
    expect(r.debug.reservaAlvo).toBe(24000)
  })
  it('status da reserva: perigo (R$5k < R$12k)', () => {
    expect(r.debug.statusReserva).toBe('perigo')
  })
  it('sobra de lazer ≈ R$1.000/mês', () => {
    expect(r.debug.sobraLazerMensal).toBeCloseTo(1000, 0)
  })
  it('veredito: negado', () => {
    expect(r.veredito.tipo).toBe('negado')
    expect(r.veredito.titulo).toBe('Negado')
  })
  it('sugere aguardar 2 meses juntando pelo lazer', () => {
    expect(r.acoes.join(' ')).toContain('2 mês')
  })
})

describe('Cenário: Segurança e Abundância (reserva completa + lazer cobre o item)', () => {
  // Tech Lead: renda 15k, custo 2k, patrimônio 150k, VR R$3.1k
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
  it('lazer ≈ 41.67% (100 - 13.33% custo - 45% envelopes)', () => {
    expect(r.debug.lazerPct).toBeCloseTo(41.67, 1)
  })
  it('sobra de lazer ≈ R$6.250/mês — maior que o item', () => {
    expect(r.debug.sobraLazerMensal).toBeGreaterThan(3100)
    expect(r.debug.sobraLazerMensal).toBeCloseTo(6250, 0)
  })
  it('veredito: compra livre', () => {
    expect(r.veredito.tipo).toBe('aprovado')
    expect(r.veredito.titulo).toBe('Compra Livre')
  })
  it('plano confirma compra à vista no mês atual', () => {
    expect(r.acoes.join(' ').toLowerCase()).toContain('único mês')
  })
})

describe('Cenário: Reserva em atenção (entre 50% e 100%)', () => {
  // Patrimônio cobre metade da reserva — deve sugerir juntar primeiro
  const r = simular({ renda: 5000, custo: 2000, patrimonio: 8000, reservaMeses: 6, itemValor: 1000, ferramenta: false })

  it('status: atenção (R$8k entre R$6k e R$12k)', () => {
    expect(r.debug.statusReserva).toBe('atencao')
  })
  it('veredito: juntar primeiro', () => {
    expect(r.veredito.titulo).toBe('Juntar Primeiro')
  })
})

describe('Cenário: Segurança mas item maior que sobra mensal', () => {
  // Reserva completa, mas item caro demais para um mês de lazer
  const r = simular({ renda: 3000, custo: 1000, patrimonio: 20000, reservaMeses: 6, itemValor: 5000, ferramenta: false })

  it('status: segurança', () => {
    expect(r.debug.statusReserva).toBe('seguranca')
  })
  it('veredito: juntar com calma', () => {
    expect(r.veredito.titulo).toBe('Juntar com Calma')
  })
})

describe('Casos extremos do motor', () => {
  it('ferramenta em atenção → segue fluxo de atenção, não alavancagem', () => {
    // Alavancagem só ativa com "perigo"
    const r = simular({ renda: 5000, custo: 2000, patrimonio: 8000, reservaMeses: 6, itemValor: 1000, ferramenta: true })
    expect(r.debug.statusReserva).toBe('atencao')
    expect(r.veredito.titulo).toBe('Juntar Primeiro')
  })

  it('custo de vida zero → reserva alvo zero → sempre segurança', () => {
    const r = simular({ renda: 3000, custo: 0, patrimonio: 0, reservaMeses: 6, itemValor: 100 })
    expect(r.debug.reservaAlvo).toBe(0)
    expect(r.debug.statusReserva).toBe('seguranca')
  })

  it('lazer zero por envelopes lotados → sobra nula', () => {
    const r = simular({
      renda: 2000, custo: 1000, patrimonio: 0, reservaMeses: 6,
      itemValor: 500, ferramenta: false,
      envelopes: [{ nome: 'Investimentos', pct: 50 }], // custo 50% + envelope 50% = 0% lazer
    })
    expect(r.debug.sobraLazerMensal).toBe(0)
  })
})
