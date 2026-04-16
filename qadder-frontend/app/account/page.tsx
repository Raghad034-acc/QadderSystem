"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppNavbar from "@/components/AppNavbar";

type Vehicle = {
  id: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  plate_number: string;
};

type Report = {
  id: string;
  case_number?: string;
  status?: string;
};

type AccountData = {
  auth_account_id: string;
  user_profile_id: string;
  email?: string;
  phone_number?: string;
  account_status?: string;
  national_id?: string;
  first_name?: string;
  second_name?: string;
  third_name?: string;
  last_name?: string;
  nationality?: string;
  date_of_birth?: string;
  vehicles: Vehicle[];
  reports: Report[];
  reports_count: number;
};

export default function AccountPage() {
  const [user, setUser] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const storedUser = localStorage.getItem("user");

        if (!storedUser) {
          window.location.href = "/login";
          return;
        }

        const parsedUser = JSON.parse(storedUser);

        if (!parsedUser.user_profile_id) {
          setError("معرف المستخدم غير موجود");
          setLoading(false);
          return;
        }

        const res = await fetch(
          `http://127.0.0.1:8000/account/${parsedUser.user_profile_id}`
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.detail || "فشل في تحميل بيانات الحساب");
        }

        setUser(data);
      }  catch (err: unknown) {
  setError(err instanceof Error ? err.message : "حدث خطأ أثناء تحميل الحساب");
      } finally {
        setLoading(false);
      }
    };

    fetchAccount();
  }, []);

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

  if (loading) {
    return (
      <main className="min-h-screen bg-qadder-background text-qadder-dark">
        <AppNavbar isLoggedIn={true} handleLogout={handleLogout} />
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="rounded-[28px] border border-qadder-border/20 bg-white p-12 text-center shadow-sm">
            جاري تحميل الحساب...
          </div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-qadder-background text-qadder-dark">
        <AppNavbar isLoggedIn={true} handleLogout={handleLogout} />
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="rounded-[28px] border border-red-200 bg-red-50 p-12 text-center shadow-sm">
            <p className="text-lg font-semibold text-red-600">{error}</p>
          </div>
        </section>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main
      className="min-h-screen bg-qadder-background text-qadder-dark"
  
    >
      <AppNavbar
        isLoggedIn={true}
        handleLogout={handleLogout}
        contactHref="#contact"
      />

      <section className="relative overflow-hidden border-b border-qadder-border/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(173,200,147,0.18),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(39,75,44,0.08),_transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-12 text-right md:py-16">
          <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
            حسابي
          </h1>
          <p className="mt-4 text-base leading-8 text-qadder-dark/70 md:text-lg">
            هنا تجد جميع بياناتك الشخصية، مركباتك المسجلة، والتقارير السابقة.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[28px] border border-qadder-border/20 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-right text-2xl font-bold">
              البيانات الشخصية
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoCard label="الاسم الكامل" value={fullName || "غير متوفر"} />
              <InfoCard
                label="البريد الإلكتروني"
                value={user.email || "غير متوفر"}
              />
              <InfoCard
                label="رقم الجوال"
                value={user.phone_number || "غير متوفر"}
              />
              <InfoCard
                label="رقم الهوية"
                value={user.national_id || "غير متوفر"}
              />
              <InfoCard
                label="الجنسية"
                value={user.nationality || "غير متوفر"}
              />
              <InfoCard
                label="تاريخ الميلاد"
                value={user.date_of_birth || "غير متوفر"}
              />
            </div>
          </div>

          <div className="grid gap-6">
            <div className="rounded-[28px] border border-qadder-border/20 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-right text-2xl font-bold">
                ملخص الحساب
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <SummaryCard
                  label="عدد المركبات"
                  value={user.vehicles?.length || 0}
                />
                <SummaryCard
                  label="عدد التقارير"
                  value={user.reports_count || 0}
                />
              </div>
            </div>

            <div className="rounded-[28px] border border-qadder-border/30 bg-white p-6 shadow-[0_20px_60px_rgba(16,47,21,0.08)]">
              <h2 className="mb-4 text-right text-xl font-bold">
                إجراءات سريعة
              </h2>

              <div className="grid gap-3">
                <Link
                  href="/vehicles"
                  className="rounded-2xl bg-qadder-primary px-5 py-3 text-center font-semibold text-white transition hover:bg-qadder-dark"
                >
                  عرض مركباتي
                </Link>

           

                <button
                  type="button"
                  className="rounded-2xl border border-qadder-border px-5 py-3 text-center font-semibold text-qadder-dark transition hover:bg-qadder-light"
                >
                  تعديل معلومات الحساب
                </button>

               
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-[28px] border border-qadder-border/20 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <span className="rounded-full bg-qadder-light px-4 py-2 text-sm font-semibold text-qadder-primary">
              {user.vehicles?.length || 0} عدد المركبات
            </span>

            <h2 className="text-right text-2xl font-bold text-qadder-dark">
              المركبات المسجلة
            </h2>
          </div>

          {user.vehicles?.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-qadder-border bg-qadder-background/40 p-10 text-center">
              لا توجد مركبات مسجلة
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {user.vehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="rounded-[28px] border border-qadder-border/20 bg-qadder-background/40 p-5"
                >
                  <div className="text-right">
                    <h3 className="text-xl font-bold text-qadder-dark">
                      {vehicle.brand} {vehicle.model}
                    </h3>
                    <p className="mt-2 text-sm font-semibold text-qadder-primary">
                      رقم اللوحة: {vehicle.plate_number}
                    </p>
                    <p className="mt-2 text-sm text-qadder-dark/70">
                      السنة: {vehicle.year} — اللون:{" "}
                      {vehicle.color || "غير محدد"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 rounded-[28px] border border-qadder-border/20 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <span className="rounded-full bg-qadder-light px-4 py-2 text-sm font-semibold text-qadder-primary">
              {user.reports_count || 0} تقرير
            </span>

            <h2 className="text-right text-2xl font-bold text-qadder-dark">
              التقارير السابقة
            </h2>
          </div>

          {user.reports?.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-qadder-border bg-qadder-background/40 p-10 text-center">
              لا توجد تقارير حتى الآن
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {user.reports.map((report) => (
                <div
                  key={report.id}
                  className="rounded-2xl border border-qadder-border/20 bg-qadder-background/40 p-5 text-right"
                >
                  <p className="font-bold text-qadder-dark">
                    رقم الحالة: {report.case_number || "غير متوفر"}
                  </p>
                  <p className="mt-2 text-sm text-qadder-dark/70">
                    الحالة: {report.status || "غير محددة"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="contact" className="bg-qadder-primary py-16 text-white">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h3 className="text-2xl font-bold md:text-3xl">تواصل معنا</h3>
          <p className="mt-4 text-white/80">
            📧{" "}
            <a href="mailto:support@qadder.com" className="hover:text-white">
              support@qadder.com
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-qadder-background/50 p-4 text-right">
      <p className="text-xs font-semibold text-qadder-dark/50">{label}</p>
      <p className="mt-2 text-sm font-bold text-qadder-dark">{value}</p>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-qadder-background/50 p-6 text-center">
      <p className="text-3xl font-extrabold text-qadder-primary">{value}</p>
      <p className="mt-2 text-sm font-semibold text-qadder-dark/70">{label}</p>
    </div>
  );
}