import { describe, it, expect } from 'vitest'
import { parseHash, formatHash } from '../src/hooks/useHashRoute.ts'

describe('parseHash', () => {
  it('retorna path "perfil" como default quando hash é vazio', () => {
    expect(parseHash('')).toEqual({ path: 'perfil', params: {} })
    expect(parseHash('#')).toEqual({ path: 'perfil', params: {} })
  })

  it('parseia path simples', () => {
    expect(parseHash('#/cenarios')).toEqual({ path: 'cenarios', params: {} })
    expect(parseHash('#/comparar')).toEqual({ path: 'comparar', params: {} })
    expect(parseHash('#/metas')).toEqual({ path: 'metas', params: {} })
  })

  it('parseia path com query params', () => {
    expect(parseHash('#/cenarios?id=abc123')).toEqual({
      path: 'cenarios',
      params: { id: 'abc123' },
    })
  })

  it('parseia múltiplos params', () => {
    expect(parseHash('#/cenarios?id=abc&foo=bar')).toEqual({
      path: 'cenarios',
      params: { id: 'abc', foo: 'bar' },
    })
  })

  it('rejeita paths desconhecidos e cai em "perfil"', () => {
    expect(parseHash('#/banana')).toEqual({ path: 'perfil', params: {} })
  })

  it('decodifica componentes URL', () => {
    expect(parseHash('#/cenarios?id=hello%20world')).toEqual({
      path: 'cenarios',
      params: { id: 'hello world' },
    })
  })
})

describe('formatHash', () => {
  it('formata path sem params', () => {
    expect(formatHash('cenarios', {})).toBe('#/cenarios')
  })

  it('formata path com params', () => {
    expect(formatHash('cenarios', { id: 'abc' })).toBe('#/cenarios?id=abc')
  })

  it('escapa valores de params', () => {
    expect(formatHash('cenarios', { id: 'hello world' })).toBe(
      '#/cenarios?id=hello%20world',
    )
  })

  it('omite params quando objeto vazio ou undefined', () => {
    expect(formatHash('perfil')).toBe('#/perfil')
  })
})
