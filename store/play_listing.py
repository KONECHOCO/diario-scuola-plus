"""Google Play store listing for Diario Scuola Plus (16 languages): texts from
store/metadata.json, phone/tablet screenshots from store/screenshots-android,
icon store/play-icon-512.png, feature graphics store/feature-graphic (scripts/play-feature-graphic.mjs).

Usage: python store/play_listing.py <service-account.json> [--apply]
Without --apply it only prints what is on Play now. With --apply the edit is
committed with changesNotSentForReview where Play allows it (the app is a draft)."""
import json, sys, time, pathlib
import jwt, requests

PKG = 'com.diarioscuolaplus.app'
B = f'https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{PKG}'
UP = f'https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/{PKG}'
ROOT = pathlib.Path(__file__).resolve().parent
SHOTS = ROOT / 'screenshots-android'

# metadata.json key -> (Play language codes, screenshot folder)
LOCALES = {
    'it': (['it-IT'], 'it'), 'en-US': (['en-US', 'en-GB'], 'en'), 'fr-FR': (['fr-FR'], 'fr'),
    'de-DE': (['de-DE'], 'de'), 'es-ES': (['es-ES', 'es-419'], 'es'), 'pt-PT': (['pt-PT', 'pt-BR'], 'pt'),
    'nl-NL': (['nl-NL'], 'nl'), 'pl': (['pl-PL'], 'pl'), 'ro': (['ro'], 'ro'), 'sv': (['sv-SE'], 'sv'),
    'ru': (['ru-RU'], 'ru'), 'uk': (['uk'], 'uk'), 'tr': (['tr-TR'], 'tr'), 'ar-SA': (['ar'], 'ar'),
    'zh-Hans': (['zh-CN'], 'zh'), 'ja': (['ja-JP'], 'ja'),
}

# Short description, max 80 characters.
SHORT = {
    'it': 'Orario, compiti, voti e media, verifiche e piani di studio. Senza account.',
    'en-US': 'Timetable, homework, grades & GPA, exams and study plans. No account needed.',
    'fr-FR': 'Emploi du temps, devoirs, notes et moyenne, contrôles et révisions. Sans compte.',
    'de-DE': 'Stundenplan, Hausaufgaben, Noten, Klassenarbeiten und Lernpläne. Ohne Konto.',
    'es-ES': 'Horario, deberes, notas y media, exámenes y planes de estudio. Sin cuenta.',
    'pt-PT': 'Horário, trabalhos de casa, notas e média, testes e planos de estudo. Sem conta.',
    'nl-NL': 'Rooster, huiswerk, cijfers, gemiddelde, toetsen en studieplannen. Geen account.',
    'pl': 'Plan lekcji, zadania domowe, oceny i średnia, sprawdziany i plany nauki.',
    'ro': 'Orar, teme, note și medie, teste și planuri de studiu. Fără cont.',
    'sv': 'Schema, läxor, betyg och snitt, prov och studieplaner. Inget konto behövs.',
    'ru': 'Расписание, домашние задания, оценки и средний балл, контрольные и учёба.',
    'uk': 'Розклад, домашні завдання, оцінки та середній бал, контрольні й навчання.',
    'tr': 'Ders programı, ödevler, notlar ve ortalama, sınavlar ve çalışma planları.',
    'ar-SA': 'الجدول الدراسي والواجبات والدرجات والمعدل والاختبارات وخطط المذاكرة.',
    'zh-Hans': '课程表、作业、成绩与平均分、考试和学习计划。无需账号。',
    'ja': '時間割、宿題、成績と平均、テスト、学習プラン。アカウント不要。',
}


def token(key):
    sa = json.load(open(key))
    now = int(time.time())
    a = jwt.encode({'iss': sa['client_email'], 'scope': 'https://www.googleapis.com/auth/androidpublisher',
                    'aud': 'https://oauth2.googleapis.com/token', 'iat': now, 'exp': now + 3600}, sa['private_key'], algorithm='RS256')
    return requests.post('https://oauth2.googleapis.com/token', data={'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer', 'assertion': a}).json()['access_token']


def main():
    key, apply = sys.argv[1], '--apply' in sys.argv
    meta = json.loads((ROOT / 'metadata.json').read_text(encoding='utf-8'))
    too_long = [mk for mk in LOCALES if len(meta[mk]['name']) > 30 or len(SHORT[mk]) > 80 or len(meta[mk]['description']) > 4000]
    assert not too_long, too_long
    H ={'Authorization': 'Bearer ' + token(key)}
    e = requests.post(f'{B}/edits', headers=H).json()['id']
    current = {l['language']: l for l in requests.get(f'{B}/edits/{e}/listings', headers=H).json().get('listings', [])}
    for lang, l in current.items():
        imgs = {t: len(requests.get(f'{B}/edits/{e}/listings/{lang}/{t}', headers=H).json().get('images', []))
                for t in ('icon', 'featureGraphic', 'phoneScreenshots', 'sevenInchScreenshots', 'tenInchScreenshots')}
        print('now', lang, repr(l.get('title')), imgs)
    if not apply:
        requests.delete(f'{B}/edits/{e}', headers=H)
        return
    for mk, (langs, folder) in LOCALES.items():
        m = meta[mk]
        for lang in langs:
            body = {'language': lang, 'title': m['name'], 'shortDescription': SHORT[mk], 'fullDescription': m['description']}
            r = requests.put(f'{B}/edits/{e}/listings/{lang}', headers=H, json=body)
            print('listing', lang, r.status_code, r.text[:120] if not r.ok else '')
            for kind, device in (('phoneScreenshots', 'phone'), ('sevenInchScreenshots', 'tablet'), ('tenInchScreenshots', 'tablet')):
                requests.delete(f'{B}/edits/{e}/listings/{lang}/{kind}', headers=H)
                for png in sorted((SHOTS / device / folder).glob('*.png')):
                    u = requests.post(f'{UP}/edits/{e}/listings/{lang}/{kind}?uploadType=media',
                                      headers={**H, 'Content-Type': 'image/png'}, data=png.read_bytes())
                    if not u.ok:
                        print('  shot', kind, png.name, u.status_code, u.text[:150])
            for kind, png in (('icon', ROOT / 'play-icon-512.png'), ('featureGraphic', ROOT / 'feature-graphic' / f'{folder}.png')):
                requests.delete(f'{B}/edits/{e}/listings/{lang}/{kind}', headers=H)
                u = requests.post(f'{UP}/edits/{e}/listings/{lang}/{kind}?uploadType=media',
                                  headers={**H, 'Content-Type': 'image/png'}, data=png.read_bytes())
                if not u.ok:
                    print('  ', kind, u.status_code, u.text[:150])
    # Never sends anything for review: if Play requires that, the edit is left uncommitted.
    r = requests.post(f'{B}/edits/{e}:commit?changesNotSentForReview=true', headers=H)
    print('commit', r.status_code, r.text[:300])


if __name__ == '__main__':
    main()
