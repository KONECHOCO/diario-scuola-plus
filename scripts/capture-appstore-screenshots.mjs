/**
 * Genera screenshot App Store per iPhone 6.5" e iPad 12.9".
 * Uso: npm run dev (in altro terminale) poi npm run screenshots:store
 */
import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.join(__dirname, '..')
const BASE_URL = process.env.SCREENSHOT_URL || 'http://127.0.0.1:5173'

const DEVICE_PROFILES = [
  {
    id: 'iphone-6.5',
    label: 'iPhone 6.5" (1284×2778)',
    expected: { width: 1284, height: 2778 },
    context: {
      viewport: { width: 428, height: 926 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    },
  },
  {
    id: 'ipad-12.9',
    label: 'iPad Pro 12.9" (2048×2732)',
    expected: { width: 2048, height: 2732 },
    context: {
      viewport: { width: 1024, height: 1366 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      userAgent:
        'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    },
  },
]

const demoState = {
  currentPage: 'dashboard',
  activeProfileId: 'default',
  profiles: [{ id: 'default', name: 'Marco', school: 'Liceo Volta', className: '3A', level: 'superiore', avatar: '🎓' }],
  subjects: [
    { id: 's1', name: 'Matematica', color: '#3b82f6', coefficient: 2 },
    { id: 's2', name: 'Italiano', color: '#ef4444', coefficient: 2 },
    { id: 's3', name: 'Inglese', color: '#22c55e', coefficient: 1 },
    { id: 's4', name: 'Storia', color: '#f59e0b', coefficient: 1 },
    { id: 's5', name: 'Scienze', color: '#8b5cf6', coefficient: 1 },
  ],
  teachers: [],
  timetable: [
    { id: 't1', day: 1, subjectId: 's1', startTime: '08:00', endTime: '09:00', room: 'A12' },
    { id: 't2', day: 1, subjectId: 's2', startTime: '09:00', endTime: '10:00', room: 'B03' },
    { id: 't3', day: 1, subjectId: 's3', startTime: '10:15', endTime: '11:15', room: 'C11' },
    { id: 't4', day: 2, subjectId: 's4', startTime: '08:00', endTime: '09:00', room: 'A05' },
    { id: 't5', day: 3, subjectId: 's5', startTime: '09:00', endTime: '10:00', room: 'Lab' },
    { id: 't6', day: 4, subjectId: 's1', startTime: '08:00', endTime: '09:00', room: 'A12' },
    { id: 't7', day: 5, subjectId: 's2', startTime: '10:15', endTime: '11:15', room: 'B03' },
  ],
  homework: [
    { id: 'h1', subjectId: 's1', title: 'Esercizi pag. 45-48', dueDate: '2026-07-15', completed: false, priority: 'high', createdAt: '2026-07-10T10:00:00.000Z' },
    { id: 'h2', subjectId: 's2', title: 'Riassunto capitolo 3', dueDate: '2026-07-16', completed: false, priority: 'medium', createdAt: '2026-07-11T10:00:00.000Z' },
    { id: 'h3', subjectId: 's3', title: 'Vocabulary unit 5', dueDate: '2026-07-14', completed: true, priority: 'low', createdAt: '2026-07-09T10:00:00.000Z' },
  ],
  exams: [
    { id: 'e1', subjectId: 's1', title: 'Verifica algebra', date: '2026-07-18', type: 'written' },
    { id: 'e2', subjectId: 's4', title: 'Interrogazione Risorgimento', date: '2026-07-20', type: 'oral' },
  ],
  grades: [
    { id: 'g1', subjectId: 's1', value: 8, type: 'written', date: '2026-06-20', description: 'Verifica' },
    { id: 'g2', subjectId: 's1', value: 7.5, type: 'oral', date: '2026-06-25', description: 'Interrogazione' },
    { id: 'g3', subjectId: 's2', value: 9, type: 'written', date: '2026-06-18', description: 'Tema' },
    { id: 'g4', subjectId: 's3', value: 8, type: 'oral', date: '2026-06-22', description: 'Dialogo' },
    { id: 'g5', subjectId: 's4', value: 7, type: 'written', date: '2026-06-28', description: 'Verifica' },
  ],
  absences: [],
  notes: [],
  recordings: [],
  flashcards: [],
  goals: [],
  events: [],
  pomodoroSessions: [],
  settings: {
    darkMode: false,
    notifications: true,
    gradeSystem: 'decimi',
    weekStartsOn: 1,
    pomodoroFocus: 25,
    pomodoroBreak: 5,
    language: 'it',
    onboardingComplete: true,
  },
  studyStreak: 5,
  lastStudyDate: '2026-07-13',
}

const shots = [
  { page: 'dashboard', file: '01-dashboard.png' },
  { page: 'orario', file: '02-orario.png' },
  { page: 'voti', file: '03-voti.png' },
  { page: 'compiti', file: '04-compiti.png' },
  { page: 'statistiche', file: '05-statistiche.png' },
]

function readPngSize(filePath) {
  const buffer = fs.readFileSync(filePath)
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
}

async function captureProfile(browser, profile) {
  const outDir = path.join(ROOT_DIR, 'store', 'screenshots', profile.id)
  fs.mkdirSync(outDir, { recursive: true })

  const context = await browser.newContext(profile.context)

  for (const shot of shots) {
    const page = await context.newPage()
    const state = { ...demoState, currentPage: shot.page }
    await page.addInitScript((data) => {
      localStorage.setItem('diario-scuola-plus', JSON.stringify({ state: data, version: 0 }))
    }, state)
    await page.goto(BASE_URL, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)

    const outPath = path.join(outDir, shot.file)
    const viewport = page.viewportSize()
    await page.screenshot({
      path: outPath,
      fullPage: false,
      clip: viewport
        ? { x: 0, y: 0, width: viewport.width, height: viewport.height }
        : undefined,
    })

    const size = readPngSize(outPath)
    const ok =
      size.width === profile.expected.width && size.height === profile.expected.height
    console.log(
      `${ok ? '✓' : '✗'} ${profile.label} → ${shot.file} (${size.width}×${size.height})`
    )
    if (!ok) {
      throw new Error(
        `Dimensioni errate per ${shot.file}: atteso ${profile.expected.width}×${profile.expected.height}, ottenuto ${size.width}×${size.height}`
      )
    }

    await page.close()
  }

  await context.close()
  console.log(`Done: ${outDir}`)
}

const browser = await chromium.launch()

try {
  for (const profile of DEVICE_PROFILES) {
    console.log(`\n=== ${profile.label} ===`)
    await captureProfile(browser, profile)
  }
} finally {
  await browser.close()
}
