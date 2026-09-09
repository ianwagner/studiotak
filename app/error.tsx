"use client";

import { useEffect } from "react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="route-error-page" role="alert">
      <p>Something went wrong</p>
      <h1>Let&apos;s try that again.</h1>
      <button type="button" onClick={reset} className="btn">
        Reload this page
      </button>
    </main>
  );
}
