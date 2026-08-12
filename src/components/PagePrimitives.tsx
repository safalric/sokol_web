import { FileDown } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

export function PageShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-8 md:py-10">
      <div className="page-heading">
        <p>TJ Sokol Doudleby nad Orlicí</p>
        <h1>{title}</h1>
      </div>
      <div className="mt-8 md:mt-10">{children}</div>
    </section>
  );
}

export function Section({
  eyebrow,
  title,
  tone = "paper",
  children,
}: {
  eyebrow: string;
  title: string;
  tone?: "paper" | "white";
  children: ReactNode;
}) {
  return (
    <section className={tone === "white" ? "section section-white" : "section"}>
      <div className="mx-auto max-w-6xl px-5 py-12">
        <p className="eyebrow text-sokol-red">{eyebrow}</p>
        <h2 className="section-title">{title}</h2>
        <div className="mt-7">{children}</div>
      </div>
    </section>
  );
}

export function PosterAction({ href, label }: { href: string; label: string }) {
  return (
    <div className="poster-download">
      <a className="poster-download-button" href={href} download>
        <FileDown className="h-4 w-4" aria-hidden="true" />
        {label}
      </a>
      <span>Originální materiál převzatý z původního webu jednoty.</span>
    </div>
  );
}

type InfoRowProps = {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: string;
  href?: string;
};

export function InfoRow({ icon: Icon, label, value, href: explicitHref }: InfoRowProps) {
  const href =
    explicitHref ??
    (label === "E-mail" ? `mailto:${value}` : label === "Telefon" ? `tel:${value.replace(/\s/g, "")}` : null);

  return (
    <div className="info-row">
      <dt>
        <Icon className="h-4 w-4 shrink-0 text-sokol-red" aria-hidden={true} />
        <span>{label}</span>
      </dt>
      <dd>{href ? <a href={href}>{value}</a> : value}</dd>
    </div>
  );
}
