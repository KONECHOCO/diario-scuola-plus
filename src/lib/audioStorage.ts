import { Capacitor } from '@capacitor/core'

const RECORDINGS_DIR = 'recordings'

export function getAudioMimeType(): string {
  if (Capacitor.getPlatform() === 'ios') return 'audio/mp4'
  return 'audio/webm'
}

export async function saveRecordingBlob(id: string, blob: Blob): Promise<{ filePath?: string; audioData?: string }> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem')
      const ext = Capacitor.getPlatform() === 'ios' ? 'm4a' : 'webm'
      const base64 = await blobToBase64(blob)
      const path = `${RECORDINGS_DIR}/${id}.${ext}`

      try {
        await Filesystem.mkdir({ path: RECORDINGS_DIR, directory: Directory.Data, recursive: true })
      } catch { /* dir exists */ }

      await Filesystem.writeFile({
        path,
        data: base64.split(',')[1] ?? base64,
        directory: Directory.Data,
      })

      return { filePath: path }
    } catch (e) {
      console.warn('Filesystem save failed, using inline:', e)
    }
  }

  return { audioData: await blobToDataUrl(blob) }
}

export async function loadRecordingUri(recording: { filePath?: string; audioData?: string }): Promise<string | null> {
  if (recording.audioData) return recording.audioData

  if (recording.filePath && Capacitor.isNativePlatform()) {
    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem')
      const result = await Filesystem.readFile({
        path: recording.filePath,
        directory: Directory.Data,
      })
      const ext = recording.filePath.endsWith('.m4a') ? 'audio/mp4' : 'audio/webm'
      return `data:${ext};base64,${result.data}`
    } catch (e) {
      console.warn('Failed to load recording:', e)
    }
  }

  return null
}

export async function deleteRecordingFile(filePath?: string): Promise<void> {
  if (!filePath || !Capacitor.isNativePlatform()) return
  try {
    const { Filesystem, Directory } = await import('@capacitor/filesystem')
    await Filesystem.deleteFile({ path: filePath, directory: Directory.Data })
  } catch { /* noop */ }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function blobToBase64(blob: Blob): Promise<string> {
  return blobToDataUrl(blob)
}
