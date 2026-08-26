import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function backendBase(): string {
  return (
    (process.env.NEXT_PUBLIC_BACKEND_URL &&
      process.env.NEXT_PUBLIC_BACKEND_URL.trim()) ||
    (process.env.BACKEND_URL &&
      process.env.BACKEND_URL.trim()) ||
    "http://127.0.0.1:4000"
  );
}

async function adminTokenFromCookie(): Promise<string> {
  try {
    const jar = await cookies();
    return jar.get("admin_token")?.value || "";
  } catch {
    return "";
  }
}

export async function PATCH(
  req: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  const { id } = await context.params;

  const token = await adminTokenFromCookie();

  const targetUrl =
    `${backendBase()}/api/admin/notification-campaigns/${id}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (token.trim()) {
    headers["x-admin-token"] = token.trim();
  }

  const body = await req.text().catch(() => "{}");

  const response = await fetch(targetUrl, {
    method: "PATCH",
    headers,
    body: body || "{}",
    cache: "no-store",
  });

  const text = await response.text();

  return new NextResponse(text, {
    status: response.status,
    headers: {
      "Content-Type":
        response.headers.get("content-type") ||
        "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}