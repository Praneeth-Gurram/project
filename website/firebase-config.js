/**
 * LogiSphere AI - Centralized Firebase Authentication Module
 * Manages Firebase App initialization, Google Auth Provider, and auth state listeners.
 */

(function () {
    const GOOGLE_CLIENT_ID = "933593436326-riinjqu4s0biscg5cqfublto7k9qab6k.apps.googleusercontent.com";

    const firebaseConfig = {
        apiKey: window.__FIREBASE_API_KEY__ || "AIzaSyDemoKeyLogiSphereEnterprise12345",
        authDomain: window.__FIREBASE_AUTH_DOMAIN__ || "logisphere-ai-demo.firebaseapp.com",
        projectId: window.__FIREBASE_PROJECT_ID__ || "logisphere-ai-demo",
        storageBucket: window.__FIREBASE_STORAGE_BUCKET__ || "logisphere-ai-demo.appspot.com",
        messagingSenderId: window.__FIREBASE_MESSAGING_SENDER_ID__ || "933593436326",
        appId: window.__FIREBASE_APP_ID__ || "1:933593436326:web:a1b2c3d4e5f6g7h8i9j0"
    };

    let app = null;
    let auth = null;
    let googleProvider = null;

    if (typeof firebase !== 'undefined') {
        try {
            if (!firebase.apps || !firebase.apps.length) {
                app = firebase.initializeApp(firebaseConfig);
            } else {
                app = firebase.app();
            }
            auth = firebase.auth();
            googleProvider = new firebase.auth.GoogleAuthProvider();
            googleProvider.addScope('profile');
            googleProvider.addScope('email');
            googleProvider.setCustomParameters({
                client_id: GOOGLE_CLIENT_ID,
                prompt: 'select_account'
            });
        } catch (err) {
            console.warn("Firebase initialization notice:", err);
        }
    }

    window.LogiSphereFirebase = {
        app: app,
        auth: auth,
        googleProvider: googleProvider,
        config: firebaseConfig,
        clientId: GOOGLE_CLIENT_ID,
        signInWithGoogle: async function () {
            if (!auth) {
                throw { code: "auth/not-initialized", message: "Firebase Auth is not initialized." };
            }
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('profile');
            provider.addScope('email');
            provider.setCustomParameters({
                client_id: GOOGLE_CLIENT_ID,
                prompt: 'select_account'
            });
            return await auth.signInWithPopup(provider);
        },
        onAuthStateChanged: function (callback) {
            if (auth && typeof auth.onAuthStateChanged === 'function') {
                return auth.onAuthStateChanged(callback);
            }
            return () => {};
        }
    };
})();
