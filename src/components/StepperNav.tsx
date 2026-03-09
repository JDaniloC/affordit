import React from 'react'

const STEP_LABELS = ['Envelopes', 'Realidade', 'Sonho', 'Estratégia']

interface Props {
  currentStep: number // 1–4
}

export default function StepperNav({ currentStep }: Props) {
  return (
    <nav className="stepper" aria-label="Progresso">
      {/* Mobile: dots */}
      <div className="stepper-dots" aria-hidden="true">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1
          const isDone = stepNum < currentStep
          const isActive = stepNum === currentStep
          return (
            <React.Fragment key={stepNum}>
              <div
                className={`stepper-dot${isDone ? ' done' : ''}${isActive ? ' active' : ''}`}
                title={label}
              >
                {isDone ? '✓' : stepNum}
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div className={`stepper-line${isDone ? ' done' : ''}`} />
              )}
            </React.Fragment>
          )
        })}
      </div>
      {/* Step label below dots on mobile */}
      <div className="stepper-label">{STEP_LABELS[currentStep - 1]}</div>
    </nav>
  )
}
