import { useMemo, useRef, useState } from 'react'
import { useDiaryStore, type ReviewAnswer } from '../store/useDiaryStore'
import { useT } from '../i18n/useT'
import type { Key } from '../i18n/core'
import { readFileText } from '../lib/files'
import { hapticLight, hapticSuccess } from '../lib/native'
import { Modal } from '../components/ui/Modal'
import { SubjectBadge } from '../components/ui/SubjectBadge'
import { EmptyState, ItemActions } from '../components/ui/Common'
import { Plus, Layers, RotateCcw, Upload } from 'lucide-react'
import type { Flashcard } from '../types'

const ANSWERS: { id: ReviewAnswer; key: Key; cls: string }[] = [
  { id: 'again', key: 'fc_again', cls: 'bg-red-100 text-red-600 dark:bg-red-900/30' },
  { id: 'hard', key: 'fc_hard', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30' },
  { id: 'good', key: 'fc_good', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30' },
  { id: 'easy', key: 'fc_easy', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' },
]

const isDue = (c: Flashcard) => !c.nextReview || new Date(c.nextReview) <= new Date()

/** "front<TAB>back", "front;back" or "front,back" per line (Anki / Quizlet exports). */
export function parseCards(text: string): { front: string; back: string }[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'))
  const sep = lines.some(l => l.includes('\t')) ? '\t' : lines.some(l => l.includes(';')) ? ';' : ','
  return lines
    .map(line => {
      const i = line.indexOf(sep)
      if (i < 0) return null
      const clean = (s: string) => s.trim().replace(/^"(.*)"$/s, '$1').replace(/""/g, '"')
      return { front: clean(line.slice(0, i)), back: clean(line.slice(i + 1)) }
    })
    .filter((c): c is { front: string; back: string } => !!c && !!c.front && !!c.back)
}

export function FlashcardsPage() {
  const { flashcards, subjects, addFlashcard, addFlashcards, deleteFlashcard, reviewFlashcard } = useDiaryStore()
  const { t, fd } = useT()
  const [modalOpen, setModalOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [subjectFilter, setSubjectFilter] = useState('')
  const [queue, setQueue] = useState<string[] | null>(null)
  const [flipped, setFlipped] = useState(false)
  const [form, setForm] = useState({ subjectId: '', front: '', back: '' })
  const [importText, setImportText] = useState('')
  const [importSubject, setImportSubject] = useState('')
  const [notice, setNotice] = useState<string>()
  const fileInput = useRef<HTMLInputElement>(null)

  const cards = subjectFilter ? flashcards.filter(c => c.subjectId === subjectFilter) : flashcards
  const dueCards = cards.filter(isDue)
  const parsed = useMemo(() => parseCards(importText), [importText])
  const current = queue?.length ? flashcards.find(c => c.id === queue[0]) : undefined

  const startStudy = () => {
    const ids = (dueCards.length ? dueCards : cards).map(c => c.id)
    setQueue(ids)
    setFlipped(false)
  }

  const answer = (a: ReviewAnswer) => {
    if (!current || !queue) return
    reviewFlashcard(current.id, a)
    hapticLight()
    // "Again" puts the card back at the end of this session.
    const rest = queue.slice(1)
    const next = a === 'again' ? [...rest, current.id] : rest
    setFlipped(false)
    if (!next.length) {
      hapticSuccess()
      setQueue(null)
      setNotice(t('fc_session_done'))
    } else {
      setQueue(next)
    }
  }

  const handleAdd = () => {
    if (!form.subjectId || !form.front || !form.back) return
    addFlashcard(form)
    // Keep the subject: cards are usually added in a row.
    setForm(f => ({ ...f, front: '', back: '' }))
    setModalOpen(false)
  }

  const handleImport = () => {
    if (!importSubject || !parsed.length) return
    addFlashcards(parsed.map(c => ({ ...c, subjectId: importSubject })))
    setNotice(t('imported_n', { n: parsed.length }))
    setImportText('')
    setImportOpen(false)
  }

  if (current && queue) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-gray-400">{queue.length}</span>
          <button onClick={() => setQueue(null)} className="text-sm text-gray-400 hover:text-red-500">{t('exit')}</button>
        </div>
        <div
          className="card min-h-64 flex flex-col items-center justify-center cursor-pointer select-none"
          onClick={() => setFlipped(!flipped)}
        >
          <SubjectBadge subjectId={current.subjectId} />
          <p className="text-xl font-medium text-center mt-4 px-4 whitespace-pre-line">{current.front}</p>
          {flipped && <p className="text-lg text-center mt-4 px-4 pt-4 border-t border-gray-100 dark:border-gray-800 w-full text-primary-700 dark:text-primary-300 whitespace-pre-line">{current.back}</p>}
          <p className="text-xs text-gray-400 mt-4">{flipped ? t('answer') : t('tap_flip')}</p>
        </div>
        {flipped && (
          <div className="grid grid-cols-4 gap-2 mt-4">
            {ANSWERS.map(a => (
              <button key={a.id} onClick={() => answer(a.id)} className={`py-3 rounded-xl text-sm font-medium ${a.cls}`}>
                {t(a.key)}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
        <select className="input w-auto max-w-[12rem]" value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}>
          <option value="">{t('all_subjects')}</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <div className="flex gap-2">
          <button onClick={() => { setImportSubject(subjectFilter); setImportOpen(true) }} className="btn-secondary flex items-center gap-2 text-sm">
            <Upload size={16} /> {t('import')}
          </button>
          <button onClick={() => { setForm(f => ({ ...f, subjectId: subjectFilter || f.subjectId })); setModalOpen(true) }} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> {t('new_short')}
          </button>
        </div>
      </div>

      {notice && <p className="mb-3 text-sm text-green-600">{notice}</p>}

      {cards.length > 0 && (
        <div className="card mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-gray-500">{t('fc_intro', { n: dueCards.length })}</p>
          <button onClick={startStudy} className="btn-primary flex items-center gap-2 text-sm flex-shrink-0">
            <RotateCcw size={16} /> {t('study_n', { n: dueCards.length || cards.length })}
          </button>
        </div>
      )}

      {cards.length === 0 ? (
        <EmptyState icon={<Layers size={32} />} title={t('no_cards')} description={t('no_cards_desc')} action={<button onClick={() => setModalOpen(true)} className="btn-primary">{t('create_card')}</button>} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {cards.map(card => (
            <div key={card.id} className="card">
              <div className="flex justify-between items-start mb-2">
                <SubjectBadge subjectId={card.subjectId} />
                <ItemActions onDelete={() => deleteFlashcard(card.id)} />
              </div>
              <p className="font-medium text-sm">{card.front}</p>
              <p className="text-sm text-gray-500 mt-1">{card.back}</p>
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-400 flex-wrap">
                <span>{t('reviews_n', { n: card.reviewCount })}</span>
                {isDue(card)
                  ? <span className="text-amber-500 font-medium">{t('due_now')}</span>
                  : <span>{t('next_review', { date: fd(new Date(card.nextReview!), 'short') })}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('new_card')}>
        <div className="space-y-4">
          <div>
            <label className="label">{t('subject')}</label>
            <select className="input" value={form.subjectId} onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))}>
              <option value="">{t('select')}</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t('front')}</label>
            <textarea className="input resize-none" rows={2} value={form.front} onChange={e => setForm(f => ({ ...f, front: e.target.value }))} />
          </div>
          <div>
            <label className="label">{t('back_side')}</label>
            <textarea className="input resize-none" rows={3} value={form.back} onChange={e => setForm(f => ({ ...f, back: e.target.value }))} />
          </div>
          <button onClick={handleAdd} disabled={!form.subjectId || !form.front || !form.back} className="btn-primary w-full">{t('save')}</button>
        </div>
      </Modal>

      <Modal open={importOpen} onClose={() => setImportOpen(false)} title={t('import_title')}>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">{t('import_help')}</p>
          <div>
            <label className="label">{t('subject')}</label>
            <select className="input" value={importSubject} onChange={e => setImportSubject(e.target.value)}>
              <option value="">{t('select')}</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <textarea
            className="input font-mono text-sm resize-none"
            rows={6}
            dir="auto"
            value={importText}
            onChange={e => setImportText(e.target.value)}
            placeholder={'2 + 2\t4\nH2O;water\nCapital of France,Paris'}
          />
          <button onClick={() => fileInput.current?.click()} className="btn-secondary w-full text-sm">{t('import_file')}</button>
          <input
            ref={fileInput}
            type="file"
            accept=".txt,.csv,.tsv,text/plain,text/csv"
            className="hidden"
            onChange={async e => {
              const file = e.target.files?.[0]
              if (file) setImportText(await readFileText(file))
              e.target.value = ''
            }}
          />
          <button onClick={handleImport} disabled={!importSubject || !parsed.length} className="btn-primary w-full">
            {t('import_n', { n: parsed.length })}
          </button>
        </div>
      </Modal>
    </div>
  )
}
