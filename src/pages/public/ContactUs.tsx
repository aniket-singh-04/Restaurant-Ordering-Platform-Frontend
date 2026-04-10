import {
  ArrowLeft,
  BadgeCheck,
  Mail,
  SendHorizontal,
  ShieldCheck,
  Store,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { submitPlatformContact } from "../../features/contact/api";
import { goBackOrNavigate } from "../../utils/navigation";
import { getApiErrorMessage, getApiFieldErrors } from "../../utils/apiErrorHelpers";
import { sanitizeHtml } from "../../security";
import { isValidEmail, isValidPhone } from "../../utils/validators";
import MenuPageLayout from "../user/menu/components/MenuPageLayout";

type ContactForm = {
  email: string;
  phone: string;
  message: string;
};

const platformHighlights = [
  {
    title: "Direct platform owner delivery",
    description: "Your form is sent from the backend mailer to the platform owner's configured email.",
    icon: Store,
  },
  {
    title: "Professional follow-up",
    description: "Your email and phone number are included so the owner can reply with the right context.",
    icon: Mail,
  },
  {
    title: "Reliable backend delivery",
    description: "Messages are submitted through the platform backend instead of depending on a device mail app.",
    icon: ShieldCheck,
  },
];

export default function ContactUs() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { pushToast } = useToast();
  const [form, setForm] = useState<ContactForm>({
    email: "",
    phone: "",
    message: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactForm, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const fallbackRoute =
    user?.role === "RESTRO_OWNER" || user?.role === "BRANCH_OWNER" ? "/admin" : "/";

  useEffect(() => {
    setForm((current) => ({
      email: current.email || user?.email || "",
      phone: current.phone || user?.phone || "",
      message: current.message,
    }));
  }, [user?.email, user?.phone]);

  const updateField = (field: keyof ContactForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validateForm = () => {
    const nextErrors: Partial<Record<keyof ContactForm, string>> = {};

    if (!form.email.trim() || !isValidEmail(form.email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!form.phone.trim() || !isValidPhone(form.phone)) {
      nextErrors.phone = "Enter a valid 10-digit phone number.";
    }

    if (form.message.trim().length < 20) {
      nextErrors.message = "Message must be at least 20 characters.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      const sanitizedMessage = sanitizeHtml(form.message.trim());
      await submitPlatformContact({
        email: form.email.trim(),
        phone: form.phone.trim(),
        message: sanitizedMessage,
      });

      setForm((current) => ({
        ...current,
        message: "",
      }));
      setErrors({});
      pushToast({
        title: "Message sent",
        description: "Your email has been sent to the platform owner.",
        variant: "success",
      });
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error);
      setErrors((current) => ({
        ...current,
        ...(fieldErrors as Partial<Record<keyof ContactForm, string>>),
      }));
      pushToast({
        title: "Could not send message",
        description: getApiErrorMessage(error),
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MenuPageLayout>
      <section className="ui-hero mt-1.5 p-3 sm:mt-2 sm:p-5">
        <div className="relative flex gap-4 z-10 max-w-3xl text-left">
          <div className="flex items-start">
            <button
              type="button"
              onClick={() => goBackOrNavigate(navigate, fallbackRoute, location.key)}
              className="ui-button-secondary ui-button-pill rounded-full px-4 py-2.5 text-sm font-semibold text-white/92 backdrop-blur"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          </div>
          <div>
            <p className="ui-eyebrow text-white/72!">Platform Contact</p>
            <h1 className="font-display text-3xl font-bold text-white sm:text-5xl">
              Contact Us
            </h1>
          </div>
        </div>

        <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.12fr)_minmax(18rem,0.88fr)]">
        <form className="ui-card space-y-5" onSubmit={handleSubmit} noValidate>
          <div>
            <p className="ui-eyebrow">Send an Email</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-(--text-primary)">
              Write to the platform owner
            </h2>
            <p className="mt-2 text-sm leading-6 text-(--text-secondary)">
              Use this form to send an onboarding request, setup question, partnership inquiry,
              or rollout discussion directly from the platform.
            </p>
          </div>

          <div className="grid gap-4">
            <div>
              <label className="ui-field-label" htmlFor="contact-email">
                Your Email
              </label>
              <input
                id="contact-email"
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="owner@restaurant.com"
                autoComplete="email"
                className="ui-input"
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email ? (
                <p className="ui-helper-text text-(--danger)!">{errors.email}</p>
              ) : null}
            </div>

            <div>
              <label className="ui-field-label" htmlFor="contact-phone">
                Phone Number
              </label>
              <input
                id="contact-phone"
                type="tel"
                value={form.phone}
                onChange={(event) =>
                  updateField("phone", event.target.value.replace(/\D/g, "").slice(0, 10))
                }
                placeholder="10-digit phone number"
                autoComplete="tel"
                inputMode="numeric"
                maxLength={10}
                className="ui-input"
                aria-invalid={Boolean(errors.phone)}
              />
              {errors.phone ? (
                <p className="ui-helper-text text-(--danger)!">{errors.phone}</p>
              ) : null}
            </div>

            <div>
              <label className="ui-field-label" htmlFor="contact-message">
                Message
              </label>
              <textarea
                id="contact-message"
                value={form.message}
                onChange={(event) => updateField("message", event.target.value)}
                placeholder="Tell us about your restaurant and how the platform owner can help."
                className="ui-textarea"
                rows={7}
                maxLength={2000}
                aria-invalid={Boolean(errors.message)}
              />
              {errors.message ? (
                <p className="ui-helper-text text-(--danger)!">{errors.message}</p>
              ) : (
                <p className="ui-helper-text">
                  Include your restaurant details and what type of onboarding or platform help you
                  need.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-(--border-subtle) bg-(--surface-muted) p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-(--accent-soft) text-(--accent)">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-(--text-primary)">
                  How delivery works
                </p>
                <p className="mt-1 text-sm leading-6 text-(--text-secondary)">
                  The backend sends your message from the platform mail account to the owner email
                  configured in the server environment.
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="ui-button ui-button-pill w-full justify-center rounded-xl py-3 text-sm font-semibold"
          >
            <SendHorizontal className="h-4.5 w-4.5" />
            {submitting ? "Sending Message..." : "Send Email to Platform Owner"}
          </button>
        </form>

        <aside className="ui-card ui-card-muted space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-(--border-subtle) bg-(--surface) px-3 py-1.5 text-sm font-semibold text-(--text-primary)">
            <Store className="h-4 w-4 text-(--accent)" />
            Built for Restaurant Owners
          </div>

          <h3 className="font-display text-2xl font-semibold text-(--text-primary)">
            What to include in your message
          </h3>

          <p className="text-sm leading-7 text-(--text-secondary)">
            A clear message helps the platform owner respond faster and with the right next steps
            for your restaurant.
          </p>

          <div className="space-y-3">
            {platformHighlights.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-[1.35rem] border border-(--border-subtle) bg-(--surface) p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-(--accent-soft) text-(--accent)">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-(--text-primary)">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-(--text-secondary)">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-3xl border border-(--border-subtle) bg-(--surface) p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-(--accent-soft) text-(--accent)">
                <BadgeCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-(--text-primary)">
                  Useful examples
                </p>
                <p className="mt-1 text-sm leading-6 text-(--text-secondary)">
                  Mention your restaurant name, city, branch count, and whether you need a demo,
                  onboarding help, or QR ordering setup.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </MenuPageLayout>
  );
}
