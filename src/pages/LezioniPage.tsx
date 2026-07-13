import { useState, useRef, useEffect } from 'react'
import { useDiaryStore } from '../store/useDiaryStore'
import { Modal } from '../components/ui/Modal'
import { SubjectBadge } from '../components/ui/SubjectBadge'
import { EmptyState, ItemActions } from '../components/ui/Common'
import { Plus, Mic, Square, Play, Pause } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { generateId } from '../types'
import { getAudioMimeType, saveRecordingBlob, loadRecordingUri, deleteRecordingFile } from '../lib/audioStorage'
import { hapticSuccess } from '../lib/native'

export function LezioniPage() {
  const { recordings, subjects, addRecording, deleteRecording } = useDiaryStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [recording, setRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [form, setForm] = useState({ subjectId: '', title: '', notes: '' })
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported(getAudioMimeType())
        ? getAudioMimeType()
        : undefined
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      chunks.current = []
      recorder.ondataavailable = e => chunks.current.push(e.data)
      recorder.onstop = () => stream.getTracks().forEach(t => t.stop())
      mediaRecorder.current = recorder
      recorder.start()
      setRecording(true)
      setDuration(0)
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
    } catch {
      alert('Permesso microfono negato. Abilita l\'accesso al microfono nelle impostazioni.')
    }
  }

  const stopRecording = () => {
    if (!mediaRecorder.current) return
    mediaRecorder.current.onstop = async () => {
      const blob = new Blob(chunks.current, { type: getAudioMimeType() })
      const id = generateId()
      const stored = await saveRecordingBlob(id, blob)
      if (form.subjectId && form.title) {
        addRecording({
          id,
          subjectId: form.subjectId,
          title: form.title,
          date: new Date().toISOString(),
          duration,
          ...stored,
          notes: form.notes || undefined,
        })
        hapticSuccess()
        setModalOpen(false)
        setForm({ subjectId: '', title: '', notes: '' })
      }
    }
    mediaRecorder.current.stop()
    setRecording(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const playAudio = async (id: string, rec: typeof recordings[0]) => {
    const uri = await loadRecordingUri(rec)
    if (!uri) return
    if (playingId === id) {
      audioRef.current?.pause()
      setPlayingId(null)
      return
    }
    if (audioRef.current) audioRef.current.pause()
    const audio = new Audio(uri)
    audioRef.current = audio
    audio.play()
    setPlayingId(id)
    audio.onended = () => setPlayingId(null)
  }

  const handleDelete = async (rec: typeof recordings[0]) => {
    await deleteRecordingFile(rec.filePath)
    deleteRecording(rec.id)
  }

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="max-w-3xl">
      <div className="flex justify-end mb-4">
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Nuova registrazione
        </button>
      </div>

      {recordings.length === 0 ? (
        <EmptyState icon={<Mic size={32} />} title="Nessuna registrazione" description="Registra le tue lezioni e rivedile quando studi" action={<button onClick={() => setModalOpen(true)} className="btn-primary">Registra</button>} />
      ) : (
        <div className="space-y-2">
          {recordings.map(rec => (
            <div key={rec.id} className="card flex items-center gap-3">
              <button
                onClick={() => playAudio(rec.id, rec)}
                className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center flex-shrink-0"
              >
                {playingId === rec.id ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <div className="flex-1">
                <p className="font-medium text-sm">{rec.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <SubjectBadge subjectId={rec.subjectId} />
                  <span className="text-xs text-gray-400">{formatDuration(rec.duration)}</span>
                  <span className="text-xs text-gray-400">{format(parseISO(rec.date), 'd MMM yyyy', { locale: it })}</span>
                </div>
                {rec.notes && <p className="text-xs text-gray-400 mt-0.5">{rec.notes}</p>}
              </div>
              <ItemActions onDelete={() => handleDelete(rec)} />
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { if (!recording) setModalOpen(false) }} title="Registra lezione">
        <div className="space-y-4">
          <div>
            <label className="label">Titolo</label>
            <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="es. Lezione del 12/03" disabled={recording} />
          </div>
          <div>
            <label className="label">Materia</label>
            <select className="input" value={form.subjectId} onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))} disabled={recording}>
              <option value="">Seleziona</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Note</label>
            <input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} disabled={recording} />
          </div>

          <div className="flex flex-col items-center py-6">
            <div className={`relative w-24 h-24 rounded-full flex items-center justify-center ${recording ? 'bg-red-100 text-red-600 pomodoro-pulse' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
              <Mic size={36} />
            </div>
            <p className="text-2xl font-mono font-bold mt-4">{formatDuration(duration)}</p>
            <p className="text-sm text-gray-400 mt-1">{recording ? 'Registrazione in corso...' : 'Pronto per registrare'}</p>
          </div>

          <button
            onClick={recording ? stopRecording : startRecording}
            disabled={!recording && (!form.title || !form.subjectId)}
            className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 ${recording ? 'bg-red-600 hover:bg-red-700 text-white' : 'btn-primary'}`}
          >
            {recording ? <><Square size={18} /> Stop e salva</> : <><Mic size={18} /> Inizia registrazione</>}
          </button>
        </div>
      </Modal>
    </div>
  )
}
