import { redirect } from "next/navigation";
import { inspectMagicToken } from "@/lib/magic-link";
import { MagicContinueForm } from "./magic-continue-form";

type MagicPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function MagicLoginPage({ searchParams }: MagicPageProps) {
  const { token } = await searchParams;

  if (!token) {
    redirect("/login?error=missing_magic_token");
  }

  const status = await inspectMagicToken(token);

  if (status === "used") {
    redirect("/login?error=magic_link_used");
  }
  if (status === "expired") {
    redirect("/login?error=magic_link_expired");
  }
  if (status !== "ok") {
    redirect("/login?error=invalid_magic_link");
  }

  return <MagicContinueForm token={token} />;
}
