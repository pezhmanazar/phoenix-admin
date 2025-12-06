import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = (await cookies()).get("admin_token")?.value;
    if (!token) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const base =
      (process.env.BACKEND_URL && process.env.BACKEND_URL.trim()) ||
      "http://127.0.0.1:4000";

    // فرم کلاینت را بخوان
    const inForm = await req.formData();

    // یک FormData جدید بساز تا بدون set کردن دستی content-type فوروارد شود
    const outForm = new FormData();
    for (const [k, v] of inForm.entries()) {
      // v می‌تواند string یا File باشد – مستقیم append کن
      outForm.append(k, v as any);
    }

    const res = await fetch(`${base}/api/admin/tickets/${params.id}/reply-upload`, {
      method: "POST",
      headers: {
        "x-admin-token": token, // محتوا را خود fetch بر اساس boundary ست می‌کند
      },
      body: outForm,
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error("proxy reply-upload error:", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}