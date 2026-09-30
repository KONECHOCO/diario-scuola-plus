import { useDiaryStore } from '../store/useDiaryStore'
import { tNow } from '../i18n/useT'
import { homeworkNotificationId, scheduleNotification, cancelNotification } from './native'
import { parseISO, subHours, setHours, setMinutes } from 'date-fns'

export async function syncHomeworkNotifications(): Promise<void> {
  const { homework, settings } = useDiaryStore.getState()
  if (!settings.notifications) return

  for (const hw of homework) {
    const id = homeworkNotificationId(hw.id)
    await cancelNotification(id)
    if (hw.completed) continue

    // 8:00 on the due day
    const notifyAt = setMinutes(setHours(parseISO(hw.dueDate), 8), 0)
    if (notifyAt > new Date()) {
      await scheduleNotification(id, tNow('notif_hw'), hw.title, notifyAt)
    }
  }
}

export async function syncExamNotifications(): Promise<void> {
  const { exams, settings } = useDiaryStore.getState()
  if (!settings.notifications) return

  for (const exam of exams) {
    const id = homeworkNotificationId(exam.id) + 50000
    await cancelNotification(id)

    // 7:30 the day before
    const notifyAt = subHours(setMinutes(setHours(parseISO(exam.date), 7), 30), 24)
    if (notifyAt > new Date()) {
      await scheduleNotification(id, tNow('notif_exam'), exam.title, notifyAt)
    }
  }
}

export async function syncAllNotifications(): Promise<void> {
  await syncHomeworkNotifications()
  await syncExamNotifications()
}
