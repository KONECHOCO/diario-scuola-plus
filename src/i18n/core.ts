import type { Locale } from 'date-fns'
import { ar, de, enUS, es, fr, it as itLocale, ja, nl, pl, pt, ro, ru, sv, tr, uk, zhCN } from 'date-fns/locale'
import { LANGS, type LangCode } from '../types'
import it, { type Dict, type Key } from './it'
import en from './en'
import fr_ from './fr'
import de_ from './de'
import es_ from './es'
import pt_ from './pt'
import nl_ from './nl'
import pl_ from './pl'
import ro_ from './ro'
import sv_ from './sv'
import ru_ from './ru'
import uk_ from './uk'
import tr_ from './tr'
import ar_ from './ar'
import zh_ from './zh'
import ja_ from './ja'

export type { Key }

const DICTS: Record<LangCode, Dict> = {
  it, en, fr: fr_, de: de_, es: es_, pt: pt_, nl: nl_, pl: pl_, ro: ro_,
  sv: sv_, ru: ru_, uk: uk_, tr: tr_, ar: ar_, zh: zh_, ja: ja_,
}

const DATE_LOCALES: Record<LangCode, Locale> = {
  it: itLocale, en: enUS, fr, de, es, pt, nl, pl, ro, sv, ru, uk, tr, ar, zh: zhCN, ja,
}

export const LANG_NAMES: Record<LangCode, string> = {
  it: 'Italiano', en: 'English', fr: 'Français', de: 'Deutsch', es: 'Español', pt: 'Português',
  nl: 'Nederlands', pl: 'Polski', ro: 'Română', sv: 'Svenska', ru: 'Русский', uk: 'Українська',
  tr: 'Türkçe', ar: 'العربية', zh: '中文', ja: '日本語',
}

export function deviceLocale(): string {
  try {
    return navigator.languages?.[0] || navigator.language || 'en'
  } catch {
    return 'en'
  }
}

export function deviceLang(): LangCode {
  for (const tag of (typeof navigator !== 'undefined' && navigator.languages) || [deviceLocale()]) {
    const code = tag.slice(0, 2).toLowerCase() as LangCode
    if ((LANGS as readonly string[]).includes(code)) return code
  }
  return 'en'
}

export function resolveLang(setting: LangCode | 'auto' | undefined): LangCode {
  return setting && setting !== 'auto' && DICTS[setting] ? setting : deviceLang()
}

export function translate(lang: LangCode, key: Key, vars?: Record<string, string | number>): string {
  let text = DICTS[lang]?.[key] ?? en[key] ?? it[key] ?? key
  if (vars) for (const [k, v] of Object.entries(vars)) text = text.split(`{${k}}`).join(String(v))
  return text
}

export function dateLocale(lang: LangCode): Locale {
  return DATE_LOCALES[lang]
}

/** BCP 47 tag for Intl: keeps the device region when the language matches (en-GB, pt-BR…). */
export function intlLocale(lang: LangCode): string {
  const device = deviceLocale()
  return device.slice(0, 2).toLowerCase() === lang ? device : lang
}

export function applyDocumentLang(lang: LangCode) {
  document.documentElement.lang = lang
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
}
