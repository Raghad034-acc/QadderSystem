"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppNavbar from "@/components/AppNavbar";
import PageLoader from "@/components/PageLoader";
import ContactUs from "@/components/ContactUs";
import { Check } from "lucide-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
      <main dir="rtl"
        className="min-h-screen bg-qadder-background text-qadder-dark">
        <AppNavbar isLoggedIn={true} handleLogout={handleLogout} />

        <section className="mx-auto max-w-7xl px-6 py-16">
          <PageLoader text="   جاري تحميل الصفحة..." />
        </section>
      </main>
    );
  }

  return (
    <main dir="rtl"
      className="min-h-screen bg-qadder-background text-qadder-dark">
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

          {/* Steps Progress */}
          <div className="overflow-x-auto pb-1">
            <div className="mx-auto flex min-w-[860px] items-start justify-between gap-2">
              {steps.map((step, index) => {
                const stepNumber = index + 1;
                const done = stepNumber < 2;
                const active = stepNumber === 2;

                return (
                  <div key={step} className="flex flex-1 items-start">
                    <div className="flex flex-1 flex-col items-center text-center">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full border text-sm font-bold transition ${done
                          ? "border-qadder-primary bg-white text-qadder-primary ring-4 ring-qadder-secondary/25"
                          : active
                            ? "border-qadder-primary bg-white text-qadder-primary ring-4 ring-qadder-secondary/25"
                            : "border border-qadder-border/40 bg-white text-qadder-dark/55"
                          }`}
                      >
                        {stepNumber}
                      </div>

                      <p
                        className={`mt-3 text-xs leading-6 md:text-sm ${active || done
                          ? "font-bold text-qadder-dark"
                          : "font-medium text-qadder-dark/65"
                          }`}
                      >
                        {step}
                      </p>
                    </div>

                    {/* Progress line */}
                    {index !== steps.length - 1 && (
                      <div className="mt-6 h-[2px] flex-1 rounded-full bg-qadder-border/30">
                        <div
                          className={`h-full rounded-full ${done ? "bg-qadder-primary" : "bg-transparent"
                            }`}
                        />
                      </div>
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

              <div className="mt-6">
                <button
                  type="submit"
                  disabled={uploading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-qadder-primary px-5 py-4 text-sm font-bold text-white transition hover:bg-qadder-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploading ? "جاري رفع التقرير..." : "التالي"}
                  {!uploading && <ChevronLeft size={18} />}
                </button>
              </div>

            </form>
          </div>
          <div className="mx-auto max-w-4xl rounded-[32px] border border-qadder-border/20 bg-white p-5 shadow-sm md:p-8">

            {/* Guidelines */}
            <div>
              <h2 className="text-right text-xl font-bold text-qadder-dark">
                إرشادات قبل الرفع
              </h2>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <GuidelineItem
                  title="اختر المركبة"
                  description="تأكد أن المركبة المختارة هي نفس المركبة المذكورة في تقرير نجم."
                />

                <GuidelineItem
                  title="رفع التقرير"
                  description="النظام يقبل فقط الملفات بصيغة PDF."
                />

                <GuidelineItem
                  title="المطابقة التلقائية"
                  description="سيتم التحقق من بيانات التقرير ومقارنتها مع حسابك والمركبة."
                />
              </div>
            </div>
          </div>
        </div>

      </section>
      <ContactUs />


    </main>
  );
}
function GuidelineItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-qadder-background/45 p-4">
      <div className="rounded-full bg-white p-2 text-qadder-primary shadow-sm">
        <Check size={15} />
      </div>

      <div className="text-right">
        <p className="text-sm font-bold text-qadder-dark">{title}</p>
        <p className="mt-1 text-sm leading-7 text-qadder-dark/70">
          {description}
        </p>
      </div>
    </div>
  );
}