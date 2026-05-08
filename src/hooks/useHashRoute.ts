import { useState, useEffect, useCallback } from 'react'

export type RoutePath = 'inicio' | 'perfil' | 'cenarios' | 'comparar' | 'metas'

const VALID_PATHS: RoutePath[] = ['inicio', 'perfil', 'cenarios', 'comparar', 'metas']

export interface Route {
  path: RoutePath
  params: Record<string, string>
}

export function parseHash(hash: string): Route {
  // Remove leading "#" and "/"; if empty, default to perfil
  const cleaned = hash.replace(/^#\/?/, '')
  if (!cleaned) return { path: 'perfil', params: {} }

  const [pathPart, queryPart = ''] = cleaned.split('?')
  const path: RoutePath = (VALID_PATHS as string[]).includes(pathPart)
    ? (pathPart as RoutePath)
    : 'perfil'

  const params: Record<string, string> = {}
  if (queryPart) {
    for (const pair of queryPart.split('&')) {
      const [k, v = ''] = pair.split('=')
      try {
        if (k) params[decodeURIComponent(k)] = decodeURIComponent(v)
      } catch {
        // skip malformed URI components
      }
    }
  }
  return { path, params }
}

export function formatHash(path: RoutePath, params: Record<string, string> = {}): string {
  const keys = Object.keys(params)
  if (keys.length === 0) return `#/${path}`
  const query = keys
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join('&')
  return `#/${path}?${query}`
}

export function useHashRoute(): {
  route: Route
  navigate: (path: RoutePath, params?: Record<string, string>) => void
} {
  const [route, setRoute] = useState<Route>(() =>
    parseHash(typeof window !== 'undefined' ? window.location.hash : ''),
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onChange = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', onChange)
    // Sync once on mount in case it changed before listener was attached
    onChange()
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const navigate = useCallback(
    (path: RoutePath, params: Record<string, string> = {}) => {
      if (typeof window === 'undefined') return
      window.location.hash = formatHash(path, params)
    },
    [],
  )

  return { route, navigate }
}
