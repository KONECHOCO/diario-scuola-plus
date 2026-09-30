import {
  LayoutDashboard, Calendar, BookOpen, ClipboardList, GraduationCap,
  Clock, Users, UserX, StickyNote, Mic, Timer, Layers, Target,
  BarChart3, Route, Settings, BookMarked,
} from 'lucide-react'
import type { Key } from '../i18n/core'
import type { PageId } from '../types'

export type Section = 'sec_main' | 'sec_manage' | 'sec_study' | 'sec_system'

export const NAV_ITEMS: { id: PageId; icon: (size: number) => React.ReactNode; section: Section }[] = [
  { id: 'dashboard', icon: s => <LayoutDashboard size={s} />, section: 'sec_main' },
  { id: 'orario', icon: s => <Clock size={s} />, section: 'sec_main' },
  { id: 'compiti', icon: s => <ClipboardList size={s} />, section: 'sec_main' },
  { id: 'esami', icon: s => <BookOpen size={s} />, section: 'sec_main' },
  { id: 'voti', icon: s => <GraduationCap size={s} />, section: 'sec_main' },
  { id: 'calendario', icon: s => <Calendar size={s} />, section: 'sec_main' },
  { id: 'materie', icon: s => <BookMarked size={s} />, section: 'sec_manage' },
  { id: 'insegnanti', icon: s => <Users size={s} />, section: 'sec_manage' },
  { id: 'assenze', icon: s => <UserX size={s} />, section: 'sec_manage' },
  { id: 'note', icon: s => <StickyNote size={s} />, section: 'sec_study' },
  { id: 'lezioni', icon: s => <Mic size={s} />, section: 'sec_study' },
  { id: 'piano', icon: s => <Route size={s} />, section: 'sec_study' },
  { id: 'pomodoro', icon: s => <Timer size={s} />, section: 'sec_study' },
  { id: 'flashcards', icon: s => <Layers size={s} />, section: 'sec_study' },
  { id: 'obiettivi', icon: s => <Target size={s} />, section: 'sec_study' },
  { id: 'statistiche', icon: s => <BarChart3 size={s} />, section: 'sec_study' },
  { id: 'impostazioni', icon: s => <Settings size={s} />, section: 'sec_system' },
]

export const navKey = (id: PageId) => `nav_${id}` as Key

/** Bottom tab bar on phones; everything else lives in the "More" sheet. */
export const TAB_IDS: PageId[] = ['dashboard', 'compiti', 'orario', 'voti']
