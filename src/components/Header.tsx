import { Menu, X } from "lucide-react";
import { useState } from "react";
import { navigation } from "../data/siteContent";
import { SokolLogo } from "./SokolLogo";

type HeaderProps = {
  currentPath: string;
  onNavigate: (href: string) => void;
};

export function Header({ currentPath, onNavigate }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleNavigate = (href: string) => {
    setIsOpen(false);
    onNavigate(href);
  };

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <button className="brand-lockup" type="button" onClick={() => handleNavigate("/")} aria-label="Úvod">
          <SokolLogo />
          <span className="brand-copy">
            <strong>Sokol</strong>
            <span>Doudleby</span>
          </span>
        </button>

        <nav className="desktop-nav" aria-label="Hlavní navigace">
          {navigation.map((item) => (
            <button
              key={item.href}
              type="button"
              className={currentPath === item.href ? "nav-link nav-link-active" : "nav-link"}
              onClick={() => handleNavigate(item.href)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button
          className="menu-button"
          aria-label={isOpen ? "Zavřít navigaci" : "Otevřít navigaci"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
        >
          {isOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>

      {isOpen ? (
        <nav className="mobile-nav" aria-label="Mobilní navigace">
          {navigation.map((item) => (
            <button
              key={item.href}
              type="button"
              className={currentPath === item.href ? "mobile-link mobile-link-active" : "mobile-link"}
              onClick={() => handleNavigate(item.href)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
