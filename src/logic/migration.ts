import {
  AppState,
  PerfilFinanceiro,
  Cenario,
  Meta,
  TipoCompra,
  Envelope,
  APP_STATE_VAZIO,
} from '../types'
import { gerarId } from '../utils/id'

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x)
}

function num(raw: Record<string, unknown>, key: string, defaultValue: number): number {
  const v = raw[key]
  return typeof v === 'number' && !Number.isNaN(v) ? v : defaultValue
}

function str(raw: Record<string, unknown>, key: string, defaultValue: string): string {
  const v = raw[key]
  return typeof v === 'string' ? v : defaultValue
}

function migrarMetas(raw: unknown): Meta[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((m): m is Record<string, unknown> => isObject(m))
    .filter(m => typeof m.id === 'number' && typeof m.nome === 'string' && typeof m.valor === 'number')
    .map(m => ({
      id: m.id as number,
      nome: m.nome as string,
      valor: m.valor as number,
    }))
}

function migrarEnvelopes(raw: unknown): Envelope[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((e): e is Record<string, unknown> => isObject(e))
    .filter(e => typeof e.id === 'number' && typeof e.nome === 'string' && typeof e.pct === 'number')
    .map(e => ({
      id: e.id as number,
      nome: e.nome as string,
      pct: e.pct as number,
    }))
}

function migrarCenarios(raw: unknown): Cenario[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((c): c is Record<string, unknown> => isObject(c))
    .filter(c => typeof c.id === 'string' && typeof c.nome === 'string' && typeof c.itemValor === 'number')
    .map(c => {
      const tipoCompraRaw = str(c, 'tipoCompra', 'lazer')
      const tipoCompra: TipoCompra =
        tipoCompraRaw === 'ferramenta' || tipoCompraRaw === 'passivoAltoValor'
          ? tipoCompraRaw
          : 'lazer'
      const agora = Date.now()
      return {
        id: c.id as string,
        nome: str(c, 'nome', 'Cenário 1'),
        itemNome: str(c, 'itemNome', ''),
        itemValor: num(c, 'itemValor', 0),
        tipoCompra,
        parcelas: num(c, 'parcelas', 1),
        taxaJuros: num(c, 'taxaJuros', 0),
        manutencaoMensal: num(c, 'manutencaoMensal', 0),
        entradaValor: num(c, 'entradaValor', 0),
        despesaSubstituida: num(c, 'despesaSubstituida', 0),
        criadoEm: num(c, 'criadoEm', agora),
        atualizadoEm: num(c, 'atualizadoEm', agora),
      }
    })
}

/**
 * Coerces any raw object into a valid AppState.
 * Handles v1 (flat fields), v2 (nested perfil/cenarios), and partial/malformed input uniformly.
 * There is only one coercion path — v2 detection is irrelevant because any input is normalized.
 */
export function migrarV1ParaV2(raw: unknown): AppState {
  if (!isObject(raw)) return APP_STATE_VAZIO

  // ── Perfil ──
  const rawPerfil = isObject(raw.perfil) ? raw.perfil : raw
  const perfil: PerfilFinanceiro = {
    renda: num(rawPerfil, 'renda', 0),
    custo: num(rawPerfil, 'custo', 0),
    parcelasExistentes: num(rawPerfil, 'parcelasExistentes', 0),
    envelopes: migrarEnvelopes(rawPerfil.envelopes),
    patrimonio: num(rawPerfil, 'patrimonio', 0),
    reservaMeses: num(rawPerfil, 'reservaMeses', 6),
    rendimentoAnual: num(rawPerfil, 'rendimentoAnual', 0),
    metaValor: num(rawPerfil, 'metaValor', 0),
    reducaoHipotetica: num(rawPerfil, 'reducaoHipotetica', 0),
  }

  // ── Metas ──
  // metas lives at the root of both v1 and v2
  const metas = migrarMetas(raw.metas)

  // ── Cenários ──
  // v2: raw.cenarios is an array of Cenario objects — coerce each one
  // v1: no raw.cenarios — build from flat itemValor field
  let cenarios: Cenario[]
  let cenarioAtivoId: string | null = null

  if (Array.isArray(raw.cenarios)) {
    // v2 path: coerce each cenario, drop malformed ones
    cenarios = migrarCenarios(raw.cenarios)

    // Validate cenarioAtivoId: only keep if it matches a valid cenario id
    const ativoRaw = typeof raw.cenarioAtivoId === 'string' ? raw.cenarioAtivoId : null
    const ativoValido = ativoRaw !== null && cenarios.some(c => c.id === ativoRaw)
    cenarioAtivoId = ativoValido ? ativoRaw : (cenarios.length > 0 ? cenarios[0].id : null)
  } else {
    // v1 path: build cenario from flat fields if itemValor > 0
    const itemValor = num(raw, 'itemValor', 0)
    cenarios = []

    if (itemValor > 0) {
      const tipoCompraRaw = str(raw, 'tipoCompra', 'lazer')
      const tipoCompra: TipoCompra = (
        tipoCompraRaw === 'ferramenta' || tipoCompraRaw === 'passivoAltoValor'
          ? tipoCompraRaw
          : 'lazer'
      ) as TipoCompra

      const id = gerarId()
      const agora = Date.now()
      const itemNome = str(raw, 'itemNome', '')

      cenarios.push({
        id,
        nome: itemNome.trim() || 'Cenário 1',
        itemNome,
        itemValor,
        tipoCompra,
        parcelas: num(raw, 'parcelas', 1),
        taxaJuros: num(raw, 'taxaJuros', 0),
        manutencaoMensal: num(raw, 'manutencaoMensal', 0),
        entradaValor: num(raw, 'entradaValor', 0),
        despesaSubstituida: num(raw, 'despesaSubstituida', 0),
        criadoEm: agora,
        atualizadoEm: agora,
      })
      cenarioAtivoId = id
    }
  }

  // ── onboardingConcluido ──
  const onboardingConcluido =
    typeof raw.onboardingConcluido === 'boolean'
      ? raw.onboardingConcluido
      : perfil.renda > 0 && cenarios.length > 0

  return {
    perfil,
    cenarios,
    metas,
    cenarioAtivoId,
    onboardingConcluido,
  }
}
