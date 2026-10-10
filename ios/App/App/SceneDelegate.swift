import UIKit
import Capacitor
import WebKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?
    private var didShowApp = false

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.backgroundColor = UIColor(red: 0.961, green: 0.957, blue: 0.933, alpha: 1)
        window?.makeKeyAndVisible()

        // The phone keeps the previous screen in the web view. Clear that before
        // the new files load, and leave check-ins and habits in local storage.
        let stale: Set<String> = [
            WKWebsiteDataTypeDiskCache,
            WKWebsiteDataTypeMemoryCache,
            WKWebsiteDataTypeOfflineWebApplicationCache,
            WKWebsiteDataTypeFetchCache,
            WKWebsiteDataTypeServiceWorkerRegistrations
        ]
        WKWebsiteDataStore.default().removeData(ofTypes: stale, modifiedSince: Date(timeIntervalSince1970: 0)) {
            DispatchQueue.main.async { self.showApp() }
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { self.showApp() }

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    private func showApp() {
        guard !didShowApp else { return }
        didShowApp = true
        window?.rootViewController = CAPBridgeViewController()
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
