import type { CalendarEvent, Exam, Homework, Subject } from '../types'

// iCalendar (RFC 5545) export: phone calendars import the .ics file from the
// share sheet. All-day entries unless an exam has a time.

interface IcsItem {
  uid: string
  title: string
  date: string
  time?: string
  description?: string
}

export function buildIcs(
  items: { homework: Homework[]; exams: Exam[]; events: CalendarEvent[]; subjects: Subject[] },
  labels: { hw: string; exam: string },
  today: string,
): { ics: string; count: number } {
  const subject = (id?: string) => items.subjects.find(s => s.id === id)?.name
  const list: IcsItem[] = [
    ...items.homework
      .filter(h => !h.completed && h.dueDate >= today)
      .map(h => ({ uid: `hw-${h.id}`, title: `${labels.hw}: ${h.title}${subject(h.subjectId) ? ` (${subject(h.subjectId)})` : ''}`, date: h.dueDate, description: h.description })),
    ...items.exams
      .filter(e => e.date >= today)
      .map(e => ({ uid: `ex-${e.id}`, title: `${labels.exam}: ${e.title}${subject(e.subjectId) ? ` (${subject(e.subjectId)})` : ''}`, date: e.date, time: e.time, description: e.notes })),
    ...items.events
      .filter(e => e.date >= today)
      .map(e => ({ uid: `ev-${e.id}`, title: e.title, date: e.date, description: e.description })),
  ]

  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Diario Scuola Plus//EN', 'CALSCALE:GREGORIAN']
  for (const item of list) {
    const day = item.date.replace(/-/g, '')
    lines.push('BEGIN:VEVENT', `UID:${item.uid}@diarioscuolaplus.app`, `DTSTAMP:${stamp}`)
    if (item.time) {
      const t = item.time.replace(':', '') + '00'
      lines.push(`DTSTART:${day}T${t}`, 'DURATION:PT1H')
    } else {
      lines.push(`DTSTART;VALUE=DATE:${day}`, `DTEND;VALUE=DATE:${nextDay(item.date)}`)
    }
    lines.push(fold(`SUMMARY:${escape(item.title)}`))
    if (item.description) lines.push(fold(`DESCRIPTION:${escape(item.description)}`))
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return { ics: lines.join('\r\n') + '\r\n', count: list.length }
}

function nextDay(date: string) {
  const [y, m, d] = date.split('-').map(Number)
  const next = new Date(y, m - 1, d + 1)
  return `${next.getFullYear()}${String(next.getMonth() + 1).padStart(2, '0')}${String(next.getDate()).padStart(2, '0')}`
}

function escape(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

// Lines longer than 75 octets must be folded.
function fold(line: string) {
  const out: string[] = []
  let rest = line
  while (new TextEncoder().encode(rest).length > 73) {
    let cut = 73
    while (new TextEncoder().encode(rest.slice(0, cut)).length > 73) cut--
    out.push(rest.slice(0, cut))
    rest = ' ' + rest.slice(cut)
  }
  out.push(rest)
  return out.join('\r\n')
}
