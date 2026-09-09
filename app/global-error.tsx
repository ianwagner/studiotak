"use client";

import { useEffect } from "react";

type GlobalErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalErrorPage({ error, reset }: GlobalErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="route-error-page" role="alert">
          <p>Something went wrong</p>
          <h1>Let&apos;s try that again.</h1>
          <button type="button" onClick={reset}>
            Reload this page
          </button>
        </main>
      </body>
    </html>
  );
}
