"use client";

import { useState } from "react";
import { toast } from "sonner";
import { generateMagicLinkAction } from "@/app/admin/magic-link/actions";
import { useLocale } from "@/components/locale-provider";
import { Spinner } from "@/components/ui/spinner";
import { formatCredentials, localizeRole } from "@/lib/credentials";

export function CredentialActions({
  userId,
  role,
  login,
  password,
}: {
  userId: string;
  role: string;
  login: string;
  password: string;
}) {
  const { admin } = useLocale();
  const [pending, setPending] = useState(false);
  const text = formatCredentials({
    roleLabel: admin.roleLabel,
    loginLabel: admin.loginLabel,
    passwordLabel: admin.passwordLabel,
    role: localizeRole(admin.roles, role),
    login,
    password,
  });

  const onCopy = async () => {
    await navigator.clipboard.writeText(text);
    toast.success(admin.copyCredentials);
  };

  const onMagicLink = async () => {
    setPending(true);
    try {
      const url = await generateMagicLinkAction(userId);

      if (navigator.share) {
        try {
          await navigator.share({ title: admin.magicLink, url });
          toast.success(admin.magicLinkCopied);
          return;
        } catch {
          // fall through to clipboard
        }
      }

      await navigator.clipboard.writeText(url);
      toast.success(admin.magicLinkCopied);
    } catch {
      toast.error(admin.magicLinkFailed);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mt-6 flex gap-3">
      <button
        className="flex flex-1 items-center justify-center gap-2 rounded-full border border-ink bg-ink px-4 py-2 text-body-sm font-medium text-white transition-all hover:bg-[#0f1a2e]"
        onClick={onCopy}
        type="button"
      >
        <span className="material-symbols-outlined text-[18px]">key</span>
        {admin.copyCredentials}
      </button>
      <button
        className="flex flex-1 items-center justify-center gap-2 rounded-full border border-hair bg-surface-container px-4 py-2 text-body-sm font-medium text-ink transition-all hover:border-[#c9ced6]"
        disabled={pending}
        onClick={onMagicLink}
        type="button"
      >
        {pending ? <Spinner size="sm" /> : <span className="material-symbols-outlined text-[18px]">auto_fix_high</span>}
        {admin.magicLink}
      </button>
    </div>
  );
}

export function CredentialField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const { admin } = useLocale();
  const onCopy = async () => {
    await navigator.clipboard.writeText(value);
    toast.success(admin.copied);
  };

  return (
    <div>
      <label className="mb-1 block font-display text-label-md text-on-surface-variant">{label}</label>
      <div className="flex items-center justify-between rounded border border-outline-variant/20 bg-surface-container-low px-3 py-2 font-mono text-sm text-on-surface">
        <span className="truncate">{value}</span>
        <button
          className="text-tertiary transition-colors hover:text-white"
          onClick={onCopy}
          title={`Copy ${label}`}
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">content_copy</span>
        </button>
      </div>
    </div>
  );
}
