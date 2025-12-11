"use client";

import { useEffect, useRef, useState } from "react";
import {
  getAuth,
  getMultiFactorResolver,
  onAuthStateChanged,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  type PhoneMultiFactorInfo,
  RecaptchaVerifier,
  signInWithEmailAndPassword,
  signOut,
  type MultiFactorResolver,
  type User
} from "firebase/auth";
import { getFirebaseApp } from "@/lib/firebaseClient";

type AuthState = {
  loading: boolean;
  user: User | null;
  error: string | null;
  firebaseReady: boolean;
};

type MfaState = {
  resolver: MultiFactorResolver | null;
  phoneNumber: string | null;
  verificationId: string | null;
  sending: boolean;
  verifying: boolean;
  error: string | null;
};

type AdminAuthGateProps = {
  children: React.ReactNode;
  onSignedIn?: (user: User | null) => void;
};

export function AdminAuthGate({ children, onSignedIn }: AdminAuthGateProps) {
  const disableAppVerificationFlag = process.env.NEXT_PUBLIC_DISABLE_PHONE_APP_VERIFICATION === "true";
  const allowAppVerificationBypass = disableAppVerificationFlag && process.env.NODE_ENV !== "production";
  const [state, setState] = useState<AuthState>({
    loading: true,
    user: null,
    error: null,
    firebaseReady: Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY)
  });
  const [onSignOut, setOnSignOut] = useState<(() => void) | null>(null);
  const [mfaState, setMfaState] = useState<MfaState>({
    resolver: null,
    phoneNumber: null,
    verificationId: null,
    sending: false,
    verifying: false,
    error: null
  });
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaInitPromise = useRef<Promise<RecaptchaVerifier> | null>(null);
  const recaptchaContainerId = "admin-mfa-recaptcha";
  const recaptchaContainerRef = useRef<HTMLElement | null>(null);
  const recaptchaRenderCounter = useRef(0);

  const ensureRecaptchaContainer = (forceFresh = false) => {
    if (typeof document === "undefined") throw new Error("reCAPTCHA container not available");
    if (!forceFresh && recaptchaContainerRef.current && document.body.contains(recaptchaContainerRef.current)) {
      return recaptchaContainerRef.current;
    }

    const old = document.getElementById(recaptchaContainerId);
    if (old && old.parentNode) {
      old.parentNode.removeChild(old);
    }

    const container = document.createElement("div");
    container.id = recaptchaContainerId;
    container.style.position = "fixed";
    container.style.right = "12px";
    container.style.bottom = "12px";
    container.style.zIndex = "1000";
    container.setAttribute("aria-hidden", "true");
    document.body.appendChild(container);

    recaptchaContainerRef.current = container;
    return container;
  };

  // Track the last seen API key to detect mid-session config changes.
  const apiKeyRef = useRef<string | undefined>(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);

  const resetRecaptcha = () => {
    try {
      recaptchaRef.current?.clear();
    } catch (e) {
      // ignore
    }
    if (recaptchaContainerRef.current && recaptchaContainerRef.current.parentNode) {
      recaptchaContainerRef.current.parentNode.removeChild(recaptchaContainerRef.current);
    }
    recaptchaRef.current = null;
    recaptchaInitPromise.current = null;
  };

  useEffect(() => {
    // Ensure the container exists once and is never removed during runtime (even on re-renders).
    if (typeof document !== "undefined") {
      ensureRecaptchaContainer();
    }
    return () => {
      try {
        recaptchaRef.current?.clear();
      } catch (e) {
        // ignore
      }
      // Do not remove the container; it stays stable across lifecycles.
      recaptchaRef.current = null;
      recaptchaInitPromise.current = null;
    };
  }, []);

  useEffect(() => {
    if (allowAppVerificationBypass) {
      console.warn("Phone app verification is disabled (NEXT_PUBLIC_DISABLE_PHONE_APP_VERIFICATION=true). Use only with Firebase test numbers.");
    }
  }, [allowAppVerificationBypass]);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    const auth = getAuth(getFirebaseApp());
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setState({ loading: false, user, error: null, firebaseReady: true });
        onSignedIn?.(user ?? null);
      },
      (error) => {
        setState({ loading: false, user: null, error: error.message, firebaseReady: true });
      }
    );
    return () => unsubscribe();
  }, [onSignedIn]);

  const ensureRecaptcha = async (forceFresh = false) => {
    if (forceFresh) {
      resetRecaptcha();
    }
    if (recaptchaRef.current && !forceFresh) return recaptchaRef.current;
    if (recaptchaInitPromise.current) return recaptchaInitPromise.current;

    if (typeof document === "undefined") throw new Error("reCAPTCHA container not available");

    const container = ensureRecaptchaContainer(forceFresh);
    const slot = document.createElement("div");
    const innerId = `${recaptchaContainerId}-${recaptchaRenderCounter.current++}`;
    slot.id = innerId;
    container.appendChild(slot);

    const auth = getAuth(getFirebaseApp());
    const buildVerifier = () => new RecaptchaVerifier(auth, slot, { size: "invisible" });

    const init = (async () => {
      const renderVerifier = async () => {
        const verifier = buildVerifier();
        recaptchaRef.current = verifier;
        await verifier.render();
        return verifier;
      };

      try {
        return await renderVerifier();
      } catch (error: any) {
        const message: string = error?.message ?? "";
        // If the SDK complains about an existing render, nuke the container and retry once.
        if (message.toLowerCase().includes("already been rendered")) {
          resetRecaptcha();
          const fresh = ensureRecaptchaContainer(true);
          const slotRetry = document.createElement("div");
          const innerIdRetry = `${recaptchaContainerId}-${recaptchaRenderCounter.current++}`;
          slotRetry.id = innerIdRetry;
          fresh.appendChild(slotRetry);
          const retryVerifier = new RecaptchaVerifier(getAuth(getFirebaseApp()), slotRetry, { size: "invisible" });
          recaptchaRef.current = retryVerifier;
          await retryVerifier.render();
          return retryVerifier;
        }

        // If the SDK cannot find or render into the container, rebuild it once and retry.
        recaptchaRef.current = null;
        if (!document.getElementById(recaptchaContainerId)) {
          const freshContainer = document.createElement("div");
          freshContainer.id = recaptchaContainerId;
          freshContainer.style.position = "fixed";
          freshContainer.style.right = "12px";
          freshContainer.style.bottom = "12px";
          freshContainer.style.zIndex = "1000";
          freshContainer.setAttribute("aria-hidden", "true");
          document.body.appendChild(freshContainer);
        }

        return await renderVerifier();
      }
    })();

    recaptchaInitPromise.current = init;
    const verifier = await init;
    recaptchaInitPromise.current = null;
    return verifier;
  };

  const startMfaChallenge = async (resolver: MultiFactorResolver, allowRetryOnCaptcha = true) => {
    const phoneHint = resolver.hints.find(
      (hint): hint is PhoneMultiFactorInfo => hint.factorId === PhoneMultiFactorGenerator.FACTOR_ID
    );
    if (!phoneHint) {
      setMfaState({
        resolver: null,
        phoneNumber: null,
        verificationId: null,
        sending: false,
        verifying: false,
        error: "No phone factor is enrolled for this account."
      });
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    setMfaState({
      resolver,
      phoneNumber: phoneHint.phoneNumber ?? "your phone",
      verificationId: null,
      sending: true,
      verifying: false,
      error: null
    });

    try {
      // If env vars changed mid-session, force reinit to avoid invalid app credential.
      if (apiKeyRef.current !== process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        resetRecaptcha();
        apiKeyRef.current = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
      }

      const auth = getAuth(getFirebaseApp());
      // Only bypass app verification locally when explicitly requested for Firebase test numbers.
      auth.settings.appVerificationDisabledForTesting = allowAppVerificationBypass;
      const phoneAuthProvider = new PhoneAuthProvider(auth);

      // Always rebuild verifier before starting a challenge to avoid stale app credentials.
      const verifier = await ensureRecaptcha(true);
      const verificationId = await phoneAuthProvider.verifyPhoneNumber(
        { multiFactorHint: phoneHint, session: resolver.session },
        verifier
      );
      setMfaState((s) => ({ ...s, verificationId, sending: false }));
    } catch (error: any) {
      const code = error?.code ?? "";
      // If reCAPTCHA is stale or the app credential is rejected, reset and retry once.
      const shouldRetry =
        allowRetryOnCaptcha &&
        (code === "auth/invalid-app-credential" ||
          code === "auth/missing-app-credential" ||
          code === "auth/captcha-check-failed");
      if (shouldRetry) {
        resetRecaptcha();
        await startMfaChallenge(resolver, false);
        return;
      }

      setMfaState((s) => ({
        ...s,
        sending: false,
        error: (() => {
          if (code === "auth/captcha-check-failed") {
            return "reCAPTCHA check failed. Make sure this domain is authorized in Firebase Auth and try again.";
          }
          if (code === "auth/invalid-app-credential" || code === "auth/missing-app-credential") {
            return "App verification failed. Confirm this domain is in Firebase Auth authorized domains and reload to refresh reCAPTCHA.";
          }
          return error?.code && error?.message ? `${error.code}: ${error.message}` : error?.message ?? "Failed to send verification code. Try again.";
        })()
      }));
    } finally {
      setState((s) => ({ ...s, loading: false }));
    }
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      setState((s) => ({ ...s, loading: true, error: null }));
      setMfaState((s) => ({
        ...s,
        resolver: null,
        verificationId: null,
        error: null,
        sending: false,
        verifying: false
      }));
      const auth = getAuth(getFirebaseApp());
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      if (error?.code === "auth/multi-factor-auth-required") {
        const auth = getAuth(getFirebaseApp());
        const resolver = getMultiFactorResolver(auth, error);
        await startMfaChallenge(resolver);
        return;
      }
      setState((s) => ({ ...s, loading: false, error: error?.message ?? "Login failed" }));
    }
  };

  const handleSubmitMfa = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const code = String(formData.get("code") ?? "").trim();
    if (!mfaState.verificationId || !mfaState.resolver) {
      setMfaState((s) => ({ ...s, error: "Missing verification info. Restart sign in." }));
      return;
    }

    try {
      setMfaState((s) => ({ ...s, verifying: true, error: null }));
      const credential = PhoneAuthProvider.credential(mfaState.verificationId, code);
      const assertion = PhoneMultiFactorGenerator.assertion(credential);
      await mfaState.resolver.resolveSignIn(assertion);
      setMfaState({
        resolver: null,
        phoneNumber: null,
        verificationId: null,
        sending: false,
        verifying: false,
        error: null
      });
    } catch (error: any) {
      setMfaState((s) => ({
        ...s,
        verifying: false,
        error: error?.message ?? "Invalid code. Try again."
      }));
    }
  };

  const handleResendMfa = async () => {
    if (!mfaState.resolver) return;
    await startMfaChallenge(mfaState.resolver);
  };

  const handleLogout = async () => {
    const auth = getAuth(getFirebaseApp());
    await signOut(auth);
    setMfaState({
      resolver: null,
      phoneNumber: null,
      verificationId: null,
      sending: false,
      verifying: false,
      error: null
    });
    if (onSignOut) onSignOut();
  };

  if (!state.firebaseReady) {
    // Firebase not configured; allow access but warn.
    return (
      <div className="card" style={{ maxWidth: 520 }}>
        <h1 style={{ marginTop: 0 }}>Admin</h1>
        <p style={{ color: "var(--muted)" }}>
          Firebase env vars are not set. Admin will use the seed data provider; sign-in is skipped.
        </p>
        {children}
      </div>
    );
  }

  if (state.loading) {
    return <p>Loading auth…</p>;
  }

  if (!state.user) {
    const card = mfaState.resolver ? (
      <div className="card" style={{ maxWidth: 420 }}>
        <h1 style={{ marginTop: 0 }}>Verify sign in</h1>
        <p style={{ marginTop: 4, color: "var(--muted)" }}>
          Enter the code sent to {mfaState.phoneNumber ?? "your phone"} to finish signing in.
        </p>
        <form className="grid" style={{ gap: 12 }} onSubmit={handleSubmitMfa}>
          <div className="field-group">
            <label>6-digit code</label>
            <input
              className="input"
              type="text"
              name="code"
              pattern="[0-9]{6}"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
            />
          </div>
          <button className="btn" type="submit" disabled={mfaState.verifying}>
            {mfaState.verifying ? "Verifying…" : "Verify code"}
          </button>
          <button className="btn secondary" type="button" onClick={handleResendMfa} disabled={mfaState.sending}>
            {mfaState.sending ? "Sending code…" : "Resend code"}
          </button>
          {mfaState.error ? <p style={{ color: "var(--accent)" }}>{mfaState.error}</p> : null}
        </form>
      </div>
    ) : (
      <div className="card" style={{ maxWidth: 420 }}>
        <h1 style={{ marginTop: 0 }}>Admin sign in</h1>
        <p style={{ marginTop: 4, color: "var(--muted)" }}>Sign in with your email and password to manage pages.</p>
        <form className="grid" style={{ gap: 12 }} onSubmit={handleLogin}>
          <div className="field-group">
            <label>Email</label>
            <input className="input" type="email" name="email" autoComplete="email" required />
          </div>
          <div className="field-group">
            <label>Password</label>
            <input className="input" type="password" name="password" autoComplete="current-password" required />
          </div>
          <button className="btn" type="submit" disabled={state.loading}>
            {state.loading ? "Signing in…" : "Sign in"}
          </button>
          {state.error ? <p style={{ color: "var(--accent)" }}>{state.error}</p> : null}
        </form>
      </div>
    );

    return (
      <div className="admin-auth">
        {card}
      </div>
    );
  }

  return children as React.ReactElement<any>;
}

export type AdminAuthContext = {
  user: User | null;
  onLogout: () => Promise<void>;
  setOnSignOut: (cb: (() => void) | null) => void;
};
