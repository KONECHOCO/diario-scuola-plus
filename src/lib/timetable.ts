import type { AppSettings, DayOfWeek, TimetableSlot, WeekKind } from '../types'

const WEEK_MS = 7 * 24 * 3600 * 1000

/** A or B for the week containing `date`, counting from the anchor Monday (week A). */
export function weekKindOf(date: Date, anchor: string): WeekKind {
  const [y, m, d] = anchor.split('-').map(Number)
  const a = Date.UTC(y, m - 1, d)
  const monday = new Date(date)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  const b = Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate())
  const weeks = Math.round((b - a) / WEEK_MS)
  return ((weeks % 2) + 2) % 2 === 0 ? 'A' : 'B'
}

/** Anchor that makes the current week be `kind`. */
export function anchorFor(kind: WeekKind, today = new Date()): string {
  const monday = new Date(today)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  if (kind === 'B') monday.setDate(monday.getDate() - 7)
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
}

export function schoolDays(settings: AppSettings): DayOfWeek[] {
  return settings.saturday ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5]
}

/** Slots of `day`, in the given rotation week (or all weeks when rotation is off). */
export function slotsFor(timetable: TimetableSlot[], day: DayOfWeek, week: WeekKind | null): TimetableSlot[] {
  return timetable
    .filter(t => t.day === day && (!week || !t.week || t.week === week))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
}
