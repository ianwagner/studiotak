"use server";

import { cookies } from "next/headers";

import { authConfig, sanitizeRedirectPath } from "@/lib/auth";

export type LoginResult = {
  success: boolean;
  error?: string;
  redirectTo?: string;
};

export async function authenticate(
  _prevState: LoginResult | undefined,
  formData: FormData,
): Promise<LoginResult> {
  const username = formData.get("username");
  const password = formData.get("password");
  const requestedRedirect = formData.get("redirect");

  const redirectTo = sanitizeRedirectPath(
    typeof requestedRedirect === "string" ? requestedRedirect : undefined,
  );

  if (
    username === authConfig.VALID_USERNAME &&
    password === authConfig.VALID_PASSWORD
  ) {
    cookies().set(authConfig.AUTH_COOKIE_NAME, authConfig.AUTH_COOKIE_VALUE, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12, // 12 hours
    });

    return { success: true, redirectTo };
  }

  return {
    success: false,
    redirectTo,
    error: "Invalid credentials. Please try again.",
  };
}
