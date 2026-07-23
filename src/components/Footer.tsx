import { SokolLogo } from "./SokolLogo";

type FooterProps = {
  onNavigate: (href: string) => void;
};

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <button className="footer-brand" type="button" onClick={() => onNavigate("/")} aria-label="Úvod">
          <SokolLogo compact />
          <span>
            <strong>TJ Sokol Doudleby nad Orlicí</strong>
            <small>Pohyb, komunita a sokolská tradice.</small>
          </span>
        </button>

        <p className="footer-note">Moderní web jednoty pro cvičení, akce a členství.</p>
      </div>
    </footer>
  );
}
