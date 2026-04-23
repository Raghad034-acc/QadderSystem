"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AppNavbar from "@/components/AppNavbar";
import PageLoader from "@/components/PageLoader";
import ContactUs from "@/components/ContactUs";
import {
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleCheckBig,
  BadgePlus,
} from "lucide-react";

type User = {
  auth_account_id?: string;
  user_profile_id?: string;
  first_name?: string;
  last_name?: string;
};

const vehicleOptions = [
  { brand: "هونداي", model: "اكسنت", year: "2013" },
  { brand: "هونداي", model: "النترا", year: "2018" },
  { brand: "نيسان", model: "صني", year: "2020" },
];

const colorOptions = [
  "أبيض",
  "أسود",
  "فضي",
  "رمادي",
  "برونزي",
  "أزرق",
  "أحمر",
  "ذهبي",
  "أخضر",
];

const arabicPlateLetters = [ 
  "أ",
  "ب",
  "ت",
  "ث",
  "ج",
  "ح",
  "خ",
  "د",
  "ذ",
  "ر",
  "ز",
  "س",
  "ش",
  "ص",
  "ض",
  "ط",
  "ظ",
  "ع",
  "غ",
  "ف",
  "ق",
  "ك",
  "ل",
  "م",
  "ن",
  "هـ",
  "و",
  "ي",
  "ى",
];

/* Shared input styling */
const inputClass =
  "block w-full min-w-0 rounded-2xl border border-qadder-border bg-qadder-background px-4 py-3.5 text-base text-qadder-dark outline-none transition placeholder:text-qadder-dark/35 focus:border-qadder-secondary focus:bg-qadder-light";

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
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  /* Close dropdown when clicking outside */
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

  /* Select dropdown value */
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
        className={`${dropdownButtonClass} ${
          disabled ? "cursor-not-allowed opacity-60" : ""
        }`}
      >
        <span className={value ? "text-qadder-dark" : "text-qadder-dark/35"}>
          {value || placeholder}
        </span>

        <ChevronDown
          className={`h-5 w-5 shrink-0 text-qadder-dark/45 transition ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !disabled && (
        <div className={dropdownMenuClass}>
          <div className="max-h-60 overflow-y-auto py-1">
            {options.map((option) => {
              const isSelected = value === option;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`flex w-full items-center justify-between px-4 py-3 text-right text-sm transition ${
                    isSelected
                      ? "bg-qadder-light font-bold text-qadder-primary"
                      : "text-qadder-dark hover:bg-qadder-background"
                  }`}
                >
                  <span>{option}</span>
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

export default function AddVehiclePage() {
  const [user, setUser] = useState<User | null>(null);

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [color, setColor] = useState("");

  const [plateLetter1, setPlateLetter1] = useState("");
  const [plateLetter2, setPlateLetter2] = useState("");
  const [plateLetter3, setPlateLetter3] = useState("");
  const [plateNumbers, setPlateNumbers] = useState("");

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    /* Load user from localStorage */
    try {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        window.location.href = "/login";
        return;
      }

      const parsedUser: User = JSON.parse(storedUser);
      setUser(parsedUser);
    } catch (err) {
      console.error("Error reading user:", err);
      setError("تعذر قراءة بيانات المستخدم");
    } finally {
      setPageLoading(false);
    }
  }, []);

  /* Available brands */
  const availableBrands = useMemo(() => {
    return [...new Set(vehicleOptions.map((item) => item.brand))];
  }, []);

  /* Available models based on brand */
  const availableModels = useMemo(() => {
    if (!brand) return [];
    return [
      ...new Set(
        vehicleOptions
          .filter((item) => item.brand === brand)
          .map((item) => item.model)
      ),
    ];
  }, [brand]);

  /* Available years based on brand and model */
  const availableYears = useMemo(() => {
    if (!brand || !model) return [];
    return [
      ...new Set(
        vehicleOptions
          .filter((item) => item.brand === brand && item.model === model)
          .map((item) => item.year)
      ),
    ];
  }, [brand, model]);

  /* Build plate preview */
  const fullPlateNumber = useMemo(() => {
    const letters = [plateLetter1, plateLetter2, plateLetter3]
      .filter(Boolean)
      .join(" ");
    const numbers = plateNumbers.trim();
    return `${letters}${letters && numbers ? " " : ""}${numbers}`.trim();
  }, [plateLetter1, plateLetter2, plateLetter3, plateNumbers]);

  const handleBrandChange = (value: string) => {
    /* Reset dependent fields when brand changes */
    setBrand(value);
    setModel("");
    setYear("");
  };

  const handleModelChange = (value: string) => {
    /* Reset year when model changes */
    setModel(value);
    setYear("");
  };

  const handlePlateNumbersChange = (value: string) => {
    /* Keep only 4 digits */
    const onlyDigits = value.replace(/\D/g, "").slice(0, 4);
    setPlateNumbers(onlyDigits);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.user_profile_id) {
      setError("معرف المستخدم غير موجود");
      return;
    }

    if (!brand) {
      setError("اختر شركة الصنع");
      return;
    }

    if (!model) {
      setError("اختر موديل السيارة");
      return;
    }

    if (!year) {
      setError("اختر سنة الصنع");
      return;
    }

    if (!color) {
      setError("اختر اللون");
      return;
    }

    if (!plateLetter1 || !plateLetter2 || !plateLetter3) {
      setError("اختر حروف اللوحة");
      return;
    }

    if (plateNumbers.length !== 4) {
      setError("رقم اللوحة يجب أن يكون 4 أرقام");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const res = await fetch("http://127.0.0.1:8000/vehicles/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_profile_id: user.user_profile_id,
          brand,
          model,
          year: Number(year),
          color,
          plate_number: fullPlateNumber,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.detail || "فشل في إضافة المركبة");
      }

      setSuccess("تمت إضافة المركبة بنجاح");

      /* Reset form after success */
      setBrand("");
      setModel("");
      setYear("");
      setColor("");
      setPlateLetter1("");
      setPlateLetter2("");
      setPlateLetter3("");
      setPlateNumbers("");

      setTimeout(() => {
        window.location.href = "/vehicles";
      }, 1200);
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("حدث خطأ أثناء إضافة المركبة");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    /* Clear session and go home */
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  if (pageLoading) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-qadder-background text-qadder-dark"
      >
        <AppNavbar isLoggedIn={true} handleLogout={handleLogout} />
        <section className="mx-auto max-w-4xl px-6 py-16">
          <PageLoader text="جاري تحميل الصفحة..." />
        </section>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-qadder-background text-qadder-dark"
    >
      <AppNavbar isLoggedIn={true} handleLogout={handleLogout} />

      <section className="relative overflow-hidden border-b border-qadder-border/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(173,200,147,0.18),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(39,75,44,0.08),_transparent_30%)]" />

        <div className="relative mx-auto max-w-5xl px-6 py-12 md:py-16">
          <div className="text-right">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-qadder-border bg-white/80 px-4 py-2 text-sm font-semibold text-qadder-dark shadow-sm backdrop-blur">
              <BadgePlus size={16} className="text-qadder-primary" />
              <span>إضافة مركبة جديدة</span>
            </div>

            <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
              إضافة مركبة جديدة
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-8 text-qadder-dark/70 md:text-lg">
              أضف مركبتك وسجّل بياناتها لتكون جاهزة للاستفادة من خدمات قدّر.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-10">
        <div className="rounded-[28px] border border-qadder-border/30 bg-qadder-card p-6 shadow-[0_20px_60px_rgba(16,47,21,0.08)] sm:p-8">
          {/* Error message */}
          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <div className="flex items-center justify-start gap-2">
                <CircleAlert size={18} />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <div className="flex items-center justify-start gap-2">
                <CircleCheckBig size={18} />
                <span>{success}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="max-w-full space-y-5">
            {/* Vehicle brand */}
            <div className="min-w-0">
              <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                شركة الصنع <span className="mr-1 text-red-500">*</span>
              </label>
              <CustomDropdown
                value={brand}
                placeholder="اختر شركة الصنع"
                options={availableBrands}
                onChange={handleBrandChange}
              />
            </div>

            {/* Vehicle model */}
            <div className="min-w-0">
              <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                موديل السيارة <span className="mr-1 text-red-500">*</span>
              </label>
              <CustomDropdown
                value={model}
                placeholder="اختر الموديل"
                options={availableModels}
                onChange={handleModelChange}
                disabled={!brand}
              />
            </div>

            {/* Vehicle year */}
            <div className="min-w-0">
              <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                سنة الصنع <span className="mr-1 text-red-500">*</span>
              </label>
              <CustomDropdown
                value={year}
                placeholder="اختر سنة الصنع"
                options={availableYears}
                onChange={setYear}
                disabled={!model}
              />
            </div>

            {/* Vehicle color */}
            <div className="min-w-0">
              <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                اللون <span className="mr-1 text-red-500">*</span>
              </label>
              <CustomDropdown
                value={color}
                placeholder="اختر اللون"
                options={colorOptions}
                onChange={setColor}
              />
            </div>

            {/* Plate information */}
            <div className="rounded-3xl border border-qadder-border/20 bg-qadder-background/50 p-4 sm:p-5">
              <h2 className="mb-4 text-right text-lg font-bold text-qadder-dark">
                بيانات اللوحة <span className="mr-1 text-red-500">*</span>
              </h2>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* Plate letters */}
                <div className="min-w-0">
                  <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                    حروف اللوحة
                  </label>

                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <CustomDropdown
                      value={plateLetter1}
                      placeholder="-"
                      options={arabicPlateLetters}
                      onChange={setPlateLetter1}
                    />

                    <CustomDropdown
                      value={plateLetter2}
                      placeholder="-"
                      options={arabicPlateLetters}
                      onChange={setPlateLetter2}
                    />

                    <CustomDropdown
                      value={plateLetter3}
                      placeholder="-"
                      options={arabicPlateLetters}
                      onChange={setPlateLetter3}
                    />
                  </div>
                </div>

                {/* Plate numbers */}
                <div className="min-w-0">
                  <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                    أرقام اللوحة
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={plateNumbers}
                    onChange={(e) => handlePlateNumbersChange(e.target.value)}
                    placeholder="مثال: 1234"
                    className={inputClass}
                  />
                </div>
              </div>

       {/* Plate preview */}
<div className="mt-5 rounded-2xl bg-white p-4 text-right shadow-sm">
  <p className="text-sm font-semibold text-qadder-dark/60">
    رقم اللوحة النهائي
  </p>

  {fullPlateNumber ? (
    <p className="mt-2 text-lg font-bold text-qadder-primary">
      {fullPlateNumber}
    </p>
  ) : (
    <p className="mt-2 text-sm text-gray-400">
      مثال: ب ب ب 1111
    </p>
  )}
</div>
            </div>

            {/* Action buttons */}
            <div className="mt-6 space-y-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-qadder-primary px-5 py-4 text-sm font-bold text-white transition hover:bg-qadder-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "جاري الإضافة..." : "حفظ المركبة"}
              </button>

              <button
                type="button"
                onClick={() => (window.location.href = "/vehicles")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-qadder-border/40 bg-white px-5 py-4 text-sm font-bold text-qadder-dark transition hover:bg-qadder-background"
              >
                <ChevronRight size={18} />
                رجوع
              </button>
            </div>
          </form>
        </div>
      </section>

      <ContactUs />
    </main>
  );
}