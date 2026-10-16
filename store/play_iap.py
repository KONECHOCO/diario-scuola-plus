"""Google Play one-time product "remove ads" for Diario Scuola Plus: 2,99 EUR base
price converted by Google for every region, title in the 16 app languages (the
in-app 'ads_buy' string), purchase option "buy" activated.

Usage: python store/play_iap.py <service-account.json>"""
import json, re, sys, time, pathlib
import jwt, requests

PKG = 'com.diarioscuolaplus.app'
PRODUCT = 'com.diarioscuolaplus.app.removeads'
OPTION = 'buy'
BASE_PRICE = {'currencyCode': 'EUR', 'units': '2', 'nanos': 990000000}
A = f'https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{PKG}'
I18N = pathlib.Path(__file__).resolve().parent.parent / 'src' / 'i18n'
PLAY_LANGS = {
    'it': ['it-IT'], 'en': ['en-US', 'en-GB'], 'fr': ['fr-FR'], 'de': ['de-DE'], 'es': ['es-ES', 'es-419'],
    'pt': ['pt-PT', 'pt-BR'], 'nl': ['nl-NL'], 'pl': ['pl-PL'], 'ro': ['ro'], 'sv': ['sv-SE'], 'ru': ['ru-RU'],
    'uk': ['uk'], 'tr': ['tr-TR'], 'ar': ['ar'], 'zh': ['zh-CN'], 'ja': ['ja-JP'],
}


def token(key):
    sa = json.load(open(key))
    now = int(time.time())
    a = jwt.encode({'iss': sa['client_email'], 'scope': 'https://www.googleapis.com/auth/androidpublisher',
                    'aud': 'https://oauth2.googleapis.com/token', 'iat': now, 'exp': now + 3600}, sa['private_key'], algorithm='RS256')
    return requests.post('https://oauth2.googleapis.com/token', data={'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer', 'assertion': a}).json()['access_token']


def i18n(lang, key):
    m = re.search(rf"^\s*{key}:\s*(['\"])(.*?)\1,?\s*$", (I18N / f'{lang}.ts').read_text(encoding='utf-8'), re.M)
    return m.group(2).replace("\\'", "'")


def main():
    H = {'Authorization': 'Bearer ' + token(sys.argv[1])}
    conv = requests.post(f'{A}/pricing:convertRegionPrices', headers=H, json={'price': BASE_PRICE}).json()
    regions = [{'regionCode': r['regionCode'], 'price': BASE_PRICE if r['regionCode'] == 'IT' else r['price'], 'availability': 'AVAILABLE'}
               for r in conv.get('convertedRegionPrices', {}).values()]
    listings = []
    for lang, codes in PLAY_LANGS.items():
        title = i18n(lang, 'ads_buy')
        listings += [{'languageCode': c, 'title': title[:55], 'description': f"{title} — {i18n(lang, 'ads_owned')}"[:200]} for c in codes]
    product = {'packageName': PKG, 'productId': PRODUCT, 'listings': listings, 'purchaseOptions': [{
        'purchaseOptionId': OPTION, 'buyOption': {'legacyCompatible': True, 'multiQuantityEnabled': False},
        'regionalPricingAndAvailabilityConfigs': regions}]}
    q = {'allowMissing': 'true', 'regionsVersion.version': conv.get('regionVersion', {}).get('version', '2022/02'),
         'updateMask': 'listings,purchaseOptions'}
    r = requests.patch(f'{A}/onetimeproducts/{PRODUCT}', headers=H, params=q, json=product)
    print('product', r.status_code, r.text[:300] if not r.ok else f"{len(listings)} listings, {len(regions)} regions")
    r.raise_for_status()
    s = requests.post(f'{A}/oneTimeProducts/{PRODUCT}/purchaseOptions:batchUpdateStates', headers=H, json={'requests': [
        {'activatePurchaseOptionRequest': {'packageName': PKG, 'productId': PRODUCT, 'purchaseOptionId': OPTION}}]})
    print('activate', s.status_code, s.text[:300] if not s.ok else 'ok')


if __name__ == '__main__':
    main()
