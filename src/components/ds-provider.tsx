import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider, initReactI18next } from 'react-i18next'
import i18n from 'i18next'
import enTranslation from '../locales/en/translation.json'

const previewI18n = i18n.createInstance()
previewI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: { en: { translation: enTranslation } },
  interpolation: { escapeValue: false },
})

export function MysteryBoxProvider({ children }: { children: React.ReactNode }) {
  return (
    <I18nextProvider i18n={previewI18n}>
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </I18nextProvider>
  )
}
