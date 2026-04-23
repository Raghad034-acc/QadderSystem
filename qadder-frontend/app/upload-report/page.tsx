"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CircleAlert,
  CircleCheckBig,
  Paperclip,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
} from "lucide-react";

import AppNavbar from "@/components/AppNavbar";
import PageLoader from "@/components/PageLoader";
import ContactUs from "@/components/ContactUs";

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

/* Shared dropdown button styling */
const dropdownButtonClass =
  "flex w-full min-w-0 items-center justify-between rounded-2xl border border-qadder-border bg-qadder-background px-4 py-3.5 text-base text-qadder-dark outline-none transition hover:border-qadder-secondary focus:border-qadder-secondary focus:bg-qadder-light";

/* Shared dropdown menu styling */
const dropdownMenuClass =
  "absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-qadder-border bg-white shadow-[0_12px_30px_rgba(16,47,21,0.12)]";

/* Reusable custom dropdown */
function CustomDropdown({
  value,
  placeholder,
  options,
  onChange,
  disabled = false,
}: {
  value: string;
  placeholder: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedOption = options.find((option) => option.value === value);

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative min-w-0">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`${dropdownButtonClass} ${disabled ? "cursor-not-allowed opacity-60" : ""
          }`}
      >
        <span className={value ? "text-qadder-dark" : "text-qadder-dark/35"}>
          {selectedOption?.label || placeholder}
        </span>

        <ChevronDown
          className={`h-5 w-5 shrink-0 text-qadder-dark/45 transition ${open ? "rotate-180" : ""
            }`}
        />
      </button>

      {open && !disabled && (
        <div className={dropdownMenuClass}>
          <div className="max-h-60 overflow-y-auto py-1">
            {options.map((option) => {
              const isSelected = value === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`flex w-full items-center justify-between px-4 py-3 text-right text-sm transition ${isSelected
                    ? "bg-qadder-light font-bold text-qadder-primary"
                    : "text-qadder-dark hover:bg-qadder-background"
                    }`}
                >
                  <span>{option.label}</span>
                  {isSelected && <Check className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

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

  // Handle user logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  // Load user data from localStorage
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

  // Fetch user vehicles after loading user data
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

  // Handle PDF file selection
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

  // Handle Najm report upload submission
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
          <PageLoader text="جاري تحميل الصفحة..." />
        </section>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-qadder-background text-qadder-dark">
      <AppNavbar
        isLoggedIn={true}
        handleLogout={handleLogout}
        contactHref="#contact"
      />

      {/* Header and steps section */}
      <section
        className="relative overflow-hidden border-b border-qadder-border/20"
        dir="rtl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(173,200,147,0.16),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(39,75,44,0.08),_transparent_30%)]" />

        <div className="relative mx-auto max-w-6xl px-6 py-6 md:py-8">
          {/* Steps progress */}
          <div className="overflow-x-auto pb-1">
            <div className="mx-auto flex min-w-[860px] items-start justify-between gap-2">
              {steps.map((step, index) => {
                const stepNumber = index + 1;
                const done = stepNumber < 1;
                const active = stepNumber === 1;

                return (
                  <div key={step} className="flex flex-1 items-start">
                    <div className="flex flex-1 flex-col items-center text-center">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full border text-sm font-bold transition ${done
                          ? "border-qadder-primary bg-qadder-primary text-white"
                          : active
                            ? "border-qadder-primary bg-white text-qadder-primary ring-4 ring-qadder-secondary/25"
                            : "border border-qadder-border/40 bg-white text-qadder-dark/55"
                          }`}
                      >
                        {done ? <Check size={18} /> : stepNumber}
                      </div>

                      <p
                        className={`mt-3 text-xs leading-6 md:text-sm ${active
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

          {/* Title */}
          <div className="mt-6 max-w-3xl text-right">
            <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
              رفع تقرير نجم
            </h1>

            <p className="mt-4 text-base leading-8 text-qadder-dark/70 md:text-lg">
              ارفع تقرير نجم   ليتم تحليل البيانات ومطابقتها تلقائيًا.
            </p>
          </div>
        </div>
      </section>

      {/* Main content section */}
      <section className="mx-auto max-w-6xl px-6 py-6 md:py-8" dir="rtl">
        <div className="mx-auto max-w-4xl rounded-[32px] border border-qadder-border/20 bg-white p-5 shadow-sm md:p-8">
          {/* Guidelines */}
          <div>
            <h2 className="text-right text-xl font-bold text-qadder-dark">
              إرشادات قبل رفع التقرير
            </h2>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <GuidelineItem
                title="اختيار المركبة الصحيحة"
                description="تأكد من اختيار نفس المركبة المذكورة في تقرير نجم."
              />
              <GuidelineItem
                title="صيغة الملف"
                description="يجب أن يكون التقرير المرفوع بصيغة PDF فقط."
              />
              <GuidelineItem
                title="المطابقة التلقائية"
                description="سيتم التحقق من بيانات التقرير ومقارنتها مع الحساب والمركبة تلقائيًا."
              />
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="mt-5 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-right text-red-600">
              <CircleAlert className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mt-5 flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-right text-green-700">
              <CircleCheckBig className="h-5 w-5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-6" dir="rtl">
            {/* Vehicle selection field */}
            {/* Vehicle selection field */}
            <div className="min-w-0">
              <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                اختر المركبة <span className="text-red-500">*</span>
              </label>

              <CustomDropdown
                value={selectedVehicleId}
                placeholder="اختر المركبة"
                options={vehicles.map((vehicle) => ({
                  value: vehicle.id,
                  label: `${vehicle.brand} ${vehicle.model} - ${vehicle.plate_number}`,
                }))}
                onChange={setSelectedVehicleId}
              />
            </div>

            {/* PDF upload field */}
            <div>


              <label className="flex cursor-pointer flex-col items-center justify-center rounded-[30px] border-2 border-dashed border-qadder-border/70 bg-qadder-background/60 px-6 py-10 text-center transition hover:border-qadder-primary hover:bg-qadder-light/35">
                <div className="mb-5 rounded-full bg-white p-5 text-qadder-primary shadow-sm transition">
                  <Paperclip className="h-7 w-7" />
                </div>

                <p className="text-lg font-bold text-qadder-dark">
                  {selectedFile ? selectedFile.name : "اضغط لاختيار ملف التقرير "}
                  <span className="text-red-500">*</span>
                </p>

                <p className="mt-2 text-sm leading-7 text-qadder-dark/65">
                  الصيغة المسموح بها: PDF فقط
                </p>

                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Actions */}
            <div className="mt-6 space-y-3">
              <button
                type="submit"
                disabled={uploading}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-qadder-primary px-5 py-4 text-sm font-bold text-white transition hover:bg-qadder-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? "جاري الرفع..." : "التالي"}
                {!uploading && <ChevronLeft size={18} />}
              </button>

              <button
                type="button"
                onClick={() => router.push("/")}
                className="inline-flex w-full items-center justify-center rounded-2xl border border-qadder-border/40 bg-white px-5 py-4 text-sm font-bold text-qadder-dark transition hover:bg-qadder-background"
              >
                <ChevronRight size={18} />
                السابق
              </button>
            </div>
          </form>
        </div>
      </section>

      <ContactUs />
    </main>
  );
}

/**
 * Reusable guideline item component
 */
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