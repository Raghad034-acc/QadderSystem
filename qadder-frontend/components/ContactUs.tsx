// Contact section component Displays social media and communication links for users to reach Qadder
export default function ContactUs() {
  return (
    <section id="contact" className="bg-white py-16 text-qadder-primary">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <h3 className="text-2xl font-bold md:text-3xl">
          تواصل معنا
        </h3>
        {/* Description */}
        <p className="mt-3 text-qadder-primary/70 text-sm md:text-base">
          نسعد بخدمتك من خلال حساباتنا الرسمية
        </p>
        <ul className="mt-8 flex items-center justify-center gap-4">
          {/* Email */}
          <li>
            <a
              href="mailto:support@qadder.com"
              aria-label="Email"
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-qadder-primary/10 text-qadder-primary transition duration-300 hover:-translate-y-1 hover:bg-qadder-primary/20"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-7 w-7"
                aria-hidden="true"
              >
                <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 2v.01L12 11 4 6.01V6h16ZM4 18V8.236l7.429 4.643a1 1 0 0 0 1.142 0L20 8.236V18H4Z" />
              </svg>
            </a>
          </li>

          {/* WhatsApp */}
          <li>
            <a
              href="https://wa.me/966XXXXXXXXX"
              aria-label="WhatsApp"
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-qadder-primary/10 text-qadder-primary transition duration-300 hover:-translate-y-1 hover:bg-qadder-primary/20"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-7 w-7"
                aria-hidden="true"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.149-.198.297-.767.966-.94 1.164-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.48s1.065 2.877 1.213 3.075c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.693.626.711.226 1.359.194 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.004 2.003h-.008C6.486 2.003 2 6.486 2 11.998c0 1.748.457 3.454 1.325 4.957L2 22l5.182-1.36a9.965 9.965 0 0 0 4.814 1.229h.008C17.514 21.869 22 17.386 22 11.874c0-2.672-1.04-5.184-2.928-7.072a9.93 9.93 0 0 0-7.068-2.799m.004 18.067h-.006a8.33 8.33 0 0 1-4.247-1.164l-.305-.18-3.074.806.82-2.997-.199-.307a8.3 8.3 0 0 1-1.278-4.446c.002-4.59 3.739-8.327 8.334-8.327 2.224 0 4.314.865 5.887 2.437a8.268 8.268 0 0 1 2.44 5.89c-.003 4.59-3.74 8.327-8.332 8.327" />
              </svg>
            </a>
          </li>

          {/* Instagram */}
          <li>
            <a
              href="#"
              aria-label="Instagram"
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-qadder-primary/10 text-qadder-primary transition duration-300 hover:-translate-y-1 hover:bg-qadder-primary/20"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-7 w-7"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                />
              </svg>
            </a>
          </li>

          {/* Twitter / X */}
          <li>
            <a
              href="#"
              aria-label="Twitter"
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-qadder-primary/10 text-qadder-primary transition duration-300 hover:-translate-y-1 hover:bg-qadder-primary/20"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-7 w-7"
                aria-hidden="true"
              >
                <path d="M18.244 2H21.5l-7.19 8.21L22 22h-6.828l-5.343-6.99L3.7 22H.5l7.69-8.78L2 2h6.828l4.843 6.38L18.244 2zm-2.39 18h1.885L8.08 4h-2.03l9.804 16z" />
              </svg>
            </a>
          </li>
        </ul>
      </div>
    </section>
  );
}