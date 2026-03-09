import React from 'react'

interface Props {
  step: number // 1–4
  onBack: () => void
  onNext: () => void
  erro: string | null
}

export default function StepperActions({ step, onBack, onNext, erro }: Props) {
  const isFirst = step === 1
  const isLast = step === 4

  return (
    <div className="step-actions">
      {erro && <p className="error-msg">{erro}</p>}
      <div className="step-actions-row">
        {!isFirst && (
          <button className="btn-secondary step-btn-back" onClick={onBack}>
            ← Anterior
          </button>
        )}
        <button
          className={`btn-primary step-btn-next${isFirst ? ' step-btn-only' : ''}`}
          onClick={onNext}
        >
          {isLast ? 'Ver Resultado →' : 'Próximo →'}
        </button>
      </div>
    </div>
  )
}
