// Per-app monetization settings (the rest of src/monetization/ is shared with
// the KONECHOCO guide apps).
export const monetizationConfig = {
  appName: 'Diario Scuola Plus',
  // Non-consumable "Remove ads" product. Must exist with this exact ID in
  // App Store Connect (In-App Purchases) and Google Play Console (One-time products).
  removeAdsProductId: 'com.diarioscuolaplus.app.removeads',
  // No App Tracking Transparency: ads are served non-personalized, so the App
  // Privacy answers can stay "no tracking" (avoids Guideline 5.1.2(i) issues).
  requestTracking: false,
}
