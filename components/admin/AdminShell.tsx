"use client";

import { Refine } from "@refinedev/core";
import routerProvider from "@refinedev/nextjs-router/app";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createFirestoreDataProvider } from "@/lib/admin/firestoreDataProvider";
import { AdminAuthGate } from "./AdminAuthGate";
import { getAuth, sendEmailVerification, signOut, type User } from "firebase/auth";
import { getFirebaseApp } from "@/lib/firebaseClient";
import { localAuthBypassEnabled, localDevUser } from "@/lib/localAuthBypass";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const dataProvider = useMemo(() => createFirestoreDataProvider(), []);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  useEffect(() => {
    setVerificationMessage(null);
    setVerificationError(null);
    setSendingVerification(false);
  }, [currentUser?.uid]);

  const handleSendVerification = async () => {
    if (localAuthBypassEnabled) {
      setVerificationMessage("Verification skipped in local development.");
      setVerificationError(null);
      return;
    }
    setVerificationMessage(null);
    setVerificationError(null);
    setSendingVerification(true);
    try {
      const auth = getAuth(getFirebaseApp());
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No signed-in user found.");
      }
      const continueUrl =
        process.env.NEXT_PUBLIC_FIREBASE_CONTINUE_URL ??
        (typeof window !== "undefined" ? window.location.origin : undefined);
      const actionCodeSettings = continueUrl ? { url: continueUrl } : undefined;
      await sendEmailVerification(user, actionCodeSettings);
      setVerificationMessage("Verification email sent. Check your inbox.");
    } catch (error: any) {
      setVerificationError(error?.message ?? "Failed to send verification email. Try again.");
    } finally {
      setSendingVerification(false);
    }
  };

  return (
    <div className="admin-shell">
      <AdminAuthGate onSignedIn={setCurrentUser}>
        <Refine
          dataProvider={dataProvider}
          routerProvider={routerProvider}
          resources={[
            {
              name: "pages",
              list: "/admin/pages",
              edit: "/admin/pages/:id",
              create: "/admin/pages/new"
            },
            {
              name: "components",
              list: "/admin/components",
              edit: "/admin/components/:id",
              create: "/admin/components/new"
            },
            {
              name: "navigation",
              list: "/admin/navigation",
              edit: "/admin/navigation/:id",
              create: "/admin/navigation/new"
            }
          ]}
          options={{ syncWithLocation: true, warnWhenUnsavedChanges: false }}
        >
          <div className="admin-layout">
            <aside className="admin-sidebar">
              <div style={{ display: "grid", gap: 6 }}>
                <Link href="/admin" style={{ fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Studio Tak / Admin
                </Link>
                <span style={{ color: "var(--muted)", fontSize: 14 }}>Refine playground for marketing pages</span>
              </div>
              <nav style={{ display: "grid", gap: 8 }}>
                <Link href="/admin/pages" className="nav-link">
                  Pages
                </Link>
                <Link href="/admin/components" className="nav-link">
                  Components
                </Link>
                <Link href="/admin/navigation" className="nav-link">
                  Navigation
                </Link>
                <Link href="/admin/media" className="nav-link">
                  Media
                </Link>
                <Link href="/admin/settings" className="nav-link">
                  Site settings
                </Link>
              </nav>
              <div
                style={{
                  display: "grid",
                  gap: 6,
                  padding: "10px 12px",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.02)",
                  marginTop: "auto"
                }}
              >
                <span style={{ color: "var(--muted)", fontSize: 13 }}>
                  Signed in as <strong>{currentUser?.email ?? currentUser?.uid ?? "—"}</strong>
                </span>
                {currentUser && !currentUser.emailVerified ? (
                  <div
                    style={{
                      display: "grid",
                      gap: 8,
                      padding: "8px 10px",
                      borderRadius: 6,
                      background: "rgba(255,205,41,0.08)",
                      border: "1px solid rgba(255,205,41,0.3)"
                    }}
                  >
                    <span style={{ color: "var(--muted)", fontSize: 13 }}>
                      Email not verified. Send yourself a verification link, then click it and re-open the admin to update
                      your status.
                    </span>
                    <span style={{ color: "var(--muted)", fontSize: 12 }}>
                      Make sure <code>{process.env.NEXT_PUBLIC_FIREBASE_CONTINUE_URL ?? "your site URL"}</code> is listed as
                      an authorized domain in Firebase Auth settings.
                    </span>
                    <div style={{ display: "grid", gap: 6 }}>
                      <button className="btn secondary" type="button" onClick={handleSendVerification} disabled={sendingVerification}>
                        {sendingVerification ? "Sending…" : "Send verification email"}
                      </button>
                      {verificationMessage ? <span style={{ color: "var(--muted)", fontSize: 13 }}>{verificationMessage}</span> : null}
                      {verificationError ? <span style={{ color: "var(--accent)", fontSize: 13 }}>{verificationError}</span> : null}
                    </div>
                  </div>
                ) : null}
                <div style={{ display: "grid", gap: 6 }}>
                  <button
                    className="btn secondary"
                    type="button"
                    onClick={async () => {
                      if (localAuthBypassEnabled) {
                        setCurrentUser(localDevUser);
                        return;
                      }
                      const auth = getAuth(getFirebaseApp());
                      await signOut(auth);
                    }}
                  >
                    Sign out
                  </button>
                  <Link href="/" className="btn secondary">
                    View site
                  </Link>
                </div>
              </div>
            </aside>
            <div className="admin-content">{children}</div>
          </div>
        </Refine>
      </AdminAuthGate>
    </div>
  );
}
