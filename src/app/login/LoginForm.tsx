"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import type { LoginResult } from "./actions";
import { authenticate } from "./actions";

type LoginFormProps = {
  redirectPath: string;
};

const initialState: LoginResult = { success: false };

export function LoginForm({ redirectPath }: LoginFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(authenticate, initialState);

  useEffect(() => {
    if (state.success) {
      const target = state.redirectTo ?? redirectPath;
      router.replace(target);
    }
  }, [state.redirectTo, state.success, redirectPath, router]);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="redirect" value={redirectPath} />
      <div className="space-y-2">
        <label htmlFor="username" className="block text-sm font-semibold text-foreground/80">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          className="w-full rounded-xl border border-foreground/15 bg-content px-4 py-3 text-base text-foreground shadow-sm outline-none transition focus:border-foreground/40 focus:ring-2 focus:ring-accent/60"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-semibold text-foreground/80">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-xl border border-foreground/15 bg-content px-4 py-3 text-base text-foreground shadow-sm outline-none transition focus:border-foreground/40 focus:ring-2 focus:ring-accent/60"
        />
      </div>
      {state.error ? <p className="text-sm font-medium text-red-500">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-accent px-5 py-3 text-base font-semibold text-accent-foreground shadow-lg shadow-accent/25 transition hover:shadow-xl hover:shadow-accent/35 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
