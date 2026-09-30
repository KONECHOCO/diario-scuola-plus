#!/usr/bin/env bash
# Eseguito su Codemagic (Mac) dopo "npx cap add ios"
set -euo pipefail

PLIST="ios/App/App/Info.plist"
if [ ! -f "$PLIST" ]; then
  echo "Info.plist non trovato: $PLIST"
  exit 1
fi

set_key() { # set_key <key> <type> <value>
  /usr/libexec/PlistBuddy -c "Print :$1" "$PLIST" >/dev/null 2>&1 \
    && /usr/libexec/PlistBuddy -c "Set :$1 $3" "$PLIST" \
    || /usr/libexec/PlistBuddy -c "Add :$1 $2 $3" "$PLIST"
}

# English base texts; every language has its own lproj/InfoPlist.strings (scripts/localize-ios.rb).
set_key NSMicrophoneUsageDescription string "'The microphone is used to record your classes.'"
set_key NSCameraUsageDescription string "'The camera is used to take photos of the board and books to attach to homework and notes.'"
set_key NSPhotoLibraryUsageDescription string "'Photos you pick are attached to homework and notes and stay on your device.'"
set_key ITSAppUsesNonExemptEncryption bool false
set_key CFBundleDevelopmentRegion string en

# AdMob: GADApplicationIdentifier
GAD_ID="${DIARIO_ADMOB_APP_ID:-ca-app-pub-3940256099942544~1458002511}"
set_key GADApplicationIdentifier string "$GAD_ID"

# SKAdNetwork ids (Google + Unity)
/usr/libexec/PlistBuddy -c "Print :SKAdNetworkItems" "$PLIST" >/dev/null 2>&1 || \
/usr/libexec/PlistBuddy -c "Add :SKAdNetworkItems array" "$PLIST"

add_sk() {
  /usr/libexec/PlistBuddy -c "Add :SKAdNetworkItems:0 dict" "$PLIST" 2>/dev/null || true
  /usr/libexec/PlistBuddy -c "Add :SKAdNetworkItems:0:SKAdNetworkIdentifier string $1" "$PLIST" 2>/dev/null || true
}
add_sk "cstr6suwn9.skadnetwork"
add_sk "4fzdc2evr5.skadnetwork"
add_sk "2fnua5tdw4.skadnetwork"
add_sk "ydx93a7ass.skadnetwork"
add_sk "4dzt52r2t5.skadnetwork"
add_sk "bvpn9ufa9b.skadnetwork"

echo "Info.plist aggiornato (AdMob, permessi, lingue)."
