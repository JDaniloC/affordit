export function gerarId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback for environments without crypto.randomUUID (older test runners)
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
