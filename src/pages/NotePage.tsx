import { useState } from 'react'
import { useDiaryStore } from '../store/useDiaryStore'
import { Modal } from '../components/ui/Modal'
import { SubjectBadge } from '../components/ui/SubjectBadge'
import { EmptyState, ItemActions } from '../components/ui/Common'
import { Plus, StickyNote, Pin } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'

export function NotePage() {
  const { notes, subjects, addNote, updateNote, deleteNote } = useDiaryStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ title: '', content: '', subjectId: '', tags: '', pinned: false })

  const filtered = notes
    .filter(n => !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.updatedAt.localeCompare(a.updatedAt))

  const openAdd = () => {
    setEditId(null)
    setForm({ title: '', content: '', subjectId: '', tags: '', pinned: false })
    setModalOpen(true)
  }

  const openEdit = (id: string) => {
    const n = notes.find(note => note.id === id)!
    setEditId(id)
    setForm({ title: n.title, content: n.content, subjectId: n.subjectId ?? '', tags: n.tags.join(', '), pinned: n.pinned })
    setModalOpen(true)
  }

  const handleSave = () => {
    if (!form.title) return
    const data = {
      title: form.title,
      content: form.content,
      subjectId: form.subjectId || undefined,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      pinned: form.pinned,
    }
    if (editId) updateNote(editId, data)
    else addNote(data)
    setModalOpen(false)
  }

  return (
    <div className="max-w-3xl">
      <div className="flex gap-2 mb-4">
        <input className="input flex-1" placeholder="Cerca note..." value={search} onChange={e => setSearch(e.target.value)} />
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm flex-shrink-0">
          <Plus size={16} /> Nuova
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<StickyNote size={32} />} title="Nessuna nota" description="Prendi appunti e annotazioni per ogni materia" action={<button onClick={openAdd} className="btn-primary">Crea nota</button>} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map(note => (
            <div key={note.id} className={`card cursor-pointer hover:shadow-md transition-shadow ${note.pinned ? 'ring-2 ring-amber-300 dark:ring-amber-600' : ''}`} onClick={() => openEdit(note.id)}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-sm flex items-center gap-1">
                  {note.pinned && <Pin size={12} className="text-amber-500" />}
                  {note.title}
                </h3>
                <div onClick={e => e.stopPropagation()}>
                  <ItemActions onDelete={() => deleteNote(note.id)} />
                </div>
              </div>
              <p className="text-sm text-gray-500 line-clamp-3">{note.content}</p>
              <div className="flex items-center gap-2 mt-2">
                {note.subjectId && <SubjectBadge subjectId={note.subjectId} />}
                <span className="text-xs text-gray-400">{format(parseISO(note.updatedAt), 'd MMM', { locale: it })}</span>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Modifica nota' : 'Nuova nota'} size="lg">
        <div className="space-y-4">
          <div>
            <label className="label">Titolo</label>
            <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="label">Contenuto</label>
            <textarea className="input resize-none" rows={8} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Scrivi i tuoi appunti..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Materia</label>
              <select className="input" value={form.subjectId} onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))}>
                <option value="">Nessuna</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tag (separati da virgola)</label>
              <input className="input" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="es. esame, importante" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.pinned} onChange={e => setForm(f => ({ ...f, pinned: e.target.checked }))} className="w-4 h-4" />
            <span className="text-sm">Fissa in alto</span>
          </label>
          <button onClick={handleSave} className="btn-primary w-full">Salva</button>
        </div>
      </Modal>
    </div>
  )
}
