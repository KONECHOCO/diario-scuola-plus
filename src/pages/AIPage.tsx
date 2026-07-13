import { useState, useRef } from 'react'
import { useDiaryStore } from '../store/useDiaryStore'
import { Sparkles, Send, BookOpen, Brain, List, FileText } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const QUICK_ACTIONS = [
  { icon: <FileText size={16} />, label: 'Riassunto', prompt: 'Crea un riassunto strutturato di questo argomento: ' },
  { icon: <Brain size={16} />, label: 'Mappa concettuale', prompt: 'Crea una mappa concettuale testuale per: ' },
  { icon: <List size={16} />, label: 'Flashcard', prompt: 'Genera 5 flashcard (domanda/risposta) su: ' },
  { icon: <BookOpen size={16} />, label: 'Piano di studio', prompt: 'Crea un piano di studio di 7 giorni per preparare: ' },
]

function generateResponse(input: string, subjects: string[]): string {
  const lower = input.toLowerCase()

  if (lower.includes('riassunto') || lower.includes('summary')) {
    const topic = input.replace(/riassunto|summary|di|su|per/gi, '').trim()
    return `## Riassunto: ${topic || 'Argomento'}\n\n**Concetti chiave:**\n1. Definizione e contesto storico\n2. Elementi principali da memorizzare\n3. Collegamenti con altre materie\n4. Esempi pratici\n5. Errori comuni da evitare\n\n**Suggerimento:** Crea flashcard per ogni concetto chiave e ripassale con la sezione Flashcards dell'app!`
  }

  if (lower.includes('mappa') || lower.includes('concettuale') || lower.includes('mind map')) {
    const topic = input.replace(/mappa|concettuale|mind map|di|su|per/gi, '').trim()
    return `## Mappa Concettuale: ${topic || 'Argomento'}\n\n\`\`\`\n📌 ${topic || 'Tema centrale'}\n├── 🔹 Sotto-tema 1\n│   ├── Dettaglio A\n│   └── Dettaglio B\n├── 🔹 Sotto-tema 2\n│   ├── Dettaglio C\n│   └── Dettaglio D\n└── 🔹 Sotto-tema 3\n    ├── Dettaglio E\n    └── Dettaglio F\n\`\`\`\n\n**Prossimo passo:** Trasforma ogni ramo in una flashcard!`
  }

  if (lower.includes('flashcard') || lower.includes('domande')) {
    const topic = input.replace(/flashcard|domande|genera|su|di|per/gi, '').trim()
    return `## Flashcard generate: ${topic || 'Argomento'}\n\n**Card 1**\n❓ Cos'è ${topic || 'il concetto principale'}?\n✅ [Inserisci la definizione corretta]\n\n**Card 2**\n❓ Quali sono le caratteristiche principali?\n✅ [Elenca le 3-5 caratteristiche]\n\n**Card 3**\n❓ Come si applica nella pratica?\n✅ [Fornisci un esempio concreto]\n\n**Card 4**\n❓ Quali errori evitare?\n✅ [Lista gli errori comuni]\n\n**Card 5**\n❓ Collegamenti con altre materie?\n✅ [Indica le connessioni]\n\n💡 Vai nella sezione Flashcards per salvarle!`
  }

  if (lower.includes('piano') || lower.includes('studio') || lower.includes('preparare')) {
    return `## Piano di Studio (7 giorni)\n\n**Giorno 1-2:** Lettura e comprensione\n- Leggi tutto il materiale\n- Evidenzia concetti chiave\n- Crea note nella sezione Note\n\n**Giorno 3-4:** Approfondimento\n- Crea flashcard\n- Usa il Pomodoro (4 sessioni/giorno)\n- Risolvi esercizi pratici\n\n**Giorno 5:** Ripasso attivo\n- Ripassa flashcard\n- Spiega i concetti ad alta voce\n- Registra una lezione audio\n\n**Giorno 6:** Simulazione\n- Fai una verifica simulata\n- Identifica lacune\n- Ripassa punti deboli\n\n**Giorno 7:** Ripasso finale\n- Ripasso veloce di tutto\n- Riposa bene la sera prima\n\n📊 Traccia i progressi nella sezione Obiettivi!`
  }

  if (lower.includes('media') || lower.includes('voto')) {
    return `Per calcolare la tua media, vai nella sezione **Voti** dove l'app calcola automaticamente:\n- Media per ogni materia (con pesi personalizzati)\n- Media generale\n- Andamento nel tempo\n\nLe tue materie attuali: ${subjects.join(', ') || 'nessuna ancora'}\n\n💡 Inserisci tutti i voti (scritti e orali separati) per statistiche accurate!`
  }

  if (lower.includes('ciao') || lower.includes('salve') || lower.includes('help') || lower.includes('aiuto')) {
    return `Ciao! 👋 Sono il tuo assistente di studio integrato in Diario Scuola Plus.\n\nPosso aiutarti con:\n- 📝 **Riassunti** strutturati\n- 🧠 **Mappe concettuali** testuali\n- 🃏 **Flashcard** da memorizzare\n- 📅 **Piani di studio** personalizzati\n- 📊 Consigli su **voti e medie**\n\nUsa i pulsanti rapidi qui sotto o scrivi la tua domanda!`
  }

  return `Ho analizzato la tua richiesta su "${input.slice(0, 50)}${input.length > 50 ? '...' : ''}".\n\n**Suggerimenti di studio:**\n1. Dividi l'argomento in sotto-temi gestibili\n2. Usa la tecnica Pomodoro (25 min focus + 5 min pausa)\n3. Crea flashcard per ogni concetto importante\n4. Ripassa dopo 1, 3 e 7 giorni (ripetizione dilazionata)\n5. Registra i punti chiave con le note vocali\n\n**Azioni rapide nell'app:**\n- Sezione **Flashcards** → memorizza concetti\n- Sezione **Pomodoro** → sessioni di focus\n- Sezione **Obiettivi** → traccia progressi giornalieri\n\nVuoi che generi un riassunto, una mappa concettuale o un piano di studio? Scrivi "riassunto di [argomento]" o usa i pulsanti rapidi!`
}

export function AIPage() {
  const { subjects } = useDiaryStore()
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: generateResponse('aiuto', subjects.map(s => s.name)) },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const send = async (text: string) => {
    if (!text.trim()) return
    const userMsg: Message = { role: 'user', content: text }
    setMessages(m => [...m, userMsg])
    setInput('')
    setLoading(true)

    await new Promise(r => setTimeout(r, 600 + Math.random() * 400))

    const response = generateResponse(text, subjects.map(s => s.name))
    setMessages(m => [...m, { role: 'assistant', content: response }])
    setLoading(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  return (
    <div className="max-w-3xl flex flex-col h-[calc(100vh-8rem)]">
      <div className="card mb-4 bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-900/20 dark:to-blue-900/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center text-white">
            <Sparkles size={20} />
          </div>
          <div>
            <p className="font-semibold text-sm">Assistente AI di Studio</p>
            <p className="text-xs text-gray-500">Assistente di studio locale · Nessun dato inviato online</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {QUICK_ACTIONS.map(action => (
          <button
            key={action.label}
            onClick={() => setInput(action.prompt)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 transition-colors"
          >
            {action.icon} {action.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
              msg.role === 'user'
                ? 'bg-primary-600 text-white rounded-br-sm'
                : 'bg-gray-100 dark:bg-gray-800 rounded-bl-sm'
            }`}>
              <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 text-sm rounded-bl-sm">
              <span className="animate-pulse">Sto elaborando...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <input
          className="input flex-1"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
          placeholder="Chiedi un riassunto, piano di studio, flashcard..."
        />
        <button onClick={() => send(input)} disabled={loading || !input.trim()} className="btn-primary px-4">
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
