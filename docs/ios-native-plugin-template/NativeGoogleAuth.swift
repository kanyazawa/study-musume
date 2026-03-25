import Foundation
import UIKit
import GoogleSignIn

public final class NativeGoogleAuth: NSObject {
    public func signIn(presentingViewController: UIViewController, completion: @escaping (Result<[String: Any], Error>) -> Void) {
        guard let clientID = Bundle.main.object(forInfoDictionaryKey: "GIDClientID") as? String else {
            completion(.failure(NativeGoogleAuthError.missingClientID))
            return
        }

        let configuration = GIDConfiguration(clientID: clientID)
        GIDSignIn.sharedInstance.configuration = configuration

        GIDSignIn.sharedInstance.signIn(withPresenting: presentingViewController) { result, error in
            if let error {
                completion(.failure(error))
                return
            }

            guard let user = result?.user,
                  let idToken = user.idToken?.tokenString else {
                completion(.failure(NativeGoogleAuthError.missingTokens))
                return
            }

            completion(.success(self.serialize(user: user, idToken: idToken)))
        }
    }

    public func restorePreviousSignIn(completion: @escaping (Result<[String: Any], Error>) -> Void) {
        GIDSignIn.sharedInstance.restorePreviousSignIn { user, error in
            if let error {
                completion(.failure(error))
                return
            }

            guard let user,
                  let idToken = user.idToken?.tokenString else {
                completion(.success(["success": false, "noSession": true]))
                return
            }

            completion(.success(self.serialize(user: user, idToken: idToken, success: true)))
        }
    }

    public func signOut() {
        GIDSignIn.sharedInstance.signOut()
    }

    private func serialize(user: GIDGoogleUser, idToken: String, success: Bool = true) -> [String: Any] {
        [
            "success": success,
            "idToken": idToken,
            "accessToken": user.accessToken.tokenString,
            "profile": [
                "email": user.profile?.email ?? "",
                "displayName": user.profile?.name ?? "",
                "photoURL": user.profile?.imageURL(withDimension: 256)?.absoluteString ?? ""
            ]
        ]
    }
}

enum NativeGoogleAuthError: Error {
    case missingClientID
    case missingTokens
}
