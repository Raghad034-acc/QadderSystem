"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifyPhonePage() {
  const router = useRouter();

  const [code, setCode] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isComplete = useMemo(() => code.every((item) => item.trim() !== ""), [code]);

  const handleChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 1);

    const updated = [...code];
    updated[index] = cleaned;
    setCode(updated);
    setError("");

    if (cleaned && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isComplete) {
      setError("أدخل رمز التحقق كاملًا");
      return;
    }

    try {
      setLoading(true);

      await new Promise((resolve) => setTimeout(resolve, 700));

      router.push("/login");
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

  return (
    <main className="min-h-screen bg-qadder-background text-qadder-dark">
      <section className="relative overflow-hidden" dir="rtl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(173,200,147,0.18),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(39,75,44,0.08),_transparent_30%)]" />

        <div className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-12 md:py-16">
          <div className="w-full max-w-md">
            <div className="rounded-[28px] border border-qadder-border/30 bg-qadder-card p-8 shadow-[0_20px_60px_rgba(16,47,21,0.08)] sm:p-10">
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-qadder-light">
                  <img
                    src="/images/logo.png"
                    alt="شعار قدر"
                    className="h-10 w-auto object-contain"
                  />
                </div>

                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[24px] border-2 border-qadder-dark bg-white">
                  <span className="text-4xl">✓</span>
                </div>

                <h1 className="text-3xl font-extrabold text-qadder-dark">
                  تأكيد رقم الهاتف
                </h1>

                <p className="mt-3 text-sm leading-7 text-qadder-dark/60">
                  تم إرسال رمز التحقق إلى رقمك المسجل.
                  <br />
                  أدخل الرمز للمتابعة إلى تسجيل الدخول.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center justify-center gap-3" dir="ltr">
                  {code.map((item, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      value={item}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="h-14 w-14 rounded-2xl border-2 border-qadder-dark bg-white text-center text-xl font-bold text-qadder-dark outline-none transition focus:border-qadder-primary"
                      maxLength={1}
                    />
                  ))}
                </div>

                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-qadder-primary px-7 py-4 text-sm font-semibold text-white shadow-lg shadow-qadder-primary/20 transition hover:bg-qadder-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "جاري التحقق..." : "تأكيد"}
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="w-full rounded-2xl border border-qadder-border px-7 py-4 text-sm font-semibold text-qadder-dark transition hover:bg-qadder-light"
                >
                  الذهاب إلى تسجيل الدخول
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}