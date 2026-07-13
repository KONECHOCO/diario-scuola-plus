import { useState } from 'react'
import { useDiaryStore } from '../store/useDiaryStore'
import { hapticSuccess } from '../lib/native'
import { GraduationCap, ChevronRight } from 'lucide-react'
import type { SchoolLevel } from '../types'

const STEPS = [
  {
    title: 'Benvenuto in Diario Scuola Plus',
    description: 'Il diario scolastico più completo: orario, voti, compiti, studio e molto altro. Tutto in un\'unica app.',
    emoji: '🎓',
  },
  {
    title: 'Organizza la tua scuola',
    description: 'Gestisci orario, compiti, esami e voti. Le medie si calcolano automaticamente.',
    emoji: '📚',
  },
  {
    title: 'Studia in modo smart',
    description: 'Pomodoro, flashcards, obiettivi giornalieri e assistente di studio integrato.',
    emoji: '🧠',
  },
  {
    title: 'Crea il tuo profilo',
    description: 'Personalizza nome, scuola e classe per iniziare.',
    emoji: '✨',
  },
]

export function Onboarding() {
  const { updateProfile, profiles, updateSettings } = useDiaryStore()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [school, setSchool] = useState('')
  const [className, setClassName] = useState('')
  const [level, setLevel] = useState<SchoolLevel>('superiore')

  const finish = () => {
    const profile = profiles[0]
    if (profile) {
      updateProfile(profile.id, {
        name: name || 'Studente',
        school: school || 'La mia scuola',
        className: className || '3A',
        level,
      })
    }
    updateSettings({ onboardingComplete: true })
    hapticSuccess()
  }

  const isLast = step === STEPS.length - 1
  const current = STEPS[step]

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-gray-950 flex flex-col safe-top safe-bottom">
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="text-6xl mb-6">{current.emoji}</div>
        <h1 className="text-2xl font-bold mb-3">{current.title}</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed">{current.description}</p>

        {isLast && (
          <div className="w-full max-w-sm mt-8 space-y-3 text-left">
            <div>
              <label className="label">Il tuo nome</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="es. Marco" autoFocus />
            </div>
            <div>
              <label className="label">Scuola</label>
              <input className="input" value={school} onChange={e => setSchool(e.target.value)} placeholder="es. Liceo Scientifico" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Classe</label>
                <input className="input" value={className} onChange={e => setClassName(e.target.value)} placeholder="es. 3A" />
              </div>
              <div>
                <label className="label">Livello</label>
                <select className="input" value={level} onChange={e => setLevel(e.target.value as SchoolLevel)}>
                  <option value="elementare">Elementare</option>
                  <option value="media">Media</option>
                  <option value="superiore">Superiore</option>
                  <option value="universita">Università</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-8 pb-8">
        <div className="flex justify-center gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-primary-600' : 'w-1.5 bg-gray-200 dark:bg-gray-700'}`} />
          ))}
        </div>

        <button
          onClick={() => isLast ? finish() : setStep(s => s + 1)}
          className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2"
        >
          {isLast ? (
            <><GraduationCap size={20} /> Inizia!</>
          ) : (
            <>Continua <ChevronRight size={18} /></>
          )}
        </button>

        {!isLast && step > 0 && (
          <button onClick={() => setStep(s => s - 1)} className="w-full text-center text-sm text-gray-400 mt-3 py-2">
            Indietro
          </button>
        )}
      </div>
    </div>
  )
}
