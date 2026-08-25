"use client";

import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Star } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { openSauceOne, instrumentSerif } from "@/app/fonts";

/** Official four-color Google "G". */
const GoogleG = () => (
  <svg className="size-5" viewBox="0 0 24 24" aria-hidden>
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (session?.user) {
      router.replace("/dashboard");
    }
  }, [session, router]);

  const handleGoogleSignIn = () => {
    setIsSigningIn(true);
    authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
  };

  if (isPending || session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="size-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div
      className={`flex min-h-screen w-full bg-background ${openSauceOne.className} ${instrumentSerif.variable}`}
    >
      {/* ---- Left: auth panel ---- */}
      <div className="relative flex w-full flex-col px-6 py-6 sm:px-10 lg:w-[44%] lg:shrink-0">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-baseline text-xl font-semibold tracking-tight text-foreground transition-opacity hover:opacity-80"
          >
            gimble<span className="text-sky-600 dark:text-sky-400">.</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to home
          </Link>
        </div>

        {/* Centered auth block */}
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-sm">
            <h1 className="font-display text-4xl leading-[1.1] text-foreground sm:text-[44px]">
              Welcome to gimble<span className="text-sky-600 dark:text-sky-400">.</span>
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              Describe what you want, and we handle the rest — from idea to
              polished mobile &amp; web design in minutes.
            </p>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="mt-9 flex h-12 w-full items-center justify-center gap-3 rounded-full border border-border bg-card text-[15px] font-semibold text-foreground shadow-sm transition-all hover:border-foreground/25 hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSigningIn ? (
                <>
                  <Spinner className="size-4" />
                  Redirecting to Google…
                </>
              ) : (
                <>
                  <GoogleG />
                  Continue with Google
                </>
              )}
            </button>

            <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">
              Free plan includes 100 credits — no credit card required.
            </p>

            <div className="my-8 h-px w-full bg-border" />

            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              By continuing, you agree to our{" "}
              <a href="#" className="underline underline-offset-2 hover:text-foreground">
                Terms
              </a>{" "}
              and{" "}
              <a href="#" className="underline underline-offset-2 hover:text-foreground">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>

        {/* Bottom meta */}
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Gimble
        </p>
      </div>

      {/* ---- Right: imagery panel ---- */}
      <div className="relative hidden flex-1 p-4 lg:block">
        <div className="relative isolate h-full w-full overflow-hidden rounded-[2rem]">
          {/* Gradient fallback under the photo */}
          <div
            aria-hidden
            className="absolute inset-0 -z-20 bg-linear-to-b from-sky-400 via-sky-300 to-rose-200"
          />
          <Image
            src="/landing/login-sky.webp"
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 0px, 56vw"
            className="-z-10 object-cover"
          />
          {/* Slight dim in dark mode so the panel doesn't glare */}
          <div aria-hidden className="absolute inset-0 hidden bg-black/20 dark:block" />
          {/* Legibility scrim behind the quote card */}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-56 bg-linear-to-t from-black/45 to-transparent"
          />

          {/* Floating quote card */}
          <figure className="absolute inset-x-8 bottom-8 max-w-md">
            <div
              className="flex items-center gap-0.5"
              role="img"
              aria-label="Rated 5 out of 5 stars"
            >
              {[0, 1, 2, 3, 4].map((i) => (
                <Star
                  key={i}
                  aria-hidden
                  className="size-4 fill-amber-300 text-amber-300"
                />
              ))}
            </div>
            <blockquote className="font-display mt-3 text-2xl leading-snug text-white [text-shadow:0_1px_16px_rgba(0,0,0,0.35)]">
              &ldquo;We went from a rough idea to a full product design using
              just one prompt.&rdquo;
            </blockquote>
            <figcaption className="mt-3 text-sm font-medium text-white/85">
              Rahul Mehta · Product Manager
            </figcaption>
          </figure>
        </div>
      </div>
    </div>
  );
}
