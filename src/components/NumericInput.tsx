import React, { useState, useEffect, useRef } from 'react'

interface Props {
  id?: string
  value: number
  onChange: (v: number) => void
  min?: number
  step?: number
  placeholder?: string
  className?: string
  defaultValue?: number
}

/**
 * Number input that allows the field to be temporarily empty while the user
 * is editing. Commits the numeric value (or defaultValue) on blur.
 *
 * The parent→raw sync (useEffect) is suppressed while the field is focused so
 * that intermediate keystrokes (e.g. typing "0" as part of "0.5") never
 * overwrite the in-progress string.
 */
export default function NumericInput({
  id,
  value,
  onChange,
  min = 0,
  step = 0.01,
  placeholder = '0',
  className,
  defaultValue = 0,
}: Props) {
  const [raw, setRaw] = useState(value === 0 ? '' : String(value))
  const focusedRef = useRef(false)

  // Sync display from parent only when the field is not focused
  // (e.g. external reset like "Refazer Simulação")
  useEffect(() => {
    if (!focusedRef.current) {
      setRaw(value === 0 ? '' : String(value))
    }
  }, [value])

  function handleFocus() {
    focusedRef.current = true
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setRaw(e.target.value)
    const parsed = parseFloat(e.target.value)
    if (!isNaN(parsed)) onChange(parsed)
  }

  function handleBlur() {
    focusedRef.current = false
    const parsed = parseFloat(raw)
    const committed = isNaN(parsed) ? defaultValue : parsed
    onChange(committed)
    setRaw(committed === 0 ? '' : String(committed))
  }

  return (
    <input
      type="number"
      id={id}
      min={min}
      step={step}
      placeholder={placeholder}
      className={className}
      value={raw}
      onFocus={handleFocus}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  )
}
