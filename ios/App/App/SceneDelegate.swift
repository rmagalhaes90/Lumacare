import UIKit
import Capacitor
import WebKit

/// Always read the web app that was just copied into this build.
class LumaBridgeViewController: CAPBridgeViewController {
    override func webView(with frame: CGRect, configuration: WKWebViewConfiguration) -> WKWebView {
        let source = """
        (function () {
          var marker = "lumacare-build-5-purged";
          if (sessionStorage.getItem(marker)) return;
          sessionStorage.setItem(marker, "1");
          var jobs = [];
          if (navigator.serviceWorker) {
            jobs.push(navigator.serviceWorker.getRegistrations().then(function (regs) {
              return Promise.all(regs.map(function (reg) { return reg.unregister(); }));
            }));
          }
          if (window.caches) {
            jobs.push(caches.keys().then(function (keys) {
              return Promise.all(keys.map(function (key) { return caches.delete(key); }));
            }));
          }
          Promise.all(jobs).then(function () {
            if (document.documentElement.innerHTML.indexOf("Name the weather, then move") !== -1) {
              location.reload();
            }
          });
        })();
        """
        configuration.userContentController.addUserScript(
            WKUserScript(source: source, injectionTime: .atDocumentEnd, forMainFrameOnly: true)
        )
        return super.webView(with: frame, configuration: configuration)
    }

    override func instanceDescriptor() -> InstanceDescriptor {
        let descriptor = super.instanceDescriptor()
        if let bundled = Bundle.main.resourceURL?.appendingPathComponent("public") {
            descriptor.appLocation = bundled
            let freshStart = bundled.appendingPathComponent("index-build5.html")
            if FileManager.default.fileExists(atPath: freshStart.path) {
                descriptor.appStartPath = "index-build5.html"
            }
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

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)

        let revision = bundledWebRevision()
        NSLog("LumaCare build 5 web: %@", revision)
        if revision != "new" {
            showStaleWeb(revision)
            return
        }

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
    }

    private func showApp() {
        guard !didShowApp else { return }
        didShowApp = true
        window?.rootViewController = LumaBridgeViewController()
    }

    private func bundledWebRevision() -> String {
        guard let root = Bundle.main.resourceURL?.appendingPathComponent("public") else { return "missing" }
        let start = root.appendingPathComponent("index-build5.html")
        guard FileManager.default.fileExists(atPath: start.path) else { return "nostart" }
        guard let enumerator = FileManager.default.enumerator(at: root, includingPropertiesForKeys: nil) else {
            return "unreadable"
        }
        var sawOld = false
        var sawNew = false
        while let url = enumerator.nextObject() as? URL {
            guard url.pathExtension == "js" || url.pathExtension == "html" else { continue }
            guard let text = try? String(contentsOf: url, encoding: .utf8) else { continue }
            if text.contains("Name the weather, then move") { sawOld = true }
            if text.contains("What's the weather like?") { sawNew = true }
        }
        if sawNew && !sawOld { return "new" }
        if sawOld { return "old" }
        return "unknown"
    }

    private func showStaleWeb(_ revision: String) {
        didShowApp = true
        let controller = UIViewController()
        controller.view.backgroundColor = window?.backgroundColor
        let title = UILabel()
        title.text = "This install still has the previous Today page."
        title.font = .systemFont(ofSize: 28, weight: .semibold)
        title.textColor = UIColor(red: 0.118, green: 0.110, blue: 0.086, alpha: 1)
        title.numberOfLines = 0
        let detail = UILabel()
        detail.text = "Xcode is running the app on this iPhone, and the bundled page is \(revision). From the Lumacare folder, run npm run ios:mac, then press Run again."
        detail.font = .systemFont(ofSize: 17)
        detail.textColor = UIColor(red: 0.369, green: 0.349, blue: 0.310, alpha: 1)
        detail.numberOfLines = 0
        let stack = UIStackView(arrangedSubviews: [title, detail])
        stack.axis = .vertical
        stack.spacing = 16
        stack.translatesAutoresizingMaskIntoConstraints = false
        controller.view.addSubview(stack)
        NSLayoutConstraint.activate([
            stack.leadingAnchor.constraint(equalTo: controller.view.safeAreaLayoutGuide.leadingAnchor, constant: 24),
            stack.trailingAnchor.constraint(equalTo: controller.view.safeAreaLayoutGuide.trailingAnchor, constant: -24),
            stack.centerYAnchor.constraint(equalTo: controller.view.centerYAnchor)
        ])
        window?.rootViewController = controller
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
