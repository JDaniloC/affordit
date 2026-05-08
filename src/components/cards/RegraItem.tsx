import React from 'react'

interface Props {
  ok: boolean
  label: string
  desc: string
}

export default function RegraItem({ ok, label, desc }: Props) {
  return (
    <div className={`regra-item ${ok ? 'regra-ok' : 'regra-falhou'}`}>
      <div className="regra-icone">{ok ? '✅' : '❌'}</div>
      <div className="regra-texto">
        <div className="regra-label">{label}</div>
        <div className="regra-desc">{desc}</div>
      </div>
    </div>
  )
}
