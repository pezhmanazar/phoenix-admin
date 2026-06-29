"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import LogoutButton from "./LogoutButton.client";

type AdminRole = "owner" | "manager" | "agent";

type AdminHeaderActionsProps = {
  role: AdminRole;
};

type MenuItem = {
  href: string;
  label: string;
  icon: string;
  title: string;
  ownerOnly?: boolean;
  style: {
    border: string;
    backgroundColor: string;
    color: string;
    fontWeight?: number;
  };
};

const navBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "9px 12px",
  borderRadius: 12,
  fontSize: "12px",
  fontWeight: 900,
  textDecoration: "none",
  whiteSpace: "nowrap",
  lineHeight: 1,
  flex: "0 0 auto",
};

const menuItems: MenuItem[] = [
  {
    href: "/admin/users",
    label: "مدیریت کاربران",
    icon: "👥",
    title: "مدیریت کاربران",
    style: {
      border: "1px solid #7c3aed",
      backgroundColor: "#2e1065",
      color: "#f5f3ff",
    },
  },
  {
    href: "/admin/website-analytics",
    label: "آمار سایت",
    icon: "📊",
    title: "آمار و تحلیل بازدید سایت",
    style: {
      border: "1px solid #f97316",
      backgroundColor: "#1c1917",
      color: "#fed7aa",
    },
  },
  {
    href: "/admin/tickets",
    label: "مدیریت تیکت‌ها",
    icon: "🎫",
    title: "مدیریت تیکت‌ها",
    style: {
      border: "1px solid #22c55e",
      backgroundColor: "#064e3b",
      color: "#dcfce7",
    },
  },
  {
    href: "/admin/announcements",
    label: "بنر همگانی",
    icon: "📣",
    title: "مدیریت بنرهای همگانی اپ",
    style: {
      border: "1px solid #ea580c",
      backgroundColor: "#7c2d12",
      color: "#ffedd5",
    },
  },
  {
    href: "/admin/admins",
    label: "مدیریت ادمین‌ها",
    icon: "🛡️",
    title: "مدیریت ادمین‌ها",
    ownerOnly: true,
    style: {
      border: "1px solid #0f766e",
      backgroundColor: "#0f766e",
      color: "#ecfeff",
    },
  },
  {
    href: "/admin/profile",
    label: "ویرایش پروفایل",
    icon: "✏️",
    title: "ویرایش پروفایل",
    style: {
      border: "1px solid #374151",
      backgroundColor: "#111827",
      color: "#e5e7eb",
      fontWeight: 800,
    },
  },
];

export default function AdminHeaderActions({ role }: AdminHeaderActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const visibleItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (item.ownerOnly && role !== "owner") return false;
      return true;
    });
  }, [role]);

  useEffect(() => {
    const update = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    update();
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("resize", update);
    };
  }, []);

  if (!isMobile) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          justifyContent: "flex-start",
          flexWrap: "nowrap",
          overflowX: "auto",
          overflowY: "hidden",
          maxWidth: "100%",
          paddingBottom: 2,
          WebkitOverflowScrolling: "touch",
        }}
      >
        {visibleItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              ...navBase,
              ...item.style,
            }}
            title={item.title}
          >
            <span aria-hidden>{item.icon}</span>
            {item.label}
          </Link>
        ))}

        <div style={{ flex: "0 0 auto" }}>
          <LogoutButton />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "flex-end",
        flex: "0 0 auto",
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "بستن منوی مدیریت" : "باز کردن منوی مدیریت"}
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          border: "1px solid #334155",
          backgroundColor: isOpen ? "#1e293b" : "#020617",
          color: "#e5e7eb",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          fontSize: 24,
          fontWeight: 900,
          lineHeight: 1,
        }}
      >
        {isOpen ? "×" : "☰"}
      </button>

      {isOpen ? (
        <>
          <button
            type="button"
            aria-label="بستن منوی مدیریت"
            onClick={() => setIsOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.4)",
              border: "none",
              zIndex: 40,
              cursor: "default",
            }}
          />

          <div
            style={{
              position: "absolute",
              top: 50,
              right: 0,
              width: 200,
              padding: 8,
              borderRadius: 16,
              backgroundColor: "#020617",
              border: "1px solid #1e293b",
              boxShadow: "0 18px 45px rgba(0,0,0,0.6)",
              zIndex: 9999,
              display: "flex",
              flexDirection: "column",
              gap: 7,
              direction: "rtl",
            }}
          >
            {visibleItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                title={item.title}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: 8,
                  padding: "11px 12px",
                  borderRadius: 12,
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: item.style.fontWeight || 900,
                  whiteSpace: "nowrap",
                  ...item.style,
                }}
              >
                <span aria-hidden>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}

            <div
              style={{
                paddingTop: 4,
                borderTop: "1px solid #1e293b",
              }}
              onClick={() => setIsOpen(false)}
            >
              <LogoutButton />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
