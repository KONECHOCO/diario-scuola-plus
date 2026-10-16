"""Put a Diario Scuola Plus build on the closed testing track (alpha) with release
notes in the 16 app languages. The release is saved; sending it for review is
done from Play Console's publishing overview.

Usage: python store/play_closed_test.py <service-account.json> <versionCode>"""
import json, sys, time
import jwt, requests

PKG = 'com.diarioscuolaplus.app'
B = f'https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{PKG}'
NOTES = {
    'it-IT': 'Diario Scuola Plus 2.0: 16 lingue, scale di voto di tutto il mondo, orario a settimane A/B, foto dei compiti, flashcard con ripetizione dilazionata e piani di studio fino all\'esame.',
    'en-US': 'School Diary Plus 2.0: 16 languages, grading scales from around the world, A/B week timetables, homework photos, spaced-repetition flashcards and study plans up to exam day.',
    'fr-FR': 'Agenda Scolaire Plus 2.0 : 16 langues, barèmes de notes du monde entier, semaines A/B, photos des devoirs, fiches à répétition espacée et plans de révision.',
    'de-DE': 'Version 2.0: 16 Sprachen, Notensysteme aus aller Welt, A/B-Wochen im Stundenplan, Fotos zu Hausaufgaben, Karteikarten mit Wiederholung und Lernpläne bis zur Prüfung.',
    'es-ES': 'Versión 2.0: 16 idiomas, escalas de notas de todo el mundo, horario de semanas A/B, fotos de los deberes, tarjetas con repetición espaciada y planes de estudio.',
    'pt-PT': 'Versão 2.0: 16 idiomas, escalas de notas de todo o mundo, horário de semanas A/B, fotos dos trabalhos, flashcards com repetição espaçada e planos de estudo.',
    'nl-NL': 'Versie 2.0: 16 talen, cijferschalen van over de hele wereld, A/B-weken in het rooster, foto\'s bij huiswerk, flashcards met herhaling en studieplannen.',
    'pl-PL': 'Wersja 2.0: 16 języków, skale ocen z całego świata, plan lekcji A/B, zdjęcia zadań, fiszki z powtórkami i plany nauki do egzaminu.',
    'ro': 'Versiunea 2.0: 16 limbi, scale de notare din toată lumea, orar pe săptămâni A/B, poze la teme, fișe cu repetiție spațiată și planuri de studiu.',
    'sv-SE': 'Version 2.0: 16 språk, betygsskalor från hela världen, A/B-veckor i schemat, foton till läxor, flashcards med repetition och studieplaner.',
    'ru-RU': 'Версия 2.0: 16 языков, системы оценок разных стран, расписание по неделям A/B, фото домашних заданий, карточки с интервальным повторением и планы подготовки.',
    'uk': 'Версія 2.0: 16 мов, системи оцінювання різних країн, розклад за тижнями A/B, фото домашніх завдань, картки з інтервальним повторенням і плани підготовки.',
    'tr-TR': 'Sürüm 2.0: 16 dil, dünyanın dört bir yanından not sistemleri, A/B haftalı ders programı, ödev fotoğrafları, aralıklı tekrar kartları ve çalışma planları.',
    'ar': 'الإصدار 2.0: 16 لغة، أنظمة درجات من حول العالم، جدول بأسابيع A/B، صور للواجبات، بطاقات مراجعة متباعدة وخطط مذاكرة حتى يوم الاختبار.',
    'zh-CN': '2.0 版：16 种语言、全球各地的评分制度、A/B 周课程表、作业照片、间隔重复记忆卡和考前学习计划。',
    'ja-JP': 'バージョン2.0：16言語、世界各国の成績スケール、A/B週の時間割、宿題の写真、間隔反復フラッシュカード、試験までの学習プラン。',
}


def token(key):
    sa = json.load(open(key))
    now = int(time.time())
    a = jwt.encode({'iss': sa['client_email'], 'scope': 'https://www.googleapis.com/auth/androidpublisher',
                    'aud': 'https://oauth2.googleapis.com/token', 'iat': now, 'exp': now + 3600}, sa['private_key'], algorithm='RS256')
    return requests.post('https://oauth2.googleapis.com/token', data={'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer', 'assertion': a}).json()['access_token']


def main():
    H = {'Authorization': 'Bearer ' + token(sys.argv[1])}
    vc = sys.argv[2]
    assert all(len(t) <= 500 for t in NOTES.values())
    e = requests.post(f'{B}/edits', headers=H).json()['id']
    body = {'track': 'alpha', 'releases': [{'name': f'2.0 ({vc})', 'versionCodes': [vc], 'status': 'completed',
                                            'releaseNotes': [{'language': k, 'text': v} for k, v in NOTES.items()]}]}
    r = requests.put(f'{B}/edits/{e}/tracks/alpha', headers=H, json=body)
    print('alpha', r.status_code, r.text[:300] if not r.ok else 'ok')
    r.raise_for_status()
    r = requests.post(f'{B}/edits/{e}:commit?changesNotSentForReview=true', headers=H)
    print('commit', r.status_code, r.text[:300])


if __name__ == '__main__':
    main()
