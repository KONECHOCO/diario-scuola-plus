import { useState } from 'react'
import { useDiaryStore } from '../store/useDiaryStore'
import { Modal } from '../components/ui/Modal'
import { EmptyState, ItemActions } from '../components/ui/Common'
import { Plus, Users, Mail, Phone, Clock } from 'lucide-react'

export function InsegnantiPage() {
  const { teachers, addTeacher, updateTeacher, deleteTeacher } = useDiaryStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', subject: '', email: '', phone: '', officeHours: '', notes: '' })

  const openAdd = () => {
    setEditId(null)
    setForm({ name: '', subject: '', email: '', phone: '', officeHours: '', notes: '' })
    setModalOpen(true)
  }

  const openEdit = (id: string) => {
    const t = teachers.find(te => te.id === id)!
    setEditId(id)
    setForm({ name: t.name, subject: t.subject ?? '', email: t.email ?? '', phone: t.phone ?? '', officeHours: t.officeHours ?? '', notes: t.notes ?? '' })
    setModalOpen(true)
  }

  const handleSave = () => {
    if (!form.name) return
    const data = {
      name: form.name,
      subject: form.subject || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      officeHours: form.officeHours || undefined,
      notes: form.notes || undefined,
    }
    if (editId) updateTeacher(editId, data)
    else addTeacher(data)
    setModalOpen(false)
  }

  return (
    <div className="max-w-3xl">
      <div className="flex justify-end mb-4">
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Aggiungi insegnante
        </button>
      </div>

      {teachers.length === 0 ? (
        <EmptyState icon={<Users size={32} />} title="Nessun insegnante" description="Salva i contatti dei tuoi professori con orari di ricevimento" action={<button onClick={openAdd} className="btn-primary">Aggiungi</button>} />
      ) : (
        <div className="space-y-3">
          {teachers.map(teacher => (
            <div key={teacher.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-lg">
                    {teacher.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold">{teacher.name}</p>
                    {teacher.subject && <p className="text-sm text-gray-500">{teacher.subject}</p>}
                  </div>
                </div>
                <ItemActions onEdit={() => openEdit(teacher.id)} onDelete={() => deleteTeacher(teacher.id)} />
              </div>
              <div className="mt-3 grid sm:grid-cols-2 gap-2">
                {teacher.email && (
                  <a href={`mailto:${teacher.email}`} className="flex items-center gap-2 text-sm text-primary-600 hover:underline">
                    <Mail size={14} /> {teacher.email}
                  </a>
                )}
                {teacher.phone && (
                  <a href={`tel:${teacher.phone}`} className="flex items-center gap-2 text-sm text-primary-600 hover:underline">
                    <Phone size={14} /> {teacher.phone}
                  </a>
                )}
                {teacher.officeHours && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock size={14} /> Ricevimento: {teacher.officeHours}
                  </div>
                )}
              </div>
              {teacher.notes && <p className="text-xs text-gray-400 mt-2">{teacher.notes}</p>}
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Modifica insegnante' : 'Nuovo insegnante'}>
        <div className="space-y-4">
          <div>
            <label className="label">Nome</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Materia</label>
            <input className="input" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="label">Telefono</label>
              <input type="tel" className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Orario ricevimento</label>
            <input className="input" value={form.officeHours} onChange={e => setForm(f => ({ ...f, officeHours: e.target.value }))} placeholder="es. Martedì 14:00-15:00" />
          </div>
          <div>
            <label className="label">Note</label>
            <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <button onClick={handleSave} className="btn-primary w-full">Salva</button>
        </div>
      </Modal>
    </div>
  )
}
