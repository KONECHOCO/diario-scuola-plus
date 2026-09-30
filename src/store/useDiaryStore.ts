import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Profile, Subject, Teacher, TimetableSlot, Homework, Exam, Grade,
  Absence, Note, LessonRecording, Flashcard, StudyGoal, CalendarEvent,
  PomodoroSession, AppSettings, PageId, DayOfWeek,
} from '../types'
import { generateId, SUBJECT_COLORS } from '../types'
import { deviceLang, deviceLocale, translate } from '../i18n/core'
import { defaultScaleFor } from '../lib/grades'

export type ReviewAnswer = 'again' | 'hard' | 'good' | 'easy'

interface DiaryState {
  currentPage: PageId
  activeProfileId: string
  profiles: Profile[]
  subjects: Subject[]
  teachers: Teacher[]
  timetable: TimetableSlot[]
  homework: Homework[]
  exams: Exam[]
  grades: Grade[]
  absences: Absence[]
  notes: Note[]
  recordings: LessonRecording[]
  flashcards: Flashcard[]
  goals: StudyGoal[]
  events: CalendarEvent[]
  pomodoroSessions: PomodoroSession[]
  settings: AppSettings
  studyStreak: number
  lastStudyDate: string | null

  setPage: (page: PageId) => void
  addProfile: (profile: Omit<Profile, 'id'>) => void
  updateProfile: (id: string, data: Partial<Profile>) => void
  deleteProfile: (id: string) => void
  setActiveProfile: (id: string) => void

  addSubject: (subject: Omit<Subject, 'id'>) => void
  updateSubject: (id: string, data: Partial<Subject>) => void
  deleteSubject: (id: string) => void

  addTeacher: (teacher: Omit<Teacher, 'id'>) => void
  updateTeacher: (id: string, data: Partial<Teacher>) => void
  deleteTeacher: (id: string) => void

  addTimetableSlot: (slot: Omit<TimetableSlot, 'id'>) => void
  updateTimetableSlot: (id: string, data: Partial<TimetableSlot>) => void
  deleteTimetableSlot: (id: string) => void

  addHomework: (hw: Omit<Homework, 'id' | 'createdAt'>) => void
  updateHomework: (id: string, data: Partial<Homework>) => void
  deleteHomework: (id: string) => void
  toggleHomework: (id: string) => void

  addExam: (exam: Omit<Exam, 'id'>) => void
  updateExam: (id: string, data: Partial<Exam>) => void
  deleteExam: (id: string) => void

  addGrade: (grade: Omit<Grade, 'id'>) => void
  updateGrade: (id: string, data: Partial<Grade>) => void
  deleteGrade: (id: string) => void

  addAbsence: (absence: Omit<Absence, 'id'>) => void
  updateAbsence: (id: string, data: Partial<Absence>) => void
  deleteAbsence: (id: string) => void

  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateNote: (id: string, data: Partial<Note>) => void
  deleteNote: (id: string) => void

  addRecording: (rec: Omit<LessonRecording, 'id'> & { id?: string }) => void
  updateRecording: (id: string, data: Partial<LessonRecording>) => void
  deleteRecording: (id: string) => void

  addFlashcard: (card: Omit<Flashcard, 'id' | 'reviewCount' | 'difficulty'>) => void
  addFlashcards: (cards: Omit<Flashcard, 'id' | 'reviewCount' | 'difficulty'>[]) => void
  updateFlashcard: (id: string, data: Partial<Flashcard>) => void
  deleteFlashcard: (id: string) => void
  reviewFlashcard: (id: string, answer: ReviewAnswer) => void

  addGoal: (goal: Omit<StudyGoal, 'id'>) => void
  updateGoal: (id: string, data: Partial<StudyGoal>) => void
  deleteGoal: (id: string) => void

  addEvent: (event: Omit<CalendarEvent, 'id'>) => void
  updateEvent: (id: string, data: Partial<CalendarEvent>) => void
  deleteEvent: (id: string) => void

  addPomodoroSession: (session: Omit<PomodoroSession, 'id'>) => void
  updateSettings: (settings: Partial<AppSettings>) => void
  updateStudyStreak: () => void
  importData: (data: Partial<DiaryState>) => void
  resetData: () => void
}

const lang = deviceLang()
const tr = (key: Parameters<typeof translate>[1]) => translate(lang, key)

const defaultProfile: Profile = {
  id: 'default',
  name: tr('default_student'),
  school: '',
  className: '',
  level: 'superiore',
  avatar: '🎓',
}

function mondayOfThisWeek(): string {
  const d = new Date()
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return localDate(d)
}

export function localDate(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function defaultWeekStart(): DayOfWeek {
  const region = deviceLocale().split(/[-_]/)[1]?.toUpperCase()
  if (region && ['US', 'CA', 'BR', 'MX', 'JP', 'IL', 'PH', 'SA'].includes(region)) return 0
  return 1
}

const regional = defaultScaleFor(deviceLocale())

const defaultSettings: AppSettings = {
  darkMode: false,
  notifications: true,
  gradeScale: regional.scale,
  passMark: regional.pass,
  weekStartsOn: defaultWeekStart(),
  saturday: false,
  rotation: false,
  rotationAnchor: mondayOfThisWeek(),
  periods: [],
  pomodoroFocus: 25,
  pomodoroBreak: 5,
  language: 'auto',
  onboardingComplete: false,
}

const sampleSubjects = (): Subject[] => [
  { id: 's1', name: tr('subj_math'), color: SUBJECT_COLORS[0], coefficient: 1 },
  { id: 's2', name: tr('subj_lang'), color: SUBJECT_COLORS[1], coefficient: 1 },
  { id: 's3', name: tr('subj_foreign'), color: SUBJECT_COLORS[2], coefficient: 1 },
  { id: 's4', name: tr('subj_history'), color: SUBJECT_COLORS[3], coefficient: 1 },
  { id: 's5', name: tr('subj_science'), color: SUBJECT_COLORS[4], coefficient: 1 },
]

/** SM-2 scheduling (the algorithm behind Anki), in days. */
function schedule(card: Flashcard, answer: ReviewAnswer): Partial<Flashcard> {
  let ease = card.ease ?? 2.5
  let reps = card.reps ?? 0
  let interval = card.interval ?? 0
  const next = new Date()
  if (answer === 'again') {
    reps = 0
    interval = 0
    ease = Math.max(1.3, ease - 0.2)
    next.setMinutes(next.getMinutes() + 10)
  } else {
    if (answer === 'hard') {
      interval = Math.max(1, Math.round(interval * 1.2))
      ease = Math.max(1.3, ease - 0.15)
    } else {
      interval = reps === 0 ? 1 : reps === 1 ? 3 : Math.round(interval * ease)
      if (answer === 'easy') {
        interval = Math.round(interval * 1.3) + 1
        ease += 0.15
      }
    }
    reps += 1
    next.setDate(next.getDate() + interval)
  }
  return {
    ease, reps, interval,
    difficulty: Math.round((3 - Math.min(3, ease - 1.3)) * 1.6),
    reviewCount: card.reviewCount + 1,
    lastReviewed: new Date().toISOString(),
    nextReview: next.toISOString(),
  }
}

export const useDiaryStore = create<DiaryState>()(
  persist(
    (set, get) => ({
      currentPage: 'dashboard',
      activeProfileId: 'default',
      profiles: [defaultProfile],
      subjects: sampleSubjects(),
      teachers: [],
      timetable: [],
      homework: [],
      exams: [],
      grades: [],
      absences: [],
      notes: [],
      recordings: [],
      flashcards: [],
      goals: [],
      events: [],
      pomodoroSessions: [],
      settings: defaultSettings,
      studyStreak: 0,
      lastStudyDate: null,

      setPage: (page) => set({ currentPage: page }),

      addProfile: (profile) => set(s => ({
        profiles: [...s.profiles, { ...profile, id: generateId() }],
      })),
      updateProfile: (id, data) => set(s => ({
        profiles: s.profiles.map(p => p.id === id ? { ...p, ...data } : p),
      })),
      deleteProfile: (id) => set(s => ({
        profiles: s.profiles.filter(p => p.id !== id),
        activeProfileId: s.activeProfileId === id ? s.profiles[0]?.id ?? '' : s.activeProfileId,
      })),
      setActiveProfile: (id) => set({ activeProfileId: id }),

      addSubject: (subject) => set(s => ({
        subjects: [...s.subjects, { ...subject, id: generateId() }],
      })),
      updateSubject: (id, data) => set(s => ({
        subjects: s.subjects.map(sub => sub.id === id ? { ...sub, ...data } : sub),
      })),
      deleteSubject: (id) => set(s => ({
        subjects: s.subjects.filter(sub => sub.id !== id),
        timetable: s.timetable.filter(t => t.subjectId !== id),
        homework: s.homework.filter(h => h.subjectId !== id),
        exams: s.exams.filter(e => e.subjectId !== id),
        grades: s.grades.filter(g => g.subjectId !== id),
      })),

      addTeacher: (teacher) => set(s => ({
        teachers: [...s.teachers, { ...teacher, id: generateId() }],
      })),
      updateTeacher: (id, data) => set(s => ({
        teachers: s.teachers.map(t => t.id === id ? { ...t, ...data } : t),
      })),
      deleteTeacher: (id) => set(s => ({
        teachers: s.teachers.filter(t => t.id !== id),
      })),

      addTimetableSlot: (slot) => set(s => ({
        timetable: [...s.timetable, { ...slot, id: generateId() }],
      })),
      updateTimetableSlot: (id, data) => set(s => ({
        timetable: s.timetable.map(t => t.id === id ? { ...t, ...data } : t),
      })),
      deleteTimetableSlot: (id) => set(s => ({
        timetable: s.timetable.filter(t => t.id !== id),
      })),

      addHomework: (hw) => set(s => ({
        homework: [...s.homework, { ...hw, id: generateId(), createdAt: new Date().toISOString() }],
      })),
      updateHomework: (id, data) => set(s => ({
        homework: s.homework.map(h => h.id === id ? { ...h, ...data } : h),
      })),
      deleteHomework: (id) => set(s => ({
        homework: s.homework.filter(h => h.id !== id),
      })),
      toggleHomework: (id) => set(s => ({
        homework: s.homework.map(h => h.id === id ? { ...h, completed: !h.completed } : h),
      })),

      addExam: (exam) => set(s => ({
        exams: [...s.exams, { ...exam, id: generateId() }],
      })),
      updateExam: (id, data) => set(s => ({
        exams: s.exams.map(e => e.id === id ? { ...e, ...data } : e),
      })),
      deleteExam: (id) => set(s => ({
        exams: s.exams.filter(e => e.id !== id),
      })),

      addGrade: (grade) => set(s => ({
        grades: [...s.grades, { ...grade, id: generateId() }],
      })),
      updateGrade: (id, data) => set(s => ({
        grades: s.grades.map(g => g.id === id ? { ...g, ...data } : g),
      })),
      deleteGrade: (id) => set(s => ({
        grades: s.grades.filter(g => g.id !== id),
      })),

      addAbsence: (absence) => set(s => ({
        absences: [...s.absences, { ...absence, id: generateId() }],
      })),
      updateAbsence: (id, data) => set(s => ({
        absences: s.absences.map(a => a.id === id ? { ...a, ...data } : a),
      })),
      deleteAbsence: (id) => set(s => ({
        absences: s.absences.filter(a => a.id !== id),
      })),

      addNote: (note) => {
        const now = new Date().toISOString()
        set(s => ({
          notes: [...s.notes, { ...note, id: generateId(), createdAt: now, updatedAt: now }],
        }))
      },
      updateNote: (id, data) => set(s => ({
        notes: s.notes.map(n => n.id === id ? { ...n, ...data, updatedAt: new Date().toISOString() } : n),
      })),
      deleteNote: (id) => set(s => ({
        notes: s.notes.filter(n => n.id !== id),
      })),

      addRecording: (rec) => set(s => ({
        recordings: [...s.recordings, { ...rec, id: rec.id ?? generateId() }],
      })),
      updateRecording: (id, data) => set(s => ({
        recordings: s.recordings.map(r => r.id === id ? { ...r, ...data } : r),
      })),
      deleteRecording: (id) => set(s => ({
        recordings: s.recordings.filter(r => r.id !== id),
      })),

      addFlashcard: (card) => get().addFlashcards([card]),
      addFlashcards: (cards) => set(s => ({
        flashcards: [...s.flashcards, ...cards.map(c => ({ ...c, id: generateId(), reviewCount: 0, difficulty: 0 }))],
      })),
      updateFlashcard: (id, data) => set(s => ({
        flashcards: s.flashcards.map(c => c.id === id ? { ...c, ...data } : c),
      })),
      deleteFlashcard: (id) => set(s => ({
        flashcards: s.flashcards.filter(c => c.id !== id),
      })),
      reviewFlashcard: (id, answer) => set(s => ({
        flashcards: s.flashcards.map(c => c.id === id ? { ...c, ...schedule(c, answer) } : c),
      })),

      addGoal: (goal) => set(s => ({
        goals: [...s.goals, { ...goal, id: generateId() }],
      })),
      updateGoal: (id, data) => set(s => ({
        goals: s.goals.map(g => g.id === id ? { ...g, ...data } : g),
      })),
      deleteGoal: (id) => set(s => ({
        goals: s.goals.filter(g => g.id !== id),
      })),

      addEvent: (event) => set(s => ({
        events: [...s.events, { ...event, id: generateId() }],
      })),
      updateEvent: (id, data) => set(s => ({
        events: s.events.map(e => e.id === id ? { ...e, ...data } : e),
      })),
      deleteEvent: (id) => set(s => ({
        events: s.events.filter(e => e.id !== id),
      })),

      addPomodoroSession: (session) => {
        set(s => ({
          pomodoroSessions: [...s.pomodoroSessions, { ...session, id: generateId() }],
        }))
        get().updateStudyStreak()
      },

      updateSettings: (settings) => set(s => ({
        settings: { ...s.settings, ...settings },
      })),

      updateStudyStreak: () => {
        const today = localDate()
        const { lastStudyDate, studyStreak } = get()
        if (lastStudyDate === today) return
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const newStreak = lastStudyDate === localDate(yesterday) ? studyStreak + 1 : 1
        set({ studyStreak: newStreak, lastStudyDate: today })
      },

      importData: (data) => set(s => ({ ...s, ...data })),
      resetData: () => set({
        subjects: sampleSubjects(),
        teachers: [],
        timetable: [],
        homework: [],
        exams: [],
        grades: [],
        absences: [],
        notes: [],
        recordings: [],
        flashcards: [],
        goals: [],
        events: [],
        pomodoroSessions: [],
        studyStreak: 0,
        lastStudyDate: null,
      }),
    }),
    {
      name: 'diario-scuola-plus',
      version: 2,
      // v1 (Italian-only app): 1–10 grades, fixed Italian language.
      migrate: (persisted, version) => {
        const state = persisted as Partial<DiaryState> & { settings?: Partial<AppSettings> & { gradeSystem?: string } }
        if (version < 2) {
          const old: Partial<AppSettings> & { gradeSystem?: string } = { ...state.settings }
          delete old.gradeSystem
          state.settings = {
            ...defaultSettings,
            ...old,
            language: 'auto',
            gradeScale: '10',
            passMark: 6,
            weekStartsOn: 1,
          }
          if ((state.currentPage as string) === 'ai') state.currentPage = 'piano'
        }
        return state as DiaryState
      },
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<DiaryState>
        return { ...current, ...p, settings: { ...defaultSettings, ...(p.settings ?? {}) } }
      },
    }
  )
)
