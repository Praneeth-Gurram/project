const { useState, useEffect } = React;

const LogiSphereIcon = ({ name, color = "currentColor", size = 20, className = "" }) => {
    if (!name) return null;
    const norm = name.toLowerCase().trim();
    const svgPaths = {
        'user': '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
        'lock': '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
        'eye': '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
        'eye-off': '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>',
        'shield-check': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
        'arrow-right': '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
        'loader': '<line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>',
        'check-circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
        'alert-triangle': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y3="13"/><line x1="12" y1="17" x2="12.01" y3="17"/>',
        'activity': '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
        'cpu': '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>',
        'refresh-cw': '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
        'key': '<path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>'
    };
    const path = svgPaths[norm] || '<circle cx="12" cy="12" r="6"/>';
    return (
        <span 
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} 
            dangerouslySetInnerHTML={{ __html: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}">${path}</svg>` }} 
        />
    );
};

const GOOGLE_CLIENT_ID = "933593436326-riinjqu4s0biscg5cqfublto7k9qab6k.apps.googleusercontent.com";

const getApiBaseUrl = () => {
    if (typeof window !== 'undefined' && window.location && window.location.origin && !window.location.origin.startsWith('file:')) {
        return window.location.origin;
    }
    return 'http://localhost:8080';
};

const mapHttpError = (res, data, defaultMsg = "Authentication failed.") => {
    if (!res) return "Unable to connect to the authentication service.";
    if (res.status === 405) {
        return "Authentication service configuration error.";
    }
    if (res.status === 401) {
        return "Invalid email or password.";
    }
    if (res.status === 403) {
        return "Access denied.";
    }
    if (res.status === 404) {
        return "Authentication service not found.";
    }
    if (res.status === 409) {
        return "An account with this email already exists.";
    }
    if (res.status === 500) {
        return "Authentication service is temporarily unavailable.";
    }
    if (data && data.detail) {
        if (typeof data.detail === 'string') return data.detail;
        if (Array.isArray(data.detail) && data.detail.length > 0 && data.detail[0].msg) {
            return data.detail[0].msg;
        }
    }
    return defaultMsg;
};

const LogiSphereAuth = ({ onLoginSuccess, initialMode = 'login' }) => {
    const [authMode, setAuthMode] = useState(
        window.location.hash === '#register' || initialMode === 'register' ? 'register' : 'login'
    );
    
    // Login Fields
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);

    // Register Fields
    const [regName, setRegName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regCompany, setRegCompany] = useState('');
    const [regRole, setRegRole] = useState('Enterprise Supply Chain Manager');
    const [regPassword, setRegPassword] = useState('');
    const [regConfirmPassword, setRegConfirmPassword] = useState('');
    const [showRegPassword, setShowRegPassword] = useState(false);
    const [showRegConfirm, setShowRegConfirm] = useState(false);

    // General States: 'normal' | 'loading' | 'success' | 'error'
    const [status, setStatus] = useState('normal');
    const [errorMsg, setErrorMsg] = useState('');
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotSuccess, setForgotSuccess] = useState(false);

    // Sync hash with mode
    const switchMode = (mode) => {
        setAuthMode(mode);
        setErrorMsg('');
        setStatus('normal');
        window.location.hash = mode === 'register' ? '#register' : '#login';
    };

    // Listen for external hash changes
    useEffect(() => {
        const handleHash = () => {
            if (window.location.hash === '#register') {
                setAuthMode('register');
            } else if (window.location.hash === '#login') {
                setAuthMode('login');
            }
        };
        window.addEventListener('hashchange', handleHash);
        return () => window.removeEventListener('hashchange', handleHash);
    }, []);

    const [googleLoading, setGoogleLoading] = useState(false);

    const completeGoogleLogin = (profile) => {
        const userName = profile.name || "Google Workspace Leader";
        const userEmail = profile.email || "google.user@logisphere.ai";
        const userAvatar = profile.picture || `https://ui-avatars.com/api/?name=${userName.replace(' ', '+')}&background=38bdf8&color=fff`;

        const authenticatedUser = {
            name: userName,
            email: userEmail,
            role: "Enterprise Supply Chain Manager (Google SSO)",
            badge: "DIRECTOR",
            role_key: "director",
            avatar: userAvatar,
            sso: true,
            uid: profile.uid || `g_${Date.now()}`
        };

        const token = `LOGISPHERE-GOOGLE-${Date.now()}`;
        if (rememberMe) {
            localStorage.setItem('logisphere_auth_token', token);
            localStorage.setItem('logisphere_user', JSON.stringify(authenticatedUser));
        } else {
            sessionStorage.setItem('logisphere_auth_token', token);
            sessionStorage.setItem('logisphere_user', JSON.stringify(authenticatedUser));
        }

        setStatus('success');
        setGoogleLoading(false);
        setTimeout(() => {
            onLoginSuccess(authenticatedUser);
        }, 500);
    };

    const handleGoogleCredentialResponse = (response) => {
        if (!response || !response.credential) return;
        try {
            const base64Url = response.credential.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            const payload = JSON.parse(jsonPayload);
            completeGoogleLogin({
                name: payload.name || payload.given_name,
                email: payload.email,
                picture: payload.picture,
                uid: payload.sub
            });
        } catch (e) {
            console.error("GIS Credential parsing error:", e);
            setStatus('error');
            setGoogleLoading(false);
            setErrorMsg("Unable to sign in with Google.");
        }
    };

    // Initialize Google Identity Services OAuth
    useEffect(() => {
        if (window.google && window.google.accounts && window.google.accounts.id) {
            try {
                window.google.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: handleGoogleCredentialResponse,
                    auto_select: false,
                    cancel_on_tap_outside: true
                });
            } catch (err) {
                console.warn("GIS ID initialize note:", err);
            }
        }
    }, []);

    // Listen to Firebase Auth state
    useEffect(() => {
        if (window.LogiSphereFirebase && typeof window.LogiSphereFirebase.onAuthStateChanged === 'function') {
            const unsubscribe = window.LogiSphereFirebase.onAuthStateChanged((user) => {
                if (user) {
                    console.log("[Firebase Auth] Active user detected:", user.email);
                }
            });
            return () => unsubscribe();
        }
    }, []);

    const handleGoogleSignIn = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        setErrorMsg('');
        setGoogleLoading(true);
        setStatus('loading');

        // 1. Preferred: Google Identity Services (GIS) OAuth 2.0 Token Client with User Client ID
        if (window.google && window.google.accounts && window.google.accounts.oauth2) {
            try {
                const tokenClient = window.google.accounts.oauth2.initTokenClient({
                    client_id: GOOGLE_CLIENT_ID,
                    scope: 'email profile openid',
                    callback: async (tokenResponse) => {
                        if (tokenResponse && tokenResponse.access_token) {
                            try {
                                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                                });
                                if (userInfoRes.ok) {
                                    const profile = await userInfoRes.json();
                                    completeGoogleLogin({
                                        name: profile.name || profile.given_name || "Google Workspace Leader",
                                        email: profile.email,
                                        picture: profile.picture,
                                        uid: profile.sub
                                    });
                                    return;
                                }
                            } catch (fetchErr) {
                                console.warn("UserInfo fetch note:", fetchErr);
                            }
                        }
                        
                        if (tokenResponse && tokenResponse.error) {
                            setGoogleLoading(false);
                            setStatus('error');
                            if (tokenResponse.error === 'access_denied') {
                                setErrorMsg("Google sign-in was cancelled.");
                            } else if (tokenResponse.error === 'popup_blocked_by_browser') {
                                setErrorMsg("Please allow popups for Google sign-in.");
                            } else {
                                setErrorMsg("Google sign-in was cancelled.");
                            }
                            return;
                        }
                    },
                    error_callback: (error) => {
                        console.warn("GIS Token Client notice:", error);
                        setGoogleLoading(false);
                        setStatus('error');
                        if (error && error.type === 'popup_closed') {
                            setErrorMsg("Google sign-in was cancelled.");
                        } else if (error && error.type === 'popup_failed_to_open') {
                            setErrorMsg("Please allow popups for Google sign-in.");
                        } else {
                            setErrorMsg("Google sign-in was cancelled.");
                        }
                    }
                });

                tokenClient.requestAccessToken({ prompt: 'select_account' });
                return;
            } catch (gisErr) {
                console.warn("GIS TokenClient error, trying Firebase fallback:", gisErr);
            }
        }

        // 2. Secondary: Firebase Authentication signInWithPopup
        if (typeof firebase !== 'undefined' && firebase.auth) {
            try {
                const provider = new firebase.auth.GoogleAuthProvider();
                provider.addScope('profile');
                provider.addScope('email');
                provider.setCustomParameters({
                    client_id: GOOGLE_CLIENT_ID,
                    prompt: 'select_account'
                });
                const result = await firebase.auth().signInWithPopup(provider);
                if (result && result.user) {
                    completeGoogleLogin({
                        name: result.user.displayName,
                        email: result.user.email,
                        picture: result.user.photoURL,
                        uid: result.user.uid
                    });
                    return;
                }
            } catch (fbErr) {
                console.error("[Firebase Google Auth Error]", fbErr);
                setGoogleLoading(false);
                setStatus('error');
                const code = fbErr ? fbErr.code || fbErr.message : '';
                if (code === 'auth/popup-closed-by-user') {
                    setErrorMsg("Google sign-in was cancelled.");
                } else if (code === 'auth/popup-blocked') {
                    setErrorMsg("Please allow popups for Google sign-in.");
                } else if (code === 'auth/account-exists-with-different-credential') {
                    setErrorMsg("An account already exists with a different sign-in method.");
                } else if (code === 'auth/network-request-failed' || (typeof code === 'string' && code.includes('network'))) {
                    setErrorMsg("Unable to connect to the authentication service.");
                } else if (code === 'auth/unauthorized-domain') {
                    setErrorMsg("This development domain is not authorized in Firebase Console.");
                } else {
                    setErrorMsg("Google sign-in was cancelled.");
                }
                return;
            }
        }

        // 3. Fallback: Prompt via GIS
        if (window.google && window.google.accounts && window.google.accounts.id) {
            try {
                window.google.accounts.id.prompt();
                return;
            } catch (promptErr) {
                console.warn("GIS prompt error:", promptErr);
            }
        }

        setGoogleLoading(false);
        setStatus('error');
        setErrorMsg("Unable to connect to the authentication service.");
    };

    const [demoRoleLoading, setDemoRoleLoading] = useState(null); // 'admin' | 'director' | 'operator' | null

    const handleDemoLogin = async (roleKey) => {
        setErrorMsg('');
        setDemoRoleLoading(roleKey);
        setStatus('loading');

        const roleName = roleKey === 'admin' ? 'Admin' : roleKey === 'director' ? 'Director' : 'Operator';

        try {
            const baseUrl = getApiBaseUrl();
            const apiUrl = `${baseUrl}/api/auth/demo`;
            let res;
            try {
                res = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({ role: roleKey })
                });
            } catch (err1) {
                // Fallback to localhost:8080 if origin differed
                res = await fetch('http://localhost:8080/api/auth/demo', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({ role: roleKey })
                });
            }

            let data = {};
            try {
                data = await res.json();
            } catch (jsonErr) {
                data = {};
            }

            if (!res.ok) {
                setDemoRoleLoading(null);
                setStatus('error');
                if (res.status === 403) {
                    setErrorMsg("Demo account is not configured or disabled in this environment.");
                } else if (res.status === 404 || res.status === 405) {
                    setErrorMsg("Authentication endpoint is configured incorrectly.");
                } else if (res.status === 500) {
                    setErrorMsg("Authentication service unavailable.");
                } else {
                    setErrorMsg(data.detail || `Unable to sign in as ${roleName}.`);
                }
                return;
            }

            const token = data.token || `LOGISPHERE-DEMO-${roleKey.toUpperCase()}-${Date.now()}`;
            const user = data.user;

            localStorage.setItem('logisphere_auth_token', token);
            localStorage.setItem('logisphere_user', JSON.stringify(user));

            setStatus('success');
            setTimeout(() => {
                onLoginSuccess(user);
            }, 500);
        } catch (err) {
            console.error("Demo login error:", err);
            setDemoRoleLoading(null);
            setStatus('error');
            setErrorMsg("Unable to connect to authentication service.");
        }
    };

    const handleLoginSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        setErrorMsg('');

        const cleanEmail = loginEmail.trim();
        const cleanPass = loginPassword.trim();

        if (!cleanEmail) {
            setStatus('error');
            setErrorMsg("Please enter your email address.");
            return;
        }
        if (!cleanPass) {
            setStatus('error');
            setErrorMsg("Please enter your password.");
            return;
        }

        setStatus('loading');

        try {
            const baseUrl = getApiBaseUrl();
            const apiUrl = `${baseUrl}/api/auth/login`;
            const res = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ email: cleanEmail, password: cleanPass, remember_me: rememberMe })
            });

            let data = {};
            try {
                data = await res.json();
            } catch (jsonErr) {
                data = {};
            }

            if (!res.ok) {
                setStatus('error');
                setErrorMsg(mapHttpError(res, data, "Invalid email or password. Please check your credentials."));
                return;
            }

            const token = data.token || `LOGISPHERE-${Date.now()}`;
            const user = data.user || {
                name: cleanEmail.split("@")[0].replace(".", " ").title || "Enterprise Analyst",
                email: cleanEmail,
                role: "Enterprise Supply Chain Analyst",
                avatar: `https://ui-avatars.com/api/?name=${cleanEmail.split("@")[0]}&background=0284c7&color=fff`
            };

            if (rememberMe) {
                localStorage.setItem('logisphere_auth_token', token);
                localStorage.setItem('logisphere_user', JSON.stringify(user));
            } else {
                sessionStorage.setItem('logisphere_auth_token', token);
                sessionStorage.setItem('logisphere_user', JSON.stringify(user));
            }

            setStatus('success');
            setTimeout(() => {
                onLoginSuccess(user);
            }, 500);

        } catch (err) {
            console.error("Login submission error:", err);
            setStatus('error');
            setErrorMsg("Unable to connect to the authentication service.");
        }
    };

    const handleRegisterSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        setErrorMsg('');

        const cleanName = regName.trim();
        const cleanEmail = regEmail.trim().toLowerCase();
        const cleanPass = regPassword.trim();
        const cleanConfirm = regConfirmPassword.trim();

        // 1. Validation checks
        if (!cleanName) {
            setStatus('error');
            setErrorMsg("Please enter your full name.");
            return;
        }
        if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
            setStatus('error');
            setErrorMsg("Please enter a valid email address.");
            return;
        }
        if (!cleanPass) {
            setStatus('error');
            setErrorMsg("Please enter a password.");
            return;
        }
        if (cleanPass.length < 6) {
            setStatus('error');
            setErrorMsg("Password must be at least 6 characters in length.");
            return;
        }
        if (cleanPass !== cleanConfirm) {
            setStatus('error');
            setErrorMsg("Passwords do not match. Please re-enter your password confirmation.");
            return;
        }

        setStatus('loading');

        try {
            const baseUrl = getApiBaseUrl();
            const apiUrl = `${baseUrl}/api/auth/register`;
            const res = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    name: cleanName,
                    email: cleanEmail,
                    company: regCompany.trim(),
                    role: regRole,
                    password: cleanPass,
                    confirm_password: cleanConfirm
                })
            });

            let data = {};
            try {
                data = await res.json();
            } catch (jsonErr) {
                data = {};
            }

            if (!res.ok) {
                setStatus('error');
                setErrorMsg(mapHttpError(res, data, "Unable to create your account. Please try again."));
                return;
            }

            const token = data.token || `LOGISPHERE-${Date.now()}`;
            const user = data.user || {
                name: cleanName,
                email: cleanEmail,
                company: regCompany.trim() || "Enterprise Workspace",
                role: regRole,
                avatar: `https://ui-avatars.com/api/?name=${cleanName.replace(' ', '+')}&background=0284c7&color=fff`
            };

            localStorage.setItem('logisphere_auth_token', token);
            localStorage.setItem('logisphere_user', JSON.stringify(user));

            setStatus('success');
            setTimeout(() => {
                onLoginSuccess(user);
            }, 600);

        } catch (err) {
            console.error("Registration error:", err);
            setStatus('error');
            setErrorMsg("Unable to connect to the authentication service.");
        }
    };

    const handleForgotReset = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!forgotEmail.trim()) return;
        
        try {
            const baseUrl = getApiBaseUrl();
            await fetch(`${baseUrl}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ email: forgotEmail.trim() })
            });
        } catch (err) {
            console.warn("Forgot password endpoint notice:", err);
        }
        
        setForgotSuccess(true);
        setTimeout(() => {
            setShowForgotModal(false);
            setForgotSuccess(false);
            setForgotEmail('');
        }, 3000);
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden"
             style={{ background: 'linear-gradient(135deg, #07090e 0%, #0d131f 50%, #080d16 100%)' }}>
            
            {/* Ambient Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[140px] pointer-events-none"></div>

            {/* Main Container Card */}
            <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-xl bg-slate-950/40 relative z-10">
                
                {/* ==================================================== */}
                {/* LEFT SIDE: BRANDING, VALUE PROPOSITION, AI NETWORK   */}
                {/* ==================================================== */}
                <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10 bg-gradient-to-br from-slate-900/60 via-slate-950/80 to-slate-900/40 relative">
                    
                    {/* Header: Logo & Branding */}
                    <div>
                        <div className="flex items-center gap-3.5 mb-2">
                            <svg width="34" height="34" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 10px rgba(102, 252, 241, 0.5))', flexShrink: 0 }}>
                                <circle cx="16" cy="16" r="14" stroke="url(#auth-logo-g1)" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.6"/>
                                <ellipse cx="16" cy="16" rx="13" ry="5.5" transform="rotate(-25 16 16)" stroke="url(#auth-logo-g2)" strokeWidth="1.6"/>
                                <ellipse cx="16" cy="16" rx="13" ry="5.5" transform="rotate(35 16 16)" stroke="url(#auth-logo-g1)" strokeWidth="1.2" opacity="0.75"/>
                                <circle cx="16" cy="16" r="3.2" fill="url(#auth-logo-core)"/>
                                <circle cx="16" cy="16" r="5.5" stroke="#66fcf1" strokeWidth="0.8" opacity="0.5"/>
                                <circle cx="5" cy="11" r="1.8" fill="#66fcf1"/>
                                <circle cx="27" cy="21" r="1.8" fill="#66fcf1"/>
                                <circle cx="9" cy="23" r="1.5" fill="#45a29e"/>
                                <circle cx="23" cy="9" r="1.5" fill="#45a29e"/>
                                <defs>
                                    <linearGradient id="auth-logo-g1" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#66fcf1"/>
                                        <stop offset="1" stopColor="#3b82f6"/>
                                    </linearGradient>
                                    <linearGradient id="auth-logo-g2" x1="0" y1="32" x2="32" y2="0" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#38bdf8"/>
                                        <stop offset="1" stopColor="#66fcf1"/>
                                    </linearGradient>
                                    <linearGradient id="auth-logo-core" x1="13" y1="13" x2="19" y2="19" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#66fcf1"/>
                                        <stop offset="1" stopColor="#0284c7"/>
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-white m-0">
                                    LogiSphere <span className="text-cyan-400">AI</span>
                                </h1>
                            </div>
                        </div>
                        <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-6">
                            Intelligent Supply Chain Intelligence
                        </p>

                        <div className="mb-6">
                            <h2 className="text-lg sm:text-xl font-semibold text-slate-100 leading-snug">
                                "Transform supply-chain data into intelligent operational decisions."
                            </h2>
                        </div>

                        {/* Three Concise Capability Highlights */}
                        <div className="space-y-4 my-6">
                            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-cyan-500/30 transition-all">
                                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0 mt-0.5">
                                    <LogiSphereIcon name="activity" size={16} />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-200 uppercase tracking-wider">Real-Time Visibility</div>
                                    <div className="text-xs text-slate-400 leading-relaxed mt-0.5">Monitor fleet activity, routes and operational risks.</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-blue-500/30 transition-all">
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0 mt-0.5">
                                    <LogiSphereIcon name="cpu" size={16} />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-200 uppercase tracking-wider">Prescriptive Intelligence</div>
                                    <div className="text-xs text-slate-400 leading-relaxed mt-0.5">Turn analytics into actionable recommendations.</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-emerald-500/30 transition-all">
                                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
                                    <LogiSphereIcon name="refresh-cw" size={16} />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-200 uppercase tracking-wider">Closed-Loop Decisions</div>
                                    <div className="text-xs text-slate-400 leading-relaxed mt-0.5">Measure outcomes and improve future decisions.</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Subtle Abstract Visual: Connected Network Paths */}
                    <div className="pt-4 mt-auto border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1.5 text-cyan-400/90 font-medium">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                            Neural Decision Engine Online
                        </span>
                        <span>1,000+ Active Corridors</span>
                    </div>
                </div>

                {/* ==================================================== */}
                {/* RIGHT SIDE: AUTHENTICATION CARD (LOGIN / REGISTER)   */}
                {/* ==================================================== */}
                <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-center bg-slate-900/80">
                    
                    {/* Mode Header */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-white tracking-tight">
                            {authMode === 'login' ? 'Welcome back' : 'Create your account'}
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-400 mt-1">
                            {authMode === 'login' 
                                ? 'Sign in to your LogiSphere AI workspace.' 
                                : 'Join your LogiSphere AI workspace.'}
                        </p>
                    </div>

                    {/* Feedback Alerts */}
                    {status === 'error' && errorMsg && (
                        <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                            <LogiSphereIcon name="alert-triangle" size={16} color="#f43f5e" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
                            <LogiSphereIcon name="check-circle" size={16} color="#10b981" />
                            <span>{authMode === 'login' ? 'Authentication verified. Redirecting to workspace...' : 'Account created successfully. Redirecting to workspace...'}</span>
                        </div>
                    )}

                    {/* ============================== */}
                    {/* FORM 1: LOGIN FORM             */}
                    {/* ============================== */}
                    {authMode === 'login' ? (
                        <form onSubmit={handleLoginSubmit} className="space-y-4">
                            
                            {/* Email Field */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                        <LogiSphereIcon name="user" size={16} />
                                    </div>
                                    <input
                                        type="email"
                                        value={loginEmail}
                                        onChange={(e) => setLoginEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        required
                                        className="w-full bg-slate-950/70 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                        <LogiSphereIcon name="lock" size={16} />
                                    </div>
                                    <input
                                        type={showLoginPassword ? "text" : "password"}
                                        value={loginPassword}
                                        onChange={(e) => setLoginPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        required
                                        className="w-full bg-slate-950/70 border border-white/10 rounded-xl pl-10 pr-11 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
                                        title={showLoginPassword ? "Hide password" : "Show password"}
                                    >
                                        <LogiSphereIcon name={showLoginPassword ? "eye-off" : "eye"} size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Remember Me & Forgot Password */}
                            <div className="flex items-center justify-between text-xs pt-1">
                                <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none">
                                    <input 
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="rounded bg-slate-950 border-white/20 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
                                    />
                                    <span>Remember me</span>
                                </label>
                                <button 
                                    type="button"
                                    onClick={() => setShowForgotModal(true)}
                                    className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                                >
                                    Forgot password?
                                </button>
                            </div>

                            {/* Sign In Button */}
                            <button
                                type="submit"
                                disabled={status === 'loading' || status === 'success'}
                                className={`w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 hover:from-cyan-500 hover:to-blue-500 shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all flex items-center justify-center gap-2 ${
                                    status === 'loading' || status === 'success' ? 'opacity-75 cursor-not-allowed' : ''
                                }`}
                            >
                                {status === 'loading' ? (
                                    <><LogiSphereIcon name="loader" size={16} className="animate-spin" /> Signing in...</>
                                ) : status === 'success' ? (
                                    <><LogiSphereIcon name="check-circle" size={16} /> Redirecting...</>
                                ) : (
                                    <>Sign In <LogiSphereIcon name="arrow-right" size={16} /></>
                                )}
                            </button>

                            {/* Divider */}
                            <div className="relative my-3.5 text-center">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                                <span className="relative bg-slate-900 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">or continue with</span>
                            </div>

                            {/* Google Sign-In Button */}
                            <button
                                type="button"
                                onClick={handleGoogleSignIn}
                                disabled={status === 'loading' || status === 'success' || googleLoading}
                                className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2.5 shadow-sm ${
                                    googleLoading ? 'opacity-80 cursor-not-allowed' : ''
                                }`}
                            >
                                {googleLoading ? (
                                    <><LogiSphereIcon name="loader" size={16} className="animate-spin text-cyan-400" /> Connecting to Google...</>
                                ) : (
                                    <>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                                        </svg>
                                        Continue with Google
                                    </>
                                )}
                            </button>

                            {/* Create Account Link Footer */}
                            <div className="pt-2 text-center text-xs text-slate-400">
                                Don't have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => switchMode('register')}
                                    className="text-cyan-400 hover:text-cyan-300 font-semibold underline transition-colors"
                                >
                                    Create an account
                                </button>
                            </div>

                            {/* Quick-Access Enterprise Demo Credentials */}
                            <div className="mt-3 pt-2.5 border-t border-white/5">
                                <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1.5 flex items-center justify-between">
                                    <span>Quick Workspace Demo Accounts</span>
                                    {demoRoleLoading && (
                                        <span className="text-cyan-400 font-normal normal-case">
                                            Signing in as {demoRoleLoading === 'admin' ? 'Admin' : demoRoleLoading === 'director' ? 'Director' : 'Operator'}...
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                                    <button
                                        type="button"
                                        disabled={status === 'loading' || status === 'success'}
                                        onClick={() => handleDemoLogin('admin')}
                                        className={`py-1 px-1.5 rounded-lg bg-white/[0.03] hover:bg-cyan-500/15 border border-white/5 hover:border-cyan-500/40 text-slate-200 hover:text-cyan-300 transition-all text-center flex items-center justify-center gap-1 font-medium ${
                                            demoRoleLoading === 'admin' ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300' : ''
                                        }`}
                                    >
                                        {demoRoleLoading === 'admin' ? (
                                            <><LogiSphereIcon name="loader" size={12} className="animate-spin" /> Admin...</>
                                        ) : (
                                            'Admin'
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={status === 'loading' || status === 'success'}
                                        onClick={() => handleDemoLogin('director')}
                                        className={`py-1 px-1.5 rounded-lg bg-white/[0.03] hover:bg-cyan-500/15 border border-white/5 hover:border-cyan-500/40 text-slate-200 hover:text-cyan-300 transition-all text-center flex items-center justify-center gap-1 font-medium ${
                                            demoRoleLoading === 'director' ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300' : ''
                                        }`}
                                    >
                                        {demoRoleLoading === 'director' ? (
                                            <><LogiSphereIcon name="loader" size={12} className="animate-spin" /> Director...</>
                                        ) : (
                                            'Director'
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={status === 'loading' || status === 'success'}
                                        onClick={() => handleDemoLogin('operator')}
                                        className={`py-1 px-1.5 rounded-lg bg-white/[0.03] hover:bg-cyan-500/15 border border-white/5 hover:border-cyan-500/40 text-slate-200 hover:text-cyan-300 transition-all text-center flex items-center justify-center gap-1 font-medium ${
                                            demoRoleLoading === 'operator' ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300' : ''
                                        }`}
                                    >
                                        {demoRoleLoading === 'operator' ? (
                                            <><LogiSphereIcon name="loader" size={12} className="animate-spin" /> Operator...</>
                                        ) : (
                                            'Operator'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    ) : (
                        /* ============================== */
                        /* FORM 2: REGISTRATION FORM      */
                        /* ============================== */
                        <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                            
                            {/* Full Name */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                        <LogiSphereIcon name="user" size={16} />
                                    </div>
                                    <input
                                        type="text"
                                        value={regName}
                                        onChange={(e) => setRegName(e.target.value)}
                                        placeholder="Enter your full name"
                                        required
                                        className="w-full bg-slate-950/70 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Email Address */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                        <span style={{ fontSize: '13px', color: '#94a3b8' }}>@</span>
                                    </div>
                                    <input
                                        type="email"
                                        value={regEmail}
                                        onChange={(e) => setRegEmail(e.target.value)}
                                        placeholder="Enter your enterprise email"
                                        required
                                        className="w-full bg-slate-950/70 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Two Column: Company & Role */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                                        Company <span className="text-slate-500 text-[10px] lowercase font-normal">(optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={regCompany}
                                        onChange={(e) => setRegCompany(e.target.value)}
                                        placeholder="Acme Global Logistics"
                                        className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                                        Role
                                    </label>
                                    <select
                                        value={regRole}
                                        onChange={(e) => setRegRole(e.target.value)}
                                        className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 transition-all"
                                    >
                                        <option value="Enterprise Supply Chain Executive">Supply Chain Executive</option>
                                        <option value="VP of Global Logistics">Logistics Director</option>
                                        <option value="Fleet Operations Manager">Fleet Operations Manager</option>
                                        <option value="Supply Chain Data Analyst">Data Analyst</option>
                                    </select>
                                </div>
                            </div>

                            {/* Password Field */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                        <LogiSphereIcon name="lock" size={16} />
                                    </div>
                                    <input
                                        type={showRegPassword ? "text" : "password"}
                                        value={regPassword}
                                        onChange={(e) => setRegPassword(e.target.value)}
                                        placeholder="Create password (min. 6 characters)"
                                        required
                                        className="w-full bg-slate-950/70 border border-white/10 rounded-xl pl-10 pr-11 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowRegPassword(!showRegPassword)}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
                                        title={showRegPassword ? "Hide password" : "Show password"}
                                    >
                                        <LogiSphereIcon name={showRegPassword ? "eye-off" : "eye"} size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password Field */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                        <LogiSphereIcon name="lock" size={16} />
                                    </div>
                                    <input
                                        type={showRegConfirm ? "text" : "password"}
                                        value={regConfirmPassword}
                                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                                        placeholder="Confirm your password"
                                        required
                                        className="w-full bg-slate-950/70 border border-white/10 rounded-xl pl-10 pr-11 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowRegConfirm(!showRegConfirm)}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
                                        title={showRegConfirm ? "Hide password" : "Show password"}
                                    >
                                        <LogiSphereIcon name={showRegConfirm ? "eye-off" : "eye"} size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Create Account Button */}
                            <button
                                type="submit"
                                disabled={status === 'loading' || status === 'success'}
                                className={`w-full py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 hover:from-cyan-500 hover:to-blue-500 shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all flex items-center justify-center gap-2 ${
                                    status === 'loading' || status === 'success' ? 'opacity-75 cursor-not-allowed' : ''
                                }`}
                            >
                                {status === 'loading' ? (
                                    <><LogiSphereIcon name="loader" size={16} className="animate-spin" /> Creating account...</>
                                ) : status === 'success' ? (
                                    <><LogiSphereIcon name="check-circle" size={16} /> Account created successfully.</>
                                ) : (
                                    <>Create Account <LogiSphereIcon name="arrow-right" size={16} /></>
                                )}
                            </button>

                            {/* Divider */}
                            <div className="relative my-2.5 text-center">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                                <span className="relative bg-slate-900 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">or sign up with</span>
                            </div>

                            {/* Google Sign-Up Button */}
                            <button
                                type="button"
                                onClick={handleGoogleSignIn}
                                disabled={status === 'loading' || status === 'success' || googleLoading}
                                className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2.5 shadow-sm ${
                                    googleLoading ? 'opacity-80 cursor-not-allowed' : ''
                                }`}
                            >
                                {googleLoading ? (
                                    <><LogiSphereIcon name="loader" size={16} className="animate-spin text-cyan-400" /> Connecting to Google...</>
                                ) : (
                                    <>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                                        </svg>
                                        Continue with Google
                                    </>
                                )}
                            </button>

                            {/* Sign In Link Footer */}
                            <div className="pt-2 text-center text-xs text-slate-400">
                                Already have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => switchMode('login')}
                                    className="text-cyan-400 hover:text-cyan-300 font-semibold underline transition-colors"
                                >
                                    Sign in
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Enterprise SSL Footnote */}
                    <div className="mt-5 pt-3 text-center border-t border-white/5">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                            <LogiSphereIcon name="shield-check" size={13} color="#10b981" />
                            256-Bit SSL Encrypted Enterprise Portal
                        </span>
                    </div>
                </div>
            </div>

            {/* Forgot Password Modal */}
            {showForgotModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl">
                        <h4 className="text-base font-bold text-white mb-1.5 flex items-center gap-2">
                            <LogiSphereIcon name="key" size={18} color="#22d3ee" /> Reset Workspace Password
                        </h4>
                        <p className="text-xs text-slate-400 mb-4">
                            Enter your enterprise email address to receive password reset instructions.
                        </p>

                        {forgotSuccess ? (
                            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-medium flex items-center gap-2">
                                <LogiSphereIcon name="check-circle" size={16} />
                                Password reset instructions have been sent. Please check your inbox.
                            </div>
                        ) : (
                            <form onSubmit={handleForgotReset} className="space-y-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                                    <input 
                                        type="email"
                                        value={forgotEmail}
                                        onChange={(e) => setForgotEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        required
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-1">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowForgotModal(false)}
                                        className="px-3.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-white/5 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="px-3.5 py-1.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-sm"
                                    >
                                        Send Reset Instructions
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Export to window for mounting
window.LogiSphereAuth = LogiSphereAuth;
