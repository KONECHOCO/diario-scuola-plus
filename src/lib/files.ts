import { Capacitor } from '@capacitor/core'

/**
 * Saves a text file and opens the share sheet (native) or downloads it (web).
 * Native: the file goes to the cache folder and is shared as a real file, so
 * "Save to Files", AirDrop, Drive, email and calendar apps all receive it.
 */
export async function shareTextFile(filename: string, content: string, mime: string, title: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem')
    const { Share } = await import('@capacitor/share')
    const { uri } = await Filesystem.writeFile({
      path: filename,
      data: content,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    })
    try {
      await Share.share({ title, files: [uri], dialogTitle: title })
    } catch (error) {
      if (!/cancel/i.test(String((error as Error)?.message ?? error))) throw error
    }
    return
  }
  const url = URL.createObjectURL(new Blob([content], { type: mime }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Reads a user-picked file as text. */
export function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}
