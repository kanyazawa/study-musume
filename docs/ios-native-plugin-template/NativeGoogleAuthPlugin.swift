import Foundation
import Capacitor

@objc(NativeGoogleAuthPlugin)
public class NativeGoogleAuthPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NativeGoogleAuthPlugin"
    public let jsName = "NativeGoogleAuth"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "signIn", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restorePreviousSignIn", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "signOut", returnType: CAPPluginReturnPromise)
    ]

    private let implementation = NativeGoogleAuth()

    @objc func signIn(_ call: CAPPluginCall) {
        guard let viewController = bridge?.viewController else {
            call.reject("No presenting view controller available.")
            return
        }

        implementation.signIn(presentingViewController: viewController) { result in
            switch result {
            case .success(let payload):
                call.resolve(payload)
            case .failure(let error):
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc func restorePreviousSignIn(_ call: CAPPluginCall) {
        implementation.restorePreviousSignIn { result in
            switch result {
            case .success(let payload):
                call.resolve(payload)
            case .failure(let error):
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc func signOut(_ call: CAPPluginCall) {
        implementation.signOut()
        call.resolve(["success": true])
    }
}
