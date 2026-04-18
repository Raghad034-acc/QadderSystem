"use client";

import React, { useEffect, useMemo, useState } from "react";
import AppNavbar from "@/components/AppNavbar";
import PageLoader from "@/components/PageLoader";
import ContactUs from "@/components/ContactUs";



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

  const availableBrands = useMemo(() => {
    return [...new Set(vehicleOptions.map((item) => item.brand))];
  }, []);

  const availableModels = useMemo(() => {
    if (!brand) return [];
    return [...new Set(vehicleOptions.filter((item) => item.brand === brand).map((item) => item.model))];
  }, [brand]);

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

  const fullPlateNumber = useMemo(() => {
    const letters = [plateLetter1, plateLetter2, plateLetter3].filter(Boolean).join(" ");
    const numbers = plateNumbers.trim();
    return `${letters}${letters && numbers ? " " : ""}${numbers}`.trim();
  }, [plateLetter1, plateLetter2, plateLetter3, plateNumbers]);

  const handleBrandChange = (value: string) => {
    setBrand(value);
    setModel("");
    setYear("");
  };

  const handleModelChange = (value: string) => {
    setModel(value);
    setYear("");
  };

  const handlePlateNumbersChange = (value: string) => {
    const onlyDigits = value.replace(/\D/g, "").slice(0, 4);
    setPlateNumbers(onlyDigits);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.user_profile_id) {
      setError("معرف المستخدم غير موجود");
      return;
    }

    if (!brand || !model || !year || !color) {
      setError("فضلاً اكملي جميع بيانات المركبة");
      return;
    }

    if (!plateLetter1 || !plateLetter2 || !plateLetter3 || plateNumbers.length < 4) {
      setError("فضلاً أدخلي حروف وأرقام اللوحة بشكل كامل");
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
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };
  if (pageLoading) {
    return (
      <main className="min-h-screen bg-qadder-background px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <PageLoader text="جاري تحميل الصفحة..." />
        </div>
      </main>
    );
  }


  return (
    <main className="min-h-screen bg-qadder-background text-qadder-dark">
      <AppNavbar isLoggedIn={true} handleLogout={handleLogout} />

      <section className="relative overflow-hidden border-b border-qadder-border/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(173,200,147,0.18),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(39,75,44,0.08),_transparent_30%)]" />

        <div className="relative mx-auto max-w-5xl px-6 py-12 md:py-16">

          <div className="text-right">
            <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
              اضافة مركبة جديدة
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-8 text-qadder-dark/70 md:text-lg">
              اختار بيانات المركبة من القوائم التالية، ثم أدخل اللوحة، وبعد الحفظ
              ستظهر مباشرة في صفحة مركباتي
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-10">
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
                شركة الصنع
              </label>
              <select
                name="brand"
                value={brand}
                onChange={(e) => handleBrandChange(e.target.value)}
                className="w-full rounded-2xl border border-qadder-border bg-white px-4 py-3 outline-none transition focus:border-qadder-primary"
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
                value={model}
                onChange={(e) => handleModelChange(e.target.value)}
                disabled={!brand}
                className="w-full rounded-2xl border border-qadder-border bg-white px-4 py-3 outline-none transition focus:border-qadder-primary disabled:cursor-not-allowed disabled:bg-gray-100"
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
                value={year}
                onChange={(e) => setYear(e.target.value)}
                disabled={!brand || !model}
                className="w-full rounded-2xl border border-qadder-border bg-white px-4 py-3 outline-none transition focus:border-qadder-primary disabled:cursor-not-allowed disabled:bg-gray-100"
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
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full rounded-2xl border border-qadder-border bg-white px-4 py-3 outline-none transition focus:border-qadder-primary"
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

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                    حروف اللوحة
                  </label>

                  <div className="grid grid-cols-3 gap-3">
                    <select
                      value={plateLetter1}
                      onChange={(e) => setPlateLetter1(e.target.value)}
                      className="w-full rounded-2xl border border-qadder-border bg-white px-3 py-3 text-center outline-none transition focus:border-qadder-primary"
                    >
                      <option value="">الحرف 1</option>
                      {arabicPlateLetters.map((item) => (
                        <option key={`l1-${item}`} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>

                    <select
                      value={plateLetter2}
                      onChange={(e) => setPlateLetter2(e.target.value)}
                      className="w-full rounded-2xl border border-qadder-border bg-white px-3 py-3 text-center outline-none transition focus:border-qadder-primary"
                    >
                      <option value="">الحرف 2</option>
                      {arabicPlateLetters.map((item) => (
                        <option key={`l2-${item}`} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>

                    <select
                      value={plateLetter3}
                      onChange={(e) => setPlateLetter3(e.target.value)}
                      className="w-full rounded-2xl border border-qadder-border bg-white px-3 py-3 text-center outline-none transition focus:border-qadder-primary"
                    >
                      <option value="">الحرف 3</option>
                      {arabicPlateLetters.map((item) => (
                        <option key={`l3-${item}`} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-qadder-dark">
                    أرقام اللوحة
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={plateNumbers}
                    onChange={(e) => handlePlateNumbersChange(e.target.value)}
                    placeholder="مثال: 1234"
                    className="w-full rounded-2xl border border-qadder-border bg-white px-4 py-3 outline-none transition focus:border-qadder-primary"
                  />
                </div>
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

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => (window.location.href = "/vehicles")}
                className="rounded-2xl border border-qadder-border px-6 py-3 font-semibold text-qadder-dark transition hover:bg-qadder-light"
              >
                رجوع
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-qadder-primary px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "جاري الإضافة..." : "حفظ المركبة"}
              </button>
            </div>
          </form>
        </div>
      </section>
      <ContactUs />

    </main>
  );
}




