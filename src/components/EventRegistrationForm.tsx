import { ExternalLink, FileCheck2, LockKeyhole } from "lucide-react";

type EventRegistrationFormProps = {
  eventName: string;
  formUrl: string | null;
  open: boolean;
};

export function EventRegistrationForm({ eventName, formUrl, open }: EventRegistrationFormProps) {
  const available = open && Boolean(formUrl);

  return (
    <article className="registration-form" aria-labelledby="registration-form-title">
      <div className="registration-heading">
        <FileCheck2 className="h-6 w-6 text-sokol-red" aria-hidden="true" />
        <div>
          <p>Přihláška přes Google Forms</p>
          <h3 id="registration-form-title">{eventName}</h3>
        </div>
      </div>

      <p>
        Formulář se otevře v zabezpečené službě Google. Odpovědi se ukládají pouze do neveřejné registrační tabulky organizátora a nejsou součástí veřejného webu ani kalendáře.
      </p>

      <div className="form-privacy-context">
        <strong><LockKeyhole className="mr-2 inline h-4 w-4" aria-hidden="true" />Důležité</strong>
        <p>Odeslání formuláře potvrzuje přijetí přihlášky ke kontrole, nikoli automatickou rezervaci místa. Duplicity, neplatné údaje a kapacita se kontrolují v neveřejné tabulce.</p>
      </div>

      {available && formUrl ? (
        <a className="btn-primary inline-flex items-center justify-center gap-2" href={formUrl} target="_blank" rel="noreferrer">
          Otevřít přihlášku <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      ) : (
        <div className="status-message status-warning" role="status">
          Přihlašování zatím není otevřené. Po potvrzení termínu zde bude zveřejněn ověřený Google formulář.
        </div>
      )}
    </article>
  );
}
