import { AppState, APP_STATE_VAZIO } from '../types'
import { migrarV1ParaV2 } from '../logic/migration'

const KEY_V1 = 'affordit_state'
const KEY_V2 = 'affordit_state_v2'

export function loadAppState(): AppState {
  // 1. Tentar v2 direto
  try {
    const rawV2 = localStorage.getItem(KEY_V2)
    if (rawV2) {
      const parsed = JSON.parse(rawV2)
      return migrarV1ParaV2(parsed)
    }
  } catch {
    // ignora; tenta v1 abaixo
  }

  // 2. Fallback: migrar v1 se existir
  try {
    const rawV1 = localStorage.getItem(KEY_V1)
    if (rawV1) {
      const parsed = JSON.parse(rawV1)
      return migrarV1ParaV2(parsed)
    }
  } catch {
    // ignora
  }

  return APP_STATE_VAZIO
}

export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(KEY_V2, JSON.stringify(state))
    if (localStorage.getItem(KEY_V1)) {
      localStorage.removeItem(KEY_V1)
    }
  } catch {
    // localStorage cheio ou indisponível — silencioso
  }
}
