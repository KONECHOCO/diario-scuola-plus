import { readFile, writeFile } from 'node:fs/promises'

const path = 'node_modules/capacitor-unity-ads/ios/Sources/UnityadsPlugin/Unityads.swift'
let source = await readFile(path, 'utf8')
source = source.replace('private var rewardedVideoLoaded = false', 'var rewardedVideoLoaded = false')
source = source.replace('private var interstitialLoaded = false', 'var interstitialLoaded = false')
source = source.replace('private var isInitialized = false', 'var isInitialized = false')
source = source.replaceAll('if state == .completed {', 'if state == .showCompletionStateCompleted {')
source = source.replace('} errorHandler: { [weak self] error in', '} errorHandler: { [weak self] (error: Error) in')
source = source.replace('UnityAds.initialize(gameId, testMode: testMode) { [weak self] in\n            print("[UnityAds] Initialized successfully")\n            self?.isInitialized = true\n            callback(true, nil)\n        } errorHandler: { [weak self] (error: Error) in\n            print("[UnityAds] Initialization failed: \\(error.localizedDescription)")\n            callback(false, error.localizedDescription)\n        }', 'UnityAds.initialize(gameId, testMode: testMode, initializationDelegate: InitializationDelegate(callback: callback, parent: self))')
source = source.replace('UnityAds.show(UIApplication.shared.windows.first?.rootViewController, placementId: placementId, showDelegate: RewardedVideoShowDelegate(callback: callback, parent: self))', 'guard let viewController = UIApplication.shared.windows.first?.rootViewController else { callback(false, nil, "No root view controller") ; return }\n        UnityAds.show(viewController, placementId: placementId, showDelegate: RewardedVideoShowDelegate(callback: callback, parent: self))')
source = source.replace('UnityAds.show(UIApplication.shared.windows.first?.rootViewController, placementId: placementId, showDelegate: InterstitialShowDelegate(callback: callback, parent: self))', 'guard let viewController = UIApplication.shared.windows.first?.rootViewController else { callback(false, "No root view controller") ; return }\n        UnityAds.show(viewController, placementId: placementId, showDelegate: InterstitialShowDelegate(callback: callback, parent: self))')
source = source.replace('return UnityAds.getVersion() ?? "unknown"', 'return UnityAds.getVersion()')
source = source.replace('// MARK: - Load Delegates', '// MARK: - Initialization Delegate\n\nclass InitializationDelegate: NSObject, UnityAdsInitializationDelegate {\n    private let callback: Unityads.InitializationCallback\n    private weak var parent: Unityads?\n\n    init(callback: @escaping Unityads.InitializationCallback, parent: Unityads) {\n        self.callback = callback\n        self.parent = parent\n    }\n\n    func initializationComplete() {\n        print("[UnityAds] Initialized successfully")\n        parent?.isInitialized = true\n        callback(true, nil)\n    }\n\n    func initializationFailed(_ error: UnityAdsInitializationError, withMessage message: String) {\n        print("[UnityAds] Initialization failed: \\(message)")\n        callback(false, message)\n    }\n}\n\n// MARK: - Load Delegates')
source = source.replaceAll('func unityAdsShowComplete(_ placementId: String, withFinishState state:', 'func unityAdsShowComplete(_ placementId: String, withFinish state:')
source = source.replaceAll('func unityAdsAdFailedToLoad(_ placementId: String, withError error:', 'func unityAdsAdFailed(toLoad placementId: String, withError error:')
// The SDK doesn't retain the delegates passed to initialize/load/show: without
// a strong reference they get deallocated and the JS promise never settles.
if (!source.includes('func keep<')) {
  source = source.replace(
    'var interstitialLoaded = false',
    'var interstitialLoaded = false\n    private var keptDelegates = [NSObject]()\n    func keep<T: NSObject>(_ delegate: T) -> T { keptDelegates.append(delegate); return delegate }',
  )
  for (const name of ['InitializationDelegate', 'RewardedVideoLoadDelegate', 'InterstitialLoadDelegate', 'RewardedVideoShowDelegate', 'InterstitialShowDelegate']) {
    source = source.replaceAll(`Delegate: ${name}(callback: callback, parent: self)`, `Delegate: keep(${name}(callback: callback, parent: self))`)
  }
}
await writeFile(path, source)
console.log('Patched capacitor-unity-ads for current Swift SDK naming and access control.')
