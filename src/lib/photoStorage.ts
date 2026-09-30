import { Capacitor } from '@capacitor/core'
import { generateId } from '../types'

// Photos attached to homework and notes. Native: JPEG files in the app's data
// folder (ref "file:photos/<id>.jpg"), so localStorage stays small. Web: a
// downscaled data URL.
const PHOTOS_DIR = 'photos'
const MAX_SIDE = 1600
const QUALITY = 0.72

export async function savePhoto(file: File): Promise<string> {
  const dataUrl = await downscale(file)
  if (!Capacitor.isNativePlatform()) return dataUrl

  const { Filesystem, Directory } = await import('@capacitor/filesystem')
  const path = `${PHOTOS_DIR}/${generateId()}.jpg`
  try {
    await Filesystem.mkdir({ path: PHOTOS_DIR, directory: Directory.Data, recursive: true })
  } catch { /* exists */ }
  await Filesystem.writeFile({ path, data: dataUrl.split(',')[1], directory: Directory.Data })
  return `file:${path}`
}

/** A URL the <img> tag can load. */
export async function photoSrc(ref: string): Promise<string> {
  if (!ref.startsWith('file:')) return ref
  const { Filesystem, Directory } = await import('@capacitor/filesystem')
  const { uri } = await Filesystem.getUri({ path: ref.slice(5), directory: Directory.Data })
  return Capacitor.convertFileSrc(uri)
}

export async function deletePhotos(refs: string[] = []): Promise<void> {
  const files = refs.filter(r => r.startsWith('file:'))
  if (!files.length || !Capacitor.isNativePlatform()) return
  const { Filesystem, Directory } = await import('@capacitor/filesystem')
  await Promise.all(files.map(r => Filesystem.deleteFile({ path: r.slice(5), directory: Directory.Data }).catch(() => undefined)))
}

async function downscale(file: File): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = reject
      el.src = url
    })
    const ratio = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.naturalWidth * ratio)
    canvas.height = Math.round(img.naturalHeight * ratio)
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', QUALITY)
  } finally {
    URL.revokeObjectURL(url)
  }
}
