"use client";

import { useState } from "react";
import Link from "next/link";

type AppNavbarProps = {
  isLoggedIn?: boolean;
  handleLogout?: () => void;
  contactHref?: string;
};

export default function AppNavbar({
  isLoggedIn = false,
  handleLogout,
  contactHref,
}: AppNavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-qadder-border/30 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-1">
            <img
              src="/images/logo.png"
              alt="شعار قدر"
              className="h-11 w-auto"
            />
          </div>

          <button
            onClick={() => setMenuOpen(true)}
            className="flex flex-col gap-1"
          >
            <span className="block h-0.5 w-6 bg-qadder-dark"></span>
            <span className="block h-0.5 w-6 bg-qadder-dark"></span>
            <span className="block h-0.5 w-6 bg-qadder-dark"></span>
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-black/40">
          <div className="absolute right-0 top-0 h-full w-64 bg-white p-6 shadow-xl">
            <button
              onClick={() => setMenuOpen(false)}
              className="mb-6 text-xl"
            >
              ✕
            </button>

            <div className="flex flex-col gap-4 text-right">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="text-qadder-dark font-medium"
              >
                الرئيسية
              </Link>

              {isLoggedIn ? (
                <>
                  <Link
                    href="/account"
                    onClick={() => setMenuOpen(false)}
                    className="text-qadder-dark font-medium"
                  >
                    حسابي
                  </Link>

                 
                </>
              ) : null}

              <Link
                href="/about"
                onClick={() => setMenuOpen(false)}
                className="text-qadder-dark font-medium"
              >
                عن قدر
              </Link>

              {contactHref && (
                <a
                  href={contactHref}
                  onClick={() => setMenuOpen(false)}
                  className="text-qadder-dark font-medium"
                >
                  تواصل معنا
                </a>
              )}

              {isLoggedIn ? (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    handleLogout?.();
                  }}
                  className="mt-4 block rounded-xl bg-qadder-logout py-3 text-center text-white"
                >
                  تسجيل الخروج
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="mt-4 block rounded-xl bg-qadder-primary py-3 text-center text-white"
                >
                  تسجيل الدخول
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}