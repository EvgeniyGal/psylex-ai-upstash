import { encode } from "next-auth/jwt";
import { cookies } from "next/headers";

type SessionUser = {
  id: string;
  login: string;
  role: string;
  title?: string;
};

export async function establishSession(user: SessionUser) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");

  const isSecure = process.env.NEXTAUTH_URL?.startsWith("https://") ?? false;
  const cookieName = isSecure
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";

  const sessionToken = await encode({
    token: {
      sub: user.id,
      name: user.login,
      role: user.role,
      ...(user.title ? { title: user.title } : {}),
    },
    secret,
    maxAge: 30 * 24 * 60 * 60,
  });

  const cookieStore = await cookies();
  cookieStore.set(cookieName, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isSecure,
  });
}
