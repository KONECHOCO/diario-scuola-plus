import { Capacitor } from '@capacitor/core'

export const isNative = Capacitor.isNativePlatform()
export const platform = Capacitor.getPlatform()

export async function initNativeApp(): Promise<void> {
  if (!isNative) return

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    const { SplashScreen } = await import('@capacitor/splash-screen')
    const { App } = await import('@capacitor/app')

    await StatusBar.setStyle({ style: Style.Light })
    if (platform === 'android') {
      await StatusBar.setBackgroundColor({ color: '#2563eb' })
    }

    await SplashScreen.hide()

    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) document.dispatchEvent(new CustomEvent('app-resume'))
    })
  } catch (e) {
    console.warn('Native init:', e)
  }
}

export async function hapticLight(): Promise<void> {
  if (!isNative) return
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
    await Haptics.impact({ style: ImpactStyle.Light })
  } catch { /* noop */ }
}

export async function hapticSuccess(): Promise<void> {
  if (!isNative) return
  try {
    const { Haptics, NotificationType } = await import('@capacitor/haptics')
    await Haptics.notification({ type: NotificationType.Success })
  } catch { /* noop */ }
}

export async function shareData(title: string, text: string, url?: string): Promise<boolean> {
  try {
    if (isNative) {
      const { Share } = await import('@capacitor/share')
      await Share.share({ title, text, url, dialogTitle: title })
      return true
    }
    if (navigator.share) {
      await navigator.share({ title, text, url })
      return true
    }
  } catch { /* user cancelled */ }
  return false
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (isNative) {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      const result = await LocalNotifications.requestPermissions()
      return result.display === 'granted'
    }
    if ('Notification' in window) {
      const result = await Notification.requestPermission()
      return result === 'granted'
    }
  } catch { /* noop */ }
  return false
}

export async function scheduleNotification(id: number, title: string, body: string, at: Date): Promise<void> {
  if (at <= new Date()) return

  try {
    if (isNative) {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      await LocalNotifications.schedule({
        notifications: [{
          id,
          title,
          body,
          schedule: { at },
          sound: undefined,
          smallIcon: 'ic_stat_icon_config_sample',
          iconColor: '#2563eb',
        }],
      })
      return
    }
  } catch (e) {
    console.warn('Schedule notification:', e)
  }
}

export async function cancelNotification(id: number): Promise<void> {
  try {
    if (isNative) {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      await LocalNotifications.cancel({ notifications: [{ id }] })
    }
  } catch { /* noop */ }
}

export function homeworkNotificationId(homeworkId: string): number {
  let hash = 0
  for (let i = 0; i < homeworkId.length; i++) {
    hash = ((hash << 5) - hash) + homeworkId.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) % 100000 + 1000
}
