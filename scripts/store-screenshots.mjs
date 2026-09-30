// App Store screenshots in 16 languages from the web build (npm run build, then
// serve dist on :4180). Seeds localized demo data into localStorage.
// Usage: node scripts/store-screenshots.mjs [baseUrl] [outDir] [lang,lang...]
// Output: <outDir>/<device>/<lang>/<n>-<screen>.png
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const base = process.argv[2] || 'http://127.0.0.1:4180/'
const outDir = process.argv[3] || 'store/screenshots'
const PLATFORM = process.env.PLATFORM || 'ios'

const DEVICES = PLATFORM === 'android'
  ? {
      phone: { viewport: { width: 412, height: 824 }, deviceScaleFactor: 2.5, isMobile: true, hasTouch: true },
      tablet: { viewport: { width: 800, height: 1280 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    }
  : {
      iphone: { viewport: { width: 430, height: 932 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
      ipad: { viewport: { width: 1024, height: 1366 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    }

// Demo content per language: subjects, homework, exam, notes, goals, profile, grading scale.
const DEMO = {
  it: { scale: '10', pass: 6, name: 'Giulia', school: 'Liceo Galilei', cls: '4B', subj: ['Matematica', 'Italiano', 'Inglese', 'Storia', 'Scienze', 'Fisica'], hw: ['Esercizi pag. 45, n. 1–12', 'Tema: il Romanticismo', 'Reading comprehension unit 5'], exam: 'Verifica sul Rinascimento', card: ['Anno della scoperta dell\'America', '1492'] },
  en: { scale: 'letter', pass: 1, name: 'Emma', school: 'Lincoln High School', cls: '10B', subj: ['Math', 'English', 'Spanish', 'History', 'Biology', 'Physics'], hw: ['Worksheet p. 45, problems 1–12', 'Essay: The Great Gatsby', 'Spanish vocabulary unit 5'], exam: 'Test on the American Revolution', card: ['Year the Declaration of Independence was signed', '1776'] },
  fr: { scale: '20', pass: 10, name: 'Léa', school: 'Lycée Victor-Hugo', cls: '1re B', subj: ['Mathématiques', 'Français', 'Anglais', 'Histoire-géo', 'SVT', 'Physique-chimie'], hw: ['Exercices p. 45, n° 1 à 12', 'Dissertation sur Molière', 'Compréhension écrite unité 5'], exam: 'Contrôle sur la Révolution', card: ['Année de la prise de la Bastille', '1789'] },
  de: { scale: 'de6', pass: 4, name: 'Lena', school: 'Goethe-Gymnasium', cls: '9b', subj: ['Mathe', 'Deutsch', 'Englisch', 'Geschichte', 'Biologie', 'Physik'], hw: ['Aufgaben S. 45, Nr. 1–12', 'Erörterung zu Faust', 'Vokabeln Unit 5'], exam: 'Klassenarbeit Weimarer Republik', card: ['Jahr des Mauerfalls', '1989'] },
  es: { scale: '10', pass: 5, name: 'Lucía', school: 'IES Cervantes', cls: '3.º B', subj: ['Matemáticas', 'Lengua', 'Inglés', 'Historia', 'Biología', 'Física'], hw: ['Ejercicios pág. 45, 1–12', 'Comentario de texto: Machado', 'Reading unidad 5'], exam: 'Examen de la Reconquista', card: ['Año de la llegada a América', '1492'] },
  pt: { scale: '20', pass: 10, name: 'Inês', school: 'Escola Secundária Camões', cls: '10.º B', subj: ['Matemática', 'Português', 'Inglês', 'História', 'Biologia', 'Física'], hw: ['Exercícios pág. 45, 1–12', 'Texto de opinião sobre Os Lusíadas', 'Reading unit 5'], exam: 'Teste sobre os Descobrimentos', card: ['Ano da chegada à Índia', '1498'] },
  nl: { scale: '10', pass: 5.5, name: 'Emma', school: 'Erasmus College', cls: '3B', subj: ['Wiskunde', 'Nederlands', 'Engels', 'Geschiedenis', 'Biologie', 'Natuurkunde'], hw: ['Opgaven blz. 45, 1–12', 'Betoog schrijven', 'Engels woordjes unit 5'], exam: 'Toets Gouden Eeuw', card: ['Jaar van de Vrede van Münster', '1648'] },
  pl: { scale: '6', pass: 2, name: 'Zuzia', school: 'LO im. Kopernika', cls: '2B', subj: ['Matematyka', 'Język polski', 'Język angielski', 'Historia', 'Biologia', 'Fizyka'], hw: ['Zadania str. 45, 1–12', 'Rozprawka o „Lalce”', 'Słówka unit 5'], exam: 'Sprawdzian z II wojny światowej', card: ['Rok chrztu Polski', '966'] },
  ro: { scale: '10', pass: 5, name: 'Ioana', school: 'Colegiul Național Eminescu', cls: 'a X-a B', subj: ['Matematică', 'Limba română', 'Limba engleză', 'Istorie', 'Biologie', 'Fizică'], hw: ['Exerciții pag. 45, 1–12', 'Eseu despre Luceafărul', 'Reading unit 5'], exam: 'Test Marea Unire', card: ['Anul Marii Uniri', '1918'] },
  sv: { scale: 'se', pass: 10, name: 'Elsa', school: 'Nordiska gymnasiet', cls: '9B', subj: ['Matematik', 'Svenska', 'Engelska', 'Historia', 'Biologi', 'Fysik'], hw: ['Uppgifter s. 45, 1–12', 'Uppsats om Strindberg', 'Glosor unit 5'], exam: 'Prov om stormaktstiden', card: ['År då Gustav Vasa valdes till kung', '1523'] },
  ru: { scale: '5', pass: 3, name: 'Маша', school: 'Школа № 57', cls: '9Б', subj: ['Математика', 'Русский язык', 'Английский', 'История', 'Биология', 'Физика'], hw: ['Упражнения стр. 45, № 1–12', 'Сочинение по «Евгению Онегину»', 'Слова unit 5'], exam: 'Контрольная по истории XIX века', card: ['Год основания Санкт-Петербурга', '1703'] },
  uk: { scale: '12', pass: 4, name: 'Оля', school: 'Ліцей № 1', cls: '9-Б', subj: ['Математика', 'Українська мова', 'Англійська', 'Історія', 'Біологія', 'Фізика'], hw: ['Вправи с. 45, № 1–12', 'Твір за «Кобзарем»', 'Слова unit 5'], exam: 'Контрольна з історії України', card: ['Рік проголошення незалежності України', '1991'] },
  tr: { scale: '100', pass: 50, name: 'Elif', school: 'Atatürk Anadolu Lisesi', cls: '10-B', subj: ['Matematik', 'Edebiyat', 'İngilizce', 'Tarih', 'Biyoloji', 'Fizik'], hw: ['Sayfa 45, 1–12 arası sorular', 'Kompozisyon: Yunus Emre', 'Unit 5 kelimeleri'], exam: 'Kurtuluş Savaşı sınavı', card: ['Cumhuriyetin ilan yılı', '1923'] },
  ar: { scale: '100', pass: 60, name: 'سارة', school: 'مدرسة النور الثانوية', cls: 'الأول ب', subj: ['الرياضيات', 'اللغة العربية', 'اللغة الإنجليزية', 'التاريخ', 'الأحياء', 'الفيزياء'], hw: ['تمارين صفحة 45 من 1 إلى 12', 'موضوع تعبير عن القراءة', 'مفردات الوحدة 5'], exam: 'اختبار التاريخ الإسلامي', card: ['ما عاصمة مصر؟', 'القاهرة'] },
  zh: { scale: '100', pass: 60, name: '小明', school: '实验中学', cls: '高一（3）班', subj: ['数学', '语文', '英语', '历史', '生物', '物理'], hw: ['第45页练习 1–12 题', '作文：我的理想', '英语第五单元单词'], exam: '历史单元测验', card: ['唐朝建立于哪一年？', '618年'] },
  ja: { scale: '100', pass: 60, name: 'さくら', school: 'さくら高校', cls: '2年B組', subj: ['数学', '国語', '英語', '歴史', '生物', '物理'], hw: ['問題集 p.45 1〜12', '読書感想文', '英単語 Unit 5'], exam: '日本史の定期テスト', card: ['明治維新が始まった年は？', '1868年'] },
}

const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4']
const SCREENS = [
  ['1-home', 'dashboard', 0],
  ['2-grades', 'voti', 0],
  ['3-timetable', 'orario', 0],
  ['4-homework', 'compiti', 0],
  ['5-plan', 'piano', 0],
]

const iso = (days) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function state(lang, page) {
  const D = DEMO[lang]
  const subjects = D.subj.map((name, i) => ({ id: `s${i + 1}`, name, color: COLORS[i], coefficient: 1 }))
  // Grades on a 1–10 base: the app converts them to the language's scale.
  const g = (id, s, v, days, type = 'scritto') => ({ id, subjectId: `s${s}`, value: v, maxValue: 10, scale: '10', type, date: iso(-days), weight: 1 })
  const today = new Date().getDay() || 1
  const slot = (id, s, day, start, end, room, week) => ({ id, subjectId: `s${s}`, day, startTime: start, endTime: end, room, week })
  const days = [1, 2, 3, 4, 5]
  const timetable = []
  const plan = [[1, 2, 3, 4], [2, 5, 1, 6], [3, 1, 4, 2], [6, 2, 5, 3], [4, 3, 1, 5]]
  days.forEach((d, di) => plan[di].forEach((s, k) => {
    const h = 8 + k
    timetable.push(slot(`t${d}${k}`, s, d, `${String(h).padStart(2, '0')}:00`, `${String(h + 1).padStart(2, '0')}:00`, String(10 + s), undefined))
  }))
  return {
    state: {
      currentPage: page,
      activeProfileId: 'default',
      profiles: [{ id: 'default', name: D.name, school: D.school, className: D.cls, level: 'superiore', avatar: '🎓' }],
      subjects,
      teachers: [],
      timetable: timetable.map(t => (t.day === today ? t : t)),
      homework: [
        { id: 'h1', subjectId: 's1', title: D.hw[0], dueDate: iso(1), completed: false, priority: 'alta', createdAt: new Date().toISOString() },
        { id: 'h2', subjectId: 's2', title: D.hw[1], dueDate: iso(3), completed: false, priority: 'media', createdAt: new Date().toISOString() },
        { id: 'h3', subjectId: 's3', title: D.hw[2], dueDate: iso(4), completed: false, priority: 'bassa', createdAt: new Date().toISOString() },
        { id: 'h4', subjectId: 's5', title: D.hw[0].replace(/45/, '38'), dueDate: iso(-1), completed: true, priority: 'media', createdAt: new Date().toISOString() },
      ],
      exams: [
        { id: 'e1', subjectId: 's4', title: D.exam, date: iso(6), type: 'scritto', studied: false },
        { id: 'e2', subjectId: 's1', title: D.subj[0], date: iso(11), type: 'scritto', studied: false },
      ],
      grades: [
        g('g1', 1, 7.5, 30), g('g2', 1, 8, 16, 'orale'), g('g3', 1, 6.5, 5),
        g('g4', 2, 8.5, 25), g('g5', 2, 9, 9, 'orale'),
        g('g6', 3, 7, 20), g('g7', 3, 8, 6),
        g('g8', 4, 6, 18, 'orale'), g('g9', 4, 7.5, 3),
        g('g10', 5, 9, 12), g('g11', 6, 6.5, 8),
      ],
      absences: [],
      notes: [],
      recordings: [],
      flashcards: [{ id: 'f1', subjectId: 's4', front: D.card[0], back: D.card[1], difficulty: 0, reviewCount: 0 }],
      goals: [{ id: 'go1', title: `${D.subj[3]}`, targetMinutes: 60, completedMinutes: 35, date: iso(0), completed: false }],
      events: [],
      pomodoroSessions: [0, 1, 2, 3, 4, 5, 6].flatMap(i => Array.from({ length: (i * 3) % 5 + 1 }, (_, k) => ({ id: `p${i}${k}`, duration: 25, type: 'focus', date: new Date(Date.now() - i * 864e5).toISOString() }))),
      settings: {
        darkMode: false, notifications: false, gradeScale: D.scale, passMark: D.pass, weekStartsOn: 1, saturday: false,
        rotation: false, rotationAnchor: iso(0), periods: [], pomodoroFocus: 25, pomodoroBreak: 5, language: lang, onboardingComplete: true,
      },
      studyStreak: 12,
      lastStudyDate: iso(0),
    },
    version: 2,
  }
}

const only = process.argv[4] ? process.argv[4].split(',') : Object.keys(DEMO)
const browser = await chromium.launch({ channel: 'chrome' })
for (const [device, options] of Object.entries(DEVICES)) {
  for (const lang of only) {
    const dir = `${outDir}/${device}/${lang}`
    await mkdir(dir, { recursive: true })
    const context = await browser.newContext({ ...options, locale: lang, colorScheme: 'light', serviceWorkers: 'block' })
    const page = await context.newPage()
    for (const [name, pageId, scroll] of SCREENS) {
      await page.goto(base)
      await page.evaluate((s) => localStorage.setItem('diario-scuola-plus', JSON.stringify(s)), state(lang, pageId))
      await page.goto(base, { waitUntil: 'networkidle' })
      await page.waitForTimeout(1500) // fonts + fade-in
      if (scroll) await page.evaluate((y) => document.querySelector('main')?.scrollTo(0, y), scroll)
      await page.screenshot({ path: `${dir}/${name}.png` })
    }
    await context.close()
    console.log(device, lang, 'ok')
  }
}
await browser.close()
