"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "@/components/locale-provider";
import { Spinner } from "@/components/ui/spinner";
import { confirmMagicLoginAction } from "@/app/auth/magic/actions";

export function MagicContinueForm({ token }: { token: string }) {
  const { landing: t } = useLocale();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.requestSubmit();
  }, []);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-paper px-6">
      <form ref={formRef} action={confirmMagicLoginAction} className="flex flex-col items-center gap-3">
        <input name="token" type="hidden" value={token} />
        <Spinner size="md" className="text-ink" />
        <p className="text-body-sm text-ink-soft">{t.signInLoading}</p>
        <noscript>
          <button className="btn-primary mt-2 px-6 py-3 text-body-md" type="submit">
            {t.magicLinkContinueButton}
          </button>
        </noscript>
      </form>
    </main>
  );
}
