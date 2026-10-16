// Google Play feature graphics (1024x500) in 16 languages: app name, subtitle
// from store/metadata.json and the Android home screenshot.
// Usage: node scripts/play-feature-graphic.mjs  →  store/feature-graphic/<lang>.png
import { mkdir, readFile } from 'node:fs/promises'
import { chromium } from 'playwright'

const META_KEYS = { it: 'it', en: 'en-US', fr: 'fr-FR', de: 'de-DE', es: 'es-ES', pt: 'pt-PT', nl: 'nl-NL', pl: 'pl', ro: 'ro', sv: 'sv', ru: 'ru', uk: 'uk', tr: 'tr', ar: 'ar-SA', zh: 'zh-Hans', ja: 'ja' }
const meta = JSON.parse(await readFile('store/metadata.json', 'utf8'))
const icon = (await readFile('store/play-icon-512.png')).toString('base64')
await mkdir('store/feature-graphic', { recursive: true })

const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1024, height: 500 } })
for (const [lang, key] of Object.entries(META_KEYS)) {
  const m = meta[key]
  const shot = (await readFile(`store/screenshots-android/phone/${lang}/1-home.png`)).toString('base64')
  const rtl = lang === 'ar'
  await page.setContent(`<!doctype html><html lang="${lang}" dir="${rtl ? 'rtl' : 'ltr'}"><body style="margin:0">
  <div style="width:1024px;height:500px;overflow:hidden;position:relative;background:linear-gradient(135deg,#1d4ed8 0%,#2563eb 45%,#7c3aed 100%);font-family:'Segoe UI','Microsoft YaHei','Yu Gothic UI',Tahoma,sans-serif;color:#fff">
    <div style="position:absolute;top:0;bottom:0;${rtl ? 'right' : 'left'}:64px;width:560px;display:flex;flex-direction:column;justify-content:center;gap:22px">
      <img src="data:image/png;base64,${icon}" style="width:112px;height:112px;border-radius:26px;box-shadow:0 12px 30px rgba(0,0,0,.25)">
      <div style="font-size:56px;font-weight:800;line-height:1.05">${m.name}</div>
      <div style="font-size:28px;font-weight:500;opacity:.92;line-height:1.25">${m.subtitle}</div>
    </div>
    <img src="data:image/png;base64,${shot}" style="position:absolute;top:56px;${rtl ? 'left' : 'right'}:72px;width:250px;border-radius:28px;border:8px solid #0f172a;box-shadow:0 20px 50px rgba(0,0,0,.35)">
  </div></body></html>`)
  await page.screenshot({ path: `store/feature-graphic/${lang}.png`, clip: { x: 0, y: 0, width: 1024, height: 500 } })
  console.log(lang, 'ok')
}
await browser.close()
