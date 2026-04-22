"use client";

import { useEffect, useMemo, useState } from "react";
import AppNavbar from "@/components/AppNavbar";
import PageLoader from "@/components/PageLoader";
import ContactUs from "@/components/ContactUs";
import { PencilLine, Trash2 } from "lucide-react";

// Account data type
type AccountData = {
  user_profile_id: string;
  email?: string;
  phone_number?: string;
  national_id?: string;
  first_name?: string;
  second_name?: string;
  third_name?: string;
  last_name?: string;
  nationality?: string;
  date_of_birth?: string;
};

// Account page component
export default function AccountPage() {
  // User, loading, and error states
  const [user, setUser] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  // Fetch account data on mount
  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const storedUser = localStorage.getItem("user");

        // Redirect to login if no user is stored
        if (!storedUser) {
          window.location.href = "/login";
          return;
        }

        const parsedUser = JSON.parse(storedUser);

        // Fetch account data from backend
        const res = await fetch(
          `http://127.0.0.1:8000/account/${parsedUser.user_profile_id}`
        );

        const data = await res.json();

        // Handle backend error
        if (!res.ok) {
          throw new Error(data?.detail || "فشل تحميل الحساب");
        }

        setUser(data);
      } catch {
        setError("حدث خطأ أثناء تحميل الحساب");
      } finally {
        setLoading(false);
      }
    };

    fetchAccount();
  }, []);

  // Build full name from available name fields
  const fullName = useMemo(() => {
    if (!user) return "";
    return [
      user.first_name,
      user.second_name,
      user.third_name,
      user.last_name,
    ]
      .filter(Boolean)
      .join(" ");
  }, [user]);

  // Loading state UI
  if (loading) {
    return (
      <main className="min-h-screen bg-qadder-background">
        <AppNavbar isLoggedIn />
        <section className="mx-auto max-w-6xl px-6 py-12">
          <PageLoader text="جاري تحميل الحساب..." />
        </section>
      </main>
    );
  }

  // Error state UI
  if (error) {
    return (
      <main className="min-h-screen bg-qadder-background">
        <AppNavbar isLoggedIn />
        <section className="mx-auto max-w-6xl px-6 py-12">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
            {error}
          </div>
        </section>
      </main>
    );
  }

  // Return nothing if user data is missing
  if (!user) return null;

  return (
    <main dir="rtl" className="min-h-screen bg-qadder-background text-qadder-dark">
      <AppNavbar isLoggedIn handleLogout={handleLogout} />

      {/* Header */}
      <section className="relative overflow-hidden border-b border-qadder-border/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(173,200,147,0.16),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(39,75,44,0.08),_transparent_30%)]" />

        <div className="relative mx-auto max-w-6xl px-6 py-6 md:py-8 text-right">
          <h1 className="text-3xl font-extrabold md:text-5xl">
            حسابي
          </h1>

          <p className="mt-4 text-base text-qadder-dark/70 md:text-lg">
            هنا يمكنك استعراض بياناتك الشخصية
          </p>
        </div>
      </section>

      {/* Main card */}
      <section className="mx-auto max-w-6xl px-6 py-6 md:py-8">
        <div className="mx-auto max-w-4xl rounded-[32px] border border-qadder-border/20 bg-white p-6 shadow-sm md:p-8">
          
          {/* Section title */}
          <div className="mb-6 text-right">
            <h2 className="text-xl font-bold text-qadder-dark">
              البيانات الشخصية
            </h2>
          </div>

          {/* Personal information */}
          <div className="grid gap-4 md:grid-cols-2">
            <InfoCard label="الاسم الكامل" value={fullName || "-"} />
            <InfoCard label="البريد الإلكتروني" value={user.email || "-"} />
            <InfoCard label="رقم الجوال" value={user.phone_number || "-"} />
            <InfoCard label="رقم الهوية" value={user.national_id || "-"} />
            <InfoCard label="الجنسية" value={user.nationality || "-"} />
            <InfoCard label="تاريخ الميلاد" value={user.date_of_birth || "-"} />
          </div>

          {/* Action buttons */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">

            {/* Edit button */}
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-qadder-border/50 bg-white px-4 py-3.5 text-sm font-semibold text-qadder-dark transition hover:bg-qadder-light"
            >
              <PencilLine size={16} />
              تعديل البيانات
            </button>

            {/* Delete account button */}
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-semibold text-qadder-error transition hover:bg-red-100"
            >
              <Trash2 size={16} />
              حذف الحساب
            </button>

          </div>

        </div>
      </section>

      <ContactUs />
    </main>
  );
}

// Reusable info card component
function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-qadder-border/20 bg-qadder-background px-4 py-3 text-right">

      <div className="flex items-center gap-2 flex-wrap" dir="rtl">
        
        <span className="text-sm font-bold text-qadder-dark whitespace-nowrap">
          {label}:
        </span>

        <span className="text-sm text-qadder-dark/80" dir="auto">
          {value}
        </span>

      </div>

    </div>
  );
}