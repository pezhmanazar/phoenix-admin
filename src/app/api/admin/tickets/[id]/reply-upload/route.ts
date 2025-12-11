import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const token = (await cookies()).get("admin_token")?.value;
    if (!token) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 }
      );
    }

    const base =
      (process.env.BACKEND_URL && process.env.BACKEND_URL.trim()) ||
      "http://127.0.0.1:4000";

    // فرم کلاینت را بخوان
    const inForm = await req.formData();

    // یک FormData جدید بساز تا بدون set کردن دستی content-type فوروارد شود
    const outForm = new FormData();
    for (const [k, v] of inForm.entries()) {
      outForm.append(k, v as any);
    }

    const res = await fetch(
      `${base}/api/admin/tickets/${id}/reply-upload`,
      {
        method: "POST",
        headers: {
          // boundary را خود fetch ست می‌کند
          "x-admin-token": token,
        },
        body: outForm,
        cache: "no-store",
      }
    );

    const rawText = await res.text();
    let json: any = null;

    try {
      json = JSON.parse(rawText);
    } catch {
      json = null;
    }

    // اگر بک‌اند JSON معتبر برگرداند
    if (json && typeof json === "object") {
      // اگر ok=false بود، همونو پاس بده
      if (!res.ok || json.ok === false) {
        const msg =
          json.error ||
          (res.status === 413
            ? "حجم فایل زیاد است. لطفاً فایل را کوچک‌تر (مثلاً زیر چند مگابایت) ارسال کنید."
            : "ارسال فایل ناموفق بود.");
        return NextResponse.json(
          { ok: false, error: msg },
          { status: res.status }
        );
      }

      // همه‌چیز اوکی
      return NextResponse.json(json, { status: res.status });
    }

    // اینجا یعنی بک‌اند HTML یا چیز دیگری داده (مثلاً صفحهٔ خطا از WCDN)
    let friendly = "ارسال فایل ناموفق بود.";
    if (res.status === 413 || rawText.includes("Request Entity Too Large")) {
      friendly =
        "حجم فایل زیاد است و در مسیر (CDN/سرور) بلاک می‌شود. لطفاً نسخهٔ کم‌حجم‌تر یا برش‌خورده بفرستید.";
    }

    return NextResponse.json(
      { ok: false, error: friendly },
      { status: res.status || 500 }
    );
  } catch (e) {
    console.error("proxy reply-upload error:", e);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}