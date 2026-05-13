import { describe, it, expect } from 'vitest'
import { migrarV1ParaV2 } from '../src/logic/migration.ts'
import { APP_STATE_VAZIO } from '../src/types.ts'

describe('migrarV1ParaV2', () => {
  it('retorna estado vazio quando entrada é null/undefined', () => {
    expect(migrarV1ParaV2(null)).toEqual(APP_STATE_VAZIO)
    expect(migrarV1ParaV2(undefined)).toEqual(APP_STATE_VAZIO)
  })

  it('retorna estado vazio quando entrada não é objeto', () => {
    expect(migrarV1ParaV2('string')).toEqual(APP_STATE_VAZIO)
    expect(migrarV1ParaV2(42)).toEqual(APP_STATE_VAZIO)
  })

  it('detecta v2 pré-existente e retorna como está', () => {
    const v2 = {
      ...APP_STATE_VAZIO,
      perfil: { ...APP_STATE_VAZIO.perfil, renda: 5000 },
    }
    expect(migrarV1ParaV2(v2)).toEqual(v2)
  })

  it('converte parcelasExistentes legado em 1 compromisso', () => {
    const v2 = {
      perfil: {
        renda: 5000, custo: 2000, parcelasExistentes: 300,
        envelopes: [], patrimonio: 0, reservaMeses: 6,
        rendimentoAnual: 0, metaValor: 0,
      },
      cenarios: [], metas: [], cenarioAtivoId: null, onboardingConcluido: true,
    }
    const result = migrarV1ParaV2(v2)
    expect(result.perfil.compromissos).toEqual([
      { id: 1, nome: 'Parcelas existentes', parcela: 300 },
    ])
    expect((result.perfil as unknown as Record<string, unknown>).parcelasExistentes).toBeUndefined()
  })

  it('preserva compromissos novos quando já estão no estado', () => {
    const v3 = {
      perfil: {
        renda: 5000, custo: 2000, parcelasExistentes: 999,  // legado deve ser ignorado
        envelopes: [], patrimonio: 0, reservaMeses: 6,
        rendimentoAnual: 0, metaValor: 0,
        compromissos: [
          { id: 5, nome: 'Cartão', parcela: 200 },
          { id: 6, nome: 'Net', parcela: 90, prazo: 24, prazoTotal: 36, taxa: 1.5 },
        ],
      },
      cenarios: [], metas: [], cenarioAtivoId: null, onboardingConcluido: true,
    }
    const result = migrarV1ParaV2(v3)
    expect(result.perfil.compromissos).toEqual([
      { id: 5, nome: 'Cartão', parcela: 200 },
      { id: 6, nome: 'Net', parcela: 90, prazo: 24, prazoTotal: 36, taxa: 1.5 },
    ])
  })

  it('lista vazia quando parcelasExistentes legado é 0 e não há compromissos novos', () => {
    const v2 = {
      perfil: {
        renda: 5000, custo: 0, parcelasExistentes: 0,
        envelopes: [], patrimonio: 0, reservaMeses: 6,
        rendimentoAnual: 0, metaValor: 0,
      },
      cenarios: [], metas: [], cenarioAtivoId: null, onboardingConcluido: true,
    }
    expect(migrarV1ParaV2(v2).perfil.compromissos).toEqual([])
  })

  it('migrarCompromissos filtra itens inválidos da lista (id/nome/parcela ausentes)', () => {
    const v3 = {
      perfil: {
        renda: 5000, custo: 0, parcelasExistentes: 0,
        envelopes: [], patrimonio: 0, reservaMeses: 6,
        rendimentoAnual: 0, metaValor: 0,
        compromissos: [
          { id: 1, nome: 'Válido', parcela: 100 },
          { id: 'string', nome: 'Inválido id', parcela: 50 },     // id não é number
          { id: 2, nome: '', parcela: 50 },                        // nome vazio é tecnicamente OK (string)
          { id: 3, parcela: 50 },                                  // sem nome
          { id: 4, nome: 'Sem parcela' },                          // sem parcela
          { id: 5, nome: 'OK 2', parcela: 80, prazo: 6 },
        ],
      },
      cenarios: [], metas: [], cenarioAtivoId: null, onboardingConcluido: true,
    }
    const result = migrarV1ParaV2(v3)
    // Deve sobrar: id 1, id 2 (nome vazio passa pelo typeof string), id 5
    expect(result.perfil.compromissos).toEqual([
      { id: 1, nome: 'Válido', parcela: 100 },
      { id: 2, nome: '', parcela: 50 },
      { id: 5, nome: 'OK 2', parcela: 80, prazo: 6 },
    ])
  })

  it('migra perfil financeiro do v1 corretamente (incluindo metaValor)', () => {
    const v1 = {
      renda: 5000,
      custo: 2000,
      parcelasExistentes: 300,
      envelopes: [{ id: 1, nome: 'Investimentos', pct: 10 }],
      patrimonio: 12000,
      reservaMeses: 6,
      rendimentoAnual: 12,
      metaValor: 50000,
    }
    const result = migrarV1ParaV2(v1)
    expect(result.perfil).toEqual({
      renda: 5000,
      envelopes: [{ id: 1, nome: 'Investimentos', pct: 10 }],
      patrimonio: 12000,
      reservaMeses: 6,
      rendimentoAnual: 12,
      metaValor: 50000,
      compromissos: [{ id: 1, nome: 'Parcelas existentes', parcela: 300 }],
      gastos: [{ id: 1, nome: 'Custo de vida', tipo: 'valor', valor: 2000 }],
    })
  })

  it('converte custo legado em 1 gasto', () => {
    const v2 = {
      perfil: {
        renda: 5000, custo: 2000, parcelasExistentes: 0,
        envelopes: [], patrimonio: 0, reservaMeses: 6,
        rendimentoAnual: 0, metaValor: 0,
      },
      cenarios: [], metas: [], cenarioAtivoId: null, onboardingConcluido: true,
    }
    const result = migrarV1ParaV2(v2)
    expect(result.perfil.gastos).toEqual([
      { id: 1, nome: 'Custo de vida', tipo: 'valor', valor: 2000 },
    ])
    expect((result.perfil as unknown as Record<string, unknown>).custo).toBeUndefined()
  })

  it('preserva gastos novos quando já estão no estado', () => {
    const v3 = {
      perfil: {
        renda: 5000, custo: 999,  // legado deve ser ignorado
        parcelasExistentes: 0, envelopes: [], patrimonio: 0, reservaMeses: 6,
        rendimentoAnual: 0, metaValor: 0,
        gastos: [
          { id: 5, nome: 'Aluguel', tipo: 'valor', valor: 1500 },
          { id: 6, nome: 'Mercado', tipo: 'pct', pct: 12 },
        ],
      },
      cenarios: [], metas: [], cenarioAtivoId: null, onboardingConcluido: true,
    }
    const result = migrarV1ParaV2(v3)
    expect(result.perfil.gastos).toEqual([
      { id: 5, nome: 'Aluguel', tipo: 'valor', valor: 1500 },
      { id: 6, nome: 'Mercado', tipo: 'pct', pct: 12 },
    ])
  })

  it('lista vazia quando custo legado é 0 e não há gastos novos', () => {
    const v2 = {
      perfil: {
        renda: 5000, custo: 0, parcelasExistentes: 0,
        envelopes: [], patrimonio: 0, reservaMeses: 6,
        rendimentoAnual: 0, metaValor: 0,
      },
      cenarios: [], metas: [], cenarioAtivoId: null, onboardingConcluido: true,
    }
    expect(migrarV1ParaV2(v2).perfil.gastos).toEqual([])
  })

  it('migrarGastos filtra itens inválidos (tipo ou campo ausente)', () => {
    const v3 = {
      perfil: {
        renda: 5000, custo: 0, parcelasExistentes: 0,
        envelopes: [], patrimonio: 0, reservaMeses: 6,
        rendimentoAnual: 0, metaValor: 0,
        gastos: [
          { id: 1, nome: 'Válido valor', tipo: 'valor', valor: 100 },
          { id: 2, nome: 'Válido pct', tipo: 'pct', pct: 10 },
          { id: 3, nome: 'Sem tipo', valor: 50 },                  // ignorado
          { id: 4, nome: 'Tipo inválido', tipo: 'misto', valor: 50 }, // ignorado
          { id: 5, nome: 'Tipo pct sem campo pct', tipo: 'pct', valor: 50 }, // ignorado
          { id: 'string', nome: 'Id inválido', tipo: 'valor', valor: 50 }, // ignorado
          { id: 7, nome: 'OK 2', tipo: 'valor', valor: 80 },
        ],
      },
      cenarios: [], metas: [], cenarioAtivoId: null, onboardingConcluido: true,
    }
    expect(migrarV1ParaV2(v3).perfil.gastos).toEqual([
      { id: 1, nome: 'Válido valor', tipo: 'valor', valor: 100 },
      { id: 2, nome: 'Válido pct', tipo: 'pct', pct: 10 },
      { id: 7, nome: 'OK 2', tipo: 'valor', valor: 80 },
    ])
  })

  it('preserva metas[] do v1 sem modificação (Ciclo F)', () => {
    const v1 = {
      renda: 5000,
      metas: [
        { id: 1, nome: 'Geladeira', valor: 3000 },
        { id: 2, nome: 'Notebook', valor: 8000 },
      ],
    }
    const result = migrarV1ParaV2(v1)
    expect(result.metas).toEqual([
      { id: 1, nome: 'Geladeira', valor: 3000 },
      { id: 2, nome: 'Notebook', valor: 8000 },
    ])
  })

  it('cria cenário a partir do item simulado em v1', () => {
    const v1 = {
      renda: 5000,
      itemNome: 'Notebook',
      itemValor: 4000,
      parcelas: 12,
      taxaJuros: 1.5,
      tipoCompra: 'lazer' as const,
      manutencaoMensal: 0,
      entradaValor: 0,
      despesaSubstituida: 0,
    }
    const result = migrarV1ParaV2(v1)
    expect(result.cenarios).toHaveLength(1)
    expect(result.cenarios[0].nome).toBe('Notebook')
    expect(result.cenarios[0].itemNome).toBe('Notebook')
    expect(result.cenarios[0].itemValor).toBe(4000)
    expect(result.cenarios[0].parcelas).toBe(12)
    expect(result.cenarios[0].taxaJuros).toBe(1.5)
    expect(result.cenarios[0].tipoCompra).toBe('lazer')
    expect(typeof result.cenarios[0].id).toBe('string')
    expect(result.cenarios[0].id.length).toBeGreaterThan(0)
    expect(result.cenarioAtivoId).toBe(result.cenarios[0].id)
  })

  it('usa "Cenário 1" quando itemNome está vazio', () => {
    const v1 = { renda: 5000, itemNome: '', itemValor: 4000 }
    const result = migrarV1ParaV2(v1)
    expect(result.cenarios[0].nome).toBe('Cenário 1')
  })

  it('NÃO cria cenário quando itemValor é zero ou ausente', () => {
    const v1 = { renda: 5000, itemValor: 0 }
    const result = migrarV1ParaV2(v1)
    expect(result.cenarios).toHaveLength(0)
    expect(result.cenarioAtivoId).toBeNull()
  })

  it('marca onboardingConcluido=true quando renda>0 e itemValor>0', () => {
    const v1 = { renda: 5000, itemValor: 4000 }
    expect(migrarV1ParaV2(v1).onboardingConcluido).toBe(true)
  })

  it('marca onboardingConcluido=false quando renda=0', () => {
    const v1 = { renda: 0, itemValor: 4000 }
    expect(migrarV1ParaV2(v1).onboardingConcluido).toBe(false)
  })

  it('marca onboardingConcluido=false quando itemValor=0', () => {
    const v1 = { renda: 5000, itemValor: 0 }
    expect(migrarV1ParaV2(v1).onboardingConcluido).toBe(false)
  })

  it('preserva valores numéricos zero (não substitui por defaults)', () => {
    const v1 = {
      renda: 5000,
      custo: 0,
      patrimonio: 0,
      parcelasExistentes: 0,
      reservaMeses: 0,
    }
    const result = migrarV1ParaV2(v1)
    expect((result.perfil as unknown as Record<string, unknown>).custo).toBeUndefined()
    expect(result.perfil.patrimonio).toBe(0)
    expect((result.perfil as unknown as Record<string, unknown>).parcelasExistentes).toBeUndefined()
    expect(result.perfil.reservaMeses).toBe(0)
  })

  it('aplica defaults para campos numéricos ausentes', () => {
    const v1 = { renda: 5000 }
    const result = migrarV1ParaV2(v1)
    expect((result.perfil as unknown as Record<string, unknown>).custo).toBeUndefined()
    expect(result.perfil.patrimonio).toBe(0)
    expect(result.perfil.reservaMeses).toBe(6)
    expect(result.perfil.envelopes).toEqual([])
    expect(result.perfil.metaValor).toBe(0)
  })

  it('v2 com perfil="string" (malformado) → perfil coercido com renda=0 sem crash', () => {
    const raw = {
      perfil: 'string',
      cenarios: [],
      metas: [],
      cenarioAtivoId: null,
      onboardingConcluido: false,
    }
    const result = migrarV1ParaV2(raw)
    expect(result.perfil.renda).toBe(0)
    expect((result.perfil as unknown as Record<string, unknown>).custo).toBeUndefined()
    expect(result.cenarios).toEqual([])
  })

  it('v2 com cenarios contendo um válido e um malformado → apenas o válido é mantido', () => {
    const agora = Date.now()
    const cenarioValido = {
      id: 'abc-123',
      nome: 'Notebook',
      itemNome: 'Notebook',
      itemValor: 4000,
      tipoCompra: 'lazer',
      parcelas: 1,
      taxaJuros: 0,
      manutencaoMensal: 0,
      entradaValor: 0,
      despesaSubstituida: 0,
      criadoEm: agora,
      atualizadoEm: agora,
    }
    const cenarioMalformado = {
      // falta id string e nome string — itemValor presente mas id é number (inválido)
      id: 999,
      nome: 42,
      itemValor: 8000,
    }
    const raw = {
      perfil: { renda: 5000, custo: 2000, parcelasExistentes: 0, envelopes: [], patrimonio: 10000, reservaMeses: 6, rendimentoAnual: 0, metaValor: 0 },
      cenarios: [cenarioValido, cenarioMalformado],
      metas: [],
      cenarioAtivoId: 'abc-123',
      onboardingConcluido: true,
    }
    const result = migrarV1ParaV2(raw)
    expect(result.cenarios).toHaveLength(1)
    expect(result.cenarios[0].id).toBe('abc-123')
    expect(result.cenarioAtivoId).toBe('abc-123')
  })

  it('v2 com cenarios: cenarioAtivoId apontando para malformado → ajustado para o válido', () => {
    const agora = Date.now()
    const cenarioValido = {
      id: 'abc-123',
      nome: 'Notebook',
      itemNome: 'Notebook',
      itemValor: 4000,
      tipoCompra: 'lazer',
      parcelas: 1,
      taxaJuros: 0,
      manutencaoMensal: 0,
      entradaValor: 0,
      despesaSubstituida: 0,
      criadoEm: agora,
      atualizadoEm: agora,
    }
    const cenarioMalformado = { id: 999, nome: 42, itemValor: 8000 }
    const raw = {
      perfil: { renda: 5000, custo: 2000, parcelasExistentes: 0, envelopes: [], patrimonio: 10000, reservaMeses: 6, rendimentoAnual: 0, metaValor: 0 },
      cenarios: [cenarioValido, cenarioMalformado],
      metas: [],
      // cenarioAtivoId aponta para o malformado (id numérico como string não existe)
      cenarioAtivoId: 'orphan-id',
      onboardingConcluido: true,
    }
    const result = migrarV1ParaV2(raw)
    // cenarioAtivoId não existe nos cenários válidos → cai no primeiro cenário válido
    expect(result.cenarioAtivoId).toBe('abc-123')
  })

  it('v2 com cenarioAtivoId não correspondente a nenhum cenário → set para null quando sem cenários', () => {
    const raw = {
      perfil: { renda: 5000, custo: 2000, parcelasExistentes: 0, envelopes: [], patrimonio: 10000, reservaMeses: 6, rendimentoAnual: 0, metaValor: 0 },
      cenarios: [],
      metas: [],
      cenarioAtivoId: 'nao-existe',
      onboardingConcluido: true,
    }
    const result = migrarV1ParaV2(raw)
    expect(result.cenarioAtivoId).toBeNull()
  })
})
