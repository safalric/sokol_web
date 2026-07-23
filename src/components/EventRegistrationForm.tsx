import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import type { FormEvent, HTMLAttributes, HTMLInputTypeAttribute, ReactNode } from "react";
import { useMemo, useState } from "react";
import { submitEventRegistration, type EventRegistrationPayload } from "../services/eventRegistration";

type FormValues = {
  eventName: string;
  participantName: string;
  birthDate: string;
  guardianName: string;
  email: string;
  phone: string;
  healthNote: string;
  gdprConsent: boolean;
  mediaConsent: boolean;
  website_hp: string;
};

type FormErrors = Partial<Record<keyof FormValues | "submit", string>>;

type EventRegistrationFormProps = {
  eventName: string;
  organizerEmail?: string;
  webhookUrl?: string;
};

const initialValues = (eventName: string): FormValues => ({
  eventName,
  participantName: "",
  birthDate: "",
  guardianName: "",
  email: "",
  phone: "",
  healthNote: "",
  gdprConsent: false,
  mediaConsent: false,
  website_hp: "",
});

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const phonePattern = /^(\+420\s?)?(\d\s?){9}$/;

function sanitizeInput(value: string, maxLength = 300) {
  return value
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!sanitizeInput(values.participantName, 120)) {
    errors.participantName = "Vyplňte jméno a příjmení účastníka.";
  }

  if (!values.birthDate) {
    errors.birthDate = "Vyplňte datum narození.";
  }

  if (!emailPattern.test(sanitizeInput(values.email, 160))) {
    errors.email = "Zadejte platný e-mail.";
  }

  if (!phonePattern.test(sanitizeInput(values.phone, 30))) {
    errors.phone = "Zadejte telefon ve formátu +420 777 123 456 nebo 777123456.";
  }

  if (!values.gdprConsent) {
    errors.gdprConsent = "Souhlas se zpracováním osobních údajů je povinný.";
  }

  return errors;
}

function toPayload(values: FormValues, organizerEmail?: string): EventRegistrationPayload {
  return {
    eventName: sanitizeInput(values.eventName, 160),
    participantName: sanitizeInput(values.participantName, 120),
    birthDate: values.birthDate,
    guardianName: sanitizeInput(values.guardianName, 120),
    email: sanitizeInput(values.email, 160).toLowerCase(),
    phone: sanitizeInput(values.phone, 30),
    healthNote: sanitizeInput(values.healthNote, 1000),
    gdprConsent: values.gdprConsent,
    mediaConsent: values.mediaConsent,
    organizerEmail,
    submittedAt: new Date().toISOString(),
  };
}

export function EventRegistrationForm({ eventName, organizerEmail, webhookUrl }: EventRegistrationFormProps) {
  const [values, setValues] = useState<FormValues>(() => initialValues(eventName));
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const endpoint = useMemo(() => webhookUrl ?? import.meta.env.VITE_EVENT_REGISTRATION_WEBHOOK_URL, [webhookUrl]);
  const isSubmitting = status === "submitting";

  const updateField = <Key extends keyof FormValues>(field: Key, value: FormValues[Key]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, submit: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (values.website_hp.trim()) {
      setStatus("success");
      setValues(initialValues(eventName));
      return;
    }

    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setStatus("submitting");

    try {
      await submitEventRegistration(toPayload(values, organizerEmail), endpoint);
      setStatus("success");
      setValues(initialValues(eventName));
    } catch (error) {
      setStatus("error");
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : "Při odeslání přihlášky došlo k chybě. Zkuste to prosím znovu.",
      });
    }
  };

  return (
    <form className="registration-form" noValidate onSubmit={handleSubmit}>
      <div className="registration-heading">
        <ShieldCheck className="h-6 w-6 text-sokol-red" aria-hidden="true" />
        <div>
          <p>Bezpečná přihláška na akci</p>
          <h3>{eventName}</h3>
        </div>
      </div>

      <input type="hidden" name="eventName" value={values.eventName} readOnly />
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website_hp">Web</label>
        <input
          id="website_hp"
          name="website_hp"
          tabIndex={-1}
          autoComplete="off"
          value={values.website_hp}
          onChange={(event) => updateField("website_hp", event.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          id="participantName"
          label="Jméno a příjmení účastníka"
          required
          value={values.participantName}
          error={errors.participantName}
          onChange={(value) => updateField("participantName", value)}
        />
        <TextField
          id="birthDate"
          label="Datum narození účastníka"
          required
          type="date"
          value={values.birthDate}
          error={errors.birthDate}
          onChange={(value) => updateField("birthDate", value)}
        />
        <TextField
          id="guardianName"
          label="Jméno a příjmení zákonného zástupce"
          value={values.guardianName}
          error={errors.guardianName}
          onChange={(value) => updateField("guardianName", value)}
        />
        <TextField
          id="email"
          label="E-mail"
          required
          type="email"
          inputMode="email"
          autoComplete="email"
          value={values.email}
          error={errors.email}
          onChange={(value) => updateField("email", value)}
        />
        <TextField
          id="phone"
          label="Telefonní číslo"
          required
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={values.phone}
          error={errors.phone}
          onChange={(value) => updateField("phone", value)}
        />
      </div>

      <label className="field-label" htmlFor="healthNote">
        Zdravotní omezení / Alergie / Poznámka
      </label>
      <textarea
        id="healthNote"
        className="form-input min-h-28 resize-y"
        value={values.healthNote}
        maxLength={1000}
        onChange={(event) => updateField("healthNote", event.target.value)}
      />

      <ConsentField
        id="gdprConsent"
        required
        checked={values.gdprConsent}
        error={errors.gdprConsent}
        onChange={(checked) => updateField("gdprConsent", checked)}
      >
        Souhlasím se zpracováním osobních údajů pro účely organizace akce v souladu se Zásadami ochrany osobních údajů.
      </ConsentField>

      <ConsentField id="mediaConsent" checked={values.mediaConsent} onChange={(checked) => updateField("mediaConsent", checked)}>
        Souhlasím s pořizováním a případným zveřejněním fotografií/videozáznamů účastníka z akce pro propagační účely TJ Sokol.
      </ConsentField>

      <div className="form-note">
        Data se odesílají přes HTTPS webhook. Po doplnění klíče webhook odešle e-mail organizátorovi, potvrzení účastníkovi a zapíše řádek do Google Tabulky.
      </div>

      {status === "success" ? <StatusMessage tone="success" message="Přihláška byla přijata. Děkujeme." /> : null}
      {errors.submit ? <StatusMessage tone="error" message={errors.submit} /> : null}

      <button className="btn-primary inline-flex items-center justify-center gap-2" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        {isSubmitting ? "Odesílám přihlášku" : "Odeslat přihlášku"}
      </button>
    </form>
  );
}

type TextFieldProps = {
  id: keyof FormValues;
  label: string;
  value: string;
  error?: string;
  required?: boolean;
  type?: HTMLInputTypeAttribute;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  onChange: (value: string) => void;
};

function TextField({ id, label, value, error, required = false, type = "text", inputMode, autoComplete, onChange }: TextFieldProps) {
  return (
    <div>
      <label className="field-label" htmlFor={id}>
        {label}
        {required ? <span className="text-sokol-red"> *</span> : null}
      </label>
      <input
        id={id}
        className="form-input"
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        value={value}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-sm font-semibold text-sokol-red">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type ConsentFieldProps = {
  id: "gdprConsent" | "mediaConsent";
  checked: boolean;
  children: ReactNode;
  error?: string;
  required?: boolean;
  onChange: (checked: boolean) => void;
};

function ConsentField({ id, checked, children, error, required = false, onChange }: ConsentFieldProps) {
  return (
    <div>
      <label className="consent-field">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span>
          {children}
          {required ? <span className="font-bold text-sokol-red"> *</span> : null}
        </span>
      </label>
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-sm font-semibold text-sokol-red">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function StatusMessage({ tone, message }: { tone: "success" | "error"; message: string }) {
  const Icon = tone === "success" ? CheckCircle2 : AlertCircle;

  return (
    <div className={tone === "success" ? "status-message status-success" : "status-message status-error"} role="status">
      <Icon className="h-5 w-5" aria-hidden="true" />
      {message}
    </div>
  );
}
