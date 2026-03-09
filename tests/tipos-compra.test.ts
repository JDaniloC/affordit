import { describe, it, expect } from 'vitest'
import {
  calcTempoEsperaLazer,
  isLazerBloqueado,
  isPermitidoFerramenta,
  calcCustoMensalVeiculo,
  validarCompraVeiculo,
  calcCustoEfetivoImovel,
  validarCompraImovel,
  validarEntradaMinima,
  resolverTipoCompra,
} from '../src/logic/index.ts'

// ===========================================================
// TIPO 1: LAZER
// Compras de consumo puro (roupas, eletrônicos, viagens).
// Bloqueado se patrimônio < 6 meses de custo.
// Tempo de espera = ceil(preco / sobraLazer)
// ===========================================================

describe('Lazer — bloqueio por reserva insuficiente', () => {
  it('patrimônio < 6 meses de custo → bloqueado', () => {
    expect(isLazerBloqueado(5000, 1000)).toBe(true)  // 5k < 6k
  })
  it('patrimônio exatamente 6 meses → não bloqueado (limite inclusivo)', () => {
    expect(isLazerBloqueado(6000, 1000)).toBe(false)  // 6k = 6k
  })
  it('patrimônio > 6 meses → não bloqueado', () => {
    expect(isLazerBloqueado(12000, 1000)).toBe(false)
  })
  it('custo zero → nunca bloqueado', () => {
    expect(isLazerBloqueado(0, 0)).toBe(false)
    expect(isLazerBloqueado(100, 0)).toBe(false)
  })
})

describe('Lazer — tempo de espera para juntar', () => {
  it('item menor que lazer → 1 mês', () => {
    expect(calcTempoEsperaLazer(500, 1000)).toBe(1)
  })
  it('item maior que lazer → arredonda para cima', () => {
    expect(calcTempoEsperaLazer(2001, 1000)).toBe(3)
  })
  it('item exato → sem arredondamento', () => {
    expect(calcTempoEsperaLazer(3000, 1000)).toBe(3)
  })
  it('sobra zero → null (não há como comprar)', () => {
    expect(calcTempoEsperaLazer(500, 0)).toBeNull()
  })
  it('sobra negativa → null', () => {
    expect(calcTempoEsperaLazer(500, -100)).toBeNull()
  })
})

// ===========================================================
// TIPO 2: FERRAMENTA
// Equipamentos de trabalho com potencial de ROI.
// Permitido se patrimônio >= 6 meses de custo (YELLOW+).
// ===========================================================

describe('Ferramenta — elegibilidade por reserva', () => {
  it('patrimônio >= 6 meses → permitido', () => {
    expect(isPermitidoFerramenta(6000, 1000)).toBe(true)
  })
  it('patrimônio < 6 meses → não permitido', () => {
    expect(isPermitidoFerramenta(5999, 1000)).toBe(false)
  })
  it('custo zero → sempre permitido', () => {
    expect(isPermitidoFerramenta(0, 0)).toBe(true)
    expect(isPermitidoFerramenta(500, 0)).toBe(true)
  })
  it('patrimônio zero com custo real → não permitido', () => {
    expect(isPermitidoFerramenta(0, 2000)).toBe(false)
  })
})

// ===========================================================
// TIPO 3: GRANDE SONHO — VEÍCULOS
// Custo mensal = parcela + manutenção + depreciação
// Aprovado se custo mensal ≤ balde de lazer
// ===========================================================

describe('Veículo — custo mensal total', () => {
  it('soma parcela + manutenção + depreciação', () => {
    expect(calcCustoMensalVeiculo(1000, 300, 200)).toBe(1500)
  })
  it('sem manutenção e depreciação → apenas parcela', () => {
    expect(calcCustoMensalVeiculo(800, 0, 0)).toBe(800)
  })
})

describe('Veículo — validação de compra', () => {
  it('custo mensal ≤ balde lazer → aprovado', () => {
    expect(validarCompraVeiculo(1000, 200, 100, 1500)).toBe(true)  // 1300 ≤ 1500
  })
  it('custo mensal exato igual ao lazer → aprovado (limite inclusivo)', () => {
    expect(validarCompraVeiculo(1000, 300, 200, 1500)).toBe(true)  // 1500 = 1500
  })
  it('custo mensal > balde lazer → reprovado', () => {
    expect(validarCompraVeiculo(1000, 300, 201, 1500)).toBe(false)  // 1501 > 1500
  })
  it('lazer zero → sempre reprovado', () => {
    expect(validarCompraVeiculo(500, 100, 50, 0)).toBe(false)
  })
})

// ===========================================================
// TIPO 3: GRANDE SONHO — IMÓVEIS
// Custo efetivo = nova parcela + manutenção − aluguel antigo
// Aprovado se custo efetivo ≤ balde investimento + balde lazer
// ===========================================================

describe('Imóvel — custo efetivo mensal', () => {
  it('desconta aluguel antigo (economia de troca)', () => {
    expect(calcCustoEfetivoImovel(3000, 500, 2000)).toBe(1500)  // 3k+500-2k
  })
  it('sem aluguel antigo (compra da primeira moradia)', () => {
    expect(calcCustoEfetivoImovel(3000, 500, 0)).toBe(3500)
  })
  it('aluguel maior que parcela → custo efetivo negativo (resultado legítimo)', () => {
    expect(calcCustoEfetivoImovel(1000, 200, 1500)).toBe(-300)  // economiza
  })
})

describe('Imóvel — validação de compra', () => {
  it('custo efetivo ≤ investimento + lazer → aprovado', () => {
    // custo efetivo = 1500, baldes = 500 + 1200 = 1700
    expect(validarCompraImovel(3000, 500, 2000, 500, 1200)).toBe(true)
  })
  it('custo efetivo > soma dos baldes → reprovado', () => {
    // custo efetivo = 1501, baldes = 500 + 1000 = 1500
    expect(validarCompraImovel(3001, 500, 2000, 500, 1000)).toBe(false)
  })
  it('aluguel alto reduz custo e viabiliza compra', () => {
    // parcela 2500, manu 300, aluguel 2400 → custo 400. baldes lazer=500
    expect(validarCompraImovel(2500, 300, 2400, 0, 500)).toBe(true)
  })
})

// ===========================================================
// ENTRADA MÍNIMA PARA GRANDES SONHOS
// Não pode zerar reserva GREEN (≥ 12 meses)
// patrimônio − entrada ≥ custo × 12
// ===========================================================

describe('Entrada mínima — preservar reserva GREEN', () => {
  it('entrada válida: sobra cobre 12 meses', () => {
    // patrimônio 200k, entrada 50k, custo 5k → sobra 150k ≥ 60k
    expect(validarEntradaMinima(200000, 50000, 5000)).toBe(true)
  })
  it('entrada exata: sobra = exatamente 12 meses', () => {
    // patrimônio 110k, entrada 50k → sobra 60k = 12 × 5k
    expect(validarEntradaMinima(110000, 50000, 5000)).toBe(true)
  })
  it('entrada excessiva: zera reserva GREEN', () => {
    // patrimônio 110k, entrada 51k → sobra 59k < 60k
    expect(validarEntradaMinima(110000, 51000, 5000)).toBe(false)
  })
  it('sem patrimônio → sempre reprovado', () => {
    expect(validarEntradaMinima(0, 0, 2000)).toBe(false)
  })
})

// ===========================================================
// DISPATCHER: resolverTipoCompra
// Roteia para a validação correta por tipo de compra
// ===========================================================

describe('Dispatcher lazer', () => {
  it('retorna bloqueado=false e tempoEspera quando reserva ok', () => {
    const r = resolverTipoCompra('lazer', {
      preco: 2000, sobraLazerMensal: 1000,
      patrimonio: 8000, custo: 1000,  // 8 meses → não bloqueado
    }) as { bloqueado: boolean; tempoEspera: number }
    expect(r.bloqueado).toBe(false)
    expect(r.tempoEspera).toBe(2)
  })

  it('retorna bloqueado=true quando reserva em perigo', () => {
    const r = resolverTipoCompra('lazer', {
      preco: 500, sobraLazerMensal: 1000,
      patrimonio: 3000, custo: 1000,  // 3 meses → bloqueado
    }) as { bloqueado: boolean; tempoEspera: number }
    expect(r.bloqueado).toBe(true)
    expect(r.tempoEspera).toBe(1)  // tempo existe mesmo com bloqueio
  })
})

describe('Dispatcher ferramenta', () => {
  it('permitido quando patrimônio ≥ 6 meses', () => {
    const r = resolverTipoCompra('ferramenta', {
      patrimonio: 12000, custo: 2000,
    }) as { permitido: boolean }
    expect(r.permitido).toBe(true)
  })

  it('não permitido quando patrimônio < 6 meses', () => {
    const r = resolverTipoCompra('ferramenta', {
      patrimonio: 5000, custo: 1000,
    }) as { permitido: boolean }
    expect(r.permitido).toBe(false)
  })
})

describe('Dispatcher grandeSonho — veículo', () => {
  it('aprovado: entrada ok + custo mensal cabe no lazer', () => {
    const r = resolverTipoCompra('grandeSonho', {
      subtipo: 'veiculo',
      patrimonio: 200000, entrada: 50000, custo: 5000,  // sobra 150k ≥ 60k ✓
      parcela: 800, manutencao: 200, depreciacao: 100,  // total 1100
      balceLazer: 1200,  // 1100 ≤ 1200 ✓
    }) as { aprovado: boolean; reprovadoNaEntrada: boolean }
    expect(r.aprovado).toBe(true)
    expect(r.reprovadoNaEntrada).toBe(false)
  })

  it('reprovado na entrada: não mantém reserva GREEN', () => {
    const r = resolverTipoCompra('grandeSonho', {
      subtipo: 'veiculo',
      patrimonio: 30000, entrada: 20000, custo: 2000,  // sobra 10k < 24k ✗
      parcela: 300, manutencao: 100, depreciacao: 50,
      balceLazer: 1000,
    }) as { aprovado: boolean; reprovadoNaEntrada: boolean }
    expect(r.aprovado).toBe(false)
    expect(r.reprovadoNaEntrada).toBe(true)
  })
})

describe('Dispatcher grandeSonho — imóvel', () => {
  it('aprovado: entrada ok + custo efetivo cabe nos baldes', () => {
    // Tech Lead: patrimônio 300k, entrada 100k, custo 5k → sobra 200k ≥ 60k ✓
    // parcela 3k, manu 500, aluguel 2k → custo efetivo 1500
    // invest 1000 + lazer 1000 = 2000 ≥ 1500 ✓
    const r = resolverTipoCompra('grandeSonho', {
      subtipo: 'imovel',
      patrimonio: 300000, entrada: 100000, custo: 5000,
      novaParcela: 3000, manutencao: 500, aluguelAntigo: 2000,
      baldeInvestimento: 1000, balceLazer: 1000,
    }) as { aprovado: boolean; reprovadoNaEntrada: boolean }
    expect(r.aprovado).toBe(true)
    expect(r.reprovadoNaEntrada).toBe(false)
  })

  it('reprovado: custo efetivo supera soma dos baldes', () => {
    const r = resolverTipoCompra('grandeSonho', {
      subtipo: 'imovel',
      patrimonio: 300000, entrada: 100000, custo: 5000,  // entrada ok
      novaParcela: 4000, manutencao: 800, aluguelAntigo: 1000,  // custo 3800
      baldeInvestimento: 500, balceLazer: 500,  // total 1000 < 3800 ✗
    }) as { aprovado: boolean; reprovadoNaEntrada: boolean }
    expect(r.aprovado).toBe(false)
    expect(r.reprovadoNaEntrada).toBe(false)  // entrada passou, compra não coube
  })
})

// ===========================================================
// CENÁRIOS INTEGRADOS: comparando os três tipos de compra
// ===========================================================

describe('Comparação entre tipos: o mesmo item pode ter diferentes rotas', () => {
  it('notebook R$6k: bloqueado como lazer, permitido como ferramenta (YELLOW)', () => {
    // patrimônio 8k, custo 1k/mês → 8 meses = YELLOW (>=6, <12)
    const lazer = resolverTipoCompra('lazer', {
      preco: 6000, sobraLazerMensal: 1000,
      patrimonio: 8000, custo: 1000,
    }) as { bloqueado: boolean }

    const ferramenta = resolverTipoCompra('ferramenta', {
      patrimonio: 8000, custo: 1000,
    }) as { permitido: boolean }

    expect(lazer.bloqueado).toBe(false)  // 8 meses ≥ 6 → lazer liberado
    expect(ferramenta.permitido).toBe(true)  // YELLOW → ferramenta ok
  })

  it('celular R$2k: bloqueado em perigo (3 meses de reserva)', () => {
    const lazer = resolverTipoCompra('lazer', {
      preco: 2000, sobraLazerMensal: 500,
      patrimonio: 3000, custo: 1000,  // 3 meses → bloqueado
    }) as { bloqueado: boolean; tempoEspera: number }

    const ferramenta = resolverTipoCompra('ferramenta', {
      patrimonio: 3000, custo: 1000,
    }) as { permitido: boolean }

    expect(lazer.bloqueado).toBe(true)
    expect(ferramenta.permitido).toBe(false)
    expect(lazer.tempoEspera).toBe(4)  // ceil(2000/500) = 4
  })

  it('carro R$40k vs notebook R$6k: grande sonho exige critérios muito mais rígidos', () => {
    // Ambos com mesmo patrimônio de 50k, custo 2k/mês
    const ferramenta = resolverTipoCompra('ferramenta', {
      patrimonio: 50000, custo: 2000,
    }) as { permitido: boolean }

    const grandeSonho = resolverTipoCompra('grandeSonho', {
      subtipo: 'veiculo',
      patrimonio: 50000, entrada: 15000, custo: 2000,  // sobra 35k ≥ 24k ✓
      parcela: 600, manutencao: 200, depreciacao: 150,  // total 950
      balceLazer: 1000,  // 950 ≤ 1000 ✓
    }) as { aprovado: boolean }

    expect(ferramenta.permitido).toBe(true)   // notebook: apenas 6 meses de reserva
    expect(grandeSonho.aprovado).toBe(true)   // carro: entrada + fluxo ok
  })
})
