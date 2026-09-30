import { useState } from 'react'
import { useDiaryStore, localDate } from '../store/useDiaryStore'
import { useT } from '../i18n/useT'
import type { Key } from '../i18n/core'
import { deletePhotos } from '../lib/photoStorage'
import { Modal } from '../components/ui/Modal'
import { SubjectBadge } from '../components/ui/SubjectBadge'
import { EmptyState, ItemActions } from '../components/ui/Common'
import { PhotoField, PhotoThumb, PhotoViewer } from '../components/ui/Photos'
import { Plus, ClipboardList, Check } from 'lucide-react'
import { parseISO } from 'date-fns'
import type { Homework, TaskPriority } from '../types'

type Filter = 'da_fare' | 'completati' | 'tutti'
const FILTER_KEYS: Record<Filter, Key> = { da_fare: 'f_todo', completati: 'f_done', tutti: 'f_all' }
const PRIORITIES: TaskPriority[] = ['bassa', 'media', 'alta']

export function CompitiPage() {
  const { homework, subjects, addHomework, updateHomework, toggleHomework, deleteHomework } = useDiaryStore()
  const { t, fd } = useT()
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [viewing, setViewing] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('da_fare')
  const emptyForm = { subjectId: '', title: '', description: '', dueDate: '', priority: 'media' as TaskPriority, photos: [] as string[] }
  const [form, setForm] = useState(emptyForm)
  const today = localDate()

  const filtered = homework
    .filter(h => filter === 'tutti' || (filter === 'da_fare' ? !h.completed : h.completed))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  const openAdd = () => {
    setEditId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (hw: Homework) => {
    setEditId(hw.id)
    setForm({ subjectId: hw.subjectId, title: hw.title, description: hw.description ?? '', dueDate: hw.dueDate, priority: hw.priority, photos: hw.photos ?? [] })
    setModalOpen(true)
  }

  const handleSave = () => {
    if (!form.subjectId || !form.title || !form.dueDate) return
    const data = { ...form, description: form.description || undefined, photos: form.photos.length ? form.photos : undefined }
    if (editId) {
      const removed = (homework.find(h => h.id === editId)?.photos ?? []).filter(p => !form.photos.includes(p))
      void deletePhotos(removed)
      updateHomework(editId, data)
    } else {
      addHomework({ ...data, completed: false })
    }
    setModalOpen(false)
    setForm(emptyForm)
  }

  const remove = (hw: Homework) => {
    void deletePhotos(hw.photos)
    deleteHomework(hw.id)
  }

  const priorityColors = { bassa: 'text-gray-400', media: 'text-amber-500', alta: 'text-red-500' }

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
        <div className="flex gap-2">
          {(['da_fare', 'completati', 'tutti'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                filter === f ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              {t(FILTER_KEYS[f])}
            </button>
          ))}
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> {t('new_hw')}
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={32} />}
          title={t('no_hw')}
          description={t('no_hw_desc')}
          action={<button onClick={openAdd} className="btn-primary">{t('add_hw')}</button>}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map(hw => {
            const overdue = !hw.completed && hw.dueDate < today
            return (
              <div key={hw.id} className={`card flex items-start gap-3 ${hw.completed ? 'opacity-60' : ''}`}>
                <button
                  onClick={() => toggleHomework(hw.id)}
                  className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    hw.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-primary-500'
                  }`}
                >
                  {hw.completed && <Check size={14} />}
                </button>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openEdit(hw)}>
                  <p className={`font-medium text-sm ${hw.completed ? 'line-through' : ''}`}>{hw.title}</p>
                  {hw.description && <p className="text-xs text-gray-400 mt-0.5 whitespace-pre-line">{hw.description}</p>}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <SubjectBadge subjectId={hw.subjectId} />
                    <span className={`text-xs font-medium ${overdue ? 'text-red-500' : 'text-gray-400'}`}>
                      {fd(parseISO(hw.dueDate), 'weekdayShort')}
                    </span>
                    <span className={`text-xs ${priorityColors[hw.priority]}`}>● {t(`prio_${hw.priority}` as Key)}</span>
                  </div>
                  {hw.photos?.length ? (
                    <div className="flex gap-2 mt-2 overflow-x-auto">
                      {hw.photos.map(p => <PhotoThumb key={p} refId={p} size={52} onOpen={setViewing} />)}
                    </div>
                  ) : null}
                </div>
                <ItemActions onEdit={() => openEdit(hw)} onDelete={() => remove(hw)} />
              </div>
            )
          })}
        </div>
      )}

      <PhotoViewer src={viewing} onClose={() => setViewing(null)} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? t('edit_hw') : t('new_hw')}>
        <div className="space-y-4">
          <div>
            <label className="label">{t('title')}</label>
            <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder={t('hw_title_ph')} />
          </div>
          <div>
            <label className="label">{t('subject')}</label>
            <select className="input" value={form.subjectId} onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))}>
              <option value="">{t('select')}</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('due')}</label>
              <input type="date" className="input" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
            <div>
              <label className="label">{t('priority')}</label>
              <select className="input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as TaskPriority }))}>
                {PRIORITIES.map(p => <option key={p} value={p}>{t(`prio_${p}` as Key)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">{t('description')} {t('optional')}</label>
            <textarea className="input resize-none" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <PhotoField value={form.photos} onChange={photos => setForm(f => ({ ...f, photos }))} />
          <button onClick={handleSave} disabled={!form.subjectId || !form.title || !form.dueDate} className="btn-primary w-full">{t('save_hw')}</button>
        </div>
      </Modal>
    </div>
  )
}
