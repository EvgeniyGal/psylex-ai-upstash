"use server";

import { redirect } from "next/navigation";
import { consumeMagicToken, inspectMagicToken } from "@/lib/magic-link";
import { getPostLoginRedirect } from "@/lib/onboarding";
import { establishSession } from "@/lib/session";

export async function confirmMagicLoginAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  if (!token) {
    redirect("/login?error=missing_magic_token");
  }

  const status = await inspectMagicToken(token);
  if (status === "missing") redirect("/login?error=missing_magic_token");
  if (status === "used") redirect("/login?error=magic_link_used");
  if (status === "expired") redirect("/login?error=magic_link_expired");
  if (status !== "ok") redirect("/login?error=invalid_magic_link");

  const user = await consumeMagicToken(token);
  if (!user) {
    // Race: used between inspect and consume
    redirect("/login?error=magic_link_used");
  }

  await establishSession({
    id: user.id,
    login: user.login,
    role: user.role,
  });

  redirect(await getPostLoginRedirect(user.id, user.role));
}
