"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
];

const inputClass =
  "w-full rounded-2xl border border-qadder-border bg-qadder-background px-4 py-3.5 text-qadder-dark outline-none transition placeholder:text-qadder-dark/35 focus:border-qadder-secondary focus:bg-qadder-light";

const selectClass =
  "w-full rounded-2xl border border-qadder-border bg-qadder-background px-4 py-3.5 text-qadder-dark outline-none transition focus:border-qadder-secondary focus:bg-qadder-light";

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

  const availableBrands = useMemo(() => {
    return [...new Set(vehicleOptions.map((v) => v.brand))];
  }, []);

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "plate_numbers") {
      const cleaned = value.replace(/\D/g, "").slice(0, 4);
      setForm((prev) => ({ ...prev, plate_numbers: cleaned }));
      return;
    }

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

  const nextStep = () => {
    setError("");

    if (currentStep === 0) {
      if (
        !form.email ||
        !form.phone_number ||
        !form.password ||
        !form.confirmPassword
      ) {
        setError("أكملي بيانات الحساب");
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
        setError("أكملي البيانات الشخصية");
        return;
      }
    }

    setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setError("");
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    

    if (currentStep !== 2) return;

    setError("");

    if (!form.brand) {
      setError("اختاري شركة الصنع");
      return;
    }

    if (!form.model) {
      setError("اختاري موديل السيارة");
      return;
    }

    if (!form.year) {
      setError("اختاري سنة الصنع");
      return;
    }

    if (!form.color) {
      setError("اختاري لون السيارة");
      return;
    }

    if (!form.plate_letter_1 || !form.plate_letter_2 || !form.plate_letter_3) {
      setError("اختاري حروف اللوحة");
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
  const fullPlateNumber = `${form.plate_letter_1 || ""} ${form.plate_letter_2 || ""} ${form.plate_letter_3 || ""} ${form.plate_numbers || ""}`.trim();
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-qadder-background text-qadder-dark"
    >
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(173,200,147,0.18),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(39,75,44,0.08),_transparent_30%)]" />

        <div className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-12">
          <div className="w-full max-w-2xl">
            <div className="rounded-[28px] border border-qadder-border/30 bg-qadder-card p-8 shadow-[0_20px_60px_rgba(16,47,21,0.08)] sm:p-10">
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-qadder-light">
                  <img
                    src="/images/logo.png"
                    alt="قدر"
                    className="h-10 object-contain"
                  />
                </div>

                <h1 className="text-3xl font-extrabold text-qadder-dark">
                  إنشاء حساب
                </h1>

                <p className="mt-3 text-sm text-qadder-dark/60">
                  أنشئ حسابك بخطوات بسيطة
                </p>
              </div>

              <div className="mb-8">
                <div className="flex items-center justify-between gap-3">
                  {steps.map((step, index) => {
                    const active = index === currentStep;
                    const done = index < currentStep;

                    return (
                      <div key={step} className="flex flex-1 items-center gap-2">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${done
                              ? "bg-qadder-primary text-white"
                              : active
                                ? "border border-qadder-border bg-qadder-light text-qadder-primary"
                                : "bg-gray-100 text-gray-500"
                            }`}
                        >
                          {index + 1}
                        </div>

                        <div className="hidden sm:block">
                          <p
                            className={`text-sm font-medium ${active || done ? "text-qadder-dark" : "text-gray-400"
                              }`}
                          >
                            {step}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {currentStep === 0 && (
                  <>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                        البريد الإلكتروني
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

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                        رقم الجوال
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

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                        كلمة المرور
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

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                        تأكيد كلمة المرور
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
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                        رقم الهوية
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

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                        الاسم الأول
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

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                        الاسم الثاني
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

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                        الاسم الثالث
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

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                        اسم العائلة
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

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                        الجنسية
                      </label>
                      <select
                        name="nationality"
                        value={form.nationality}
                        onChange={handleChange}
                        className={selectClass}
                      >
                        <option value="">اختر الجنسية</option>
                        {nationalityOptions.map((nationality) => (
                          <option key={nationality} value={nationality}>
                            {nationality}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                        تاريخ الميلاد
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
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                        شركة الصنع
                      </label>
                      <select
                        name="brand"
                        value={form.brand}
                        onChange={handleChange}
                        className={selectClass}
                      >
                        <option value="">اختر شركة الصنع</option>
                        {availableBrands.map((brand) => (
                          <option key={brand} value={brand}>
                            {brand}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                        موديل السيارة
                      </label>
                      <select
                        name="model"
                        value={form.model}
                        onChange={handleChange}
                        disabled={!form.brand}
                        className={`${selectClass} disabled:opacity-60`}
                      >
                        <option value="">اختر الموديل</option>
                        {availableModels.map((model) => (
                          <option key={model} value={model}>
                            {model}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                        سنة الصنع
                      </label>
                      <select
                        name="year"
                        value={form.year}
                        onChange={handleChange}
                        disabled={!form.model}
                        className={`${selectClass} disabled:opacity-60`}
                      >
                        <option value="">اختر سنة الصنع</option>
                        {availableYears.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                        اللون
                      </label>
                      <select
                        name="color"
                        value={form.color}
                        onChange={handleChange}
                        className={selectClass}
                      >
                        <option value="">اختر اللون</option>
                        {colorOptions.map((color) => (
                          <option key={color} value={color}>
                            {color}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="rounded-3xl border border-qadder-border/20 bg-qadder-background/50 p-5">
                      <h2 className="mb-4 text-right text-lg font-bold text-qadder-dark">
                        بيانات اللوحة
                      </h2>
                      <div>

                        <div className="grid grid-cols-4 gap-3">
                          <select
                            name="plate_letter_1"
                            value={form.plate_letter_1}
                            onChange={handleChange}
                            className={selectClass}
                          >
                            <option value="">الحرف 1</option>
                            {arabicPlateLetters.map((letter) => (
                              <option key={`1-${letter}`} value={letter}>
                                {letter}
                              </option>
                            ))}
                          </select>

                          <select
                            name="plate_letter_2"
                            value={form.plate_letter_2}
                            onChange={handleChange}
                            className={selectClass}
                          >
                            <option value="">الحرف 2</option>
                            {arabicPlateLetters.map((letter) => (
                              <option key={`2-${letter}`} value={letter}>
                                {letter}
                              </option>
                            ))}
                          </select>

                          <select
                            name="plate_letter_3"
                            value={form.plate_letter_3}
                            onChange={handleChange}
                            className={selectClass}
                          >
                            <option value="">الحرف 3</option>
                            {arabicPlateLetters.map((letter) => (
                              <option key={`3-${letter}`} value={letter}>
                                {letter}
                              </option>
                            ))}
                          </select>


                          <input
                            name="plate_numbers"
                            type="text"
                            value={form.plate_numbers}
                            onChange={handleChange}
                            placeholder="0098"
                            className={`${inputClass} text-center`}
                          />
                        </div>

                        <p className="mt-2 text-xs text-qadder-dark/60">
                          الصيغة المطلوبة: خ ن ت 0098
                        </p>
                      </div>
                      <div className="mt-5 rounded-2xl bg-white p-4 text-right shadow-sm">
                        <p className="text-sm font-semibold text-qadder-dark/60">
                          رقم اللوحة النهائي
                        </p>
                        <p className="mt-2 text-lg font-bold text-qadder-primary">
                          {fullPlateNumber || "سيظهر هنا بعد اختيار الحروف والأرقام"}
                        </p>
                      </div>
                    </div>
                  </>
                )}


                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 pt-2">
                  {currentStep > 0 ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        prevStep();
                      }}
                      className="rounded-2xl border border-qadder-border px-6 py-3 text-qadder-dark transition hover:bg-qadder-light"
                    >
                      السابق
                    </button>
                  ) : (
                    <div />
                  )}

                  {currentStep < steps.length - 1 ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        nextStep();
                      }}
                      className="rounded-2xl bg-qadder-primary px-7 py-3 font-semibold text-white transition hover:bg-qadder-dark"
                    >
                      التالي
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading}
                      className="rounded-2xl bg-qadder-primary px-7 py-3 font-semibold text-white transition hover:bg-qadder-dark disabled:opacity-60"
                    >
                      {loading ? "جاري الإنشاء..." : "إنشاء حساب"}
                    </button>
                  )}
                </div>
              </form>

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