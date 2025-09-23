import { useMemo, useState } from "react";
import {
  bodySmallMutedTextClasses,
  bodySmallStrongTextClasses,
  captionTextClasses,
  displayTextClasses,
  formLabelClasses,
  inputClasses,
  leadTextClasses,
  primaryButtonClasses,
  textareaClasses,
} from "../styles/ui";

const SUPPORT_EMAIL = "sayantan.kumar.basu@gmail.com";

function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const isValid = useMemo(() => {
    return (
      form.name.trim().length > 0 &&
      form.email.trim().length > 0 &&
      form.message.trim().length > 0
    );
  }, [form]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!isValid) return;

    const subject = `Aleya contact from ${form.name}`;
    const body = `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`;
    const mailtoLink = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;

    window.location.href = mailtoLink;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100 px-6 py-16">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 text-emerald-900">
        <div className="space-y-4 text-center">
          <p className={`${captionTextClasses} text-emerald-700`}>Gather &amp; share</p>
          <h1 className={`${displayTextClasses} text-emerald-950`}>
            Contact the Aleya support canopy.
          </h1>
          <p className={`${leadTextClasses} text-emerald-900/80`}>
            Send a note and our support tender will respond with gentle guidance within
            two business days. Let us know how we can nurture your practice.
          </p>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-white/80 p-8 shadow-2xl shadow-emerald-900/10 backdrop-blur">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <label className={`block ${formLabelClasses}`}>
              Name
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className={inputClasses}
                placeholder="Your full name"
              />
            </label>

            <label className={`block ${formLabelClasses}`}>
              Email
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className={inputClasses}
                placeholder="you@email.com"
              />
            </label>

            <label className={`block ${formLabelClasses}`}>
              Message
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                required
                rows={6}
                className={textareaClasses}
                placeholder="Share the details you’d like us to tend to."
              />
            </label>

            <button
              type="submit"
              className={`${primaryButtonClasses} w-full md:w-auto`}
              disabled={!isValid}
            >
              Send email to support
            </button>
          </form>
          <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
            <p className={`${bodySmallStrongTextClasses} text-emerald-800`}>
              Prefer your own mail app?
            </p>
            <p className={`${bodySmallMutedTextClasses} text-emerald-900/70`}>
              Email us directly at {" "}
              <a
                className="font-semibold text-emerald-700 underline-offset-2 hover:underline"
                href={`mailto:${SUPPORT_EMAIL}`}
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;
