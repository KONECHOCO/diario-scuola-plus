#!/usr/bin/env bash
# Eseguito su Codemagic (Mac) dopo "npx cap add ios"
set -euo pipefail

PLIST="ios/App/App/Info.plist"
if [ ! -f "$PLIST" ]; then
  echo "Info.plist non trovato: $PLIST"
  exit 1
fi

MSG="Diario Scuola Plus usa il microfono per registrare le tue lezioni audio."

/usr/libexec/PlistBuddy -c "Print :NSMicrophoneUsageDescription" "$PLIST" 2>/dev/null \
  && /usr/libexec/PlistBuddy -c "Set :NSMicrophoneUsageDescription '$MSG'" "$PLIST" \
  || /usr/libexec/PlistBuddy -c "Add :NSMicrophoneUsageDescription string '$MSG'" "$PLIST"

/usr/libexec/PlistBuddy -c "Print :ITSAppUsesNonExemptEncryption" "$PLIST" 2>/dev/null \
  && /usr/libexec/PlistBuddy -c "Set :ITSAppUsesNonExemptEncryption false" "$PLIST" \
  || /usr/libexec/PlistBuddy -c "Add :ITSAppUsesNonExemptEncryption bool false" "$PLIST"

# AdMob: GADApplicationIdentifier
GAD_ID="${DIARIO_ADMOB_APP_ID:-ca-app-pub-3940256099942544~1458002511}"
/usr/libexec/PlistBuddy -c "Print :GADApplicationIdentifier" "$PLIST" 2>/dev/null \
  && /usr/libexec/PlistBuddy -c "Set :GADApplicationIdentifier $GAD_ID" "$PLIST" \
  || /usr/libexec/PlistBuddy -c "Add :GADApplicationIdentifier string $GAD_ID" "$PLIST"

# AdMob: SKAdNetworkItems (richiesto da iOS per privacy)
/usr/libexec/PlistBuddy -c "Print :SKAdNetworkItems" "$PLIST" 2>/dev/null || \
/usr/libexec/PlistBuddy -c "Add :SKAdNetworkItems array" "$PLIST"

add_sk() {
  /usr/libexec/PlistBuddy -c "Add :SKAdNetworkItems:0 dict" "$PLIST" 2>/dev/null || true
  /usr/libexec/PlistBuddy -c "Add :SKAdNetworkItems:0:SKAdNetworkIdentifier string $1" "$PLIST" 2>/dev/null || true
}
add_sk "cstr6suwn9.skadnetwork"
add_sk "4fzdc2evr5.skadnetwork"
add_sk "2fnua5tdw4.skadnetwork"
add_sk "ydx93a7ass.skadnetwork"

echo "Info.plist aggiornato (AdMob incluso)."
