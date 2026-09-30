import type { Grade, GradeScaleId, Period, Subject } from '../types'

// Grading scales used around the world. Every grade is converted to a 0..1
// "unit" value (1 = best) so averages work across scales and old grades.

export interface GradeScale {
  id: GradeScaleId
  min: number
  max: number
  step: number
  /** Lower number = better grade (German 1–6). */
  reversed?: boolean
  /** Letter scales: label -> value, best first. */
  letters?: [string, number][]
  defaultPass: number
}

const US_LETTERS: [string, number][] = [
  ['A+', 4.3], ['A', 4], ['A-', 3.7], ['B+', 3.3], ['B', 3], ['B-', 2.7],
  ['C+', 2.3], ['C', 2], ['C-', 1.7], ['D+', 1.3], ['D', 1], ['F', 0],
]
// Swedish A–F (merit points)
const SE_LETTERS: [string, number][] = [['A', 20], ['B', 17.5], ['C', 15], ['D', 12.5], ['E', 10], ['F', 0]]

export const SCALES: Record<GradeScaleId, GradeScale> = {
  '10': { id: '10', min: 0, max: 10, step: 0.25, defaultPass: 6 },
  '20': { id: '20', min: 0, max: 20, step: 0.25, defaultPass: 10 },
  de6: { id: 'de6', min: 1, max: 6, step: 0.25, reversed: true, defaultPass: 4 },
  '6': { id: '6', min: 1, max: 6, step: 0.25, defaultPass: 4 },
  '5': { id: '5', min: 1, max: 5, step: 0.5, defaultPass: 3 },
  '12': { id: '12', min: 1, max: 12, step: 1, defaultPass: 4 },
  '100': { id: '100', min: 0, max: 100, step: 1, defaultPass: 60 },
  letter: { id: 'letter', min: 0, max: 4.3, step: 0.1, letters: US_LETTERS, defaultPass: 1 },
  se: { id: 'se', min: 0, max: 20, step: 2.5, letters: SE_LETTERS, defaultPass: 10 },
}

export const SCALE_IDS = Object.keys(SCALES) as GradeScaleId[]

/** Default scale and pass mark from the device region (it-IT -> IT). */
export function defaultScaleFor(locale: string): { scale: GradeScaleId; pass: number } {
  const [lang, region = ''] = locale.replace('_', '-').split('-')
  const country = region.toUpperCase() || lang.toUpperCase()
  const table: Record<string, [GradeScaleId, number]> = {
    IT: ['10', 6], ES: ['10', 5], NL: ['10', 5.5], RO: ['10', 5], BR: ['10', 5], MX: ['10', 6], AR: ['10', 6],
    FR: ['20', 10], BE: ['20', 10], PT: ['20', 10], TN: ['20', 10], MA: ['20', 10], DZ: ['20', 10],
    DE: ['de6', 4], AT: ['de6', 4],
    CH: ['6', 4], PL: ['6', 2],
    RU: ['5', 3], BY: ['5', 3], KZ: ['5', 3],
    UA: ['12', 4], UK: ['12', 4],
    US: ['letter', 1], CA: ['100', 50],
    SE: ['se', 10], SV: ['se', 10],
    TR: ['100', 50], GB: ['100', 50], EN: ['100', 50],
    CN: ['100', 60], ZH: ['100', 60], JP: ['100', 60], JA: ['100', 60], SA: ['100', 60], AE: ['100', 60], EG: ['100', 50],
  }
  const hit = table[country] ?? table[lang.toUpperCase()]
  return hit ? { scale: hit[0], pass: hit[1] } : { scale: '100', pass: 60 }
}

export function toUnit(scale: GradeScale, value: number): number {
  const u = (value - scale.min) / (scale.max - scale.min)
  return clamp(scale.reversed ? 1 - u : u)
}

export function fromUnit(scale: GradeScale, unit: number): number {
  const u = clamp(unit)
  return scale.min + (scale.reversed ? 1 - u : u) * (scale.max - scale.min)
}

export function gradeUnit(g: Grade): number {
  if (g.scale && SCALES[g.scale]) return toUnit(SCALES[g.scale], g.value)
  return clamp(g.maxValue > 0 ? g.value / g.maxValue : 0)
}

export function isBetterOrEqual(scale: GradeScale, a: number, b: number) {
  return scale.reversed ? a <= b : a >= b
}

/** Weighted average (0..1) of a subject's grades, or null. */
export function subjectUnitAverage(grades: Grade[], subjectId: string): number | null {
  const list = grades.filter(g => g.subjectId === subjectId)
  const weights = list.reduce((s, g) => s + (g.weight || 1), 0)
  if (!list.length || !weights) return null
  return list.reduce((s, g) => s + gradeUnit(g) * (g.weight || 1), 0) / weights
}

/** Average of subject averages, weighted by the subject coefficient. */
export function overallUnitAverage(grades: Grade[], subjects: Subject[]): number | null {
  let sum = 0
  let weights = 0
  for (const sub of subjects) {
    const avg = subjectUnitAverage(grades, sub.id)
    if (avg === null) continue
    const w = sub.coefficient || 1
    sum += avg * w
    weights += w
  }
  return weights ? sum / weights : null
}

/** Grade value needed on the next test (with `weight`) to reach `targetUnit`. */
export function neededUnit(grades: Grade[], subjectId: string, targetUnit: number, weight: number): number | null {
  const list = grades.filter(g => g.subjectId === subjectId)
  const w = list.reduce((s, g) => s + (g.weight || 1), 0)
  const sum = list.reduce((s, g) => s + gradeUnit(g) * (g.weight || 1), 0)
  if (weight <= 0) return null
  return (targetUnit * (w + weight) - sum) / weight
}

/** Human readable value in a scale ("7.5", "B+", "2,3"). */
export function formatGrade(scale: GradeScale, value: number, locale: string, digits = 2): string {
  if (scale.letters) {
    let best = scale.letters[0]
    for (const l of scale.letters) if (Math.abs(l[1] - value) < Math.abs(best[1] - value)) best = l
    return best[0]
  }
  return new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(Math.round(value * 100) / 100)
}

/** Average in the display scale; letter scales also show the GPA number. */
export function formatAverage(scale: GradeScale, unit: number | null, locale: string): string {
  if (unit === null) return '—'
  const value = fromUnit(scale, unit)
  if (scale.id === 'letter') return `${formatGrade(scale, value, locale)} · ${value.toFixed(2)}`
  return formatGrade(scale, value, locale)
}

export function scaleRangeLabel(scale: GradeScale): string {
  // Isolated left-to-right so "0–100" doesn't flip inside Arabic text.
  if (scale.letters) return `⁦${scale.letters[0][0]}–${scale.letters[scale.letters.length - 1][0]}⁩`
  return `⁦${scale.min}–${scale.max}${scale.reversed ? ' (1 = ★)' : ''}⁩`
}

/** Rounds a needed value to the scale step, towards the "safer" (better) side. */
export function roundUpToStep(scale: GradeScale, value: number): number {
  const steps = (value - scale.min) / scale.step
  const rounded = scale.reversed ? Math.floor(steps + 1e-9) : Math.ceil(steps - 1e-9)
  return Math.min(scale.max, Math.max(scale.min, scale.min + rounded * scale.step))
}

/** Period containing `date`, given periods sorted by start. */
export function periodOf(periods: Period[], date: string): Period | undefined {
  const sorted = [...periods].sort((a, b) => a.start.localeCompare(b.start))
  let hit: Period | undefined
  for (const p of sorted) if (p.start <= date) hit = p
  return hit
}

function clamp(n: number) {
  return Math.max(0, Math.min(1, n))
}
