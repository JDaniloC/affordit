import { describe, it, expect, beforeEach } from 'vitest'
import { encodeShareUrl, tryDecodeShareFromUrl, clearShareParamFromUrl } from '../src/state/share'
import { APP_STATE_VAZIO, AppState, PERFIL_VAZIO } from '../src/types'

const makeState = (over: Partial<AppState> = {}): AppState => ({
  ...APP_STATE_VAZIO,
  perfil: { ...PERFIL_VAZIO, renda: 5_000, custo: 2_000, patrimonio: 10_000 },
  ...over,
})

function setHash(hash: string) {
  // jsdom expõe window.location; setar hash é tipicamente permitido.
  window.location.hash = hash
}

describe('encodeShareUrl + tryDecodeShareFromUrl — round-trip', () => {
  beforeEach(() => {
    setHash('')
  })

  it('round-trip preserva o estado', () => {
    const original = makeState({
      perfil: { ...PERFIL_VAZIO, renda: 8_000, custo: 3_500, patrimonio: 50_000, metaValor: 100_000, rendimentoAnual: 10 },
      cenarios: [
        {
          id: 'c1',
          nome: 'Notebook',
          itemNome: 'Notebook Pro',
          itemValor: 8_500,
          tipoCompra: 'ferramenta',
          parcelas: 12,
          taxaJuros: 2,
          manutencaoMensal: 0,
          entradaValor: 0,
          despesaSubstituida: 0,
          inflacaoAnual: 0,
          criadoEm: 1717000000000,
          atualizadoEm: 1717000000000,
        },
      ],
      cenarioAtivoId: 'c1',
      onboardingConcluido: true,
    })
    const url = encodeShareUrl(original, 'https://app.example/')
    // Extrai o hash da URL gerada e seta no window
    const hash = url.slice(url.indexOf('#'))
    setHash(hash)
    const decoded = tryDecodeShareFromUrl()
    expect(decoded).not.toBeNull()
    expect(decoded!.perfil.renda).toBe(8_000)
    expect(decoded!.cenarios).toHaveLength(1)
    expect(decoded!.cenarios[0].itemNome).toBe('Notebook Pro')
    expect(decoded!.onboardingConcluido).toBe(true)
  })

  it('round-trip preserva caracteres acentuados em nomes', () => {
    const original = makeState({
      cenarios: [
        {
          id: 'a',
          nome: 'Carro usado — São Paulo',
          itemNome: 'Móvel/Eletrônico R$',
          itemValor: 1_000,
          tipoCompra: 'lazer',
          parcelas: 1,
          taxaJuros: 0,
          manutencaoMensal: 0,
          entradaValor: 0,
          despesaSubstituida: 0,
          inflacaoAnual: 0,
          criadoEm: 1,
          atualizadoEm: 1,
        },
      ],
    })
    const url = encodeShareUrl(original, 'https://app.example/')
    setHash(url.slice(url.indexOf('#')))
    const decoded = tryDecodeShareFromUrl()
    expect(decoded!.cenarios[0].nome).toBe('Carro usado — São Paulo')
    expect(decoded!.cenarios[0].itemNome).toBe('Móvel/Eletrônico R$')
  })
})

describe('tryDecodeShareFromUrl — casos inválidos', () => {
  beforeEach(() => {
    setHash('')
  })

  it('hash vazio retorna null', () => {
    expect(tryDecodeShareFromUrl()).toBeNull()
  })

  it('hash sem param share retorna null', () => {
    setHash('#/perfil')
    expect(tryDecodeShareFromUrl()).toBeNull()
  })

  it('share param vazio retorna null', () => {
    setHash('#/perfil?share=')
    expect(tryDecodeShareFromUrl()).toBeNull()
  })

  it('share param inválido (base64 quebrado) retorna null', () => {
    setHash('#/perfil?share=!!!nãoébase64!!!')
    expect(tryDecodeShareFromUrl()).toBeNull()
  })

  it('share param com JSON inválido retorna null', () => {
    // base64 de "isto não é json"
    setHash('#/perfil?share=aXN0byBuw6NvIMOpIGpzb24')
    expect(tryDecodeShareFromUrl()).toBeNull()
  })
})

describe('clearShareParamFromUrl', () => {
  beforeEach(() => {
    setHash('')
  })

  it('remove o param share preservando a rota', () => {
    setHash('#/cenarios?share=abc')
    clearShareParamFromUrl()
    expect(window.location.hash).toBe('#/cenarios')
  })

  it('preserva outros params da query', () => {
    setHash('#/cenarios?id=42&share=abc')
    clearShareParamFromUrl()
    expect(window.location.hash).toContain('id=42')
    expect(window.location.hash).not.toContain('share=')
  })

  it('não faz nada se não há param share', () => {
    setHash('#/perfil')
    clearShareParamFromUrl()
    expect(window.location.hash).toBe('#/perfil')
  })

  it('não faz nada se hash vazio', () => {
    setHash('')
    clearShareParamFromUrl()
    expect(window.location.hash).toBe('')
  })
})
