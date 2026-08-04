import { ExternalLink, Mail } from "lucide-react";
import { socialLinks } from "../data/siteContent";
import { SokolLogo } from "./SokolLogo";

type FooterProps = {
  onNavigate: (href: string) => void;
};

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-identity">
          <button className="footer-brand" type="button" onClick={() => onNavigate("/")} aria-label="Úvod">
            <SokolLogo compact />
            <span>
              <strong>TJ Sokol Doudleby nad Orlicí</strong>
              <small>Pohyb, komunita a sokolská tradice.</small>
            </span>
          </button>
          <a className="footer-contact" href="mailto:sokoldoudleby@seznam.cz">
            <Mail className="h-4 w-4" aria-hidden="true" />
            sokoldoudleby@seznam.cz
          </a>
          <div className="footer-socials" role="group" aria-label="Sociální sítě">
            {socialLinks.map((item) => (
              <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" aria-label={item.label}>
                {item.shortLabel}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            ))}
          </div>
          <span className="footer-ico">IČO 15040020</span>
        </div>

        <div className="footer-links">
          <button type="button" onClick={() => onNavigate("/gdpr")}>
            Ochrana osobních údajů
          </button>
          <span className="footer-meta">© {new Date().getFullYear()} TJ Sokol Doudleby nad Orlicí</span>
        </div>
      </div>
    </footer>
  );
}
