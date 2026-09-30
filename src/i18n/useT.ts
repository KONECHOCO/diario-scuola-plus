import { useMemo } from 'react'
import { format as formatDate } from 'date-fns'
import { useDiaryStore } from '../store/useDiaryStore'
import { SCALES } from '../lib/grades'
import { dateLocale, intlLocale, resolveLang, translate, type Key } from './core'

// Locale-correct date styles (order, separators and words differ per language).
const DATE_STYLES = {
  short: { day: 'numeric', month: 'short' },
  shortYear: { day: 'numeric', month: 'short', year: 'numeric' },
  weekdayShort: { weekday: 'short', day: 'numeric', month: 'short' },
  weekdayLong: { weekday: 'long', day: 'numeric', month: 'long' },
  full: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
  month: { month: 'long', year: 'numeric' },
} satisfies Record<string, Intl.DateTimeFormatOptions>

/** Translations, date formatting and the active grade scale for components. */
export function useT() {
  const language = useDiaryStore(s => s.settings.language)
  const scaleId = useDiaryStore(s => s.settings.gradeScale)
  return useMemo(() => {
    const lang = resolveLang(language)
    const locale = dateLocale(lang)
    return {
      lang,
      locale,
      intl: intlLocale(lang),
      scale: SCALES[scaleId] ?? SCALES['10'],
      t: (key: Key, vars?: Record<string, string | number>) => translate(lang, key, vars),
      /** date-fns pattern: only for weekday names (EEEE, EEE, EEEEEE). */
      fmt: (date: Date, pattern: string) => formatDate(date, pattern, { locale }),
      fd: (date: Date, style: keyof typeof DATE_STYLES) => date.toLocaleDateString(intlLocale(lang), DATE_STYLES[style]),
    }
  }, [language, scaleId])
}

/** Same as useT().t, outside React (notifications, exports). */
export function tNow(key: Key, vars?: Record<string, string | number>) {
  return translate(resolveLang(useDiaryStore.getState().settings.language), key, vars)
}
