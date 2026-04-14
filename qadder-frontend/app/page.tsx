export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f7f9f7] text-[#102F15]">
      <header className="sticky top-0 z-50 border-b border-[#e7ece7] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-1">
            
              <img
                src="/images/logo.png"
                alt="شعار قدر"
                className="h-11 w-auto"
              />
            
            <div className="text-right">
     
             
            </div>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-medium text-[#102F15]/80 md:flex">
            <a href="#" className="transition hover:text-[#274B2C]">
              الرئيسية
            </a>
            <a href="#" className="transition hover:text-[#274B2C]">
              الخدمات
            </a>
            <a href="#" className="transition hover:text-[#274B2C]">
              عن قدر
            </a>
            <a href="#" className="transition hover:text-[#274B2C]">
              تواصل معنا
            </a>
          </nav>

          <button className="rounded-full bg-[#274B2C] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#102F15]">
            تسجيل الدخول
          </button>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(173,200,147,0.18),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(39,75,44,0.08),_transparent_30%)]" />

        <div className="relative mx-auto flex max-w-7xl flex-col items-center px-6 pb-20 pt-16 text-center md:pt-24">
          <div className="mb-6 rounded-full border border-[#ADC893] bg-[#FCFFE4] px-4 py-2 text-xs font-semibold text-[#274B2C] shadow-sm">
            الخيار الذكي لتقدير أضرار المركبات في المملكة
          </div>

          
            
              <img
                src="/images/logo.png"
                alt="شعار قدر"
                className="h-50 w-200 object-contain"
              />
         


          <h2 className="max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-[#102F15] md:text-6xl">
            قدّر أضرار مركبتك
            <span className="block text-[#274B2C]">بسهولة ودقة</span>
          </h2>

          <p className="mt-6 max-w-3xl text-base leading-8 text-[#102F15]/65 md:text-lg">
            يوفّر قدر تجربة رقمية متكاملة لتقييم أضرار الحوادث باستخدام
            تقنيات الذكاء الاصطناعي، مما يساعد المستخدم على توفير الوقت،
            تقليل الجهد، والحصول على تقدير إصلاح أكثر دقة واتساقًا.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <button className="rounded-2xl bg-[#274B2C] px-7 py-4 text-sm font-semibold text-white shadow-lg shadow-[#274B2C]/20 transition hover:bg-[#102F15]">
              ابدأ التقدير الآن
            </button>
            <button className="rounded-2xl border border-[#dfe6df] bg-white px-7 py-4 text-sm font-semibold text-[#102F15] shadow-sm transition hover:border-[#ADC893] hover:bg-[#FCFFE4]">
              تعرّف على قدر
            </button>
          </div>

          <div className="mt-16 grid w-full max-w-6xl gap-6 rounded-[28px] border border-[#e8ece8] bg-white p-6 shadow-[0_20px_60px_rgba(16,47,21,0.08)] md:grid-cols-3 md:p-8">
            <div className="rounded-3xl border border-[#edf1ed] bg-[#fbfcfb] p-8 text-center transition hover:-translate-y-1 hover:shadow-md">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FCFFE4] text-2xl">
                🗎
              </div>
              <h3 className="text-xl font-bold text-[#102F15]">
                رفع التقرير
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#102F15]/60">
                ارفع تقرير نجم أو التقرير الرسمي لبدء عملية التقدير بشكل منظم
                وسريع.
              </p>
            </div>

            <div className="rounded-3xl border border-[#edf1ed] bg-[#fbfcfb] p-8 text-center transition hover:-translate-y-1 hover:shadow-md">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FCFFE4] text-2xl">
                ⛶
              </div>
              <h3 className="text-xl font-bold text-[#102F15]">
                تصوير الأضرار
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#102F15]/60">
                التقط صورًا واضحة للجزء المتضرر حتى يتمكن النظام من تحليل نوع
                الضرر ودرجته بدقة.
              </p>
            </div>

            <div className="rounded-3xl border border-[#edf1ed] bg-[#fbfcfb] p-8 text-center transition hover:-translate-y-1 hover:shadow-md">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FCFFE4] text-2xl">
                ✓
              </div>
              <h3 className="text-xl font-bold text-[#102F15]">
                الحصول على التقدير
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#102F15]/60">
                استلم ملخصًا منظمًا للأضرار وتقديرًا لتكلفة الإصلاح ضمن تجربة
                سريعة وسهلة الاستخدام.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#274B2C] py-14 text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 text-center md:grid-cols-4">
          <div>
            <p className="text-4xl font-extrabold">+10</p>
            <p className="mt-2 text-sm text-white/75">عملية تقدير</p>
          </div>
          <div>
            <p className="text-4xl font-extrabold">%80</p>
            <p className="mt-2 text-sm text-white/75">دقة التقدير</p>
          </div>
          <div>
            <p className="text-4xl font-extrabold">10 دقائق</p>
            <p className="mt-2 text-sm text-white/75">متوسط الوقت</p>
          </div>
          <div>
            <p className="text-4xl font-extrabold">24/7</p>
            <p className="mt-2 text-sm text-white/75">خدمة مستمرة</p>
          </div>
        </div>
      </section>
    </main>
  );
}