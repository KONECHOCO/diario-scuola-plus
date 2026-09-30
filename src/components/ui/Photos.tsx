import { useEffect, useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'
import { photoSrc, savePhoto } from '../../lib/photoStorage'
import { useT } from '../../i18n/useT'

/** Thumbnail that resolves a stored photo ref (file:… or data URL). */
export function PhotoThumb({ refId, onOpen, size = 64 }: { refId: string; onOpen?: (src: string) => void; size?: number }) {
  const [src, setSrc] = useState<string>()
  useEffect(() => {
    let alive = true
    photoSrc(refId).then(s => alive && setSrc(s)).catch(() => undefined)
    return () => { alive = false }
  }, [refId])
  return (
    <button
      type="button"
      onClick={e => { e.stopPropagation(); if (src) onOpen?.(src) }}
      className="rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0"
      style={{ width: size, height: size }}
    >
      {src && <img src={src} alt="" className="w-full h-full object-cover" />}
    </button>
  )
}

/** Full-screen viewer. */
export function PhotoViewer({ src, onClose }: { src: string | null; onClose: () => void }) {
  if (!src) return null
  return (
    <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center safe-top safe-bottom" onClick={onClose}>
      <img src={src} alt="" className="max-w-full max-h-full object-contain" />
      <button className="absolute top-4 end-4 p-2 rounded-full bg-white/20 text-white" style={{ marginTop: 'env(safe-area-inset-top)' }} onClick={onClose}>
        <X size={22} />
      </button>
    </div>
  )
}

/** Photo list editor for a form: take/pick photos, remove them. */
export function PhotoField({ value, onChange }: { value: string[]; onChange: (refs: string[]) => void }) {
  const { t } = useT()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [viewing, setViewing] = useState<string | null>(null)

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setBusy(true)
    try {
      const refs: string[] = []
      for (const file of Array.from(files)) refs.push(await savePhoto(file))
      onChange([...value, ...refs])
    } catch {
      alert(t('photo_error'))
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div>
      <label className="label">{t('photos')}</label>
      <div className="flex flex-wrap gap-2">
        {value.map(ref => (
          <div key={ref} className="relative">
            <PhotoThumb refId={ref} onOpen={setViewing} />
            <button
              type="button"
              onClick={() => onChange(value.filter(r => r !== ref))}
              className="absolute -top-1.5 -end-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400 flex flex-col items-center justify-center gap-0.5 text-[10px] disabled:opacity-50"
        >
          <Camera size={20} />
          {t('add_photo')}
        </button>
        <input ref={input} type="file" accept="image/*" multiple className="hidden" onChange={e => onFiles(e.target.files)} />
      </div>
      <PhotoViewer src={viewing} onClose={() => setViewing(null)} />
    </div>
  )
}
