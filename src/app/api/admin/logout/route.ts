// src/app/api/admin/logout/route.ts
import { NextResponse, type NextRequest } from "next/server";

function clearTokenCookie(res: NextResponse) {
  res.cookies.set({
    name: "admin_token",
    value: "",
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: false,   // روی HTTPS = true
    expires: new Date(0), // پاک کردن
  });
}

export async function POST(req: NextRequest) {
  // اگر توکن داریم، بک‌اند را هم خبر کنیم که revoke کند
  const token = req.cookies.get("admin_token")?.value;
  if (token) {
    const base = (process.env.BACKEND_URL && process.env.BACKEND_URL.trim()) || "http://127.0.0.1:4000";
    try {
      await fetch(`${base}/api/admin/logout`, {
        method: "POST",
        headers: { "x-admin-token": token },
      });
    } catch {
      // اگر شبکه خطا داد، ایرادی نداره؛ کوکی را پاک می‌کنیم
    }
  }

  const res = NextResponse.json({ ok: true });
  clearTokenCookie(res);
  return res;
}

// برای سازگاری اگر GET هم بزنی:
export async function GET(req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: "admin_token",
    value: "",
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    expires: new Date(0),
  });
  return res;
}