// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const base =
      (process.env.BACKEND_URL && process.env.BACKEND_URL.trim()) ||
      "http://127.0.0.1:4000";

    // ارسال ایمیل+پسورد یا apiKey به بک‌اند
    const r = await fetch(`${base}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = await r.json().catch(() => null);

    if (!json?.ok || !json?.token) {
      return NextResponse.json(
        { ok: false, error: json?.error || "login_failed" },
        { status: 401 }
      );
    }

    // ✅ ست‌کردن توکن سشن در کوکی httpOnly
    const res = NextResponse.json({
      ok: true,
      admin: json.admin,
      redirect: true, // 👈 به کلاینت علامت بده موفق بوده
    });

    res.cookies.set({
      name: "admin_token",
      value: json.token,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: false, // روی پرود حتما true
      maxAge: 60 * 60 * 24 * 7, // ۷ روز
    });

    return res;
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "internal_error" },
      { status: 500 }
    );
  }
}