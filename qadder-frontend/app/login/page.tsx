"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    login: "",
    password: "",
    rememberMe: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);

      const res = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          login: form.login,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "فشل تسجيل الدخول");
      }

      localStorage.setItem("user", JSON.stringify(data));
      router.push("/");
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
    <main dir="rtl" className="min-h-screen bg-qadder-background text-qadder-dark">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(173,200,147,0.18),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(39,75,44,0.08),_transparent_30%)]" />

        <div className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-12 md:py-16">
          <div className="flex w-full max-w-4xl flex-col gap-8">
            <div className="mx-auto w-full max-w-md">
              <div className="rounded-[28px] border border-qadder-border/30 bg-qadder-card p-8 shadow-[0_20px_60px_rgba(16,47,21,0.08)] sm:p-10">
                <div className="mb-8 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-qadder-light">
                    <img
                      src="/images/logo.png"
                      alt="شعار قدر"
                      className="h-10 w-auto object-contain"
                    />
                  </div>

                  <h1 className="text-3xl font-extrabold text-qadder-dark">
                    تسجيل الدخول
                  </h1>

                  <p className="mt-3 text-sm text-qadder-dark/60">
                    أدخل بياناتك للوصول إلى حسابك
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="login"
                      className="mb-2 block text-sm font-semibold text-qadder-dark"
                    >
                      البريد الإلكتروني أو رقم الجوال
                    </label>
                    <input
                      id="login"
                      name="login"
                      type="text"
                      value={form.login}
                      onChange={handleChange}
                      placeholder="أدخل البريد الإلكتروني أو رقم الجوال"
                      className="w-full rounded-2xl border border-qadder-border bg-qadder-background px-4 py-3.5 text-right text-qadder-dark outline-none transition placeholder:text-qadder-dark/35 focus:border-qadder-secondary focus:bg-qadder-light"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="mb-2 block text-sm font-semibold text-qadder-dark"
                    >
                      كلمة المرور
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="أدخل كلمة المرور"
                      className="w-full rounded-2xl border border-qadder-border bg-qadder-background px-4 py-3.5 text-right text-qadder-dark outline-none transition placeholder:text-qadder-dark/35 focus:border-qadder-secondary focus:bg-qadder-light"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 text-sm">
                    <button
                      type="button"
                      className="font-medium text-qadder-primary transition hover:text-qadder-dark"
                    >
                      نسيت كلمة المرور؟
                    </button>

                    <label className="flex items-center gap-2 text-qadder-dark/75">
                      <span>تذكرني</span>
                      <input
                        type="checkbox"
                        name="rememberMe"
                        checked={form.rememberMe}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-qadder-border accent-qadder-primary"
                      />
                    </label>
                  </div>

                  {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-2xl bg-qadder-primary px-7 py-4 text-sm font-semibold text-white shadow-lg shadow-qadder-primary/20 transition hover:bg-qadder-dark disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                  </button>
                </form>

                <div className="mt-6 text-center text-sm text-qadder-dark/70">
                  ليس لديك حساب؟{" "}
                  <Link
                    href="/register"
                    className="font-semibold text-qadder-primary transition hover:text-qadder-dark"
                  >
                    إنشاء حساب
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}