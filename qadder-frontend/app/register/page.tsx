"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const steps = ["بيانات الحساب", "البيانات الشخصية", "بيانات المركبة"];

const vehicleOptions = [
  { brand: "هونداي", model: "اكسنت", year: "2013" },
  { brand: "هونداي", model: "النترا", year: "2018" },
  { brand: "نيسان", model: "صني", year: "2020" },
];

const nationalityOptions = [
  "سعودي",
  "مصري",
  "سوري",
  "أردني",
  "يمني",
  "سوداني",
  "هندي",
  "باكستاني",
  "فلبيني",
  "أخرى",
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
  "ح",
  "د",
  "ر",
  "س",
  "ص",
  "ط",
  "ع",
  "ق",
  "ك",
  "ل",
  "م",
  "ن",
  "هـ",
  "و",
  "ي",
  "خ",
  "ت",
  "ج",
  "ف",
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

/**
 * Reusable custom dropdown component
 * This gives full control over width and layout across devices.
 */
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

  /* Close dropdown on option selection */
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

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const [form, setForm] = useState({
    email: "",
    phone_number: "",
    password: "",
    confirmPassword: "",

    national_id: "",
    first_name: "",
    second_name: "",
    third_name: "",
    last_name: "",
    nationality: "",
    date_of_birth: "",

    brand: "",
    model: "",
    year: "",
    color: "",
    plate_letter_1: "",
    plate_letter_2: "",
    plate_letter_3: "",
    plate_numbers: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* Get all available vehicle brands */
  const availableBrands = useMemo(() => {
    return [...new Set(vehicleOptions.map((v) => v.brand))];
  }, []);

  /* Get available models based on selected brand */
  const availableModels = useMemo(() => {
    if (!form.brand) return [];
    return [
      ...new Set(
        vehicleOptions
          .filter((v) => v.brand === form.brand)
          .map((v) => v.model)
      ),
    ];
  }, [form.brand]);

  /* Get available years based on selected brand and model */
  const availableYears = useMemo(() => {
    if (!form.brand || !form.model) return [];
    return [
      ...new Set(
        vehicleOptions
          .filter((v) => v.brand === form.brand && v.model === form.model)
          .map((v) => v.year)
      ),
    ];
  }, [form.brand, form.model]);

  /* Handle regular input changes */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "plate_numbers") {
      const cleaned = value.replace(/\D/g, "").slice(0, 4);
      setForm((prev) => ({ ...prev, plate_numbers: cleaned }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* Handle custom dropdown changes */
  const handleDropdownChange = (name: string, value: string) => {
    if (name === "brand") {
      setForm((prev) => ({
        ...prev,
        brand: value,
        model: "",
        year: "",
      }));
      return;
    }

    if (name === "model") {
      setForm((prev) => ({
        ...prev,
        model: value,
        year: "",
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* Validate current step before moving forward */
  const nextStep = () => {
    setError("");

    if (currentStep === 0) {
      if (
        !form.email ||
        !form.phone_number ||
        !form.password ||
        !form.confirmPassword
      ) {
        setError("أكمل بيانات الحساب");
        return;
      }

      if (form.password !== form.confirmPassword) {
        setError("كلمة المرور وتأكيدها غير متطابقين");
        return;
      }

      if (form.password.length < 6) {
        setError("كلمة المرور يجب أن تكون 6 خانات أو أكثر");
        return;
      }
    }

    if (currentStep === 1) {
      if (
        !form.national_id ||
        !form.first_name ||
        !form.second_name ||
        !form.third_name ||
        !form.last_name ||
        !form.nationality ||
        !form.date_of_birth
      ) {
        setError("أكمل البيانات الشخصية");
        return;
      }
    }

    setCurrentStep((prev) => prev + 1);
  };

  /* Move back to previous step */
  const prevStep = () => {
    setError("");
    setCurrentStep((prev) => prev - 1);
  };

  /* Submit registration payload */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep !== 2) return;

    setError("");

    if (!form.brand) {
      setError("اختر شركة الصنع");
      return;
    }

    if (!form.model) {
      setError("اختر موديل السيارة");
      return;
    }

    if (!form.year) {
      setError("اختر سنة الصنع");
      return;
    }

    if (!form.color) {
      setError("اختر لون السيارة");
      return;
    }

    if (!form.plate_letter_1 || !form.plate_letter_2 || !form.plate_letter_3) {
      setError("اختر حروف اللوحة");
      return;
    }

    if (form.plate_numbers.length !== 4) {
      setError("رقم اللوحة يجب أن يكون 4 أرقام");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        email: form.email,
        phone_number: form.phone_number,
        password: form.password,

        national_id: form.national_id,
        first_name: form.first_name,
        second_name: form.second_name,
        third_name: form.third_name,
        last_name: form.last_name,
        nationality: form.nationality,
        date_of_birth: form.date_of_birth,

        brand: form.brand,
        model: form.model,
        year: Number(form.year),
        color: form.color,
        plate_number: `${form.plate_letter_1} ${form.plate_letter_2} ${form.plate_letter_3} ${form.plate_numbers}`,
      };

      console.log("payload:", payload);

      const res = await fetch("http://127.0.0.1:8000/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "فشل إنشاء الحساب");
      }

      router.push("/verify-phone");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("حدث خطأ غير متوقع");
      }
    } finally {
      setLoading(false);
    }
  };

  /* Build the final plate preview value */
  const fullPlateNumber = `${form.plate_letter_1 || ""} ${form.plate_letter_2 || ""} ${form.plate_letter_3 || ""} ${form.plate_numbers || ""}`.trim();

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-qadder-background text-qadder-dark"
    >
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(173,200,147,0.18),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(39,75,44,0.08),_transparent_30%)]" />

        <div className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
          <div className="w-full max-w-2xl min-w-0">
            <div className="rounded-[28px] border border-qadder-border/30 bg-qadder-card p-6 shadow-[0_20px_60px_rgba(16,47,21,0.08)] sm:p-8 lg:p-10">
              {/* Page header */}
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-qadder-light">
                  <img
                    src="/images/logo.png"
                    alt="قدر"
                    className="h-10 object-contain"
                  />
                </div>

                <h1 className="text-2xl font-extrabold text-qadder-dark sm:text-3xl">
                  إنشاء حساب
                </h1>

                <p className="mt-3 text-sm text-qadder-dark/60">
                  أنشئ حسابك بخطوات بسيطة
                </p>
              </div>

              {/* Progress steps */}
              <div className="mb-8 overflow-x-auto pb-1">
                <div className="flex min-w-[520px] items-start justify-between gap-2 sm:min-w-[600px]">
                  {steps.map((step, index) => {
                    const active = index === currentStep;
                    const done = index < currentStep;

                    return (
                      <div key={step} className="flex flex-1 items-start">
                        <div className="flex flex-1 flex-col items-center text-center">
                          {/* Step circle */}
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition ${
                              done
                                ? "bg-qadder-primary text-white"
                                : active
                                ? "border border-qadder-primary bg-white text-qadder-primary ring-4 ring-qadder-secondary/25"
                                : "border border-qadder-border/40 bg-white text-qadder-dark/55"
                            }`}
                          >
                            {done ? <Check size={16} /> : index + 1}
                          </div>

                          {/* Step label */}
                          <p
                            className={`mt-2 text-[11px] leading-5 sm:text-sm ${
                              active
                                ? "font-bold text-qadder-dark"
                                : "font-medium text-qadder-dark/60"
                            }`}
                          >
                            {step}
                          </p>
                        </div>

                        {/* Step connector */}
                        {index !== steps.length - 1 && (
                          <div className="mt-5 h-[2px] flex-1 bg-qadder-border/30">
                            <div
                              className={`h-full ${
                                done ? "bg-qadder-primary" : "bg-transparent"
                              }`}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form body */}
              <form onSubmit={handleSubmit} className="max-w-full space-y-5">
                {currentStep === 0 && (
                  <>
                    {/* Email field */}
                    <div className="min-w-0">
                      <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                        البريد الإلكتروني <span className="mr-1 text-red-500">*</span>
                      </label>
                      <input
                        name="email"
                        type="email"
                        placeholder="أدخل البريد الإلكتروني"
                        value={form.email}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>

                    {/* Phone field */}
                    <div className="min-w-0">
                      <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                        رقم الجوال <span className="mr-1 text-red-500">*</span>
                      </label>
                      <input
                        name="phone_number"
                        type="text"
                        placeholder="أدخل رقم الجوال"
                        value={form.phone_number}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>

                    {/* Password field */}
                    <div className="min-w-0">
                      <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                        كلمة المرور <span className="mr-1 text-red-500">*</span>
                      </label>
                      <input
                        name="password"
                        type="password"
                        placeholder="أدخل كلمة المرور"
                        value={form.password}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>

                    {/* Confirm password field */}
                    <div className="min-w-0">
                      <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                        تأكيد كلمة المرور <span className="mr-1 text-red-500">*</span>
                      </label>
                      <input
                        name="confirmPassword"
                        type="password"
                        placeholder="أعد إدخال كلمة المرور"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>
                  </>
                )}

                {currentStep === 1 && (
                  <>
                    {/* National ID */}
                    <div className="min-w-0">
                      <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                        رقم الهوية <span className="mr-1 text-red-500">*</span>
                      </label>
                      <input
                        name="national_id"
                        type="text"
                        placeholder="أدخل رقم الهوية"
                        value={form.national_id}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>

                    {/* First name */}
                    <div className="min-w-0">
                      <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                        الاسم الأول <span className="mr-1 text-red-500">*</span>
                      </label>
                      <input
                        name="first_name"
                        type="text"
                        placeholder="أدخل الاسم الأول"
                        value={form.first_name}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>

                    {/* Second name */}
                    <div className="min-w-0">
                      <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                        الاسم الثاني <span className="mr-1 text-red-500">*</span>
                      </label>
                      <input
                        name="second_name"
                        type="text"
                        placeholder="أدخل الاسم الثاني"
                        value={form.second_name}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>

                    {/* Third name */}
                    <div className="min-w-0">
                      <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                        الاسم الثالث <span className="mr-1 text-red-500">*</span>
                      </label>
                      <input
                        name="third_name"
                        type="text"
                        placeholder="أدخل الاسم الثالث"
                        value={form.third_name}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>

                    {/* Last name */}
                    <div className="min-w-0">
                      <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                        اسم العائلة <span className="mr-1 text-red-500">*</span>
                      </label>
                      <input
                        name="last_name"
                        type="text"
                        placeholder="أدخل اسم العائلة"
                        value={form.last_name}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>

                    {/* Nationality field */}
                    <div className="min-w-0">
                      <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                        الجنسية <span className="mr-1 text-red-500">*</span>
                      </label>
                      <CustomDropdown
                        value={form.nationality}
                        placeholder="اختر الجنسية"
                        options={nationalityOptions}
                        onChange={(value) =>
                          handleDropdownChange("nationality", value)
                        }
                      />
                    </div>

                    {/* Birth date */}
                    <div className="min-w-0">
                      <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                        تاريخ الميلاد <span className="mr-1 text-red-500">*</span>
                      </label>
                      <input
                        name="date_of_birth"
                        type="date"
                        value={form.date_of_birth}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>
                  </>
                )}

                {currentStep === 2 && (
                  <>
                    {/* Vehicle brand */}
                    <div className="min-w-0">
                      <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                        شركة الصنع <span className="mr-1 text-red-500">*</span>
                      </label>
                      <CustomDropdown
                        value={form.brand}
                        placeholder="اختر شركة الصنع"
                        options={availableBrands}
                        onChange={(value) => handleDropdownChange("brand", value)}
                      />
                    </div>

                    {/* Vehicle model */}
                    <div className="min-w-0">
                      <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                        موديل السيارة <span className="mr-1 text-red-500">*</span>
                      </label>
                      <CustomDropdown
                        value={form.model}
                        placeholder="اختر الموديل"
                        options={availableModels}
                        onChange={(value) => handleDropdownChange("model", value)}
                        disabled={!form.brand}
                      />
                    </div>

                    {/* Vehicle year */}
                    <div className="min-w-0">
                      <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                        سنة الصنع <span className="mr-1 text-red-500">*</span>
                      </label>
                      <CustomDropdown
                        value={form.year}
                        placeholder="اختر سنة الصنع"
                        options={availableYears}
                        onChange={(value) => handleDropdownChange("year", value)}
                        disabled={!form.model}
                      />
                    </div>

                    {/* Vehicle color */}
                    <div className="min-w-0">
                      <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                        اللون <span className="mr-1 text-red-500">*</span>
                      </label>
                      <CustomDropdown
                        value={form.color}
                        placeholder="اختر اللون"
                        options={colorOptions}
                        onChange={(value) => handleDropdownChange("color", value)}
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
                              value={form.plate_letter_1}
                              placeholder="-"
                              options={arabicPlateLetters}
                              onChange={(value) =>
                                handleDropdownChange("plate_letter_1", value)
                              }
                            />

                            <CustomDropdown
                              value={form.plate_letter_2}
                              placeholder="-"
                              options={arabicPlateLetters}
                              onChange={(value) =>
                                handleDropdownChange("plate_letter_2", value)
                              }
                            />

                            <CustomDropdown
                              value={form.plate_letter_3}
                              placeholder="-"
                              options={arabicPlateLetters}
                              onChange={(value) =>
                                handleDropdownChange("plate_letter_3", value)
                              }
                            />
                          </div>
                        </div>

                        {/* Plate numbers */}
                        <div className="min-w-0">
                          <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                            أرقام اللوحة
                          </label>
                          <input
                            name="plate_numbers"
                            type="text"
                            value={form.plate_numbers}
                            onChange={handleChange}
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
                          <p className="mt-2 text-lg font-bold text-qadder-dark/35">
                            ستظهر اللوحه هنا بعد اختيار الحروف والأرقام
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Error message */}
                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                {/* Form actions */}
                <div className="mt-6 space-y-3">
                  {currentStep < steps.length - 1 ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        nextStep();
                      }}
                      disabled={loading}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-qadder-primary px-5 py-4 text-sm font-bold text-white transition hover:bg-qadder-dark disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? "جاري التنفيذ..." : "التالي"}
                      {!loading && <ChevronLeft size={18} />}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-qadder-primary px-5 py-4 text-sm font-bold text-white transition hover:bg-qadder-dark disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? "جاري الإنشاء..." : "إنشاء حساب"}
                    </button>
                  )}

                  {currentStep > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        prevStep();
                      }}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-qadder-border/40 bg-white px-5 py-4 text-sm font-bold text-qadder-dark transition hover:bg-qadder-background"
                    >
                      <ChevronRight size={18} />
                      السابق
                    </button>
                  )}
                </div>
              </form>

              {/* Login link */}
              {currentStep === 0 && (
                <div className="mt-6 text-center text-sm text-qadder-dark/70">
                  لديك حساب؟{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-qadder-primary transition hover:text-qadder-dark"
                  >
                    تسجيل الدخول
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}