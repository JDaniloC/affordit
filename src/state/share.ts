import { AppState } from '../types'
import { migrarV1ParaV2 } from '../logic/migration'

const SHARE_PARAM = 'share'

// URL-safe base64 (RFC 4648 §5): troca + por -, / por _, e remove padding.
function toBase64Url(s: string): string {
  // btoa precisa de string latin-1; usamos encodeURIComponent + unescape para
  // garantir compatibilidade com caracteres acentuados ("R$", "ã", "ç" etc).
  const bin = unescape(encodeURIComponent(s))
  return btoa(bin)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function fromBase64Url(s: string): string {
  // Restaura padding e caracteres originais.
  const padded = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)
  const bin = atob(padded)
  return decodeURIComponent(escape(bin))
}

/**
 * Gera a URL completa de compartilhamento com o estado codificado em base64.
 * Resultado: `https://app/#/perfil?share=<base64>` (mantém a rota corrente).
 */
export function encodeShareUrl(state: AppState, baseHref?: string): string {
  const json = JSON.stringify(state)
  const enc = toBase64Url(json)
  const base =
    baseHref ??
    (typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : '')
  // Mantém a rota atual; adiciona/sobrescreve o param `share`.
  const hashAtual =
    typeof window !== 'undefined' && window.location.hash
      ? window.location.hash
      : '#/cenarios'
  const [pathPart, queryPart = ''] = hashAtual.replace(/^#\/?/, '').split('?')
  const params = new URLSearchParams(queryPart)
  params.set(SHARE_PARAM, enc)
  return `${base}#/${pathPart || 'cenarios'}?${params.toString()}`
}

/**
 * Tenta decodificar um estado compartilhado a partir da URL atual.
 * Retorna null se não houver parâmetro share, se o base64 estiver inválido,
 * ou se o JSON decodificado não puder ser normalizado para AppState.
 */
export function tryDecodeShareFromUrl(): AppState | null {
  if (typeof window === 'undefined') return null
  const hash = window.location.hash
  if (!hash) return null
  const queryStart = hash.indexOf('?')
  if (queryStart === -1) return null
  const params = new URLSearchParams(hash.slice(queryStart + 1))
  const enc = params.get(SHARE_PARAM)
  if (!enc) return null
  try {
    const json = fromBase64Url(enc)
    const parsed = JSON.parse(json)
    return migrarV1ParaV2(parsed)
  } catch {
    return null
  }
}

/**
 * Remove o parâmetro `share` da URL sem disparar reload (preserva a rota e
 * outros params eventuais). Use após carregar o estado compartilhado.
 */
export function clearShareParamFromUrl(): void {
  if (typeof window === 'undefined') return
  const hash = window.location.hash
  if (!hash) return
  const queryStart = hash.indexOf('?')
  if (queryStart === -1) return
  const pathPart = hash.slice(0, queryStart)
  const params = new URLSearchParams(hash.slice(queryStart + 1))
  params.delete(SHARE_PARAM)
  const remaining = params.toString()
  const novoHash = remaining ? `${pathPart}?${remaining}` : pathPart
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${novoHash}`)
}
