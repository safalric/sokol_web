import {
  CalendarDays,
  ChevronDown,
  Dumbbell,
  ExternalLink,
  History,
  Home,
  Images,
  Info,
  MapPin,
  Menu,
  PartyPopper,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type ComponentType } from "react";
import { memberApplicationUrl, navigation, secondaryNavigation, socialLinks } from "../data/siteContent";
import { SokolLogo } from "./SokolLogo";

type HeaderProps = {
  currentPath: string;
  onNavigate: (href: string) => void;
};

const mobileNavigationIcons: Record<string, ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  "/": Home,
  "/cviceni": Dumbbell,
  "/akce": PartyPopper,
  "/kalendar": CalendarDays,
  "/kontakt": MapPin,
  "/o-nas": Info,
  "/fotogalerie": Images,
  "/historie": History,
};

export function Header({ currentPath, onNavigate }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDetailsElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileNavRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setIsOpen(false);
  }, [currentPath]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    window.requestAnimationFrame(() => mobileNavRef.current?.querySelector<HTMLAnchorElement>("a")?.focus());

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (moreMenuRef.current?.open && !moreMenuRef.current.contains(event.target as Node)) {
        moreMenuRef.current.open = false;
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && moreMenuRef.current?.open) {
        moreMenuRef.current.open = false;
        moreMenuRef.current.querySelector<HTMLElement>("summary")?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleNavigate = (href: string) => {
    setIsOpen(false);
    if (moreMenuRef.current) {
      moreMenuRef.current.open = false;
    }
    onNavigate(href);
  };

  const renderLink = (item: { label: string; href: string }, className: string) => (
    <a
      key={item.href}
      href={item.href}
      className={currentPath === item.href ? `${className} ${className}-active` : className}
      aria-current={currentPath === item.href ? "page" : undefined}
      onClick={(event) => {
        event.preventDefault();
        handleNavigate(item.href);
      }}
    >
      {item.label}
    </a>
  );

  const renderMobileLink = (item: { label: string; href: string }) => {
    const Icon = mobileNavigationIcons[item.href];

    return (
      <a
        key={item.href}
        href={item.href}
        className={currentPath === item.href ? "mobile-link mobile-link-active" : "mobile-link"}
        aria-current={currentPath === item.href ? "page" : undefined}
        onClick={(event) => {
          event.preventDefault();
          handleNavigate(item.href);
        }}
      >
        <Icon className="h-5 w-5" aria-hidden={true} />
        <span>{item.label}</span>
      </a>
    );
  };

  const isSecondaryPage = secondaryNavigation.some((item) => item.href === currentPath);

  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
        <a
          className="brand-lockup"
          href="/"
          aria-label="TJ Sokol Doudleby nad Orlicí – úvod"
          onClick={(event) => {
            event.preventDefault();
            handleNavigate("/");
          }}
        >
          <SokolLogo />
          <span className="brand-copy">
            <strong>Sokol</strong>
            <span>Doudleby</span>
          </span>
        </a>

        <nav className="desktop-nav" aria-label="Hlavní navigace">
          {navigation.map((item) => renderLink(item, "nav-link"))}
          <details ref={moreMenuRef} className={isSecondaryPage ? "more-menu more-menu-active" : "more-menu"}>
            <summary className="nav-link">
              Více
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </summary>
            <div className="more-menu-panel">
              {secondaryNavigation.map((item) => renderLink(item, "more-menu-link"))}
              <div className="more-menu-socials" aria-label="Sociální sítě">
                {socialLinks.map((item) => (
                  <a key={item.href} className="more-menu-link" href={item.href} target="_blank" rel="noopener noreferrer">
                    <span>{item.shortLabel}</span>
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
          </details>
          <a className="header-cta" href={memberApplicationUrl} target="_blank" rel="noopener noreferrer">
            Přidat se
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </nav>

        <button
          ref={menuButtonRef}
          type="button"
          className="menu-button"
          aria-label={isOpen ? "Zavřít navigaci" : "Otevřít navigaci"}
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
          title={isOpen ? "Zavřít menu" : "Otevřít menu"}
          onClick={() => setIsOpen((current) => !current)}
        >
          {isOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
        </div>
      </header>

      {isOpen ? (
        <nav ref={mobileNavRef} id="mobile-navigation" className="mobile-nav" aria-label="Mobilní navigace">
          <div className="mobile-nav-group">{navigation.map(renderMobileLink)}</div>
          <div className="mobile-nav-group mobile-nav-secondary">{secondaryNavigation.map(renderMobileLink)}</div>
          <div className="mobile-social-links" aria-label="Sociální sítě">
            {socialLinks.map((item) => (
              <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer">
                {item.shortLabel}
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            ))}
          </div>
          <a
            className="mobile-cta"
            href={memberApplicationUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
          >
            Přidat se
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </nav>
      ) : null}
    </>
  );
}
