import UIKit
import Capacitor
import WebKit

/// Always read the web app that was just copied into this build.
class LumaBridgeViewController: CAPBridgeViewController {
    override func instanceDescriptor() -> InstanceDescriptor {
        let descriptor = super.instanceDescriptor()
        if let bundled = Bundle.main.resourceURL?.appendingPathComponent("public") {
            descriptor.appLocation = bundled
        }
        return descriptor
    }
}

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?
    private var didShowApp = false

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.backgroundColor = UIColor(red: 0.961, green: 0.957, blue: 0.933, alpha: 1)
        window?.makeKeyAndVisible()

        // Drop the saved page before the new files load.
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
        window?.rootViewController = LumaBridgeViewController()
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
