import type { GradeScale } from '../../lib/grades'

/** Grade picker for the active scale: letter select or number field. */
export function GradeInput({ scale, value, onChange, placeholder }: {
  scale: GradeScale
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  if (scale.letters) {
    return (
      <select className="input" value={value} onChange={e => onChange(e.target.value)}>
        <option value="">—</option>
        {scale.letters.map(([label, v]) => <option key={label} value={String(v)}>{label}</option>)}
      </select>
    )
  }
  return (
    <input
      type="number"
      inputMode="decimal"
      min={scale.min}
      max={scale.max}
      step={scale.step}
      className="input"
      value={value}
      placeholder={placeholder ?? `${scale.min}–${scale.max}`}
      onChange={e => onChange(e.target.value)}
    />
  )
}

/** Parses a typed grade, clamped to the scale; null if empty/invalid. */
export function parseGrade(scale: GradeScale, raw: string): number | null {
  const n = parseFloat(raw.replace(',', '.'))
  if (!Number.isFinite(n)) return null
  return Math.min(scale.max, Math.max(scale.min, n))
}
