"use client";

import { usePathname } from "next/navigation";
import React from "react";

export default function AdminHeaderVisibility({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (
    pathname === "/admin/login" ||
    pathname.startsWith("/admin/login/")
  ) {
    return null;
  }

  return <>{children}</>;
}