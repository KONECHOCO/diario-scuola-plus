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

echo "Info.plist aggiornato."
