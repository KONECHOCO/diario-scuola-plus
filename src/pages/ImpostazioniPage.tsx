import { useState, useRef } from 'react'
import { useDiaryStore } from '../store/useDiaryStore'
import type { SchoolLevel } from '../types'
import { shareData, requestNotificationPermission } from '../lib/native'
import { syncAllNotifications } from '../lib/notifications'
import { Download, Upload, Trash2, User, Bell, Moon, Sun, Shield, FileText, ExternalLink } from 'lucide-react'

const APP_VERSION = '1.0.0'

export function ImpostazioniPage() {
  const {
    settings, updateSettings, profiles, activeProfileId, updateProfile,
    resetData,
  } = useDiaryStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const profile = profiles.find(p => p.id === activeProfileId)
  const [profileForm, setProfileForm] = useState({
    name: profile?.name ?? '',
    school: profile?.school ?? '',
    className: profile?.className ?? '',
    level: profile?.level ?? 'superiore' as SchoolLevel,
    avatar: profile?.avatar ?? '🎓',
  })

  const toggleDark = () => {
    const dark = !settings.darkMode
    updateSettings({ darkMode: dark })
    document.documentElement.classList.toggle('dark', dark)
  }

  const saveProfile = () => {
    if (profile) updateProfile(profile.id, profileForm)
  }

  const exportData = async () => {
    const data = localStorage.getItem('diario-scuola-plus')
    if (!data) return
    const filename = `diario-scuola-backup-${new Date().toISOString().split('T')[0]}.json`
    const shared = await shareData('Backup Diario Scuola', 'I tuoi dati scolastici', undefined)
    if (!shared) {
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string)
        localStorage.setItem('diario-scuola-plus', JSON.stringify(parsed))
        window.location.reload()
      } catch {
        alert('File non valido')
      }
    }
    reader.readAsText(file)
  }

  const enableNotifications = async () => {
    const granted = await requestNotificationPermission()
    updateSettings({ notifications: granted })
    if (granted) syncAllNotifications()
  }

  const avatars = ['🎓', '📚', '✏️', '🌟', '🚀', '💡', '🎯', '🏆']

  return (
    <div className="max-w-2xl space-y-6">
      <div className="card">
        <h3 className="font-semibold flex items-center gap-2 mb-4"><User size={18} /> Profilo studente</h3>
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {avatars.map(a => (
              <button
                key={a}
                onClick={() => setProfileForm(f => ({ ...f, avatar: a }))}
                className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center ${profileForm.avatar === a ? 'bg-primary-100 ring-2 ring-primary-500' : 'bg-gray-100 dark:bg-gray-800'}`}
              >
                {a}
              </button>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Nome</label>
              <input className="input" value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Classe</label>
              <input className="input" value={profileForm.className} onChange={e => setProfileForm(f => ({ ...f, className: e.target.value }))} />
            </div>
            <div>
              <label className="label">Scuola</label>
              <input className="input" value={profileForm.school} onChange={e => setProfileForm(f => ({ ...f, school: e.target.value }))} />
            </div>
            <div>
              <label className="label">Livello</label>
              <select className="input" value={profileForm.level} onChange={e => setProfileForm(f => ({ ...f, level: e.target.value as SchoolLevel }))}>
                <option value="elementare">Elementare</option>
                <option value="media">Media</option>
                <option value="superiore">Superiore</option>
                <option value="universita">Università</option>
              </select>
            </div>
          </div>
          <button onClick={saveProfile} className="btn-primary">Salva profilo</button>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-4">Aspetto e notifiche</h3>
        <div className="space-y-3">
          <button onClick={toggleDark} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800">
            <span className="flex items-center gap-2 text-sm">
              {settings.darkMode ? <Moon size={18} /> : <Sun size={18} />}
              Modalità scura
            </span>
            <div className={`w-10 h-6 rounded-full transition-colors ${settings.darkMode ? 'bg-primary-600' : 'bg-gray-300'}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${settings.darkMode ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
          </button>
          <button
            onClick={() => settings.notifications ? updateSettings({ notifications: false }) : enableNotifications()}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <span className="flex items-center gap-2 text-sm"><Bell size={18} /> Promemoria compiti ed esami</span>
            <div className={`w-10 h-6 rounded-full transition-colors ${settings.notifications ? 'bg-primary-600' : 'bg-gray-300'}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${settings.notifications ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-4">Timer Pomodoro</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Focus (minuti)</label>
            <input type="number" className="input" value={settings.pomodoroFocus} onChange={e => updateSettings({ pomodoroFocus: parseInt(e.target.value) || 25 })} />
          </div>
          <div>
            <label className="label">Pausa (minuti)</label>
            <input type="number" className="input" value={settings.pomodoroBreak} onChange={e => updateSettings({ pomodoroBreak: parseInt(e.target.value) || 5 })} />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-4">Backup e sincronizzazione</h3>
        <p className="text-sm text-gray-500 mb-4">I dati restano sul tuo dispositivo. Esporta un backup per trasferirli.</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportData} className="btn-secondary flex items-center gap-2 text-sm">
            <Download size={16} /> Esporta / Condividi
          </button>
          <button onClick={() => fileRef.current?.click()} className="btn-secondary flex items-center gap-2 text-sm">
            <Upload size={16} /> Importa dati
          </button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={importData} />
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold flex items-center gap-2 mb-4"><Shield size={18} /> Legale e privacy</h3>
        <div className="space-y-2">
          <a href="/privacy-policy.html" target="_blank" rel="noopener" className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-sm">
            <span className="flex items-center gap-2"><FileText size={16} /> Privacy Policy</span>
            <ExternalLink size={14} className="text-gray-400" />
          </a>
          <a href="/terms.html" target="_blank" rel="noopener" className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-sm">
            <span className="flex items-center gap-2"><FileText size={16} /> Termini di utilizzo</span>
            <ExternalLink size={14} className="text-gray-400" />
          </a>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          L'assistente AI è locale e non invia dati a server esterni. Le registrazioni audio restano sul dispositivo.
        </p>
      </div>

      <div className="card border-red-200 dark:border-red-900">
        <h3 className="font-semibold text-red-600 mb-2">Zona pericolosa</h3>
        <p className="text-sm text-gray-500 mb-3">Elimina tutti i dati. Questa azione è irreversibile.</p>
        <button
          onClick={() => { if (confirm('Sei sicuro? Tutti i dati verranno eliminati.')) { resetData(); window.location.reload() } }}
          className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium"
        >
          <Trash2 size={16} /> Resetta tutti i dati
        </button>
      </div>

      <p className="text-center text-xs text-gray-400 pb-4">
        Diario Scuola Plus v{APP_VERSION} · com.diarioscuolaplus.app
      </p>
    </div>
  )
}
