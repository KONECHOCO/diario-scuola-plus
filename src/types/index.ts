export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type GradeType = 'scritto' | 'orale' | 'pratico' | 'altro'

export type TaskPriority = 'bassa' | 'media' | 'alta'

export type SchoolLevel = 'elementare' | 'media' | 'superiore' | 'universita'

export const LANGS = ['it', 'en', 'fr', 'de', 'es', 'pt', 'nl', 'pl', 'ro', 'sv', 'ru', 'uk', 'tr', 'ar', 'zh', 'ja'] as const
export type LangCode = typeof LANGS[number]

export type GradeScaleId = '10' | '20' | 'de6' | '6' | '5' | '12' | '100' | 'letter' | 'se'

/** Timetable rotation: every week, or only in week A / week B. */
export type WeekKind = 'A' | 'B'

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
  week?: WeekKind
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
  photos?: string[]
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
  /** Value in `scale` (legacy grades: value out of maxValue). */
  value: number
  maxValue: number
  scale?: GradeScaleId
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
  photos?: string[]
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
  /** SM-2 state */
  ease?: number
  interval?: number
  reps?: number
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

/** A school term (quadrimestre, trimestre, semester...) running from `start` to the next term's start. */
export interface Period {
  id: string
  name: string
  start: string
}

export interface AppSettings {
  darkMode: boolean
  notifications: boolean
  gradeScale: GradeScaleId
  passMark: number
  weekStartsOn: DayOfWeek
  saturday: boolean
  rotation: boolean
  /** Monday (yyyy-MM-dd) of a week that is "week A". */
  rotationAnchor: string
  periods: Period[]
  pomodoroFocus: number
  pomodoroBreak: number
  language: LangCode | 'auto'
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
  | 'piano'
  | 'impostazioni'

export const SUBJECT_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1',
  '#84cc16', '#e11d48', '#0ea5e9', '#a855f7', '#10b981',
]

export function generateId(): string {
  return crypto.randomUUID()
}
