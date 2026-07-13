export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type GradeType = 'scritto' | 'orale' | 'pratico' | 'altro'

export type TaskPriority = 'bassa' | 'media' | 'alta'

export type SchoolLevel = 'elementare' | 'media' | 'superiore' | 'universita'

export interface Profile {
  id: string
  name: string
  school: string
  className: string
  level: SchoolLevel
  avatar: string
}

export interface Subject {
  id: string
  name: string
  color: string
  teacherId?: string
  targetGrade?: number
  coefficient?: number
}

export interface Teacher {
  id: string
  name: string
  subject?: string
  email?: string
  phone?: string
  officeHours?: string
  notes?: string
}

export interface TimetableSlot {
  id: string
  subjectId: string
  day: DayOfWeek
  startTime: string
  endTime: string
  room?: string
  notes?: string
}

export interface Homework {
  id: string
  subjectId: string
  title: string
  description?: string
  dueDate: string
  completed: boolean
  priority: TaskPriority
  reminder?: string
  createdAt: string
}

export interface Exam {
  id: string
  subjectId: string
  title: string
  date: string
  time?: string
  type: GradeType
  notes?: string
  studied: boolean
}

export interface Grade {
  id: string
  subjectId: string
  value: number
  maxValue: number
  type: GradeType
  date: string
  description?: string
  weight: number
}

export interface Absence {
  id: string
  date: string
  subjectId?: string
  justified: boolean
  reason?: string
  hours?: number
}

export interface Note {
  id: string
  title: string
  content: string
  subjectId?: string
  tags: string[]
  createdAt: string
  updatedAt: string
  pinned: boolean
}

export interface LessonRecording {
  id: string
  subjectId: string
  title: string
  date: string
  duration: number
  audioData?: string
  filePath?: string
  transcript?: string
  notes?: string
}

export interface Flashcard {
  id: string
  subjectId: string
  front: string
  back: string
  difficulty: number
  lastReviewed?: string
  nextReview?: string
  reviewCount: number
}

export interface StudyGoal {
  id: string
  title: string
  targetMinutes: number
  completedMinutes: number
  date: string
  completed: boolean
}

export interface CalendarEvent {
  id: string
  title: string
  date: string
  endDate?: string
  type: 'scuola' | 'personale' | 'sport' | 'festa'
  subjectId?: string
  description?: string
  reminder?: string
}

export interface PomodoroSession {
  id: string
  subjectId?: string
  duration: number
  type: 'focus' | 'break'
  date: string
}

export interface AppSettings {
  darkMode: boolean
  notifications: boolean
  gradeSystem: 'decimi' | 'centesimi' | 'lettere'
  weekStartsOn: DayOfWeek
  pomodoroFocus: number
  pomodoroBreak: number
  language: 'it'
  onboardingComplete: boolean
}

export type PageId =
  | 'dashboard'
  | 'orario'
  | 'compiti'
  | 'esami'
  | 'voti'
  | 'calendario'
  | 'materie'
  | 'insegnanti'
  | 'assenze'
  | 'note'
  | 'lezioni'
  | 'pomodoro'
  | 'flashcards'
  | 'obiettivi'
  | 'statistiche'
  | 'ai'
  | 'impostazioni'

export const DAY_NAMES = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'] as const
export const DAY_NAMES_SHORT = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'] as const

export const SUBJECT_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1',
  '#84cc16', '#e11d48', '#0ea5e9', '#a855f7', '#10b981',
]

export function generateId(): string {
  return crypto.randomUUID()
}

export function calcSubjectAverage(grades: Grade[], subjectId: string): number | null {
  const subjectGrades = grades.filter(g => g.subjectId === subjectId)
  if (subjectGrades.length === 0) return null
  const total = subjectGrades.reduce((sum, g) => sum + (g.value / g.maxValue) * 10 * g.weight, 0)
  const weightSum = subjectGrades.reduce((sum, g) => sum + g.weight, 0)
  return Math.round((total / weightSum) * 100) / 100
}

export function calcOverallAverage(grades: Grade[], subjects: Subject[]): number | null {
  const avgs = subjects
    .map(s => calcSubjectAverage(grades, s.id))
    .filter((a): a is number => a !== null)
  if (avgs.length === 0) return null
  return Math.round((avgs.reduce((a, b) => a + b, 0) / avgs.length) * 100) / 100
}
