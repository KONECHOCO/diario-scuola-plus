import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Profile, Subject, Teacher, TimetableSlot, Homework, Exam, Grade,
  Absence, Note, LessonRecording, Flashcard, StudyGoal, CalendarEvent,
  PomodoroSession, AppSettings, PageId,
} from '../types'
import { generateId, SUBJECT_COLORS } from '../types'

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
  updateFlashcard: (id: string, data: Partial<Flashcard>) => void
  deleteFlashcard: (id: string) => void
  reviewFlashcard: (id: string, correct: boolean) => void

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

const defaultProfile: Profile = {
  id: 'default',
  name: 'Studente',
  school: 'La mia scuola',
  className: '3A',
  level: 'superiore',
  avatar: '🎓',
}

const defaultSettings: AppSettings = {
  darkMode: false,
  notifications: true,
  gradeSystem: 'decimi',
  weekStartsOn: 1,
  pomodoroFocus: 25,
  pomodoroBreak: 5,
  language: 'it',
  onboardingComplete: false,
}

const sampleSubjects: Subject[] = [
  { id: 's1', name: 'Matematica', color: SUBJECT_COLORS[0], coefficient: 2 },
  { id: 's2', name: 'Italiano', color: SUBJECT_COLORS[1], coefficient: 2 },
  { id: 's3', name: 'Inglese', color: SUBJECT_COLORS[2], coefficient: 1 },
  { id: 's4', name: 'Storia', color: SUBJECT_COLORS[3], coefficient: 1 },
  { id: 's5', name: 'Scienze', color: SUBJECT_COLORS[4], coefficient: 1 },
]

export const useDiaryStore = create<DiaryState>()(
  persist(
    (set, get) => ({
      currentPage: 'dashboard',
      activeProfileId: 'default',
      profiles: [defaultProfile],
      subjects: sampleSubjects,
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

      addFlashcard: (card) => set(s => ({
        flashcards: [...s.flashcards, { ...card, id: generateId(), reviewCount: 0, difficulty: 0 }],
      })),
      updateFlashcard: (id, data) => set(s => ({
        flashcards: s.flashcards.map(c => c.id === id ? { ...c, ...data } : c),
      })),
      deleteFlashcard: (id) => set(s => ({
        flashcards: s.flashcards.filter(c => c.id !== id),
      })),
      reviewFlashcard: (id, correct) => set(s => ({
        flashcards: s.flashcards.map(c => {
          if (c.id !== id) return c
          const newDiff = correct ? Math.max(0, c.difficulty - 1) : Math.min(5, c.difficulty + 1)
          const daysUntilNext = [1, 2, 4, 7, 14, 30][newDiff] ?? 1
          const next = new Date()
          next.setDate(next.getDate() + daysUntilNext)
          return {
            ...c,
            difficulty: newDiff,
            reviewCount: c.reviewCount + 1,
            lastReviewed: new Date().toISOString(),
            nextReview: next.toISOString(),
          }
        }),
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
        const today = new Date().toISOString().split('T')[0]
        const { lastStudyDate, studyStreak } = get()
        if (lastStudyDate === today) return
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]
        const newStreak = lastStudyDate === yesterdayStr ? studyStreak + 1 : 1
        set({ studyStreak: newStreak, lastStudyDate: today })
      },

      importData: (data) => set(s => ({ ...s, ...data })),
      resetData: () => set({
        subjects: sampleSubjects,
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
    { name: 'diario-scuola-plus' }
  )
)
