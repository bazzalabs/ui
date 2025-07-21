import de from '../locales/de.json' with { type: 'json' }
import en from '../locales/en.json' with { type: 'json' }
import fr from '../locales/fr.json' with { type: 'json' }
import nl from '../locales/nl.json' with { type: 'json' }
import zh_CN from '../locales/zh-CN.json' with { type: 'json' }
import zh_TW from '../locales/zh-TW.json' with { type: 'json' }

export type Locale = 'en' | 'fr' | 'nl' | 'zh_CN' | 'zh_TW' | 'de'

type Translations = Record<string, string>

const translations: Record<Locale, Translations> = {
  en,
  fr,
  zh_CN,
  zh_TW,
  nl,
  de,
}

export function t(key: string, locale: Locale): string {
  return translations[locale][key] ?? key
}
