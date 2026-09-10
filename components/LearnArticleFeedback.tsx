"use client";

import { useEffect, useState } from "react";

type FeedbackValue = "yes" | "no";

type LearnArticleFeedbackProps = {
  articleSlug: string;
  articleTitle: string;
};

const storageKeyFor = (articleSlug: string) => `studio-tak:learn-feedback:${articleSlug}`;

/**
 * A lightweight, anonymous feedback prompt. The selection is remembered per
 * browser so a reader is only counted once for an article. Aggregate reporting
 * is sent to GA4 when the visitor has opted in to analytics.
 */
export function LearnArticleFeedback({ articleSlug, articleTitle }: LearnArticleFeedbackProps) {
  const [selection, setSelection] = useState<FeedbackValue | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(storageKeyFor(articleSlug));
      if (storedValue === "yes" || storedValue === "no") {
        setSelection(storedValue);
      }
    } catch {
      // Private browsing or strict browser settings can deny local storage.
      // The prompt still works for this page view in that case.
    } finally {
      setReady(true);
    }
  }, [articleSlug]);

  const submitFeedback = (value: FeedbackValue) => {
    if (selection) return;

    setSelection(value);
    try {
      window.localStorage.setItem(storageKeyFor(articleSlug), value);
    } catch {
      // See the note in the hydration effect above.
    }

    // gtag is loaded only after analytics consent, so this remains anonymous
    // and respects the site's existing cookie preference flow.
    if (typeof window.gtag === "function") {
      window.gtag("event", "article_feedback", {
        article_slug: articleSlug,
        article_title: articleTitle,
        feedback_value: value
      });
    }
  };

  return (
    <section className="learn-article-feedback" aria-labelledby="learn-article-feedback-question">
      <p id="learn-article-feedback-question">Was this helpful?</p>
      {selection ? (
        <p className="learn-article-feedback-thanks" role="status">
          Thanks for letting us know.
        </p>
      ) : (
        <div className="learn-article-feedback-actions" aria-label="Article feedback">
          <button type="button" onClick={() => submitFeedback("yes")} disabled={!ready}>
            Yes
          </button>
          <button type="button" onClick={() => submitFeedback("no")} disabled={!ready}>
            No
          </button>
        </div>
      )}
    </section>
  );
}
