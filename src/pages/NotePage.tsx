import { useState } from 'react'
import { useDiaryStore } from '../store/useDiaryStore'
import { useT } from '../i18n/useT'
import { deletePhotos } from '../lib/photoStorage'
import { Modal } from '../components/ui/Modal'
import { SubjectBadge } from '../components/ui/SubjectBadge'
import { EmptyState, ItemActions } from '../components/ui/Common'
import { PhotoField, PhotoThumb, PhotoViewer } from '../components/ui/Photos'
import { Plus, StickyNote, Pin } from 'lucide-react'
import { parseISO } from 'date-fns'
import type { Note } from '../types'

export function NotePage() {
  const { notes, subjects, addNote, updateNote, deleteNote } = useDiaryStore()
  const { t, fd } = useT()
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [viewing, setViewing] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const emptyForm = { title: '', content: '', subjectId: '', tags: '', pinned: false, photos: [] as string[] }
  const [form, setForm] = useState(emptyForm)

  const q = search.toLowerCase()
  const filtered = notes
    .filter(n => !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.tags.some(tag => tag.toLowerCase().includes(q)))
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.updatedAt.localeCompare(a.updatedAt))

  const openAdd = () => {
    setEditId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (n: Note) => {
    setEditId(n.id)
    setForm({ title: n.title, content: n.content, subjectId: n.subjectId ?? '', tags: n.tags.join(', '), pinned: n.pinned, photos: n.photos ?? [] })
    setModalOpen(true)
  }

  const handleSave = () => {
    if (!form.title) return
    const data = {
      title: form.title,
      content: form.content,
      subjectId: form.subjectId || undefined,
      tags: form.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      pinned: form.pinned,
      photos: form.photos.length ? form.photos : undefined,
    }
    if (editId) {
      const removed = (notes.find(n => n.id === editId)?.photos ?? []).filter(p => !form.photos.includes(p))
      void deletePhotos(removed)
      updateNote(editId, data)
    } else {
      addNote(data)
    }
    setModalOpen(false)
  }

  const remove = (n: Note) => {
    void deletePhotos(n.photos)
    deleteNote(n.id)
  }

  return (
    <div className="max-w-3xl">
      <div className="flex gap-2 mb-4">
        <input className="input flex-1" placeholder={t('search_notes')} value={search} onChange={e => setSearch(e.target.value)} />
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm flex-shrink-0">
          <Plus size={16} /> {t('new_short')}
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<StickyNote size={32} />} title={t('no_notes')} description={t('no_notes_desc')} action={<button onClick={openAdd} className="btn-primary">{t('create_note')}</button>} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map(note => (
            <div key={note.id} className={`card cursor-pointer hover:shadow-md transition-shadow ${note.pinned ? 'ring-2 ring-amber-300 dark:ring-amber-600' : ''}`} onClick={() => openEdit(note)}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-sm flex items-center gap-1">
                  {note.pinned && <Pin size={12} className="text-amber-500" />}
                  {note.title}
                </h3>
                <div onClick={e => e.stopPropagation()}>
                  <ItemActions onDelete={() => remove(note)} />
                </div>
              </div>
              <p className="text-sm text-gray-500 line-clamp-3 whitespace-pre-line">{note.content}</p>
              {note.photos?.length ? (
                <div className="flex gap-2 mt-2 overflow-x-auto">
                  {note.photos.map(p => <PhotoThumb key={p} refId={p} size={52} onOpen={setViewing} />)}
                </div>
              ) : null}
              <div className="flex items-center gap-2 mt-2">
                {note.subjectId && <SubjectBadge subjectId={note.subjectId} />}
                <span className="text-xs text-gray-400">{fd(parseISO(note.updatedAt), 'short')}</span>
              </div>
              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {note.tags.map(tag => (
                    <span key={tag} className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full text-gray-500">#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <PhotoViewer src={viewing} onClose={() => setViewing(null)} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? t('edit_note') : t('new_note')} size="lg">
        <div className="space-y-4">
          <div>
            <label className="label">{t('title')}</label>
            <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="label">{t('content')}</label>
            <textarea className="input resize-none" rows={8} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder={t('content_ph')} />
          </div>
          <PhotoField value={form.photos} onChange={photos => setForm(f => ({ ...f, photos }))} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('subject')}</label>
              <select className="input" value={form.subjectId} onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))}>
                <option value="">{t('none')}</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t('tags')}</label>
              <input className="input" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder={t('tags_ph')} />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.pinned} onChange={e => setForm(f => ({ ...f, pinned: e.target.checked }))} className="w-4 h-4" />
            <span className="text-sm">{t('pin')}</span>
          </label>
          <button onClick={handleSave} disabled={!form.title} className="btn-primary w-full">{t('save')}</button>
        </div>
      </Modal>
    </div>
  )
}
