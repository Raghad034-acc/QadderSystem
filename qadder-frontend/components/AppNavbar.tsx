"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  Home,
  User,
  Car,
  FileText,
  Info,
  Phone,
  LogIn,
  LogOut,
} from "lucide-react";

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

  const itemClass =
    "flex items-center justify-end rounded-xl px-4 py-3 text-qadder-dark transition-all duration-200 hover:bg-qadder-primary/10 active:scale-[0.98] active:bg-qadder-primary/20";

  const dividerClass = "border-b border-qadder-border/40 pb-2 last:border-b-0";

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-qadder-border/30 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-row-reverse items-center justify-between px-6 py-4">
          
          {/* Logo */}
          <div className="flex items-center gap-1">
            <img
              src="/images/logo.png"
              alt="Qadder Logo"
              className="h-11 w-auto"
            />
          </div>

          {/* Menu Button */}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-qadder-border/40 bg-qadder-primary/5"
          >
            <Menu size={22} />
          </button>

        </div>
      </header>

      {menuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="absolute right-0 top-0 h-full w-72 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Menu Header */}
            <div className="mb-6 flex items-center justify-between border-b border-qadder-border/40 pb-4">
              <h3 className="text-lg font-bold">القائمة</h3>

              {/* Close Button */}
              <button
                onClick={() => setMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-qadder-primary/5"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-2 text-right">

              <div className={dividerClass}>
                <Link href="/" onClick={() => setMenuOpen(false)} className={itemClass}>
                  <span className="flex flex-row-reverse items-center gap-3 font-medium">
                    <Home size={18} className="text-qadder-primary" />
                    الرئيسية
                  </span>
                </Link>
              </div>

              {isLoggedIn && (
                <div className={dividerClass}>
                  <Link href="/account" onClick={() => setMenuOpen(false)} className={itemClass}>
                    <span className="flex flex-row-reverse items-center gap-3 font-medium">
                      <User size={18} className="text-qadder-primary" />
                      حسابي
                    </span>
                  </Link>
                </div>
              )}

              {isLoggedIn && (
                <div className={dividerClass}>
                  <Link href="/vehicles" onClick={() => setMenuOpen(false)} className={itemClass}>
                    <span className="flex flex-row-reverse items-center gap-3 font-medium">
                      <Car size={18} className="text-qadder-primary" />
                      مركباتي
                    </span>
                  </Link>
                </div>
              )}

              {isLoggedIn && (
                <div className={dividerClass}>
                  <Link href="/reports" onClick={() => setMenuOpen(false)} className={itemClass}>
                    <span className="flex flex-row-reverse items-center gap-3 font-medium">
                      <FileText size={18} className="text-qadder-primary" />
                      تقاريري
                    </span>
                  </Link>
                </div>
              )}

              <div className={dividerClass}>
                <Link href="/" onClick={() => setMenuOpen(false)} className={itemClass}>
                  <span className="flex flex-row-reverse items-center gap-3 font-medium">
                    <Info size={18} className="text-qadder-primary" />
                    عن قدر
                  </span>
                </Link>
              </div>

              {contactHref && (
                <div className={dividerClass}>
                  <a href={contactHref} onClick={() => setMenuOpen(false)} className={itemClass}>
                    <span className="flex flex-row-reverse items-center gap-3 font-medium">
                      <Phone size={18} className="text-qadder-primary" />
                      تواصل معنا
                    </span>
                  </a>
                </div>
              )}

              {isLoggedIn ? (
                <div className={dividerClass}>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      handleLogout?.();
                    }}
                    className={`${itemClass} w-full`}
                  >
                    <span className="flex flex-row-reverse items-center gap-3 font-medium text-qadder-logout">
                      <LogOut size={18} />
                      تسجيل الخروج
                    </span>
                  </button>
                </div>
              ) : (
                <div className={dividerClass}>
                  <Link href="/login" onClick={() => setMenuOpen(false)} className={itemClass}>
                    <span className="flex flex-row-reverse items-center gap-3 font-medium">
                      <LogIn size={18} className="text-qadder-primary" />
                      تسجيل الدخول
                    </span>
                  </Link>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
}