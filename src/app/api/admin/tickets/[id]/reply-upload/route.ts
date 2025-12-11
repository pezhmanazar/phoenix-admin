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

    // ۱) فرم از کلاینت
    const inForm = await req.formData();

    // ۲) کپی‌کردن فرم برای فوروارد (بدون دست‌کاری header)
    const outForm = new FormData();
    for (const [k, v] of inForm.entries()) {
      // v می‌تونه string یا File/Blob باشه
      outForm.append(k, v as any);
    }

    // ۳) ارسال به بک‌اند
    const backendRes = await fetch(
      `${base}/api/admin/tickets/${id}/reply-upload`,
      {
        method: "POST",
        headers: {
          // ❗ نوع محتوا رو خود fetch برای FormData ست می‌کند
          "x-admin-token": token,
        },
        body: outForm,
        cache: "no-store",
      }
    );

    // ۴) تلاش برای خواندن JSON؛ اگر نشد، متن خام را داریم
    const rawText = await backendRes.text();
    let data: any = null;
    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch {
      data = null;
    }

    // ۵) اگر بک‌اند خطا داد یا data.ok === false بود
    if (!backendRes.ok || (data && data.ok === false)) {
      const errMsg =
        (data && data.error) ||
        rawText || // ممکن است HTML باشد؛ برای دیباگ مفید است
        `HTTP_${backendRes.status}`;

      return NextResponse.json(
        { ok: false, error: errMsg },
        { status: backendRes.status || 500 }
      );
    }

    // ۶) موفق
    if (data) {
      return NextResponse.json(data, { status: backendRes.status || 200 });
    }

    // اگر بک‌اند بدنه‌ای نداد ولی status اوکی بود
    return NextResponse.json({ ok: true }, { status: backendRes.status || 200 });
  } catch (e) {
    console.error("proxy reply-upload error:", e);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}