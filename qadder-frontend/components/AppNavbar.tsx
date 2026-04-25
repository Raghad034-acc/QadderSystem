// Navigation bar component Provides a responsive top navbar with a mobile side menu for navigating between pages.
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

// Props type for AppNavbar component
type AppNavbarProps = {
  isLoggedIn?: boolean;
  handleLogout?: () => void;
  contactHref?: string;
};

// App navbar component
export default function AppNavbar({
  isLoggedIn = false,
  handleLogout,
  contactHref,
}: AppNavbarProps) {
  // Controls mobile side menu visibility
  const [menuOpen, setMenuOpen] = useState(false);

  // Shared class for menu items
  const itemClass =
    "flex w-full items-center justify-start gap-3 rounded-xl px-4 py-3 text-right text-qadder-dark transition-all duration-200 hover:bg-qadder-primary/10 active:scale-[0.98] active:bg-qadder-primary/20";

  // Shared class for menu item wrapper/divider
  const dividerClass = "border-b border-qadder-border/40 pb-2 last:border-b-0";

  // Logout handler
  const onLogout = () => {
    // Use custom logout handler if provided
    if (handleLogout) {
      handleLogout();
      return;
    }

    // Clear stored user/session-related data
    localStorage.removeItem("user");
    localStorage.removeItem("latestNajmStep1");
    localStorage.removeItem("latestNajmStep2");
    localStorage.removeItem("latestNajmStep3");
    localStorage.removeItem("latestNajmStep4");
    localStorage.removeItem("latestNajmStep5");
    localStorage.removeItem("latestNajmStep6");
    localStorage.removeItem("latestNajmStep7");
    localStorage.removeItem("latestNajmStep8");

    // Redirect to home page
    window.location.href = "/";
  };

  return (
    <>
      {/* Top navbar */}
      <header className="sticky top-0 z-50 border-b border-qadder-border/30 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-row-reverse items-center justify-between px-6 py-4">
          {/* Logo */}
          <div className="flex items-center gap-1">
            <img
              src="/images/LetterLogo.png"
              alt="Qadder Logo"
              className="h-11 w-auto"
            />
          </div>

          {/* Open menu button */}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-qadder-border/40 bg-qadder-primary/5"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* Side menu overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40"
          onClick={() => setMenuOpen(false)}
        >
          {/* Side menu panel */}
          <div
            dir="rtl"
            className="absolute right-0 top-0 h-full w-72 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Menu header */}
            <div className="mb-6 flex items-center justify-between border-b border-qadder-border/40 pb-4">
              <h3 className="text-lg font-bold text-qadder-dark">القائمة</h3>

              {/* Close menu button */}
              <button
                onClick={() => setMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-qadder-primary/5 text-qadder-dark"
              >
                <X size={20} />
              </button>
            </div>

            {/* Menu items */}
            <div className="flex flex-col gap-2">
              <div className={dividerClass}>
                <Link
                  href="/"
                  onClick={() => setMenuOpen(false)}
                  className={itemClass}
                >
                  <Home size={18} className="shrink-0 text-qadder-primary" />
                  <span className="font-medium">الرئيسية</span>
                </Link>
              </div>

              {/* Account link for logged-in users */}
              {isLoggedIn && (
                <div className={dividerClass}>
                  <Link
                    href="/account"
                    onClick={() => setMenuOpen(false)}
                    className={itemClass}
                  >
                    <User size={18} className="shrink-0 text-qadder-primary" />
                    <span className="font-medium">حسابي</span>
                  </Link>
                </div>
              )}

              {/* Vehicles link for logged-in users */}
              {isLoggedIn && (
                <div className={dividerClass}>
                  <Link
                    href="/vehicles"
                    onClick={() => setMenuOpen(false)}
                    className={itemClass}
                  >
                    <Car size={18} className="shrink-0 text-qadder-primary" />
                    <span className="font-medium">مركباتي</span>
                  </Link>
                </div>
              )}

              {/* Reports link for logged-in users */}
              {isLoggedIn && (
                <div className={dividerClass}>
                  <Link
                    href="/reports"
                    onClick={() => setMenuOpen(false)}
                    className={itemClass}
                  >
                    <FileText
                      size={18}
                      className="shrink-0 text-qadder-primary"
                    />
                    <span className="font-medium">تقاريري</span>
                  </Link>
                </div>
              )}

              {/* About link */}
              <div className={dividerClass}>
                <Link
                  href="/"
                  onClick={() => setMenuOpen(false)}
                  className={itemClass}
                >
                  <Info size={18} className="shrink-0 text-qadder-primary" />
                  <span className="font-medium">عن قدر</span>
                </Link>
              </div>

              {/* Contact link if provided */}
              {contactHref && (
                <div className={dividerClass}>
                  <a
                    href={contactHref}
                    onClick={() => setMenuOpen(false)}
                    className={itemClass}
                  >
                    <Phone size={18} className="shrink-0 text-qadder-primary" />
                    <span className="font-medium">تواصل معنا</span>
                  </a>
                </div>
              )}

              {/* Logout if logged in, otherwise login */}
              {isLoggedIn ? (
                <div className={dividerClass}>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onLogout();
                    }}
                    className={`${itemClass} text-qadder-logout`}
                  >
                    <LogOut size={18} className="shrink-0" />
                    <span className="font-medium">تسجيل الخروج</span>
                  </button>
                </div>
              ) : (
                <div className={dividerClass}>
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className={itemClass}
                  >
                    <LogIn size={18} className="shrink-0 text-qadder-primary" />
                    <span className="font-medium">تسجيل الدخول</span>
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