"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppNavbar from "@/components/AppNavbar";
import Link from "next/link";

type StoredUser = {
  user_profile_id?: string;
  first_name?: string;
};

type Vehicle = {
  id: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  plate_number: string;
};

const steps = [
  "رفع التقرير",
  "رفع الصورة",
  "تحليل الأضرار",
  "حساب التكلفة",
  "التقرير النهائي",
];

export default function UploadReportPage() {
  const router = useRouter();

  const [user, setUser] = useState<StoredUser | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [pageLoading, setPageLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        window.location.href = "/login";
        return;
      }

      const parsedUser: StoredUser = JSON.parse(storedUser);

      if (!parsedUser.user_profile_id) {
        setError("معرف المستخدم غير موجود");
        setPageLoading(false);
        return;
      }

      setUser(parsedUser);
    } catch (err: unknown) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "تعذر قراءة بيانات المستخدم"
      );
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.user_profile_id) return;

    const fetchVehicles = async () => {
      try {
        setError("");

        const res = await fetch(
          `http://127.0.0.1:8000/vehicles/user/${user.user_profile_id}`
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.detail || "فشل في تحميل المركبات");
        }

        setVehicles(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        console.error(err);
        setError(
          err instanceof Error ? err.message : "فشل في تحميل المركبات"
        );
      } finally {
        setPageLoading(false);
      }
    };

    fetchVehicles();
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.type !== "application/pdf") {
      setError("يُسمح فقط برفع ملفات PDF");
      setSelectedFile(null);
      return;
    }

    setError("");
    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.user_profile_id) {
      setError("معرف المستخدم غير موجود");
      return;
    }

    if (!selectedVehicleId) {
      setError("الرجاء اختيار المركبة");
      return;
    }

    if (!selectedFile) {
      setError("الرجاء رفع تقرير نجم بصيغة PDF");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccess("");

      const formData = new FormData();
      formData.append("user_profile_id", user.user_profile_id);
      formData.append("vehicle_id", selectedVehicleId);
      formData.append("file", selectedFile);

      const res = await fetch(
        "http://127.0.0.1:8000/step1/upload-najm-report",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        if (typeof data?.detail === "string") {
          throw new Error(data.detail);
        }

        if (data?.detail?.message) {
          throw new Error(data.detail.message);
        }

        throw new Error("فشل في رفع التقرير");
      }

      localStorage.setItem("latestNajmStep1", JSON.stringify(data));

      setSuccess("تم رفع التقرير ومطابقة البيانات بنجاح");

      setTimeout(() => {
        router.push("/report-review");
      }, 1200);
    } catch (err: unknown) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "حدث خطأ أثناء رفع التقرير"
      );
    } finally {
      setUploading(false);
    }
  };

  if (pageLoading) {
    return (
      <main className="min-h-screen bg-qadder-background text-qadder-dark">
        <AppNavbar isLoggedIn={true} handleLogout={handleLogout} />
        <section className="mx-auto max-w-5xl px-6 py-16" dir="rtl">
          <div className="rounded-[28px] border border-qadder-border/20 bg-white p-12 text-center shadow-sm">
            جاري تحميل الصفحة...
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-qadder-background text-qadder-dark">
      <AppNavbar
        isLoggedIn={true}
        handleLogout={handleLogout}
        contactHref="#contact"
      />

      <section
        className="relative overflow-hidden border-b border-qadder-border/20"
        dir="rtl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(173,200,147,0.18),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(39,75,44,0.08),_transparent_30%)]" />

        <div className="relative mx-auto max-w-6xl px-6 py-12 md:py-16">
          <div className="max-w-4xl text-right">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-qadder-border bg-qadder-light px-4 py-2 text-sm font-semibold text-qadder-primary shadow-sm">
                   <span>الخطوة الأولى</span>
            </div>

            <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
              رفع تقرير نجم
            </h1>

            <p className="mt-4 text-base leading-8 text-qadder-dark/70 md:text-lg">
              ارفع تقرير نجم بصيغة PDF، ثم سيقوم النظام باستخراج البيانات
              ومقارنتها تلقائيًا مع معلومات حسابك والمركبة التي اخترتها.
            </p>
          </div>

          <div className="mt-8 overflow-x-auto">
            <div className="flex min-w-[850px] items-center gap-3">
              {steps.map((step, index) => {
                const active = index === 0;
                const done = index < 0;

                return (
                  <div key={step} className="flex flex-1 items-center gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        done
                          ? "bg-qadder-primary text-white"
                          : active
                          ? "border border-qadder-border bg-white text-qadder-primary"
                          : "bg-white text-qadder-dark/50"
                      }`}
                    >
                      {index + 1}
                    </div>

                    <div className="min-w-[120px]">
                      <p
                        className={`text-sm font-semibold ${
                          active || done
                            ? "text-qadder-dark"
                            : "text-qadder-dark/45"
                        }`}
                      >
                        {step}
                      </p>
                    </div>

                    {index < steps.length - 1 && (
                      <div className="h-[2px] flex-1 bg-qadder-border/40" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10" dir="rtl">
    

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[28px] border border-qadder-border/20 bg-white p-6 shadow-sm md:p-8">
            {error && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-right text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-right text-green-700">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
              <div>
                <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                  اختر المركبة
                </label>

                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full rounded-2xl border border-qadder-border bg-white px-4 py-3 outline-none transition focus:border-qadder-primary"
                >
                  <option value="">اختر المركبة</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.brand} {vehicle.model} - {vehicle.plate_number}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                  رفع تقرير نجم (PDF)
                </label>

                <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-qadder-border bg-qadder-background/40 px-6 py-10 text-center transition hover:border-qadder-primary hover:bg-qadder-light/40">
                  <span className="mb-3 text-4xl">📎</span>
                  <span className="text-base font-bold text-qadder-dark">
                    {selectedFile
                      ? selectedFile.name
                      : "اضغط لاختيار ملف التقرير"}
                  </span>
                  <span className="mt-2 text-sm text-qadder-dark/60">
                    الصيغة المسموح بها: PDF فقط
                  </span>

                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="rounded-2xl border border-qadder-border px-6 py-3 font-semibold text-qadder-dark transition hover:bg-qadder-light"
                >
                  رجوع
                </button>

                <button
                  type="submit"
                  disabled={uploading}
                  className="rounded-2xl bg-qadder-primary px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploading ? "جاري رفع التقرير..." : "رفع التقرير والمتابعة"}
                </button>
              </div>
            </form>
          </div>

          <div
            className="rounded-[28px] border border-qadder-border/20 bg-white p-6 shadow-sm md:p-8"
            dir="rtl"
          >
            <h2 className="mb-4 text-right text-xl font-bold">قبل رفع التقرير</h2>

            <div className="space-y-4 text-right">
              <div className="rounded-2xl bg-qadder-background/50 p-4">
                <p className="text-sm font-semibold text-qadder-dark">
                  1. اختر المركبة الصحيحة
                </p>
                <p className="mt-2 text-sm leading-7 text-qadder-dark/65">
                  تأكد أن المركبة المختارة هي نفس المركبة المذكورة في تقرير نجم.
                </p>
              </div>

              <div className="rounded-2xl bg-qadder-background/50 p-4">
                <p className="text-sm font-semibold text-qadder-dark">
                  2. ارفع التقرير بصيغة PDF
                </p>
                <p className="mt-2 text-sm leading-7 text-qadder-dark/65">
                  النظام لن يقبل أي صيغة أخرى غير PDF.
                </p>
              </div>

              <div className="rounded-2xl bg-qadder-background/50 p-4">
                <p className="text-sm font-semibold text-qadder-dark">
                  3. ستتم المطابقة تلقائيًا
                </p>
                <p className="mt-2 text-sm leading-7 text-qadder-dark/65">
                  سيتم مقارنة بيانات التقرير مع بيانات حسابك والمركبة قبل
                  الانتقال للخطوة التالية.
                </p>
              </div>
            </div>

            {vehicles.length > 0 && (
              <div className="mt-6 rounded-2xl border border-qadder-border/20 bg-qadder-light/40 p-4 text-right">
                <p className="text-sm font-semibold text-qadder-dark">
                  المركبات المتوفرة حاليًا
                </p>
                <p className="mt-2 text-sm text-qadder-dark/70">
                  لديك {vehicles.length} مركبة مسجلة في النظام.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>


    </main>
  );
}