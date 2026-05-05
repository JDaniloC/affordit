// src/components/VereditoBadge.tsx
import React from 'react'
import { Veredito } from '../logic/index'

interface Props {
  veredito: Veredito
  size?: 'sm' | 'md'
}

const CLASSES: Record<Veredito['tipo'], string> = {
  aprovado: 'badge-aprovado',
  negado: 'badge-negado',
  juntar: 'badge-juntar',
}

const LABELS: Record<Veredito['tipo'], string> = {
  aprovado: 'OK',
  negado: 'Risco',
  juntar: 'Juntar',
}

export default function VereditoBadge({ veredito, size = 'md' }: Props) {
  const cls = CLASSES[veredito.tipo] ?? 'badge-juntar'
  const label = LABELS[veredito.tipo] ?? veredito.tipo
  return <span className={`badge ${cls} badge-${size}`} title={veredito.titulo}>{label}</span>
}
