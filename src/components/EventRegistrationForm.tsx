import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import type { FormEvent, HTMLAttributes, HTMLInputTypeAttribute, ReactNode } from "react";
import { useState } from "react";
import {
  isParticipantMinor,
  parseIsoBirthDate,
  REGISTRATION_CONSENT_VERSION,
  REGISTRATION_LIMITS,
} from "../config/registration";
import {
  submitEventRegistration,
  type EventRegistrationPayload,
  type EventRegistrationResult,
} from "../services/eventRegistration";

type FormValues = {
  eventName: string;
  participantName: string;
  birthDate: string;
  guardianName: string;
  email: string;
  phone: string;
  healthNote: string;
  additionalNote: string;
  privacyAcknowledged: boolean;
  guardianDeclaration: boolean;
  healthConsent: boolean;
  mediaConsent: boolean;
  website_hp: string;
};

type FormErrors = Partial<Record<keyof FormValues | "submit", string>>;

type EventRegistrationFormProps = {
  eventName: string;
};

const initialValues = (eventName: string): FormValues => ({
  eventName,
  participantName: "",
  birthDate: "",
  guardianName: "",
  email: "",
  phone: "",
  healthNote: "",
  additionalNote: "",
  privacyAcknowledged: false,
  guardianDeclaration: false,
  healthConsent: false,
  mediaConsent: false,
  website_hp: "",
});

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const phonePattern = /^(\+420\s?)?(\d\s?){9}$/;

function normalizeInput(value: string, maxLength = 300) {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!normalizeInput(values.participantName, REGISTRATION_LIMITS.participantName)) {
    errors.participantName = "Vyplňte jméno a příjmení účastníka.";
  }

  if (!values.birthDate) {
    errors.birthDate = "Vyplňte datum narození.";
  } else {
    const birthDate = parseIsoBirthDate(values.birthDate);
    const today = new Date();
    const oldestAcceptedDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());

    if (!birthDate) {
      errors.birthDate = "Zadejte platné datum narození.";
    } else if (birthDate > today) {
      errors.birthDate = "Datum narození nemůže být v budoucnosti.";
    } else if (birthDate < oldestAcceptedDate) {
      errors.birthDate = "Zkontrolujte prosím zadaný rok narození.";
    }
  }

  if (isParticipantMinor(values.birthDate)) {
    if (!normalizeInput(values.guardianName, REGISTRATION_LIMITS.guardianName)) {
      errors.guardianName = "U nezletilého účastníka vyplňte zákonného zástupce.";
    }
    if (!values.guardianDeclaration) {
      errors.guardianDeclaration = "Potvrďte oprávnění přihlásit nezletilého účastníka.";
    }
  }

  if (!emailPattern.test(normalizeInput(values.email, REGISTRATION_LIMITS.email))) {
    errors.email = "Zadejte platný e-mail.";
  }

  if (!phonePattern.test(normalizeInput(values.phone, REGISTRATION_LIMITS.phone))) {
    errors.phone = "Zadejte telefon ve formátu +420 777 123 456 nebo 777123456.";
  }

  if (!values.privacyAcknowledged) {
    errors.privacyAcknowledged = "Potvrďte seznámení se zásadami ochrany osobních údajů.";
  }

  if (normalizeInput(values.healthNote, REGISTRATION_LIMITS.healthNote) && !values.healthConsent) {
    errors.healthConsent = "Pro zpracování zdravotních údajů je nutný výslovný souhlas.";
  }

  return errors;
}

function toPayload(values: FormValues, submissionId: string): EventRegistrationPayload {
  return {
    submissionId,
    eventName: normalizeInput(values.eventName, 160),
    participantName: normalizeInput(values.participantName, REGISTRATION_LIMITS.participantName),
    birthDate: values.birthDate,
    guardianName: normalizeInput(values.guardianName, REGISTRATION_LIMITS.guardianName),
    email: normalizeInput(values.email, REGISTRATION_LIMITS.email).toLowerCase(),
    phone: normalizeInput(values.phone, REGISTRATION_LIMITS.phone),
    healthNote: normalizeInput(values.healthNote, REGISTRATION_LIMITS.healthNote),
    additionalNote: normalizeInput(values.additionalNote, REGISTRATION_LIMITS.additionalNote),
    privacyAcknowledged: values.privacyAcknowledged,
    guardianDeclaration: values.guardianDeclaration,
    healthConsent: values.healthConsent,
    mediaConsent: values.mediaConsent,
    website_hp: normalizeInput(values.website_hp, 200),
    consentVersion: REGISTRATION_CONSENT_VERSION,
  };
}

function createSubmissionId() {
  return crypto.randomUUID().replace(/-/g, "");
}

export function EventRegistrationForm({ eventName }: EventRegistrationFormProps) {
  const [values, setValues] = useState<FormValues>(() => initialValues(eventName));
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [submissionId, setSubmissionId] = useState(createSubmissionId);
  const [successResult, setSuccessResult] = useState<EventRegistrationResult | null>(null);
  const isSubmitting = status === "submitting";
  const participantIsMinor = isParticipantMinor(values.birthDate);

  const updateField = <Key extends keyof FormValues>(field: Key, value: FormValues[Key]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, submit: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      const fieldOrder: Array<keyof FormValues> = [
        "participantName",
        "birthDate",
        "guardianName",
        "email",
        "phone",
        "healthNote",
        "additionalNote",
        "privacyAcknowledged",
        "guardianDeclaration",
        "healthConsent",
        "mediaConsent",
      ];
      const firstInvalidField = fieldOrder.find((field) => nextErrors[field]);

      if (firstInvalidField) {
        window.requestAnimationFrame(() => document.getElementById(firstInvalidField)?.focus());
      }

      return;
    }

    setStatus("submitting");
    setSuccessResult(null);

    try {
      const [result] = await Promise.all([
        submitEventRegistration(toPayload(values, submissionId)),
        new Promise<void>((resolve) => window.setTimeout(resolve, 1000)),
      ]);
      setStatus("success");
      setSuccessResult(result);
      setValues(initialValues(eventName));
      setSubmissionId(createSubmissionId());
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
    <form className="registration-form" noValidate autoComplete="on" onSubmit={handleSubmit}>
      <div className="registration-heading">
        <ShieldCheck className="h-6 w-6 text-sokol-red" aria-hidden="true" />
        <div>
          <p>Bezpečná online přihláška</p>
          <h3>{eventName}</h3>
        </div>
      </div>

      <input type="hidden" name="eventName" value={values.eventName} readOnly />
      <div className="hp-field" aria-hidden="true">
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
          autoComplete="name"
          maxLength={REGISTRATION_LIMITS.participantName}
          value={values.participantName}
          error={errors.participantName}
          onChange={(value) => updateField("participantName", value)}
        />
        <TextField
          id="birthDate"
          label="Datum narození účastníka"
          required
          type="date"
          autoComplete="bday"
          min={`${new Date().getFullYear() - 120}-01-01`}
          max={new Date().toISOString().slice(0, 10)}
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
          required={participantIsMinor}
          autoComplete="name"
          maxLength={REGISTRATION_LIMITS.guardianName}
        />
        <TextField
          id="email"
          label="E-mail"
          required
          type="email"
          inputMode="email"
          autoComplete="email"
          maxLength={REGISTRATION_LIMITS.email}
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
          maxLength={REGISTRATION_LIMITS.phone}
          value={values.phone}
          error={errors.phone}
          onChange={(value) => updateField("phone", value)}
        />
      </div>

      {participantIsMinor ? (
        <ConsentField
          id="guardianDeclaration"
          required
          checked={values.guardianDeclaration}
          error={errors.guardianDeclaration}
          onChange={(checked) => updateField("guardianDeclaration", checked)}
        >
          Potvrzuji, že jsem zákonný zástupce účastníka nebo jsem oprávněn/a jej na tuto akci přihlásit.
        </ConsentField>
      ) : null}

      <label className="field-label" htmlFor="healthNote">
        Zdravotní omezení / Alergie <span className="font-normal text-zinc-600">(nepovinné)</span>
      </label>
      <textarea
        id="healthNote"
        className="form-input min-h-28 resize-y"
        value={values.healthNote}
        maxLength={REGISTRATION_LIMITS.healthNote}
        onChange={(event) => updateField("healthNote", event.target.value)}
      />

      {values.healthNote.trim() ? (
        <ConsentField
          id="healthConsent"
          required
          checked={values.healthConsent}
          error={errors.healthConsent}
          onChange={(checked) => updateField("healthConsent", checked)}
        >
          Výslovně souhlasím se zpracováním výše uvedených údajů o zdravotním stavu výhradně pro bezpečnou organizaci této akce. Souhlas mohu kdykoli odvolat na e-mailu správce, aniž je dotčena zákonnost předchozího zpracování.
        </ConsentField>
      ) : null}

      <label className="field-label" htmlFor="additionalNote">
        Organizační poznámka <span className="font-normal text-zinc-600">(nepovinné)</span>
      </label>
      <textarea
        id="additionalNote"
        className="form-input min-h-24 resize-y"
        value={values.additionalNote}
        maxLength={REGISTRATION_LIMITS.additionalNote}
        onChange={(event) => updateField("additionalNote", event.target.value)}
      />

      <div className="form-privacy-context">
        <strong>Jak s údaji naložíme</strong>
        <p>
          Běžné údaje slouží pouze k vyřízení přihlášky a organizaci této akce. Zdravotní údaje a fotografie mají vlastní dobrovolné souhlasy. Podrobnosti, práva a kontakt správce najdete v zásadách.
        </p>
      </div>

      <ConsentField
        id="privacyAcknowledged"
        required
        checked={values.privacyAcknowledged}
        error={errors.privacyAcknowledged}
        onChange={(checked) => updateField("privacyAcknowledged", checked)}
      >
        Potvrzuji, že jsem se seznámil/a se <a href="/gdpr">zásadami ochrany osobních údajů</a> a beru na vědomí zpracování údajů nezbytných pro vyřízení přihlášky a organizaci akce.
      </ConsentField>

      <ConsentField id="mediaConsent" checked={values.mediaConsent} onChange={(checked) => updateField("mediaConsent", checked)}>
        Dobrovolně souhlasím s pořízením a zveřejněním fotografií nebo videozáznamů účastníka z této akce na webu a sociálních sítích TJ Sokol pro informování o činnosti jednoty. Neudělení souhlasu nemá vliv na účast a souhlas lze kdykoli odvolat.
      </ConsentField>

      <div className="form-note">
        Přihlášku kontroluje zabezpečené serverové API. V aktuálním demo režimu se vytvoří pouze náhled potvrzovacích e-mailů; osobní ani zdravotní údaje se neukládají a nikam se neposílají.
      </div>

      {status === "success" ? (
        <StatusMessage
          tone="success"
          message={
            successResult?.mode === "live"
              ? "Přihláška byla úspěšně odeslána. Potvrzení bylo zasláno na e-mail."
              : "Demo přihláška byla úspěšně zkontrolována. V ostrém provozu by potvrzení přišlo na e-mail; žádná data nebyla uložena ani odeslána."
          }
        />
      ) : null}
      {status === "success" && successResult?.preview ? (
        <div className="email-preview" aria-label="Náhled demo e-mailů">
          <strong>Náhled e-mailů</strong>
          <span>Organizátor: {successResult.preview.organizer.to} · {successResult.preview.organizer.subject}</span>
          <span>Účastník: {successResult.preview.participant.to} · {successResult.preview.participant.subject}</span>
        </div>
      ) : null}
      {errors.submit ? <StatusMessage tone="error" message={errors.submit} /> : null}

      <button type="submit" className="btn-primary inline-flex items-center justify-center gap-2" disabled={isSubmitting}>
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
  placeholder?: string;
  min?: string;
  max?: string;
  maxLength?: number;
  onChange: (value: string) => void;
};

function TextField({
  id,
  label,
  value,
  error,
  required = false,
  type = "text",
  inputMode,
  autoComplete,
  placeholder,
  min,
  max,
  maxLength,
  onChange,
}: TextFieldProps) {
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
        placeholder={placeholder}
        min={min}
        max={max}
        maxLength={maxLength}
        value={value}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onInput={type === "date" ? (event) => onChange(event.currentTarget.value) : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-sm font-semibold text-sokol-red" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type ConsentFieldProps = {
  id: "privacyAcknowledged" | "guardianDeclaration" | "healthConsent" | "mediaConsent";
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
        <p id={`${id}-error`} className="mt-2 text-sm font-semibold text-sokol-red" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function StatusMessage({ tone, message }: { tone: "success" | "error"; message: string }) {
  const Icon = tone === "success" ? CheckCircle2 : AlertCircle;

  return (
    <div
      className={tone === "success" ? "status-message status-success" : "status-message status-error"}
      role={tone === "error" ? "alert" : "status"}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      {message}
    </div>
  );
}
