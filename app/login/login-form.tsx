"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { SiteHeader } from "@/components/site-header";
import { Spinner } from "@/components/ui/spinner";
import { useLocale } from "@/components/locale-provider";
import { credentialsSchema, type CredentialsInput } from "@/lib/login-schema";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { landing: t } = useLocale();
  const magicLinkErrors = useMemo(
    () => ({
      missing_magic_token: t.magicLinkMissingToken,
      invalid_magic_link: t.magicLinkInvalid,
      magic_link_used: t.magicLinkUsed,
      magic_link_expired: t.magicLinkExpired,
    }),
    [t],
  );
  const magicError = magicLinkErrors[searchParams.get("error") as keyof typeof magicLinkErrors];
  const [error, setError] = useState<string | null>(magicError ?? null);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<CredentialsInput>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { login: "", password: "" },
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = async (values: CredentialsInput) => {
    setError(null);
    const result = await signIn("credentials", {
      ...values,
      redirect: false,
      callbackUrl: "/admin/rooms",
    });

    if (result?.ok) {
      const redirectResponse = await fetch("/api/auth/redirect");
      const { path } = (await redirectResponse.json()) as { path: string };
      router.push(path);
      return;
    }
    setError(t.invalidCredentials);
  };

  const handleFormKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (event.key !== "Enter" || event.nativeEvent.isComposing || isSubmitting) return;
    if (!(event.target instanceof HTMLInputElement)) return;

    event.preventDefault();
    void handleSubmit(onSubmit)();
  };

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-paper">
      <SiteHeader
        trailing={
          <>
            <Link
              className="hidden items-center gap-1.5 text-[13px] font-medium text-ink-soft transition-colors hover:text-ink sm:flex"
              href="/"
            >
              <span className="material-symbols-outlined text-base">home</span>
              {t.backToStart}
            </Link>
            <LocaleSwitcher />
          </>
        }
      />

      <div className="relative flex flex-grow items-center justify-center px-6">
        <div className="relative z-10 w-full max-w-md">
          <div className="mb-8 flex flex-col items-center gap-3">
            <h1 className="font-display text-headline-lg text-ink">{t.signInTitle}</h1>
            <p className="text-center text-body-sm text-ink-soft">{t.signInSubtitle}</p>
          </div>

          <form
            className="glass-panel space-y-5 p-8"
            onKeyDown={handleFormKeyDown}
            onSubmit={handleSubmit(onSubmit)}
          >
            <div>
              <label className="mb-2 block text-label-md text-ink-soft">
                {t.loginLabel}
              </label>
              <input
                autoComplete="username"
                className="w-full rounded-md border border-hair bg-paper px-4 py-3 font-mono text-sm text-ink focus:border-law focus:outline-none focus:ring-1 focus:ring-law disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                enterKeyHint="next"
                placeholder="psylex_..."
                {...register("login")}
              />
              {errors.login ? (
                <p className="mt-1 text-xs text-error">{t.invalidLoginFormat}</p>
              ) : null}
            </div>
            <div>
              <label className="mb-2 block text-label-md text-ink-soft">
                {t.passwordLabel}
              </label>
              <div className="relative">
                <input
                  autoComplete="current-password"
                  className="w-full rounded-md border border-hair bg-paper py-3 pl-4 pr-12 text-ink focus:border-law focus:outline-none focus:ring-1 focus:ring-law disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSubmitting}
                  enterKeyHint="go"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                />
                <button
                  aria-label={showPassword ? t.hidePassword : t.showPassword}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-paper hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSubmitting}
                  onClick={() => setShowPassword((visible) => !visible)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>
            {error ? <p className="text-sm text-error">{error}</p> : null}
            <button
              className="btn-primary flex w-full items-center justify-center gap-2 px-6 py-3 text-body-md transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="text-white" />
                  {t.signInLoading}
                </>
              ) : (
                t.signInButton
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-body-sm text-ink-soft">
            <Link className="text-law hover:underline" href="/">
              {t.backToLanding}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
