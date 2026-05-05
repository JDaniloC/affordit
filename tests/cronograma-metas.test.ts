import { describe, it, expect } from 'vitest'
import {
  calcCronogramaMetas,
  calcMesItemAposFila,
  calcAtrasoPatrimonioPorFila,
  calcCronogramaSaudavel,
  formatMesAbreviado,
  formatPrazoBR,
} from '../src/logic/index.ts'
import type { Meta } from '../src/logic/index.ts'

const meta = (id: number, nome: string, valor: number): Meta => ({ id, nome, valor })

describe('calcCronogramaMetas — casos base', () => {
  it('lista vazia retorna agendadas e inatingiveis vazios', () => {
    const r = calcCronogramaMetas([], 1_000, 0)
    expect(r.agendadas).toEqual([])
    expect(r.metasInatingiveis).toEqual([])
  })

  it('1 meta com sobra positiva e sem head start: mês = ceil(valor/sobra)', () => {
    const r = calcCronogramaMetas([meta(1, 'Notebook', 4_500)], 500, 0)
    expect(r.agendadas).toHaveLength(1)
    expect(r.agendadas[0]).toMatchObject({
      posicao: 1,
      mesQueComeca: 0,
      mesQueCompleta: 9,
      mesesParaCompletar: 9,
      saldoInicial: 0,
    })
    expect(r.metasInatingiveis).toEqual([])
  })
})

describe('calcCronogramaMetas — head start', () => {
  it('head start cobre 100% da meta: mês 0', () => {
    const r = calcCronogramaMetas([meta(1, 'Curso', 2_000)], 500, 5_000)
    expect(r.agendadas[0]).toMatchObject({
      mesQueComeca: 0,
      mesQueCompleta: 0,
      mesesParaCompletar: 0,
      saldoInicial: 5_000,
    })
  })

  it('head start parcial: mês = ceil(falta/sobra)', () => {
    const r = calcCronogramaMetas([meta(1, 'Bicicleta', 3_000)], 500, 1_000)
    expect(r.agendadas[0]).toMatchObject({
      mesQueComeca: 0,
      mesQueCompleta: 4,
      mesesParaCompletar: 4,
      saldoInicial: 1_000,
    })
  })

  it('head start exatamente igual ao valor da meta: mês 0', () => {
    const r = calcCronogramaMetas([meta(1, 'Item', 1_000)], 500, 1_000)
    expect(r.agendadas[0].mesQueCompleta).toBe(0)
  })

  it('head start cobre 2 metas em sequência (troco passa)', () => {
    const r = calcCronogramaMetas(
      [meta(1, 'A', 1_000), meta(2, 'B', 500)],
      500,
      2_000,
    )
    expect(r.agendadas[0].mesQueCompleta).toBe(0)
    expect(r.agendadas[0].saldoInicial).toBe(2_000)
    expect(r.agendadas[1].mesQueCompleta).toBe(0)
    expect(r.agendadas[1].saldoInicial).toBe(1_000)
  })
})

describe('calcCronogramaMetas — fila com múltiplas metas', () => {
  it('3 metas iguais com sobra constante: meses cumulativos', () => {
    const r = calcCronogramaMetas(
      [meta(1, 'A', 1_000), meta(2, 'B', 1_000), meta(3, 'C', 1_000)],
      500,
      0,
    )
    expect(r.agendadas[0].mesQueCompleta).toBe(2)
    expect(r.agendadas[1].mesQueComeca).toBe(2)
    expect(r.agendadas[1].mesQueCompleta).toBe(4)
    expect(r.agendadas[2].mesQueCompleta).toBe(6)
  })

  it('troco fracionado passa para a próxima meta', () => {
    const r = calcCronogramaMetas(
      [meta(1, 'A', 1_100), meta(2, 'B', 500)],
      300,
      0,
    )
    expect(r.agendadas[0].mesesParaCompletar).toBe(4)
    expect(r.agendadas[1].saldoInicial).toBe(100)
    expect(r.agendadas[1].mesesParaCompletar).toBe(2)
    expect(r.agendadas[1].mesQueCompleta).toBe(6)
  })

  it('reordenação altera cronograma', () => {
    const a = meta(1, 'A', 5_000)
    const b = meta(2, 'B', 1_000)
    const r1 = calcCronogramaMetas([a, b], 500, 0)
    const r2 = calcCronogramaMetas([b, a], 500, 0)
    expect(r1.agendadas[0].mesQueCompleta).toBe(10)
    expect(r2.agendadas[0].mesQueCompleta).toBe(2)
  })

  it('posição 1-based', () => {
    const r = calcCronogramaMetas(
      [meta(1, 'A', 100), meta(2, 'B', 100)],
      100,
      0,
    )
    expect(r.agendadas[0].posicao).toBe(1)
    expect(r.agendadas[1].posicao).toBe(2)
  })
})

describe('calcCronogramaMetas — inatingíveis e edge cases', () => {
  it('sobra zero + head start zero: tudo inatingível', () => {
    const r = calcCronogramaMetas(
      [meta(1, 'A', 1_000), meta(2, 'B', 500)],
      0,
      0,
    )
    expect(r.agendadas).toEqual([])
    expect(r.metasInatingiveis).toHaveLength(2)
  })

  it('sobra zero + head start cobre só a primeira', () => {
    const r = calcCronogramaMetas(
      [meta(1, 'A', 1_000), meta(2, 'B', 500)],
      0,
      1_000,
    )
    expect(r.agendadas).toHaveLength(1)
    expect(r.metasInatingiveis).toHaveLength(1)
  })

  it('meta inatingível no meio (estoura horizonte) não para a fila', () => {
    const r = calcCronogramaMetas(
      [meta(1, 'pequena1', 200), meta(2, 'gigante', 100_000), meta(3, 'pequena2', 100)],
      100,
      0,
    )
    expect(r.agendadas.map((a) => a.meta.id)).toEqual([1, 3])
    expect(r.metasInatingiveis.map((m) => m.id)).toEqual([2])
    expect(r.agendadas[0].mesQueCompleta).toBe(2)
    expect(r.agendadas[1].mesQueComeca).toBe(2)
  })

  it('meta com valor 0: mês 0, troco = saldo anterior', () => {
    const r = calcCronogramaMetas(
      [meta(1, 'A', 100), meta(2, 'gratis', 0), meta(3, 'B', 100)],
      100,
      0,
    )
    expect(r.agendadas[1].mesQueCompleta).toBe(1)
    expect(r.agendadas[2].mesQueCompleta).toBe(2)
  })

  it('valor negativo de meta tratado como 0 (defensivo)', () => {
    const r = calcCronogramaMetas([meta(1, 'glitch', -500)], 100, 0)
    expect(r.agendadas[0].mesQueCompleta).toBe(0)
  })

  it('sobra mensal igual ao valor da meta: mês 1', () => {
    const r = calcCronogramaMetas([meta(1, 'A', 500)], 500, 0)
    expect(r.agendadas[0].mesQueCompleta).toBe(1)
  })

  it('determinismo: mesma entrada → mesma saída', () => {
    const input: [Meta[], number, number] = [
      [meta(1, 'A', 1_300), meta(2, 'B', 700), meta(3, 'C', 250)],
      400,
      500,
    ]
    const r1 = calcCronogramaMetas(...input)
    const r2 = calcCronogramaMetas(...input)
    expect(r1).toEqual(r2)
  })

  it('10 metas em fila: cronograma O(n) consistente', () => {
    const metas10 = Array.from({ length: 10 }, (_, i) => meta(i + 1, `M${i + 1}`, 1_000))
    const r = calcCronogramaMetas(metas10, 500, 0)
    expect(r.agendadas).toHaveLength(10)
    expect(r.agendadas[9].mesQueCompleta).toBe(20)
  })
})

describe('calcMesItemAposFila', () => {
  it('fila vazia: equivalente a calcMesesParaMeta clássico', () => {
    expect(calcMesItemAposFila(1_000, [], 200, 0).mes).toBe(5)
  })

  it('item após 1 meta', () => {
    const r = calcMesItemAposFila(500, [meta(1, 'A', 1_000)], 100, 0)
    expect(r.mes).toBe(15)
  })

  it('item após 3 metas', () => {
    const r = calcMesItemAposFila(
      300,
      [meta(1, 'A', 200), meta(2, 'B', 200), meta(3, 'C', 200)],
      100,
      0,
    )
    expect(r.mes).toBe(9)
  })

  it('item inatingível porque a fila estoura horizonte: null', () => {
    const r = calcMesItemAposFila(1_000, [meta(1, 'gigante', 100_000)], 100, 0)
    expect(r.mes).toBeNull()
  })

  it('item gratuito (valor 0): mês = última meta da fila', () => {
    const r = calcMesItemAposFila(0, [meta(1, 'A', 1_000)], 100, 0)
    expect(r.mes).toBe(10)
  })
})

describe('formatMesAbreviado', () => {
  it('mês 0 retorna mês corrente em pt-BR (formato "mai/2026")', () => {
    const refDate = new Date(2026, 4, 15) // mai/2026
    expect(formatMesAbreviado(0, refDate)).toMatch(/mai\.?\/2026/)
  })

  it('mês 1 retorna mês seguinte', () => {
    const refDate = new Date(2026, 4, 15)
    expect(formatMesAbreviado(1, refDate)).toMatch(/jun\.?\/2026/)
  })

  it('cruza ano corretamente', () => {
    const refDate = new Date(2026, 11, 1) // dez/2026
    expect(formatMesAbreviado(2, refDate)).toMatch(/fev\.?\/2027/)
  })
})

describe('calcCronogramaSaudavel', () => {
  it('1 meta de R$5k: adiada até patrimônio ≥ R$100k (5%) E atraso ≤ 3m', () => {
    // patrimônio 70k, meta 100k, sobra 500/mês, sem juros, reserva 20k
    // pctMax 5% → patrimônio precisa estar em 100k+ para 5k caber
    // De 70k para 100k: 60 meses com 500/mês
    // Atraso marginal de comprar em 60: meta sem compra atinge mês 60, com compra atinge ~70 → atraso ~10m, > 3m
    // Então adia ainda mais até que o atraso marginal caia para ≤3
    const r = calcCronogramaSaudavel(
      [{ id: 1, nome: 'Notebook', valor: 5_000 }],
      70_000, 500, 0, 100_000, 0.05, 3, 20_000,
    )
    expect(r.agendadas).toHaveLength(1)
    expect(r.agendadas[0].mesQueCompleta).toBeGreaterThanOrEqual(60)
  })

  it('compra muito grande relativamente ao patrimônio: vira inatingível saudável', () => {
    // patrimônio 1k, valor 50k, sobra 100/mês, meta 0 → ignora critério 2
    // Mas com pctMax 5%, valor precisa ≤ 50 do patrimônio. patrimonio precisa ≥ 1M.
    // Em 600 meses chega a 1k + 100*600 = 61k. Não dá.
    const r = calcCronogramaSaudavel(
      [{ id: 1, nome: 'Caro', valor: 50_000 }],
      1_000, 100, 0, 0, 0.05, 6, 0,
    )
    expect(r.agendadas).toHaveLength(0)
    expect(r.metasInatingiveis).toHaveLength(1)
  })

  it('mantém ordem da fila — meta i só pode acontecer após meta i-1', () => {
    const r = calcCronogramaSaudavel(
      [
        { id: 1, nome: 'A', valor: 1_000 },
        { id: 2, nome: 'B', valor: 1_000 },
        { id: 3, nome: 'C', valor: 1_000 },
      ],
      100_000, 500, 0, 0, 0.05, 6, 20_000,
    )
    expect(r.agendadas).toHaveLength(3)
    expect(r.agendadas[0].mesQueCompleta).toBeLessThan(r.agendadas[1].mesQueCompleta)
    expect(r.agendadas[1].mesQueCompleta).toBeLessThan(r.agendadas[2].mesQueCompleta)
  })

  it('respeita reserva: compra que derrubaria patrimônio abaixo da reserva é adiada', () => {
    // patrimônio 25k, reserva 20k, meta 0 (ignora #2), pctMax 100% (passa #1 sempre)
    // Compra de 10k derrubaria para 15k < 20k. Adia.
    const r = calcCronogramaSaudavel(
      [{ id: 1, nome: 'X', valor: 10_000 }],
      25_000, 500, 0, 0, 1.0, 999, 20_000,
    )
    expect(r.agendadas[0].mesQueCompleta).toBeGreaterThan(0)
  })

  it('metaValor=0 ignora critério de atraso e usa só pct', () => {
    const r = calcCronogramaSaudavel(
      [{ id: 1, nome: 'X', valor: 5_000 }],
      200_000, 500, 0, 0, 0.05, 3, 20_000,
    )
    // 5k é 2.5% de 200k → passa critério 1 imediatamente
    expect(r.agendadas[0].mesQueCompleta).toBe(0)
  })

  it('lista vazia retorna agendadas e inatingiveis vazios', () => {
    const r = calcCronogramaSaudavel([], 100_000, 500, 0, 100_000, 0.05, 3, 20_000)
    expect(r.agendadas).toEqual([])
    expect(r.metasInatingiveis).toEqual([])
  })
})

describe('formatPrazoBR', () => {
  it('zero ou negativo retorna "agora"', () => {
    expect(formatPrazoBR(0)).toBe('agora')
    expect(formatPrazoBR(-3)).toBe('agora')
  })

  it('menos de 12 meses retorna "X meses" (ou "1 mês")', () => {
    expect(formatPrazoBR(1)).toBe('1 mês')
    expect(formatPrazoBR(11)).toBe('11 meses')
  })

  it('exatamente 12 meses retorna "1 ano"', () => {
    expect(formatPrazoBR(12)).toBe('1 ano')
  })

  it('múltiplos de 12 retornam "N anos"', () => {
    expect(formatPrazoBR(24)).toBe('2 anos')
    expect(formatPrazoBR(60)).toBe('5 anos')
  })

  it('anos + meses retornam "X anos e Y meses"', () => {
    expect(formatPrazoBR(14)).toBe('1 ano e 2 meses')
    expect(formatPrazoBR(25)).toBe('2 anos e 1 mês')
    expect(formatPrazoBR(100)).toBe('8 anos e 4 meses')
  })
})

describe('calcAtrasoPatrimonioPorFila', () => {
  const filaItem = (id: number, valor: number, mesQueCompleta: number) => ({
    id, valor, mesQueCompleta,
  })

  it('metaValor = 0: retorna tudo null', () => {
    const r = calcAtrasoPatrimonioPorFila(10_000, 0, 500, 0, [filaItem(1, 1_000, 2)])
    expect(r.atrasoTotal).toBeNull()
    expect(r.mesesSemFila).toBeNull()
    expect(r.atrasoPorMeta[0].meses).toBeNull()
  })

  it('fila vazia: atraso total = 0, mesesSem = mesesCom', () => {
    const r = calcAtrasoPatrimonioPorFila(10_000, 50_000, 500, 0, [])
    expect(r.mesesSemFila).toBe(80) // (50k - 10k) / 500 = 80
    expect(r.mesesComFila).toBe(80)
    expect(r.atrasoTotal).toBe(0)
    expect(r.atrasoPorMeta).toEqual([])
  })

  it('1 meta na fila: atraso reflete o valor da compra', () => {
    // patrimônio 10k, meta 50k, sobra 500/mês, sem juros
    // Sem fila: 80 meses para meta.
    // Com 1 compra de 5k no mês 10: trajetória cai 5k em mês 10. Total +10 meses.
    const r = calcAtrasoPatrimonioPorFila(
      10_000, 50_000, 500, 0,
      [filaItem(1, 5_000, 10)],
    )
    expect(r.mesesSemFila).toBe(80)
    expect(r.mesesComFila).toBe(90)
    expect(r.atrasoTotal).toBe(10)
    expect(r.atrasoPorMeta[0]).toEqual({ id: 1, meses: 10 })
  })

  it('múltiplas metas: cada uma tem custo marginal positivo', () => {
    const r = calcAtrasoPatrimonioPorFila(
      10_000, 50_000, 500, 0,
      [filaItem(1, 2_000, 4), filaItem(2, 3_000, 10)],
    )
    expect(r.atrasoTotal).toBeGreaterThan(0)
    expect(r.atrasoPorMeta[0].meses).toBeGreaterThan(0)
    expect(r.atrasoPorMeta[1].meses).toBeGreaterThan(0)
    // soma dos custos marginais ≈ atrasoTotal (não exato com compounding, mas aqui sem juros = exato)
    const soma = r.atrasoPorMeta.reduce((s, a) => s + (a.meses ?? 0), 0)
    expect(soma).toBe(r.atrasoTotal)
  })

  it('sobra mensal <= 0 e patrimônio < meta: tudo null', () => {
    const r = calcAtrasoPatrimonioPorFila(
      10_000, 50_000, 0, 0,
      [filaItem(1, 1_000, 1)],
    )
    expect(r.mesesSemFila).toBeNull()
    expect(r.mesesComFila).toBeNull()
    expect(r.atrasoTotal).toBeNull()
    expect(r.atrasoPorMeta[0].meses).toBeNull()
  })

  it('patrimônio já atinge a meta e fila não derruba: atraso 0', () => {
    // patrimônio 100k, meta 50k → mês 0 já passa. Compra de 1k no mês 5 derruba para 99k → ainda > 50k.
    const r = calcAtrasoPatrimonioPorFila(
      100_000, 50_000, 500, 0,
      [filaItem(1, 1_000, 5)],
    )
    expect(r.mesesSemFila).toBe(0)
    expect(r.mesesComFila).toBe(0)
    expect(r.atrasoTotal).toBe(0)
  })

  it('REGRESSÃO: compras feitas no mês 0 (head start) reduzem patrimônio inicial', () => {
    // Cenário do cliente: patrimônio 70k, reserva 20k, meta 100k.
    // Head start = 50k. Compras totalizando 50k todas com mesQueCompleta=0.
    // Sem fila: precisa juntar 30k → 30k/500 = 60 meses.
    // Com fila: patrimônio cai para 20k no mês 0, precisa juntar 80k → 160 meses.
    // Atraso = 100 meses, NÃO zero.
    const r = calcAtrasoPatrimonioPorFila(
      70_000, 100_000, 500, 0,
      [
        filaItem(1, 20_000, 0),
        filaItem(2, 20_000, 0),
        filaItem(3, 10_000, 0),
      ],
    )
    expect(r.mesesSemFila).toBe(60)
    expect(r.mesesComFila).toBe(160)
    expect(r.atrasoTotal).toBe(100)
    // Cada compra contribui significativamente para o atraso
    for (const a of r.atrasoPorMeta) {
      expect(a.meses).not.toBeNull()
      expect(a.meses!).toBeGreaterThan(0)
    }
  })

  it('com juros compostos: atraso menor do que com taxa zero (poder do tempo)', () => {
    const r0 = calcAtrasoPatrimonioPorFila(
      10_000, 50_000, 500, 0,
      [filaItem(1, 5_000, 10)],
    )
    const r1 = calcAtrasoPatrimonioPorFila(
      10_000, 50_000, 500, 1, // 1% a.m.
      [filaItem(1, 5_000, 10)],
    )
    expect(r0.atrasoTotal).toBeGreaterThanOrEqual((r1.atrasoTotal as number))
  })
})
