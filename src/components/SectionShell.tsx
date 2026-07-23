import type { ReactNode } from "react";

type SectionShellProps = {
  id: string;
  eyebrow: string;
  title: string;
  intro: string;
  tone?: "white" | "soft";
  children: ReactNode;
};

export function SectionShell({
  id,
  eyebrow,
  title,
  intro,
  tone = "white",
  children,
}: SectionShellProps) {
  return (
    <section id={id} className={tone === "soft" ? "bg-sokol-soft" : "bg-white"}>
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
        <div className="mb-9 max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-sokol-red">
            {eyebrow}
          </p>
          <h2 className="mt-3 font-display text-4xl font-black uppercase text-sokol-navy sm:text-5xl">
            {title}
          </h2>
          <p className="mt-4 text-base leading-7 text-zinc-700">{intro}</p>
        </div>
        {children}
      </div>
    </section>
  );
}
