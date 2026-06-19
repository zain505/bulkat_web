import { I18nContext } from './i18nContext'

export function I18nProvider({ value, children }) {
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
