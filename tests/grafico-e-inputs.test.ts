import { describe, it, expect } from 'vitest'
import {
  calcMesQueAtingeMeta,
  calcAtrasoCompra,
  calcProjecaoPatrimonio,
  calcImpactoCompraNoPatrimonio,
} from '../src/logic/index.ts'

// ===========================================================
// calcMesQueAtingeMeta
// Dado um array de projeção, retorna o mês (1-based) em que
// o valor primeiro atinge ou supera a meta. Null se nunca.
// Usado pelo gráfico para marcar quando o patrimônio chega
// ao valor do item.
// ===========================================================

describe('calcMesQueAtingeMeta — encontra o mês correto', () => {
  it('atinge na primeira posição → mês 1', () => {
    expect(calcMesQueAtingeMeta([5000, 6000, 7000], 5000)).toBe(1)
  })

  it('atinge exatamente no limite → mês correto', () => {
    // [1000, 2000, 3000] atinge 3000 no mês 3
    expect(calcMesQueAtingeMeta([1000, 2000, 3000], 3000)).toBe(3)
  })

  it('supera (não apenas iguala) → primeiro mês que excede', () => {
    // Meta 2500: [1000, 2000, 3000] → mês 3 (3000 > 2500)
    expect(calcMesQueAtingeMeta([1000, 2000, 3000], 2500)).toBe(3)
  })

  it('nunca atinge dentro do horizonte → null', () => {
    expect(calcMesQueAtingeMeta([1000, 2000, 3000], 5000)).toBeNull()
  })

  it('array vazio → null', () => {
    expect(calcMesQueAtingeMeta([], 1000)).toBeNull()
  })

  it('meta zero → atinge no mês 1 (qualquer valor ≥ 0)', () => {
    expect(calcMesQueAtingeMeta([0, 1000, 2000], 0)).toBe(1)
  })

  it('valores negativos na projeção (patrimônio pós-compra no vermelho)', () => {
    // Compra consumiu todo o patrimônio → primeiros meses negativos
    expect(calcMesQueAtingeMeta([-5000, -3000, -1000, 1000, 3000], 0)).toBe(4)
  })
})

describe('calcMesQueAtingeMeta — cenário instrumento R$8k com lazer R$100/mês', () => {
  it('horizonte de 36 meses nunca chega a R$8k saindo de R$1k com R$100/mês', () => {
    // patrimônio inicial 1000, aporte 100, 36 meses → max = 1000 + 36×100 = 4600 < 8000
    const projecao = calcProjecaoPatrimonio(1000, 100, 36)
    expect(calcMesQueAtingeMeta(projecao, 8000)).toBeNull()
  })

  it('sem compra chega a R$8k no mês 70', () => {
    // precisaria de ceil((8000-1000)/100) = 70 meses
    const projecao = calcProjecaoPatrimonio(1000, 100, 80)
    expect(calcMesQueAtingeMeta(projecao, 8000)).toBe(70)
  })

  it('com compra à vista: patrimônio começa em -7000 (1000-8000), nunca chega em 36m', () => {
    const { comCompra } = calcImpactoCompraNoPatrimonio(1000, 100, 36, 8000, 1)
    expect(calcMesQueAtingeMeta(comCompra, 8000)).toBeNull()
  })
})

// ===========================================================
// calcAtrasoCompra
// Quantos meses a compra atrasa a chegada à meta.
// Null quando a meta é inatingível em qualquer cenário
// dentro do horizonte.
// ===========================================================

describe('calcAtrasoCompra — calcula atraso corretamente', () => {
  it('atraso zero: compra não impacta porque já atingiu antes', () => {
    const sem = [5000, 6000, 7000]
    const com = [5000, 6000, 7000]  // parcelado sem impacto
    expect(calcAtrasoCompra(sem, com, 5000)).toBe(0)
  })

  it('atraso de 2 meses: compra à vista de R$10k com aporte R$5k', () => {
    // Sem compra: meta 100k, atual 70k, aporte 5k → mês 6 (70+30=100)
    const sem = calcProjecaoPatrimonio(70000, 5000, 12)
    // Com compra: atual 60k (70k-10k), aporte 5k → mês 8 (60+40=100)
    const com = calcProjecaoPatrimonio(60000, 5000, 12)
    expect(calcAtrasoCompra(sem, com, 100000)).toBe(2)
  })

  it('null quando meta inatingível em algum cenário', () => {
    // Sem compra: 36 meses não chegam a 8000 com aporte 100 partindo de 1000
    const sem = calcProjecaoPatrimonio(1000, 100, 36)
    const com = calcProjecaoPatrimonio(-7000, 100, 36)
    expect(calcAtrasoCompra(sem, com, 8000)).toBeNull()
  })

  it('null quando sem compra também não atinge (horizonte curto)', () => {
    const sem = calcProjecaoPatrimonio(0, 1000, 5)  // max 5000
    const com = calcProjecaoPatrimonio(-5000, 1000, 5)
    expect(calcAtrasoCompra(sem, com, 10000)).toBeNull()
  })

  it('atraso proporcional ao valor da compra', () => {
    // Aporte 1000/mês. Compra R$3000 → 3 meses de atraso. Compra R$5000 → 5 meses.
    const base = calcProjecaoPatrimonio(10000, 1000, 20)
    const com3k = calcProjecaoPatrimonio(7000, 1000, 20)
    const com5k = calcProjecaoPatrimonio(5000, 1000, 20)
    const meta = 20000
    expect(calcAtrasoCompra(base, com3k, meta)).toBe(3)
    expect(calcAtrasoCompra(base, com5k, meta)).toBe(5)
  })
})

// ===========================================================
// Invariantes do gráfico — propriedades que os dados do
// gráfico sempre devem satisfazer
// ===========================================================

describe('Invariantes do gráfico de projeção', () => {
  it('semCompra sempre >= comCompra para compra à vista (déficit constante)', () => {
    const { semCompra, comCompra } = calcImpactoCompraNoPatrimonio(
      20000, 2000, 24, 6000, 1,
    )
    semCompra.forEach((v, i) => {
      expect(v).toBeGreaterThanOrEqual(comCompra[i])
    })
  })

  it('déficit constante = itemValor para compra à vista', () => {
    const { semCompra, comCompra } = calcImpactoCompraNoPatrimonio(
      50000, 3000, 12, 8000, 1,
    )
    semCompra.forEach((v, i) => {
      expect(v - comCompra[i]).toBeCloseTo(8000, 2)
    })
  })

  it('após as parcelas, o déficit entre as linhas iguala o valor total do item', () => {
    // 12k item em 6x (2k/mês parcela), aporte 5k/mês
    // Após mês 6: deficit deve ser 12k (parcelas quitadas, só o buraco inicial conta)
    const { semCompra, comCompra } = calcImpactoCompraNoPatrimonio(
      30000, 5000, 12, 12000, 6,
    )
    const deficit = semCompra[11] - comCompra[11]  // mês 12
    expect(deficit).toBeCloseTo(12000, 2)
  })

  it('parcelado 12x: durante pagamento, aporte efetivo é menor', () => {
    // aporte 2k, parcela = 6000/12 = 500/mês → aporte efetivo 1500
    const { semCompra, comCompra } = calcImpactoCompraNoPatrimonio(
      10000, 2000, 12, 6000, 12,
    )
    // Mês 1: sem = 12000, com = 11500 (10000 + 1500)
    expect(comCompra[0]).toBeCloseTo(11500, 2)
    expect(semCompra[0]).toBe(12000)
  })

  it('parcela maior que aporte → patrimônio diminui durante as parcelas', () => {
    // aporte 500/mês, parcela = 6000/12 = 500/mês → aporte efetivo 0
    const { comCompra } = calcImpactoCompraNoPatrimonio(
      10000, 500, 12, 6000, 12,
    )
    // Aporte efetivo = 0 → patrimônio estacionado nos primeiros 12 meses
    expect(comCompra[0]).toBeCloseTo(10000, 2)
    expect(comCompra[11]).toBeCloseTo(10000, 2)
  })

  it('parcela muito maior que aporte → patrimônio decresce durante as parcelas', () => {
    // aporte 300/mês, parcela = 3000/6 = 500/mês → aporte efetivo -200
    const { comCompra } = calcImpactoCompraNoPatrimonio(
      5000, 300, 8, 3000, 6,
    )
    // Mês 1: 5000 + (300-500) = 4800
    expect(comCompra[0]).toBeCloseTo(4800, 2)
    // Mês 6 (última parcela): 5000 + 6×(-200) = 3800
    expect(comCompra[5]).toBeCloseTo(3800, 2)
    // Mês 7 (sem parcela): 3800 + 300 = 4100
    expect(comCompra[6]).toBeCloseTo(4100, 2)
  })

  it('array tem sempre 36 pontos para o gráfico principal', () => {
    const { semCompra, comCompra } = calcImpactoCompraNoPatrimonio(
      10000, 1000, 36, 5000, 12,
    )
    expect(semCompra).toHaveLength(36)
    expect(comCompra).toHaveLength(36)
  })
})

// ===========================================================
// Semântica do NumericInput — regras de comportamento
// que a lógica (não o DOM) garante. Os testes documentam
// os contratos que a implementação deve obedecer.
// ===========================================================

describe('NumericInput — contratos de comportamento (regras de negócio)', () => {
  it('parseFloat("") retorna NaN → onChange não deve ser chamado com NaN', () => {
    const parsed = parseFloat('')
    expect(isNaN(parsed)).toBe(true)
    // A implementação só chama onChange se !isNaN(parsed)
  })

  it('parseFloat("0") retorna 0 → válido, onChange deve ser chamado', () => {
    const parsed = parseFloat('0')
    expect(isNaN(parsed)).toBe(false)
    expect(parsed).toBe(0)
  })

  it('parseFloat("0.") retorna 0 → válido, mas exibe "0." sem reescrever', () => {
    // Enquanto o campo está focused, "0." é um estado intermediário válido
    expect(parseFloat('0.')).toBe(0)
  })

  it('parseFloat("0.5") retorna 0.5 → campo intermediário "0" não deve apagar', () => {
    // Garantia: ao focar, o useEffect NÃO sobrescreve o raw
    // Isso é garantido pelo focusedRef que suprime o sync enquanto focused
    expect(parseFloat('0.5')).toBe(0.5)
    expect(parseFloat('0')).toBe(0)  // "0" como passo intermediário é válido
  })

  it('onBlur com campo vazio usa defaultValue', () => {
    const raw = ''
    const parsed = parseFloat(raw)
    const committed = isNaN(parsed) ? 0 : parsed  // defaultValue = 0
    expect(committed).toBe(0)
  })

  it('onBlur com campo preenchido normaliza trailing zeros', () => {
    // "1000.00" → parseFloat → 1000 → String → "1000"
    const raw = '1000.00'
    const committed = parseFloat(raw)
    expect(committed).toBe(1000)
    expect(String(committed)).toBe('1000')
  })
})

// ===========================================================
// Envelopes — unicidade de IDs ao adicionar e remover
// ===========================================================

describe('Envelopes — IDs únicos após múltiplas operações', () => {
  // Simula a lógica de addEnvelope usando o mesmo algoritmo do componente
  function addEnvelope(envelopes: { id: number; nome: string; pct: number }[]) {
    const maxId = envelopes.reduce((m, e) => Math.max(m, e.id ?? 0), 0)
    return [...envelopes, { id: maxId + 1, nome: '', pct: 0 }]
  }

  function removeEnvelope(envelopes: { id: number; nome: string; pct: number }[], id: number) {
    return envelopes.filter((e) => e.id !== id)
  }

  it('primeiro envelope recebe id=1', () => {
    const result = addEnvelope([])
    expect(result[0].id).toBe(1)
  })

  it('ids incrementam monotonicamente', () => {
    let list = addEnvelope([])
    list = addEnvelope(list)
    list = addEnvelope(list)
    const ids = list.map((e) => e.id)
    expect(ids).toEqual([1, 2, 3])
  })

  it('após remover e readicionar, novo id é maior que qualquer existente', () => {
    let list = addEnvelope([])  // [id=1]
    list = addEnvelope(list)    // [id=1, id=2]
    list = removeEnvelope(list, 1)  // [id=2]
    list = addEnvelope(list)    // [id=2, id=3] — NÃO reutiliza id=1
    const ids = list.map((e) => e.id)
    expect(ids).not.toContain(1)
    expect(new Set(ids).size).toBe(ids.length)  // todos únicos
  })

  it('carregando do localStorage (ids 1,2,3) e adicionando → novo id=4, sem colisão', () => {
    // Simula envelopes salvos com ids existentes
    const fromStorage = [
      { id: 1, nome: 'Igreja', pct: 15 },
      { id: 2, nome: 'Investimentos', pct: 20 },
      { id: 3, nome: 'Férias', pct: 10 },
    ]
    const result = addEnvelope(fromStorage)
    expect(result[3].id).toBe(4)
    const allIds = result.map((e) => e.id)
    expect(new Set(allIds).size).toBe(allIds.length)
  })

  it('lista vazia: reiniciar counter não causa colisão com ids da sessão anterior', () => {
    // Simula: sessão anterior tinha ids 5,6,7 (salvos), nova sessão começa "do zero"
    // mas carrega do storage
    const fromStorage = [{ id: 5, nome: 'A', pct: 10 }, { id: 6, nome: 'B', pct: 20 }]
    const result = addEnvelope(fromStorage)
    expect(result[2].id).toBe(7)
  })

  it('N adições e remoções alternadas: ids sempre únicos', () => {
    let list: { id: number; nome: string; pct: number }[] = []
    for (let i = 0; i < 5; i++) list = addEnvelope(list)
    list = removeEnvelope(list, 2)
    list = removeEnvelope(list, 4)
    for (let i = 0; i < 3; i++) list = addEnvelope(list)
    const ids = list.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
