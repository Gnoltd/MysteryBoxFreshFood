import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { updateUserLang } from '../../services/auth'

export function LanguageToggle() {
  const { i18n } = useTranslation()
  const { currentUser } = useAuth()
  const current = i18n.language.startsWith('vi') ? 'vi' : 'en'

  const toggle = async () => {
    const next = current === 'en' ? 'vi' : 'en'
    await i18n.changeLanguage(next)
    if (currentUser) await updateUserLang(currentUser.uid, next)
  }

  return (
    <button onClick={toggle} className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded border border-slate-700 transition-colors">
      {current === 'en' ? 'VI' : 'EN'}
    </button>
  )
}
