import { useState } from 'react'
import { useDiaryStore } from '../store/useDiaryStore'
import { Modal } from '../components/ui/Modal'
import { SubjectBadge } from '../components/ui/SubjectBadge'
import { EmptyState, ItemActions } from '../components/ui/Common'
import { Plus, Layers, RotateCcw, Check, X } from 'lucide-react'

export function FlashcardsPage() {
  const { flashcards, subjects, addFlashcard, deleteFlashcard, reviewFlashcard } = useDiaryStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [studyMode, setStudyMode] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [form, setForm] = useState({ subjectId: '', front: '', back: '' })

  const dueCards = flashcards.filter(c => !c.nextReview || new Date(c.nextReview) <= new Date())
  const studyCards = studyMode ? (dueCards.length > 0 ? dueCards : flashcards) : []
  const current = studyCards[currentIndex]

  const handleAdd = () => {
    if (!form.subjectId || !form.front || !form.back) return
    addFlashcard(form)
    setModalOpen(false)
    setForm({ subjectId: '', front: '', back: '' })
  }

  const handleReview = (correct: boolean) => {
    if (!current) return
    reviewFlashcard(current.id, correct)
    setFlipped(false)
    if (currentIndex < studyCards.length - 1) setCurrentIndex(i => i + 1)
    else { setStudyMode(false); setCurrentIndex(0) }
  }

  if (studyMode && current) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-gray-400">{currentIndex + 1} / {studyCards.length}</span>
          <button onClick={() => { setStudyMode(false); setCurrentIndex(0); setFlipped(false) }} className="text-sm text-gray-400 hover:text-red-500">Esci</button>
        </div>
        <div
          className="card min-h-64 flex flex-col items-center justify-center cursor-pointer select-none"
          onClick={() => setFlipped(!flipped)}
        >
          <SubjectBadge subjectId={current.subjectId} />
          <p className="text-xl font-medium text-center mt-4 px-4">{flipped ? current.back : current.front}</p>
          <p className="text-xs text-gray-400 mt-4">{flipped ? 'Risposta' : 'Clicca per girare'}</p>
        </div>
        {flipped && (
          <div className="flex gap-3 mt-4">
            <button onClick={() => handleReview(false)} className="flex-1 py-3 rounded-xl bg-red-100 text-red-600 font-medium flex items-center justify-center gap-2">
              <X size={18} /> Non ricordo
            </button>
            <button onClick={() => handleReview(true)} className="flex-1 py-3 rounded-xl bg-green-100 text-green-600 font-medium flex items-center justify-center gap-2">
              <Check size={18} /> Ricordo!
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{dueCards.length} carte da ripassare · Ripetizione dilazionata</p>
        <div className="flex gap-2">
          {flashcards.length > 0 && (
            <button onClick={() => { setStudyMode(true); setCurrentIndex(0); setFlipped(false) }} className="btn-secondary flex items-center gap-2 text-sm">
              <RotateCcw size={16} /> Studia ({dueCards.length || flashcards.length})
            </button>
          )}
          <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> Nuova
          </button>
        </div>
      </div>

      {flashcards.length === 0 ? (
        <EmptyState icon={<Layers size={32} />} title="Nessuna flashcard" description="Crea flashcard per memorizzare concetti con ripetizione dilazionata" action={<button onClick={() => setModalOpen(true)} className="btn-primary">Crea flashcard</button>} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {flashcards.map(card => (
            <div key={card.id} className="card">
              <div className="flex justify-between items-start mb-2">
                <SubjectBadge subjectId={card.subjectId} />
                <ItemActions onDelete={() => deleteFlashcard(card.id)} />
              </div>
              <p className="font-medium text-sm">{card.front}</p>
              <p className="text-sm text-gray-500 mt-1">{card.back}</p>
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                <span>Ripassate: {card.reviewCount}</span>
                {card.nextReview && new Date(card.nextReview) <= new Date() && (
                  <span className="text-amber-500 font-medium">Da ripassare</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuova flashcard">
        <div className="space-y-4">
          <div>
            <label className="label">Materia</label>
            <select className="input" value={form.subjectId} onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))}>
              <option value="">Seleziona</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Domanda (fronte)</label>
            <input className="input" value={form.front} onChange={e => setForm(f => ({ ...f, front: e.target.value }))} />
          </div>
          <div>
            <label className="label">Risposta (retro)</label>
            <textarea className="input resize-none" rows={3} value={form.back} onChange={e => setForm(f => ({ ...f, back: e.target.value }))} />
          </div>
          <button onClick={handleAdd} className="btn-primary w-full">Salva</button>
        </div>
      </Modal>
    </div>
  )
}
