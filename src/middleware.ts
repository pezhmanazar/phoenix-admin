// src/middleware.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function backendBase(): string {
  return (
    (process.env.NEXT_PUBLIC_BACKEND_URL || "").trim() ||
    (process.env.BACKEND_URL || "").trim() ||
    "http://127.0.0.1:4000"
  );
}

async function verifyAdminToken(
  token: string,
): Promise<boolean> {
  if (!token.trim()) {
    return false;
  }

  try {
    const headers: Record<string, string> = {
      "x-admin-token": token.trim(),
    };

    let res = await fetch(
      `${backendBase()}/api/admin/verify`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      },
    );

    // همان fallback که در layout فعلی داری
    if (res.status === 404) {
      res = await fetch(
        `${backendBase()}/api/admin/me`,
        {
          method: "GET",
          headers,
          cache: "no-store",
        },
      );
    }

    if (!res.ok) {
      return false;
    }

    const json = await res.json().catch(() => null);

    return Boolean(
      json?.ok &&
      json?.admin,
    );
  } catch {
    return false;
  }
}

export async function middleware(
  req: NextRequest,
) {
  const { pathname } = req.nextUrl;

  const token =
    req.cookies.get("admin_token")?.value || "";

  // -------------------------
  // صفحه Login
  // -------------------------
  if (pathname.startsWith("/admin/login")) {
    if (!token) {
      return NextResponse.next();
    }

    const valid =
      await verifyAdminToken(token);

    // اگر هنوز لاگین معتبر است،
    // اصلاً صفحه Login را نشان نده
    if (valid) {
      const url = req.nextUrl.clone();

      url.pathname = "/admin/analytics";
      url.search = "";

      return NextResponse.redirect(url);
    }

    // کوکی مانده ولی دیگر معتبر نیست
    const response = NextResponse.next();

    response.cookies.delete("admin_token");

    return response;
  }

  // -------------------------
  // مسیرهای مدیریتی
  // -------------------------
  if (pathname.startsWith("/admin")) {
    if (!token) {
      const url = req.nextUrl.clone();

      url.pathname = "/admin/login";

      url.searchParams.set(
        "redirect",
        pathname,
      );

      return NextResponse.redirect(url);
    }

    const valid =
      await verifyAdminToken(token);

    if (!valid) {
      const url = req.nextUrl.clone();

      url.pathname = "/admin/login";

      url.searchParams.set(
        "redirect",
        pathname,
      );

      const response =
        NextResponse.redirect(url);

      response.cookies.delete(
        "admin_token",
      );

      return response;
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};