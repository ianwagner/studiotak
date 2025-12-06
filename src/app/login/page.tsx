import { Section } from "@/components/Section";
import { sanitizeRedirectPath } from "@/lib/auth";

import { LoginForm } from "./LoginForm";

type LoginPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const rawRedirect = searchParams?.redirect;
  const redirectValue = Array.isArray(rawRedirect) ? rawRedirect[0] : rawRedirect;
  const redirectPath = sanitizeRedirectPath(redirectValue);

  return (
    <Section className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-content/30 to-background">
      <div className="w-full max-w-xl rounded-3xl border border-foreground/15 bg-content/85 p-10 shadow-2xl shadow-foreground/10 backdrop-blur">
        <div className="space-y-3 pb-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground/60">Private Access</p>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-foreground">
            Studio Tak login
          </h1>
          <p className="text-base text-foreground/75">
            Sign in with the provided credentials to view the site.
          </p>
        </div>
        <LoginForm redirectPath={redirectPath} />
        <a
          href="https://campfire.studiotak.co"
          className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-accent/60 px-5 py-3 text-base font-semibold text-accent transition hover:border-accent hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
          rel="noreferrer"
        >
          Go to Campfire
        </a>
      </div>
    </Section>
  );
}
