import { describe, it, expect } from 'vitest'
import {
  isBigTicket,
  validarEntrada,
  calcDTI,
  calcMargemManobra,
  calcCustoOcultoVeiculo,
  validarVeiculo,
  calcNovoCustoFixoImovel,
  validarImovel,
  validarBigTicket,
} from '../src/logic/index.ts'

// ===========================================================
// ATIVAÇÃO DO MODO BIG TICKET
// Ativa quando valor > 24× renda OU flag isHighValueAsset = true
// ===========================================================

describe('Ativação do modo Big Ticket', () => {
  it('ativa automaticamente quando valor excede 24× a renda', () => {
    expect(isBigTicket(120001, 5000, false)).toBe(true)  // > 24 × 5000
  })
  it('não ativa quando valor é exatamente 24× (deve exceder)', () => {
    expect(isBigTicket(120000, 5000, false)).toBe(false) // = 24 × 5000
  })
  it('não ativa quando valor está abaixo de 24×', () => {
    expect(isBigTicket(50000, 5000, false)).toBe(false)
  })
  it('ativa com flag manual independente do valor', () => {
    expect(isBigTicket(100, 5000, true)).toBe(true)
  })
  it('não ativa sem flag e sem valor suficiente', () => {
    expect(isBigTicket(100, 5000, false)).toBe(false)
  })
})

// ===========================================================
// CHECAGEM A — VALIDAÇÃO DE ENTRADA (DOWN PAYMENT)
// (patrimônio − entrada) >= custo × 6  →  mantém nível YELLOW
// ===========================================================

describe('Validação da Entrada', () => {
  it('aprovado: saldo após entrada >= 6 meses de custo', () => {
    // 150k - 120k = 30k ≥ 2k × 6 = 12k
    expect(validarEntrada(150000, 120000, 2000)).toBe(true)
  })
  it('aprovado no limite exato (= 6 meses)', () => {
    // 30k - 18k = 12k = 2k × 6
    expect(validarEntrada(30000, 18000, 2000)).toBe(true)
  })
  it('reprovado: saldo após entrada < 6 meses', () => {
    // 50k - 45k = 5k < 12k
    expect(validarEntrada(50000, 45000, 2000)).toBe(false)
  })
  it('reprovado quando entrada zera o patrimônio', () => {
    expect(validarEntrada(20000, 20000, 2000)).toBe(false)
  })
  it('reprovado quando entrada excede o patrimônio', () => {
    expect(validarEntrada(10000, 15000, 2000)).toBe(false)
  })
})

// ===========================================================
// CHECAGEM B — TAXA DE ESFORÇO (DTI)
// (parcela + manutenção − aluguel substituído) ≤ (lazer + investimento)
// ===========================================================

describe('Taxa de Esforço (DTI) — sem aluguel substituído', () => {
  it('aprovado: total ≤ soma dos baldes', () => {
    expect(calcDTI(1000, 500, 2000, 1000, 0)).toBe(true)  // 1500 ≤ 3000
  })
  it('reprovado: total > soma dos baldes', () => {
    expect(calcDTI(1000, 500, 800, 500, 0)).toBe(false)   // 1500 > 1300
  })
  it('aprovado no limite exato (≤, inclusivo)', () => {
    expect(calcDTI(1000, 500, 1000, 500, 0)).toBe(true)   // 1500 = 1500
  })
})

describe('Taxa de Esforço (DTI) — com aluguel substituído', () => {
  it('aluguel reduz o custo efetivo da transição', () => {
    // parcela 4500 - aluguel 2500 = custo efetivo 2000 ≤ lazer 1500 + invest 3000 = 4500
    expect(calcDTI(4500, 0, 1500, 3000, 2500)).toBe(true)
  })
  it('sem desconto de aluguel o mesmo cenário seria reprovado', () => {
    // 4500 + 200 = 4700 > 4500
    expect(calcDTI(4500, 200, 1500, 3000, 0)).toBe(false)
  })
  it('aluguel maior que a parcela gera custo efetivo negativo → sempre aprovado', () => {
    expect(calcDTI(1000, 0, 500, 500, 1500)).toBe(true)   // -500 ≤ 1000
  })
})

// ===========================================================
// CHECAGEM C — MARGEM DE MANOBRA (SAFETY MARGIN)
// Sobra após todos os custos ≥ 5% da renda
// ===========================================================

describe('Margem de Manobra', () => {
  it('aprovado: sobra ≥ 5% da renda', () => {
    // renda 10k, custo 6k, parcela 2k → sobra 2k ≥ 500 (5%)
    expect(calcMargemManobra(10000, 6000, 2000, 0)).toBe(true)
  })
  it('reprovado: sobra < 5% da renda', () => {
    // renda 5k, custo 4k, parcela 800 → sobra 200 < 250 (5%)
    expect(calcMargemManobra(5000, 4000, 800, 0)).toBe(false)
  })
  it('aprovado no limite exato de 5%', () => {
    // renda 5k, 5% = 250 → custo 4k, parcela 750 → sobra 250
    expect(calcMargemManobra(5000, 4000, 750, 0)).toBe(true)
  })
  it('aluguel substituído reduz o custo fixo efetivo', () => {
    // renda 5k, custo 4k - aluguel 800 = 3.2k efetivo, parcela 1k → sobra 800 ≥ 250
    expect(calcMargemManobra(5000, 4000, 1000, 800)).toBe(true)
  })
  it('sem desconto de aluguel o mesmo cenário seria reprovado', () => {
    // renda 5k, custo 4k, parcela 1k → sobra 0 < 250
    expect(calcMargemManobra(5000, 4000, 1000, 0)).toBe(false)
  })
})

// ===========================================================
// VEÍCULOS — Ativo de depreciação
// Custo oculto = 1%/mês do valor (seguro + manutenção + IPVA)
// Aprovação: (parcela + custo oculto) ≤ lazer  E  parcela < 20% da renda
// ===========================================================

describe('Custo oculto do veículo (1%/mês)', () => {
  it('carro de R$30k → custo oculto R$300/mês', () => {
    expect(calcCustoOcultoVeiculo(30000)).toBeCloseTo(300, 2)
  })
  it('carro de R$100k → custo oculto R$1.000/mês', () => {
    expect(calcCustoOcultoVeiculo(100000)).toBeCloseTo(1000, 2)
  })
  it('custo é proporcional ao valor do veículo', () => {
    expect(calcCustoOcultoVeiculo(50000)).toBeCloseTo(500, 2)
  })
})

describe('Validação de veículo — pelo balde de lazer', () => {
  it('aprovado: parcela + custo oculto ≤ lazer', () => {
    // 600 + 300 = 900 ≤ 1000
    expect(validarVeiculo({ parcela: 600, custoOculto: 300, balceLazer: 1000, renda: 5000 })).toBe(true)
  })
  it('aprovado no limite exato', () => {
    expect(validarVeiculo({ parcela: 700, custoOculto: 300, balceLazer: 1000, renda: 5000 })).toBe(true)
  })
  it('reprovado: total > lazer', () => {
    expect(validarVeiculo({ parcela: 800, custoOculto: 300, balceLazer: 1000, renda: 5000 })).toBe(false)
  })
})

describe('Validação de veículo — teto de 20% da renda', () => {
  it('reprovado quando parcela ≥ 20% da renda (deve ser estritamente menor)', () => {
    // renda 5k, 20% = 1k, parcela 1k → reprovado
    expect(validarVeiculo({ parcela: 1000, custoOculto: 100, balceLazer: 2000, renda: 5000 })).toBe(false)
  })
  it('aprovado quando parcela < 20% da renda', () => {
    expect(validarVeiculo({ parcela: 999, custoOculto: 100, balceLazer: 2000, renda: 5000 })).toBe(true)
  })
})

// ===========================================================
// IMÓVEIS — Ativo de patrimônio
// Novo custo fixo = (custo − aluguel) + parcela + condomínio/IPTU
// Aprovação: custo ≤ 50% renda OU diferença coberta pelo investimento sem zerar lazer
// Teto de parcela: < 35% da renda
// ===========================================================

describe('Novo custo fixo do imóvel', () => {
  it('calcula corretamente com todos os componentes', () => {
    // custo 5k - aluguel 2.5k + parcela 4.5k + cond 200 = 7.2k
    expect(calcNovoCustoFixoImovel(5000, 2500, 4500, 200)).toBe(7200)
  })
  it('sem aluguel: custo + parcela + condomínio', () => {
    // 3k - 0 + 2k + 300 = 5.3k
    expect(calcNovoCustoFixoImovel(3000, 0, 2000, 300)).toBe(5300)
  })
  it('sem condomínio/IPTU: parâmetro zero', () => {
    expect(calcNovoCustoFixoImovel(3000, 1000, 2000, 0)).toBe(4000)
  })
  it('aluguel igual à parcela: custo fixo ≈ original + condomínio', () => {
    // 4k - 2k + 2k + 500 = 4.5k
    expect(calcNovoCustoFixoImovel(4000, 2000, 2000, 500)).toBe(4500)
  })
})

describe('Validação de imóvel — teto de 50% da renda', () => {
  it('aprovado: novo custo ≤ 50% da renda', () => {
    // 7k ≤ 15k × 50% = 7.5k
    expect(validarImovel({ novoCustoFixo: 7000, renda: 15000, baldeInvestimento: 1000, balceLazer: 2000 })).toBe(true)
  })
  it('aprovado no limite exato de 50%', () => {
    expect(validarImovel({ novoCustoFixo: 7500, renda: 15000, baldeInvestimento: 1000, balceLazer: 2000 })).toBe(true)
  })
  it('reprovado quando custo > 50% e investimento insuficiente', () => {
    // 5.5k > 5k, diferença 500, mas investimento só 200
    expect(validarImovel({ novoCustoFixo: 5500, renda: 10000, baldeInvestimento: 200, balceLazer: 1000 })).toBe(false)
  })
})

describe('Validação de imóvel — manobra pelo balde de investimento', () => {
  it('aprovado quando diferença cabe no investimento sem zerar lazer', () => {
    // custo 8.5k > 7.5k (50%), diferença 1k ≤ invest 3k, lazer 1.5k > 0
    expect(validarImovel({ novoCustoFixo: 8500, renda: 15000, baldeInvestimento: 3000, balceLazer: 1500 })).toBe(true)
  })
  it('reprovado quando cobrir a diferença zeraria o lazer', () => {
    // custo 15k, diferença 7.5k = invest 7.5k, mas lazer = 0
    expect(validarImovel({ novoCustoFixo: 15000, renda: 15000, baldeInvestimento: 7500, balceLazer: 0 })).toBe(false)
  })
})

describe('Validação de imóvel — teto de 35% da renda para parcela', () => {
  it('reprovado quando parcela ≥ 35% da renda (estritamente menor)', () => {
    // renda 10k, 35% = 3.5k, parcela 3.5k → reprovado
    expect(validarImovel({ novoCustoFixo: 4000, renda: 10000, parcela: 3500, baldeInvestimento: 5000, balceLazer: 2000 })).toBe(false)
  })
  it('aprovado quando parcela < 35%', () => {
    expect(validarImovel({ novoCustoFixo: 4000, renda: 10000, parcela: 3499, baldeInvestimento: 5000, balceLazer: 2000 })).toBe(true)
  })
})

// ===========================================================
// ORQUESTRADOR — validarBigTicket
// Roda as 3 checagens. Aprovado somente se TODAS passarem.
// ===========================================================

describe('Orquestrador do Big Ticket — checagens combinadas', () => {
  const baseAprovado = {
    patrimonio: 150000, entrada: 120000, custo: 2000,
    novaParcela: 4500, manutencao: 0,
    balceLazer: 1500, baldeInvestimento: 3000,
    aluguelSubstituido: 2500, renda: 15000,
  }

  it('aprovado quando as 3 checagens passam', () => {
    const r = validarBigTicket(baseAprovado)
    expect(r.passouEntrada).toBe(true)
    expect(r.passouDTI).toBe(true)
    expect(r.passouMargem).toBe(true)
    expect(r.aprovado).toBe(true)
  })

  it('reprovado quando apenas a entrada falha', () => {
    // patrimônio 15k - entrada 14k = 1k < 12k (6 meses × 2k)
    const r = validarBigTicket({ ...baseAprovado, patrimonio: 15000, entrada: 14000 })
    expect(r.passouEntrada).toBe(false)
    expect(r.aprovado).toBe(false)
  })

  it('reprovado quando apenas o DTI falha', () => {
    // parcela 8k > lazer 3k + invest 2k = 5k
    const r = validarBigTicket({ ...baseAprovado, entrada: 10000, novaParcela: 8000, balceLazer: 3000, baldeInvestimento: 2000, aluguelSubstituido: 0 })
    expect(r.passouDTI).toBe(false)
    expect(r.aprovado).toBe(false)
  })

  it('reprovado quando apenas a margem falha', () => {
    // renda 5k, custo 4k, parcela 800 → sobra 200 < 250 (5%)
    const r = validarBigTicket({ ...baseAprovado, renda: 5000, patrimonio: 200000, custo: 4000, novaParcela: 800, aluguelSubstituido: 0 })
    expect(r.passouMargem).toBe(false)
    expect(r.aprovado).toBe(false)
  })

  it('resultado sempre contém as 3 checagens individuais', () => {
    const r = validarBigTicket(baseAprovado)
    expect(r).toHaveProperty('passouEntrada')
    expect(r).toHaveProperty('passouDTI')
    expect(r).toHaveProperty('passouMargem')
    expect(r).toHaveProperty('aprovado')
  })
})

describe('Exemplo prático — Tech Lead comprando imóvel de R$600k', () => {
  // Dados: entrada 120k, parcela 4.5k, aluguel atual 2.5k
  // Patrimônio 150k, custo de vida 2k, renda 15k

  it('checagem A: R$30k restantes ≥ 6 meses (R$12k) → PASS', () => {
    expect(validarEntrada(150000, 120000, 2000)).toBe(true)
  })

  it('novo custo fixo: base 2k - aluguel 2.5k + parcela 4.5k = R$4k', () => {
    expect(calcNovoCustoFixoImovel(2000, 2500, 4500, 0)).toBe(4000)
  })

  it('checagem B: diferença de R$2k coberta pelo balde de investimento (R$3k) → PASS', () => {
    expect(calcDTI(4500, 0, 0, 3000, 2500)).toBe(true)
  })

  it('veredito final: APROVADO', () => {
    const r = validarBigTicket({
      patrimonio: 150000, entrada: 120000, custo: 2000,
      novaParcela: 4500, manutencao: 0,
      balceLazer: 1500, baldeInvestimento: 3000,
      aluguelSubstituido: 2500, renda: 15000,
    })
    expect(r.aprovado).toBe(true)
  })
})

describe('Exemplo prático — Carro popular para uso cotidiano', () => {
  // Carro R$50k, entrada R$10k, parcela R$1.2k, renda R$8k, lazer R$2k

  it('ativação: 50k > 24 × 8k = 192k → NÃO é Big Ticket automático', () => {
    expect(isBigTicket(50000, 8000, false)).toBe(false)
  })

  it('custo oculto do carro: 1% de R$50k = R$500/mês', () => {
    expect(calcCustoOcultoVeiculo(50000)).toBe(500)
  })

  it('aprovado: parcela 1.2k + custo oculto 500 = 1.7k ≤ lazer 2k', () => {
    expect(validarVeiculo({ parcela: 1200, custoOculto: 500, balceLazer: 2000, renda: 8000 })).toBe(true)
  })

  it('parcela 1.2k < 20% de 8k (1.6k) → teto de parcela respeitado', () => {
    expect(validarVeiculo({ parcela: 1200, custoOculto: 500, balceLazer: 2000, renda: 8000 })).toBe(true)
  })
})
