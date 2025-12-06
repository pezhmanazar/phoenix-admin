// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // اجازه‌ی دسترسی به صفحه لاگین و APIهای عمومی لاگین/لاگ‌اوت
  if (
    pathname.startsWith("/admin/login") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/logout")
  ) {
    return NextResponse.next();
  }

  // محافظت از مسیرهای /admin/*
  if (pathname.startsWith("/admin")) {
    const token = req.cookies.get("admin_token")?.value;
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    // ✅ در این مرحله فقط وجود کوکی کافی است
    return NextResponse.next();
  }

  return NextResponse.next();
}

// فقط روی مسیرهای /admin اعمال می‌شود
export const config = {
  matcher: ["/admin/:path*"],
};