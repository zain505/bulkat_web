import { createContext } from 'react'
import { createI18n } from './i18nCore'

export const I18nContext = createContext(createI18n('en'))
