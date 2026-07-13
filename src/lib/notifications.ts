import { useDiaryStore } from '../store/useDiaryStore'
import { homeworkNotificationId, scheduleNotification, cancelNotification } from './native'
import { parseISO, subHours, setHours, setMinutes } from 'date-fns'

export async function syncHomeworkNotifications(): Promise<void> {
  const { homework, settings } = useDiaryStore.getState()
  if (!settings.notifications) return

  for (const hw of homework) {
    const id = homeworkNotificationId(hw.id)
    await cancelNotification(id)

    if (hw.completed) continue

    const dueDate = parseISO(hw.dueDate)
    const notifyAt = subHours(setMinutes(setHours(dueDate, 8), 0), 0)

    if (notifyAt > new Date()) {
      await scheduleNotification(
        id,
        '📚 Compito in scadenza',
        hw.title,
        notifyAt,
      )
    }
  }
}

export async function syncExamNotifications(): Promise<void> {
  const { exams, settings } = useDiaryStore.getState()
  if (!settings.notifications) return

  for (const exam of exams) {
    const id = homeworkNotificationId(exam.id) + 50000
    await cancelNotification(id)

    const examDate = parseISO(exam.date)
    const notifyAt = subHours(setMinutes(setHours(examDate, 7), 30), 24)

    if (notifyAt > new Date()) {
      await scheduleNotification(
        id,
        '📝 Esame domani!',
        exam.title,
        notifyAt,
      )
    }
  }
}

export async function syncAllNotifications(): Promise<void> {
  await syncHomeworkNotifications()
  await syncExamNotifications()
}
